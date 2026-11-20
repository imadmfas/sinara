// Prompt library: on-demand loading, search, filters and the optional full offline download.
// Nothing here ships prompt text in the homepage bundle; the manifest and chunks are fetched when needed.
import type { AgeBandId } from '../content/types';
import { modeGuides, searchAliases } from '../content/catalogGuide';
import { fields } from '../content/index';

export type Status = 'validated' | 'held' | 'reviewed';
export interface CatalogVariant { id: string; mode: string; status: Status; difficulty: string; output: string; showcase: boolean }
export interface CatalogCase {
  id: string; title: string; domain: string; chunk: string; role: string; goal: string; inputs: string; check: string;
  fields: string[]; branches: string[]; ages: AgeBandId[]; caregiver: boolean; waitsForText: boolean; origin: string;
  variants: CatalogVariant[];
  hay: string; // normalized search text
}
export interface Manifest {
  sourceHash: string; origin: string;
  counts: { cases: number; variants: number; usableVariants: number; casesWithUsable: number; showcase: number; byStatus: Record<string, number> };
  modes: string[]; outputs: string[]; domains: string[]; showcase: string[];
  chunks: Record<string, { domain: string; file: string; bytes: number }>;
  cases: CatalogCase[];
}

const base = () => import.meta.env.BASE_URL || './';
const url = (f: string) => `${base()}catalog/${f}`;

