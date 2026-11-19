/* Build-time content validation. Fails the build on duplicate ids, missing branch content,
   dead routes, broken quiz keys, highlight mismatches and banned Arabic phrasing. */
import { fields, allBranches, marshesProject } from '../src/content/index';
import { fieldBases } from '../src/content/branches';
import { schoolInterests, allSchoolTopics } from '../src/content/school';
import { schoolFollowups, preschoolFollowups, fieldFollowups } from '../src/content/followups';
import { families } from '../src/content/preschool';
import * as preschool from '../src/content/preschool';
import { ages } from '../src/content/ages';
import { services } from '../src/content/services';
import { guideConcepts } from '../src/content/guide';
import * as house from '../src/content/house';
import { brand } from '../src/content/brand';
import { to, matchesPattern } from '../src/routes';
import type { QuizQuestion, FollowupScenario } from '../src/content/types';

const errors: string[] = [];
const warn: string[] = [];
const err = (m: string) => errors.push(m);

// 1. Counts carried over from the prototype.
if (ages.length !== 6) err(`expected 6 age bands, got ${ages.length}`);
if (fields.length !== 12) err(`expected 12 fields, got ${fields.length}`);
if (allBranches.length !== 47) err(`expected 47 branches, got ${allBranches.length}`);
if (services.length !== 10) err(`expected 10 services, got ${services.length}`);
if (families.length !== 4) err(`expected 4 preschool families, got ${families.length}`);
if (schoolInterests.length !== 6 || allSchoolTopics.length !== 18) err('expected 6 school interests and 18 topics');
if (guideConcepts.length !== 5) err('expected 5 guide concepts');

// 2. Unique ids.
function unique(label: string, ids: string[]) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) err(`duplicate ${label} id: ${id}`);
    seen.add(id);
  }
}
unique('age', ages.map((a) => a.id));
unique('field', fields.map((f) => f.id));
unique('branch', allBranches.map((b) => b.branch.id));
unique('school topic', allSchoolTopics.map((t) => t.id));
unique('service', services.map((s) => s.id));
const quizIds: string[] = [];
fields.forEach((f) => {
  if (!f.quiz) return err(`field ${f.id} has no quiz`);
  quizIds.push(f.quiz.main.id, f.quiz.transfer.id, f.quiz.flawed.question.id);
});
unique('quiz', quizIds);
const fus: FollowupScenario[] = [...Object.values(fieldFollowups), ...schoolFollowups, ...Object.values(preschoolFollowups)];
unique('followup', fus.map((x) => x.id));

// 3. Branch content.
const goods = new Set<string>();
for (const { field, branch } of allBranches) {
  const at = `${field.id}/${branch.id}`;
  for (const k of ['name', 'weak', 'good', 'why', 'simpler'] as const) if (!branch[k]?.trim()) err(`${at}: missing ${k}`);
  if (branch.weak === branch.good) err(`${at}: weak equals good`);
  if (goods.has(branch.good)) err(`${at}: improved request duplicates another branch`);
  goods.add(branch.good);
  if (branch.highlights.length < 2) err(`${at}: needs at least 2 highlights`);
  for (const h of branch.highlights) if (!branch.good.includes(h.text)) err(`${at}: highlight not found in improved request: «${h.text}»`);
  if (branch.good.includes(branch.name) && branch.good.length < 60) warn.push(`${at}: improved request may be a generic template`);
}
fieldBases.forEach((f) => { if (!fieldFollowups[f.id]) err(`field ${f.id} has no follow-up scenario`); });

// 4. Quiz keys and distractor length balance.
let total = 0, keyLongest = 0;
function checkQuestion(q: QuizQuestion, at: string) {
  const correct = q.options.filter((o) => o.correct);
  if (correct.length !== 1) err(`${at}: must have exactly one correct option (has ${correct.length})`);
  if (q.options.length < 3) err(`${at}: needs at least 3 options`);
  unique(`${at} option`, q.options.map((o) => o.id));
  q.options.forEach((o) => { if (!o.feedback.trim()) err(`${at}/${o.id}: missing feedback`); });
  total++;
  const maxLen = Math.max(...q.options.map((o) => o.text.length));
  if (correct[0] && correct[0].text.length === maxLen) keyLongest++;
}
fields.forEach((f) => {
  checkQuestion(f.quiz.main, `${f.id}.main`);
  checkQuestion(f.quiz.transfer, `${f.id}.transfer`);
  checkQuestion(f.quiz.flawed.question, `${f.id}.flawed`);
  if (f.quiz.flawed.flawLine < 0 || f.quiz.flawed.flawLine >= f.quiz.flawed.answer.length) err(`${f.id}: flawLine out of range`);
  const pos = [f.quiz.main, f.quiz.transfer, f.quiz.flawed.question].map((q) => q.options.findIndex((o) => o.correct));
  if (new Set(pos).size === 1) warn.push(`${f.id}: correct option is in the same position in every question`);
});
const ratio = keyLongest / total;
console.log(`quiz questions: ${total}; key is the longest option in ${keyLongest} (${Math.round(ratio * 100)}%)`);
if (ratio > 0.5) err('the correct option is the longest in more than half of the questions; rebalance distractors');

