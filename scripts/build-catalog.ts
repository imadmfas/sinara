/* Imports sinara-handoff/catalog/sinara-prompts.json into the app.
 * - Deterministic: same input → same output (no timestamps).
 * - Validates every record, assigns editorial status (validated / held; «reviewed» only from a recorded review file).
 * - Writes a small manifest (cases + variant index, used for search and counts) and one prompt chunk per collection,
 *   loaded on demand so the homepage JavaScript ships no prompts.
 * - Writes docs/catalog-validation-report.md.
 * Fails the build on structural errors (missing fields, duplicate ids, orphan variants, empty prompts, exact duplicates). */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { domainCrosswalk, caseBranches, teenDomains, modeGuides, showcaseAnswers, CATALOG_ORIGIN } from '../src/content/catalogGuide';
import { fieldBases } from '../src/content/branches';

const SRC = 'sinara-handoff/catalog/sinara-prompts.json';
const OUT = 'public/catalog';
const REVIEWS = 'sinara-handoff/catalog/reviews.json'; // optional: [{ id, reviewer, date, decision }]

interface Raw { id: string; caseId: string; domain: string; case: string; mode: string; role: string; goal: string; inputs: string; check: string; prompt: string }
const raw = JSON.parse(readFileSync(SRC, 'utf8')) as Raw[];
const sourceHash = createHash('sha256').update(readFileSync(SRC)).digest('hex').slice(0, 12);
const errors: string[] = [];
const required: (keyof Raw)[] = ['id', 'caseId', 'domain', 'case', 'mode', 'role', 'goal', 'inputs', 'check', 'prompt'];

