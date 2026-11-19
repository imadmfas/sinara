/* سِينارة live coach — a small serverless worker (Cloudflare Workers compatible, plain fetch handler).
 *
 * Security model
 * - Live chat is for adults only. Eligibility is decided HERE, not by the app's age selector:
 *   POST /session exchanges an adult access code (held by a parent, teacher or the adult learner)
 *   for a short-lived HMAC-signed session token. POST /chat rejects any request without a valid token.
 * - If ADULT_ACCESS_CODE or SESSION_SECRET is not configured, live chat stays disabled (503).
 * - Provider keys live only in server secrets. Messages are forwarded, never logged or stored.
 * - Inputs and session length are limited; rate limits return 429 so the app can fall back.
 */

export interface Env {
  PROVIDER?: string; // 'anthropic' | 'fixture'
  MODEL?: string;
  ANTHROPIC_API_KEY?: string;
  SESSION_SECRET?: string;
  ADULT_ACCESS_CODE?: string;
  ALLOWED_ORIGIN?: string;
  SESSION_MINUTES?: string;
  FIXTURE?: string; // fixture behaviour for tests: ok | rate | error | drop
}

export const LIMITS = { maxInput: 800, maxTurns: 12, maxTotal: 12000, sessionAttemptsPerMinute: 5 };

const SYSTEM = [
  'أنت «فَطين»، مدرّب في منصة سِينارة يساعد البالغين على صياغة طلبات أوضح للذكاء الاصطناعي وتقويم الأجوبة.',
  'اكتب بالعربية الفصحى الواضحة، وبجمل قصيرة. اسأل سؤالاً توضيحياً واحداً إذا نقصت معلومة تؤثر في الجواب.',
  'ميّز بوضوح بين: مثال تعليمي، ومعلومة لها مصدر يذكره المستخدم، وادعاء يحتاج إلى تحقق.',
  'لا تختلق مراجع أو أرقام صفحات أو نصوصاً دينية أو مواد قانونية أو جرعات دوائية. إذا احتاج الجواب إلى ذلك فاطلب من المستخدم المصدر أو أحِله إلى المختص.',
  'لا تطلب اسم المستخدم أو مدرسته أو عنوانه أو صوره أو أي بيانات شخصية.'
].join('\n');

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function issueToken(env: Env, now = Date.now()) {
  const payload = b64url(enc.encode(JSON.stringify({ role: 'adult', exp: now + Number(env.SESSION_MINUTES || 30) * 60_000 })));
  return `${payload}.${await hmac(env.SESSION_SECRET!, payload)}`;
}

export async function verifyToken(env: Env, token: string | null, now = Date.now()) {
  if (!token || !env.SESSION_SECRET) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  if (!safeEqual(await hmac(env.SESSION_SECRET, payload), sig)) return false;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as { role: string; exp: number };
    return data.role === 'adult' && data.exp > now;
  } catch {
    return false;
  }
}

const attempts = new Map<string, { n: number; t: number }>();
function tooManyAttempts(ip: string, now = Date.now()) {
  const a = attempts.get(ip);
  if (!a || now - a.t > 60_000) { attempts.set(ip, { n: 1, t: now }); return false; }
  a.n++;
  return a.n > LIMITS.sessionAttemptsPerMinute;
}
export const _resetAttempts = () => attempts.clear();

function cors(env: Env, req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowed = (env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin) || /^capacitor:\/\/localhost$|^https?:\/\/localhost(:\d+)?$/.test(origin);
  return ok ? { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'content-type, authorization', 'access-control-allow-methods': 'POST, OPTIONS', vary: 'origin' } : {};
}

const json = (body: unknown, status: number, h: Record<string, string>) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...h } });

interface Msg { role: 'user' | 'assistant'; content: string }