// 5. Follow-ups.
for (const s of fus) {
  if (s.options.filter((o) => o.best).length !== 1) err(`${s.id}: must have exactly one best follow-up`);
  if (!s.changed.length || s.changed.some((i) => i < 0 || i >= s.revised.length)) err(`${s.id}: changed indexes invalid`);
  if (!s.answer.length || !s.revised.length) err(`${s.id}: empty sample`);
}

// 6. House arithmetic.
if (house.sumAreas(house.areasV1) !== house.plotArea) err(`house v1 areas sum to ${house.sumAreas(house.areasV1)}, expected ${house.plotArea}`);
if (house.sumAreas(house.areasV2) !== house.plotArea) err(`house v2 areas sum to ${house.sumAreas(house.areasV2)}, expected ${house.plotArea}`);
if (house.reviseOptions.filter((o) => o.best).length !== 1) err('house revise options need exactly one best');

// 7. Preschool: every option changes the outcome.
const base = { character: 'bird', place: 'palms', action: 'sing' };
const baseText = preschool.buildStory(base).sentences.join(' ');
for (const c of preschool.storyCharacters) for (const p of preschool.storyPlaces) for (const a of preschool.storyActions) {
  const s = preschool.buildStory({ character: c.id, place: p.id, action: a.id });
  if (s.sentences.some((x) => !x)) err(`story ${c.id}/${p.id}/${a.id} has a missing sentence`);
}
(['character', 'place', 'action'] as const).forEach((slot) => {
  const list = slot === 'character' ? preschool.storyCharacters : slot === 'place' ? preschool.storyPlaces : preschool.storyActions;
  list.filter((x) => x.id !== base[slot]).forEach((x) => {
    if (preschool.buildStory({ ...base, [slot]: x.id }).sentences.join(' ') === baseText) err(`story option ${slot}=${x.id} does not change the story`);
  });
});

// 8. Routes: every content link resolves to a known route pattern.
const links = [
  to.home(), to.house(), to.marshes(), to.studio(), to.guide(), to.progress(), to.settings(),
  ...ages.map((a) => to.path(a.id)),
  ...families.map((f) => to.kids(f.id)),
  ...allSchoolTopics.flatMap((t) => [to.school('a7', t.id), to.school('a10', t.id)]),
  ...allBranches.map(({ field, branch }) => to.branch(field.id, branch.id)),
  ...allBranches.map(({ field, branch }) => to.studio(field.id, branch.id)),
  ...fus.map((s) => to.followup(s.id))
];
links.forEach((l) => { if (!matchesPattern(l)) err(`dead route: ${l}`); });

// 9. Arabic house style: banned terms and constructions (owner's editorial rules).
const banned: [RegExp, string][] = [
  [/(^|[^؀-ۿ])(مجرد|مجرّد|التراث|بوصفه|بوصفها)(?=$|[^؀-ۿ])/, 'banned term'],
  [/(^|[^؀-ۿ])بل(?=$|[^؀-ۿ])/, 'construction with «بل»'],
  [/وإنما/, 'construction with «وإنما»'],
  [/الشاطبي|الموافقات|ابن تيمية|ابن القيم|ابن باز|ابن عثيمين/, 'excluded source name']
];
function walk(v: unknown, path: string) {
  if (typeof v === 'string') {
    for (const [re, label] of banned) if (re.test(v)) err(`${label} at ${path}: «${v.slice(0, 80)}»`);
  } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
  else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, `${path}.${k}`));
}
walk({ fields, schoolInterests, fus, services, guideConcepts, house, brand, marshesProject, ages, preschool }, 'content');

warn.forEach((w) => console.warn('warn:', w));
if (errors.length) {
  console.error(`\nContent validation failed (${errors.length}):`);
  errors.forEach((e) => console.error(' - ' + e));
  process.exit(1);
}
console.log(`content OK: ${fields.length} fields, ${allBranches.length} branches, ${allSchoolTopics.length} school topics, ${fus.length} follow-ups, ${links.length} routes checked`);
