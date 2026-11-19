// محادثة ذكية مباشرة — optional adult live coach client.
// Enabled only when VITE_LIVE_COACH_URL is configured at build time. Eligibility is enforced on the
// server with a signed adult session; the client-side age selector cannot unlock it.

export const LIVE_URL: string = (import.meta.env.VITE_LIVE_COACH_URL as string | undefined)?.replace(/\/$/, '') || '';
export const liveConfigured = () => LIVE_URL.length > 0;

export const LIMITS = { maxInput: 800, maxTurns: 12 };

const TOKEN_KEY = 'sinara.adultSession'; // session-scoped, never persisted to localStorage

export function getToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function clearToken() {
  try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

export class LiveError extends Error {
  constructor(public kind: 'offline' | 'unauthorized' | 'rate' | 'provider' | 'disabled' | 'aborted' | 'limit', msg: string) { super(msg); }
}

export async function startAdultSession(code: string): Promise<void> {
  if (!liveConfigured()) throw new LiveError('disabled', 'disabled');
  if (!navigator.onLine) throw new LiveError('offline', 'offline');
  const r = await fetch(`${LIVE_URL}/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) });
  if (r.status === 401 || r.status === 403) throw new LiveError('unauthorized', 'unauthorized');
  if (r.status === 429) throw new LiveError('rate', 'rate');
  if (!r.ok) throw new LiveError('provider', String(r.status));
  const { token } = (await r.json()) as { token: string };
  sessionStorage.setItem(TOKEN_KEY, token);
}

export interface LiveMessage { role: 'user' | 'assistant'; content: string }

/** Streams assistant text. The caller passes only the deliberate message and minimal lesson context. */
export async function streamChat(
  messages: LiveMessage[],
  lesson: { title: string; kind: string },
  onText: (t: string) => void,
  signal: AbortSignal
): Promise<void> {
  const token = getToken();
  if (!token) throw new LiveError('unauthorized', 'no session');
  if (!navigator.onLine) throw new LiveError('offline', 'offline');
  let r: Response;
  try {
    r = await fetch(`${LIVE_URL}/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ messages, lesson }),
      signal
    });
  } catch (e) {
    if (signal.aborted) throw new LiveError('aborted', 'aborted');
    throw new LiveError('offline', String(e));
  }
  if (r.status === 401 || r.status === 403) { clearToken(); throw new LiveError('unauthorized', 'unauthorized'); }
  if (r.status === 429) throw new LiveError('rate', 'rate');
  if (r.status === 413) throw new LiveError('limit', 'limit');
  if (!r.ok || !r.body) throw new LiveError('provider', String(r.status));
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i: number;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const evt = buf.slice(0, i);
        buf = buf.slice(i + 2);
        const data = evt.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('');
        if (!data) continue;
        const msg = JSON.parse(data) as { type: string; text?: string; error?: string };
        if (msg.type === 'text' && msg.text) onText(msg.text);
        if (msg.type === 'error') throw new LiveError('provider', msg.error || 'provider');
      }
    }
  } catch (e) {
    if (signal.aborted) throw new LiveError('aborted', 'aborted');
    throw e;
  }
}