export const normalize = (s: string) =>
  s.replace(/[ً-ْٰـ]/g, '').replace(/[إأآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[^\p{L}\p{N}]+/gu, ' ').trim().toLowerCase();

// 1. Structure
const ids = new Set<string>();
for (const r of raw) {
  for (const k of required) if (typeof r[k] !== 'string' || !r[k].trim()) errors.push(`${r.id ?? '?'}: missing ${k}`);
  if (ids.has(r.id)) errors.push(`duplicate id ${r.id}`);
  ids.add(r.id);
  if (!/^SN-\d{3}-\d{2}$/.test(r.id) || !/^SC-\d{3}$/.test(r.caseId)) errors.push(`${r.id}: unexpected id format`);
  if (r.id.slice(3, 6) !== r.caseId.slice(3)) errors.push(`${r.id}: parent mismatch with ${r.caseId}`);
  if (!domainCrosswalk[r.domain]) errors.push(`${r.id}: domain without crosswalk «${r.domain}»`);
  if (!modeGuides[r.mode]) errors.push(`${r.id}: unknown mode «${r.mode}»`);
}

// 2. Parents: every case must be internally consistent (same case fields across its variants).
const byCase = new Map<string, Raw[]>();
for (const r of raw) byCase.set(r.caseId, [...(byCase.get(r.caseId) ?? []), r]);
for (const [cid, vs] of byCase) {
  for (const k of ['domain', 'case', 'role', 'goal', 'inputs', 'check'] as const) if (new Set(vs.map((v) => v[k])).size !== 1) errors.push(`${cid}: inconsistent ${k} across variants`);
  if (new Set(vs.map((v) => v.mode)).size !== vs.length) errors.push(`${cid}: repeated mode`);
}

// 3. Exact normalized duplicates among prompts.
const seen = new Map<string, string>();
for (const r of raw) {
  const n = normalize(r.prompt);
  if (seen.has(n)) errors.push(`exact normalized duplicate: ${r.id} = ${seen.get(n)}`);
  seen.set(n, r.id);
}

// 4. Near-duplicate cases (goal + inputs + check token overlap). Flagged, counted once each.
const tokens = (s: string) => new Set(normalize(s).split(' ').filter((w) => w.length > 2));
const caseList = [...byCase.values()].map((v) => v[0]);
const nearDup: string[] = [];
for (let i = 0; i < caseList.length; i++) for (let j = i + 1; j < caseList.length; j++) {
  const a = tokens(caseList[i].goal + ' ' + caseList[i].inputs + ' ' + caseList[i].check);
  const b = tokens(caseList[j].goal + ' ' + caseList[j].inputs + ' ' + caseList[j].check);
  const inter = [...a].filter((x) => b.has(x)).length;
  const jac = inter / (a.size + b.size - inter);
  if (jac >= 0.4) nearDup.push(`${caseList[i].caseId} ~ ${caseList[j].caseId} (${jac.toFixed(2)})`);
}

// 5. Coherence checks per variant → held with reasons.
const caregiverCase = (r: Raw) => /المرافق/.test(r.prompt) && /الطفل/.test(r.prompt);
const professionalOnlyModes = ['اختصار مهني', 'نموذج تسليم'];
const reviews: { id: string; reviewer: string; date: string; decision: string }[] = existsSync(REVIEWS) ? JSON.parse(readFileSync(REVIEWS, 'utf8')) : [];
const reviewed = new Map(reviews.filter((r) => r.decision === 'approved').map((r) => [r.id, r]));

interface Variant { id: string; mode: string; status: 'validated' | 'held' | 'reviewed'; flags: string[] }
const flagsFor = (r: Raw): { hold: string[]; flags: string[] } => {
  const hold: string[] = [];
  const flags: string[] = [];
  for (const k of ['role', 'goal', 'inputs', 'check'] as const) if (!r.prompt.includes(r[k])) hold.push(`prompt does not contain case ${k}`);
  if (caregiverCase(r) && professionalOnlyModes.includes(r.mode)) hold.push('professional work mode on a caregiver/child activity');
  if (/جرعة|وصفة علاجية|فتوى/.test(r.prompt)) hold.push('touches medical dosage or religious ruling');
  if (!/شكل الجواب:/.test(r.prompt)) hold.push('no expected output shape');
  if (r.prompt.startsWith('أعدّ تدريباً') && r.domain !== 'التعليم والتدريب' && !caregiverCase(r)) flags.push('opening «أعدّ تدريباً يناسب» on a non-training task');
  if (r.prompt.length > 900) flags.push('long prompt');
  return { hold, flags };
};

const outputKind = (prompt: string) => {
  const shape = (prompt.match(/شكل الجواب: ([^\n]+)/) || [])[1] ?? '';
  if (/جدول/.test(shape)) return 'جدول';
  if (/مداخلات|حوار|الدور الأول|سؤال وخياران|سؤال واحد في الرسالة|سؤال تطبيق/.test(shape)) return 'حوار أو تمرين';
  if (/لوحة|لقطات|خانات/.test(shape)) return 'وصف بصري';
  if (/خطوات|قالب/.test(shape)) return 'قالب أو خطوات';
  return 'نص قصير';
};

const domains = Object.keys(domainCrosswalk);
const slug = (d: string) => `c${String(domains.indexOf(d) + 1).padStart(2, '0')}`;
const held: { id: string; reasons: string[] }[] = [];
const flagged: Record<string, number> = {};
const cases = [...byCase.entries()].map(([cid, vs]) => {
  const f = vs[0];
  const fields = domainCrosswalk[f.domain];
  const branches = caseBranches[cid] ?? [];
  for (const b of branches) {
    const [fid, bid] = b.split('/');
    if (!fieldBases.find((x) => x.id === fid)?.branches.find((x) => x.id === bid)) errors.push(`${cid}: crosswalk to unknown branch ${b}`);
  }
  const caregiver = caregiverCase(f);
  const ages = caregiver ? ['a23'] : teenDomains.includes(f.domain) ? ['a13', 'a18', 'a23'] : ['a18', 'a23'];
  const variants: Variant[] = vs.map((r) => {
    const { hold, flags } = flagsFor(r);
    flags.forEach((x) => (flagged[x] = (flagged[x] ?? 0) + 1));
    if (hold.length) held.push({ id: r.id, reasons: hold });
    return { id: r.id, mode: r.mode, status: hold.length ? 'held' : reviewed.has(r.id) ? 'reviewed' : 'validated', flags };
  });
  return {
    id: cid, title: f.case, domain: f.domain, chunk: slug(f.domain), role: f.role, goal: f.goal, inputs: f.inputs, check: f.check,
    fields, branches, ages, caregiver, waitsForText: f.prompt.includes('انتظر إرفاق'), origin: 'handoff-2026-11-20',
    variants: variants.map((v) => ({ id: v.id, mode: v.mode, status: v.status, difficulty: modeGuides[v.mode].difficulty, output: outputKind(vs.find((x) => x.id === v.id)!.prompt), showcase: !!showcaseAnswers[v.id] }))
  };
});
const OUTPUTS = ['جدول', 'حوار أو تمرين', 'وصف بصري', 'قالب أو خطوات', 'نص قصير'];
const STATUS = { validated: 'v', held: 'h', reviewed: 'r' } as const;
/** Compact manifest form: variant = [idSuffix, modeIndex, status, outputIndex]. Expanded by src/lib/catalog.ts. */
const compactCases = cases.map((c) => {
  const { variants, ...rest } = c;
  return { ...rest, v: variants.map((x) => [x.id.slice(-2), Object.keys(modeGuides).indexOf(x.mode), STATUS[x.status], OUTPUTS.indexOf(x.output)]) };
});
for (const id of Object.keys(showcaseAnswers)) if (!ids.has(id)) errors.push(`showcase answer for unknown id ${id}`);

if (errors.length) {
  console.error(`catalog import failed (${errors.length}):`);
  errors.slice(0, 40).forEach((e) => console.error(' - ' + e));
  process.exit(1);
}

const all = cases.flatMap((c) => c.variants);
const counts = {
  cases: cases.length,
  variants: all.length,
  usableVariants: all.filter((v) => v.status !== 'held').length,
  byStatus: { imported: 0, validated: all.filter((v) => v.status === 'validated').length, reviewed: all.filter((v) => v.status === 'reviewed').length, held: all.filter((v) => v.status === 'held').length },
  casesWithUsable: cases.filter((c) => c.variants.some((v) => v.status !== 'held')).length,
  showcase: all.filter((v) => v.showcase).length
};

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const chunks: Record<string, { domain: string; file: string; bytes: number }> = {};
for (const d of domains) {
  const s = slug(d);
  const body: Record<string, string> = {};
  raw.filter((r) => r.domain === d).forEach((r) => (body[r.id] = r.prompt));
  const json = JSON.stringify(body);
  writeFileSync(`${OUT}/${s}.json`, json);
  chunks[s] = { domain: d, file: `${s}.json`, bytes: Buffer.byteLength(json) };
}
const manifest = { schema: 1, source: SRC.split('/').pop(), sourceHash, origin: CATALOG_ORIGIN, counts, modes: Object.keys(modeGuides), outputs: OUTPUTS, showcase: Object.keys(showcaseAnswers), domains, chunks, cases: compactCases };
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest));

