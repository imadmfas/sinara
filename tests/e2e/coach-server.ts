// Test-only HTTP wrapper around the worker with the FIXTURE provider. Labelled simulated.
import http from 'node:http';
import worker, { type Env } from '../../server/src/worker';

const env: Env = { PROVIDER: 'fixture', FIXTURE: 'ok', SESSION_SECRET: 'e2e-secret-abcdefghijklmnop', ADULT_ACCESS_CODE: 'e2e-adult', ALLOWED_ORIGIN: 'http://localhost:4173' };
export const hits: string[] = [];

http.createServer(async (req, res) => {
  if (req.url?.startsWith('/__fixture/')) { env.FIXTURE = req.url.split('/')[2]; res.writeHead(200, { 'access-control-allow-origin': '*' }); res.end('ok'); return; }
  if (req.url === '/__hits') { res.writeHead(200, { 'access-control-allow-origin': '*', 'content-type': 'application/json' }); res.end(JSON.stringify(hits)); return; }
  if (req.method !== 'OPTIONS') hits.push(req.url || '');
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const r = await worker.fetch(new Request(`http://localhost:8787${req.url}`, { method: req.method, headers: req.headers as Record<string, string>, body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method || '') ? undefined : Buffer.concat(chunks) }), env);
  res.writeHead(r.status, Object.fromEntries(r.headers));
  if (!r.body) { res.end(); return; }
  const reader = r.body.getReader();
  try { for (;;) { const { value, done } = await reader.read(); if (done) break; res.write(value); } } catch { /* dropped stream */ }
  res.end();
}).listen(8787);
console.log('fixture coach on 8787');
