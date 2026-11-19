// SIMULATED provider tests (PROVIDER=fixture). No real model is called here.
import { beforeEach, describe, expect, it } from 'vitest';
import worker, { issueToken, verifyToken, _resetAttempts, type Env } from '../src/worker';

const base: Env = { PROVIDER: 'fixture', SESSION_SECRET: 'test-secret-0123456789', ADULT_ACCESS_CODE: 'adult-code', ALLOWED_ORIGIN: 'https://imadmfas.github.io' };
const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`https://coach.example${path}`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://imadmfas.github.io', ...headers }, body: JSON.stringify(body) });
const chatBody = { messages: [{ role: 'user', content: 'كيف أحسّن طلبي؟' }], lesson: { title: 'العمارة', kind: 'branch' } };

async function token(env = base) {
  const r = await worker.fetch(post('/session', { code: 'adult-code' }), env);
  return ((await r.json()) as { token: string }).token;
}

describe('adult eligibility is enforced server-side', () => {
  beforeEach(() => _resetAttempts());
  it('disables live chat when no adult control is configured', async () => {
    const env = { PROVIDER: 'fixture' };
    expect((await worker.fetch(post('/session', { code: 'x' }), env)).status).toBe(503);
    expect((await worker.fetch(post('/chat', chatBody), env)).status).toBe(503);
  });
  it('rejects chat without a session, even if the client claims an adult age band', async () => {
    const r = await worker.fetch(post('/chat', { ...chatBody, band: 'a23', age: 'adult' }), base);
    expect(r.status).toBe(401);
  });
  it('rejects a forged or tampered token', async () => {
    const t = await token();
    const [p] = t.split('.');
    expect((await worker.fetch(post('/chat', chatBody, { authorization: `Bearer ${p}.forged` }), base)).status).toBe(401);
    const childPayload = btoa(JSON.stringify({ role: 'adult', exp: Date.now() + 1e9 })).replace(/=+$/, '');
    expect((await worker.fetch(post('/chat', chatBody, { authorization: `Bearer ${childPayload}.${t.split('.')[1]}` }), base)).status).toBe(401);
  });
  it('rejects a wrong adult code and rate-limits guessing', async () => {
    expect((await worker.fetch(post('/session', { code: 'nope' }), base)).status).toBe(401);
    for (let i = 0; i < 6; i++) await worker.fetch(post('/session', { code: 'nope' }), base);
    expect((await worker.fetch(post('/session', { code: 'adult-code' }), base)).status).toBe(429);
  });
  it('expires tokens', async () => {
    const t = await issueToken(base, Date.now() - 31 * 60_000);
    expect(await verifyToken(base, t)).toBe(false);
  });
});

describe('chat with fixture provider (simulated)', () => {
  beforeEach(() => _resetAttempts());
  it('streams text events', async () => {
    const r = await worker.fetch(post('/chat', chatBody, { authorization: `Bearer ${await token()}` }), base);
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toContain('text/event-stream');
    const text = await r.text();
    expect(text).toContain('"type":"text"');
    expect(text).toContain('[اختبار محاكاة]');
  });
  it('maps provider rate limits to 429', async () => {
    const env = { ...base, FIXTURE: 'rate' };
    expect((await worker.fetch(post('/chat', chatBody, { authorization: `Bearer ${await token(env)}` }), env)).status).toBe(429);
  });
  it('maps provider errors to 502', async () => {
    const env = { ...base, FIXTURE: 'error' };
    expect((await worker.fetch(post('/chat', chatBody, { authorization: `Bearer ${await token(env)}` }), env)).status).toBe(502);
  });
  it('surfaces a dropped stream as an error the client can recover from', async () => {
    const env = { ...base, FIXTURE: 'drop' };
    const r = await worker.fetch(post('/chat', chatBody, { authorization: `Bearer ${await token(env)}` }), env);
    await expect(r.text()).rejects.toThrow();
  });
  it('limits input length and session length', async () => {
    const t = await token();
    const long = { messages: [{ role: 'user', content: 'ا'.repeat(801) }] };
    expect((await worker.fetch(post('/chat', long, { authorization: `Bearer ${t}` }), base)).status).toBe(413);
    const many = { messages: Array.from({ length: 13 }, () => [{ role: 'user', content: 'س' }, { role: 'assistant', content: 'ج' }]).flat().slice(0, 25) };
    expect((await worker.fetch(post('/chat', many, { authorization: `Bearer ${t}` }), base)).status).toBe(413);
  });
  it('only allows configured origins', async () => {
    const r = await worker.fetch(new Request('https://coach.example/chat', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } }), base);
    expect(r.headers.get('access-control-allow-origin')).toBeNull();
  });
});