// Stratified editorial sample: every work mode once, spread across all 12 collections.
const modes = Object.keys(modeGuides);
const sample = modes.map((m, i) => {
  const d = domains[i % domains.length];
  const c = cases.filter((x) => x.domain === d)[Math.floor(i / domains.length) % 10];
  return raw.find((r) => r.caseId === c.id && r.mode === m)!;
});

const fmt = (n: number) => n.toLocaleString('en');
const report = `# تقرير التحقق من مكتبة البرومبتات

يُولَّد هذا التقرير آلياً بالأمر \`npm run catalog\` من الملف \`${SRC}\` (البصمة \`${sourceHash}\`). النتيجة نفسها تتكرر مع المدخل نفسه.

## المجاميع

- المواقف المستقلة (الحالات الأم): ${fmt(counts.cases)}
- الصيغ المستوردة: ${fmt(counts.variants)}
- الصيغ القابلة للاستعمال (غير المحجوزة): ${fmt(counts.usableVariants)}
- بحسب الحالة التحريرية: مستوردة دون فحص ${counts.byStatus.imported} · مفحوصة آلياً ${fmt(counts.byStatus.validated)} · مراجَعة بشرياً ${counts.byStatus.reviewed} · محجوزة ${counts.byStatus.held}
- صيغ الواجهة النموذجية (بجواب تعليمي مكتوب): ${counts.showcase}

الصيغ مولّدة تعليمياً بمدخلات خيالية. ليست ${fmt(counts.variants)} حالة مستقلة ولا أجوبة خبراء مراجَعة. كل صيغة مربوطة بحالتها الأم وتُعدّ الحالة مرة واحدة.

## الفحوص الآلية (ناجحة)

- الحقول العشرة موجودة وغير فارغة في كل سجل.
- المعرّفات فريدة، وكل صيغة مرتبطة بحالة أم موجودة، وحقول الحالة متطابقة بين صيغها.
- لا تكرار حرفياً بعد إزالة التشكيل وتوحيد الهمزات والتاء المربوطة والأرقام وعلامات الترقيم.
- كل مجموعة مربوطة بمجال في سِينارة، والروابط إلى التخصصات الفرعية موجودة.
- لا يُعرض أي سجل لفئات ٤–٦ و٧–٩ و١٠–١٢. حالات المرافق تُعرض للبالغين فقط.

## المحجوزة (${held.length})

${held.map((h) => `- ${h.id}: ${h.reasons.join('؛ ')}`).join('\n') || '- لا شيء'}

## ملاحظات أسلوبية للمراجعة (لا تحجب النشر)

${Object.entries(flagged).map(([k, v]) => `- ${k}: ${v} صيغة`).join('\n') || '- لا شيء'}

## حالات متقاربة (تُعدّ كل حالة مرة واحدة، وتحتاج نظرة تحريرية)

${nearDup.map((x) => `- ${x}`).join('\n') || '- لا شيء فوق العتبة ٠٫٤'}

## عيّنة طبقية للمراجعة البشرية (لم تُراجَع بعد)

كل نمط عمل مرة واحدة، موزعة على المجموعات الاثنتي عشرة. لتسجيل مراجعة أضف سطراً في \`${REVIEWS}\` بالشكل \`{"id":"SN-…","reviewer":"…","date":"…","decision":"approved"}\` ثم أعد البناء.

${sample.map((r) => `- ${r.id} · ${r.domain} · ${r.mode} · ${r.case}`).join('\n')}
`;
writeFileSync('docs/catalog-validation-report.md', report);
console.log(`catalog: ${counts.cases} cases, ${counts.variants} variants, usable ${counts.usableVariants}, held ${counts.byStatus.held}, reviewed ${counts.byStatus.reviewed}; manifest ${(Buffer.byteLength(JSON.stringify(manifest)) / 1024).toFixed(0)} KB`);