export function validateMessages(body: unknown): { ok: true; messages: Msg[]; lesson: { title: string; kind: string } } | { ok: false; status: number; error: string } {
  const b = body as { messages?: unknown; lesson?: { title?: unknown; kind?: unknown } };
  if (!b || !Array.isArray(b.messages) || !b.messages.length) return { ok: false, status: 400, error: 'messages required' };
  const messages: Msg[] = [];
  let total = 0;
  for (const m of b.messages as Msg[]) {
    if ((m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') return { ok: false, status: 400, error: 'bad message' };
    if (m.role === 'user' && m.content.length > LIMITS.maxInput) return { ok: false, status: 413, error: 'message too long' };
    total += m.content.length;
    messages.push({ role: m.role, content: m.content });
  }
  if (messages.filter((m) => m.role === 'user').length > LIMITS.maxTurns) return { ok: false, status: 413, error: 'session too long' };
  if (total > LIMITS.maxTotal) return { ok: false, status: 413, error: 'conversation too long' };
  if (messages[messages.length - 1].role !== 'user') return { ok: false, status: 400, error: 'last message must be user' };
  const title = typeof b.lesson?.title === 'string' ? b.lesson.title.slice(0, 80) : '';
  const kind = typeof b.lesson?.kind === 'string' ? b.lesson.kind.slice(0, 20) : '';
  return { ok: true, messages, lesson: { title, kind } };
}

const sse = (o: unknown) => enc.encode(`data: ${JSON.stringify(o)}\n\n`);

async function providerStream(env: Env, messages: Msg[], lesson: { title: string }, signal: AbortSignal): Promise<Response | ReadableStream<Uint8Array>> {
  if (env.PROVIDER === 'fixture') {
    const mode = env.FIXTURE || 'ok';
    if (mode === 'rate') return new Response('rate', { status: 429 });
    if (mode === 'error') return new Response('upstream', { status: 502 });
    return new ReadableStream({
      start(c) {
        c.enqueue(sse({ type: 'text', text: '[اختبار محاكاة] ' }));
        c.enqueue(sse({ type: 'text', text: 'حدّد الجمهور والمدة.' }));
        if (mode === 'drop') { c.error(new Error('dropped')); return; }
        c.enqueue(sse({ type: 'done' }));
        c.close();
      }
    });
  }
  if (!env.ANTHROPIC_API_KEY) return new Response('no provider', { status: 503 });
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: env.MODEL || 'claude-haiku-5-5', max_tokens: 700, stream: true, system: `${SYSTEM}\nالدرس الحالي: ${lesson.title || 'غير محدد'}`, messages })
  });
  if (!r.ok || !r.body) return new Response('upstream', { status: r.status === 429 ? 429 : 502 });
  // Translate the provider's SSE into the app's minimal {type:'text'} events.
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  return new ReadableStream({
    async pull(c) {
      const { value, done } = await reader.read();
      if (done) { c.enqueue(sse({ type: 'done' })); c.close(); return; }
      buf += dec.decode(value, { stream: true });
      let i: number;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const evt = buf.slice(0, i);
        buf = buf.slice(i + 2);
        const data = evt.split('\n').find((l) => l.startsWith('data:'))?.slice(5).trim();
        if (!data) continue;
        try {
          const d = JSON.parse(data) as { type: string; delta?: { type: string; text?: string }; error?: { message?: string } };
          if (d.type === 'content_block_delta' && d.delta?.type === 'text_delta' && d.delta.text) c.enqueue(sse({ type: 'text', text: d.delta.text }));
          if (d.type === 'error') c.enqueue(sse({ type: 'error', error: 'provider' }));
        } catch { /* ignore malformed chunk */ }
      }
    },
    cancel() { void reader.cancel(); }
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const h = cors(env, req);
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (req.method !== 'POST') return json({ error: 'method' }, 405, h);
    const configured = !!(env.SESSION_SECRET && env.ADULT_ACCESS_CODE);

    if (url.pathname === '/session') {
      if (!configured) return json({ error: 'live chat disabled' }, 503, h);
      const ip = req.headers.get('cf-connecting-ip') || 'local';
      if (tooManyAttempts(ip)) return json({ error: 'rate' }, 429, h);
      const body = (await req.json().catch(() => ({}))) as { code?: string };
      if (typeof body.code !== 'string' || !safeEqual(body.code, env.ADULT_ACCESS_CODE!)) return json({ error: 'unauthorized' }, 401, h);
      return json({ token: await issueToken(env) }, 200, h);
    }

    if (url.pathname === '/chat') {
      if (!configured) return json({ error: 'live chat disabled' }, 503, h);
      const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || null;
      if (!(await verifyToken(env, token))) return json({ error: 'unauthorized' }, 401, h);
      const v = validateMessages(await req.json().catch(() => null));
      if (!v.ok) return json({ error: v.error }, v.status, h);
      const out = await providerStream(env, v.messages, v.lesson, req.signal);
      if (out instanceof Response) return json({ error: out.status === 429 ? 'rate' : 'provider' }, out.status === 429 ? 429 : 502, h);
      return new Response(out, { status: 200, headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store', ...h } });
    }
    return json({ error: 'not found' }, 404, h);
  }
};