export const normalize = (s: string) =>
  s.replace(/[ً-ْٰـ]/g, '').replace(/[إأآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[^\p{L}\p{N}]+/gu, ' ').trim().toLowerCase();

const FULL_CACHE = 'sinara-catalog-full';
const FULL_STATE = 'sinara.catalogOffline';

/** Network first; on failure fall back to any cached copy (service worker runtime cache or full download). */
async function getJSON<T>(file: string): Promise<T> {
  const u = new URL(url(file), location.href).href;
  try {
    const r = await fetch(u, { cache: 'no-cache' });
    if (!r.ok) throw new Error(String(r.status));
    return (await r.json()) as T;
  } catch (e) {
    if ('caches' in window) {
      const hit = await caches.match(u);
      if (hit) return (await hit.json()) as T;
    }
    throw e;
  }
}

let manifestP: Promise<Manifest> | null = null;
export function loadManifest(): Promise<Manifest> {
  manifestP ??= getJSON<{ cases: (Omit<CatalogCase, 'variants' | 'hay'> & { v: [string, number, string, number][] })[] } & Omit<Manifest, 'cases'>>('manifest.json')
    .then((m) => {
      const st: Record<string, Status> = { v: 'validated', h: 'held', r: 'reviewed' };
      const fieldName = (id: string) => fields.find((f) => f.id === id)?.name ?? '';
      const branchName = (b: string) => { const [f, br] = b.split('/'); return fields.find((x) => x.id === f)?.branches.find((x) => x.id === br)?.name ?? ''; };
      const cases = m.cases.map((c) => {
        const variants = c.v.map(([suf, mi, s, oi]) => ({ id: `SN-${c.id.slice(3)}-${suf}`, mode: m.modes[mi], status: st[s], difficulty: modeGuides[m.modes[mi]].difficulty, output: m.outputs[oi], showcase: m.showcase.includes(`SN-${c.id.slice(3)}-${suf}`) }));
        const hay = normalize([c.title, c.role, c.goal, c.inputs, c.check, c.domain, ...c.fields.map(fieldName), ...c.branches.map(branchName)].join(' '));
        return { ...c, variants, hay } as CatalogCase;
      });
      return { ...m, cases } as Manifest;
    })
    .catch((e) => { manifestP = null; throw e; });
  return manifestP;
}

const chunkP = new Map<string, Promise<Record<string, string>>>();
export function loadChunk(chunk: string) {
  if (!chunkP.has(chunk)) chunkP.set(chunk, getJSON<Record<string, string>>(`${chunk}.json`).catch((e) => { chunkP.delete(chunk); throw e; }));
  return chunkP.get(chunk)!;
}

export async function findVariant(id: string) {
  const m = await loadManifest();
  const c = m.cases.find((x) => id.startsWith(`SN-${x.id.slice(3)}-`));
  const v = c?.variants.find((x) => x.id === id);
  if (!c || !v) return null;
  const prompts = await loadChunk(c.chunk);
  return { c, v, prompt: prompts[id] ?? '' };
}

/* ---------- search ---------- */
const aliasGroups = searchAliases.map((g) => g.map(normalize));
/** Expands each query term with its alias group (Iraqi and colloquial forms). Multi-word aliases match as phrases. */
export function expandQuery(q: string): string[][] {
  const n = normalize(q);
  if (!n) return [];
  let rest = n;
  const groups: string[][] = [];
  for (const g of aliasGroups) {
    const hit = g.filter((a) => a.includes(' ')).find((a) => rest.includes(a));
    if (hit) { groups.push(g); rest = rest.replace(hit, ' '); }
  }
  for (const w of rest.split(' ').filter((x) => x.length > 1)) {
    const g = aliasGroups.find((gr) => gr.includes(w) || gr.some((a) => !a.includes(' ') && (w.startsWith(a) || (a.startsWith(w) && w.length >= 3))));
    groups.push(g ? Array.from(new Set([w, ...g])) : [w]);
  }
  return groups;
}

export interface Filters { q: string; field: string; mode: string; age: string; level: string; output: string }

export function search(m: Manifest, f: Filters, band: AgeBandId | null) {
  const groups = expandQuery(f.q);
  // Age exposure: children's bands never see the dataset; 13–17 see only cases tagged for them.
  const ageLimit = band === 'a13' ? 'a13' : null;
  const out: { c: CatalogCase; variants: CatalogVariant[]; score: number }[] = [];
  for (const c of m.cases) {
    if (ageLimit && !c.ages.includes(ageLimit)) continue;
    if (f.age && !c.ages.includes(f.age as AgeBandId)) continue;
    if (f.field && !c.fields.includes(f.field) && !c.branches.some((b) => b.startsWith(f.field + '/'))) continue;
    let score = 0;
    let ok = true;
    for (const g of groups) {
      const best = Math.max(...g.map((t) => (c.hay.includes(t) ? (normalize(c.title).includes(t) ? 3 : 1) : 0)), ...g.map((t) => (c.variants.some((v) => normalize(v.mode).includes(t)) ? 1 : 0)));
      if (!best) { ok = false; break; }
      score += best;
    }
    if (!ok) continue;
    const variants = c.variants.filter((v) => v.status !== 'held' && (!f.mode || v.mode === f.mode) && (!f.level || v.difficulty === f.level) && (!f.output || v.output === f.output)
      && (!groups.length || groups.every((g) => g.some((t) => c.hay.includes(t) || normalize(v.mode).includes(t)))));
    if (!variants.length) continue;
    out.push({ c, variants, score });
  }
  out.sort((a, b) => b.score - a.score || a.c.id.localeCompare(b.c.id));
  return out;
}

/* ---------- optional full offline download ---------- */
export interface OfflineState { hash: string; bytes: number; complete: boolean; at: number }
export const offlineState = (): OfflineState | null => { try { return JSON.parse(localStorage.getItem(FULL_STATE) || 'null'); } catch { return null; } };

/** Downloads every chunk into a fresh temporary cache, then swaps it in. An interrupted download leaves the last
 *  complete copy untouched. */
export async function downloadAll(m: Manifest, onProgress: (done: number, total: number) => void, signal: AbortSignal) {
  if (!('caches' in window)) throw new Error('no-cache-api');
  const files = ['manifest.json', ...Object.values(m.chunks).map((c) => c.file)];
  const tmpName = `${FULL_CACHE}-tmp-${m.sourceHash}`;
  await caches.delete(tmpName);
  const tmp = await caches.open(tmpName);
  let done = 0;
  for (const f of files) {
    if (signal.aborted) { await caches.delete(tmpName); throw new DOMException('aborted', 'AbortError'); }
    const u = new URL(url(f), location.href).href;
    const r = await fetch(u, { signal, cache: 'no-cache' });
    if (!r.ok) { await caches.delete(tmpName); throw new Error(`http ${r.status}`); }
    await tmp.put(u, r);
    onProgress(++done, files.length);
  }
  // Swap: copy into the final cache, then remove the temporary one and older versions.
  const finalName = `${FULL_CACHE}-${m.sourceHash}`;
  await caches.delete(finalName);
  const fin = await caches.open(finalName);
  for (const req of await tmp.keys()) { const res = await tmp.match(req); if (res) await fin.put(req, res); }
  await caches.delete(tmpName);
  for (const k of await caches.keys()) if (k.startsWith(FULL_CACHE) && k !== finalName) await caches.delete(k);
  const bytes = Object.values(m.chunks).reduce((s, c) => s + c.bytes, 0);
  localStorage.setItem(FULL_STATE, JSON.stringify({ hash: m.sourceHash, bytes, complete: true, at: Date.now() }));
}

export async function removeDownload() {
  for (const k of await caches.keys()) if (k.startsWith(FULL_CACHE)) await caches.delete(k);
  localStorage.removeItem(FULL_STATE);
}

export const ar = (n: number) => n.toLocaleString('ar-IQ');
export const kb = (b: number) => `${ar(Math.round(b / 1024))} ك.ب`;

/** Splits a catalogue prompt into labelled parts for «تعلّم كيف كُتب». */
export function anatomy(prompt: string, c: CatalogCase) {
  const lines = prompt.split('\n');
  return lines.map((line) => {
    let kind: 'role' | 'inputs' | 'format' | 'check' | 'guard' | 'instruction' = 'instruction';
    if (line.includes(c.role) && line.includes(c.goal)) kind = 'role';
    else if (line.startsWith('المعطيات')) kind = 'inputs';
    else if (line.startsWith('شكل الجواب')) kind = 'format';
    else if (line.startsWith('معيار المراجعة')) kind = 'check';
    else if (line.startsWith('استخدم العربية')) kind = 'guard';
    return { line, kind };
  });
}

/** Mode → closest studio service, used when a template is opened in the studio. */
export const modeService: Record<string, string> = {
  'قرار بين خيارين': 'compare', 'خطة عمل': 'plan', 'دليل بصري': 'visual', 'مراجعة مخرج': 'review', 'سيناريو محادثة': 'conversation',
  'تدريب تفاعلي': 'conversation', 'أسئلة تحقق': 'quiz', 'اختبار نقل المهارة': 'quiz', 'بطاقة شرح لمبتدئ': 'explain'
};
