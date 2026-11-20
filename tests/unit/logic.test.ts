import { describe, expect, it } from 'vitest';
import { migrate, emptyState, practise, resetBand, SCHEMA_VERSION } from '../../src/lib/store';
import { buildPrompt } from '../../src/lib/promptBuilder';
import { reply, type CoachContext } from '../../src/lib/coach';
import { buildStory, countPhrase } from '../../src/content/preschool';
import { fields } from '../../src/content/index';

describe('progress store', () => {
  it('migrates v1 flat skills into per-band progress', () => {
    const s = migrate({ version: 1, band: 'a10', skills: { task: { count: 2, last: 1 } }, settings: { effects: true } });
    expect(s.version).toBe(SCHEMA_VERSION);
    expect(s.progress.a10?.skills.task?.count).toBe(2);
    expect(s.settings.effects).toBe(true);
    expect(s.settings.narration).toBe(false);
  });
  it('keeps progress separate per band and resets one band only', () => {
    let s = { ...emptyState(), band: 'a4' as const };
    s = practise(s, 'task', 'k');
    s = practise({ ...s, band: 'a23' }, 'verify', 'h');
    expect(s.progress.a4?.skills.task?.count).toBe(1);
    expect(s.progress.a23?.skills.verify?.count).toBe(1);
    s = resetBand(s, 'a4');
    expect(s.progress.a4).toBeUndefined();
    expect(s.progress.a23).toBeDefined();
  });
  it('survives garbage', () => { expect(migrate('x').band).toBeNull(); });
});

describe('prompt builder', () => {
  const base = { service: 'explain', goal: '', audience: '', inputs: '', constraints: '', format: 'جدول', verify: 'بدون خطوة تحقق إضافية', extra: {} };
  it('reports missing task and required fields', () => {
    const b = buildPrompt(base);
    expect(b.missing).toEqual(['المهمة أو المفهوم']);
    expect(b.next).toContain('الفائدة المركّبة');
  });
  it('asks the assistant to wait when the material is not supplied', () => {
    const b = buildPrompt({ ...base, service: 'summarize', goal: 'تلخيص' });
    expect(b.waits).toBe(true);
    expect(b.text).toContain('انتظر النص');
  });
  it('different services change the output', () => {
    const a = buildPrompt({ ...base, goal: 'x', extra: { concept: 'ك' } }).text;
    const c = buildPrompt({ ...base, service: 'compare', goal: 'x', extra: { alternatives: 'أ أو ب', criteria: 'الكلفة' } }).text;
    expect(a).not.toEqual(c);
    expect(c).toContain('قارن بهذه المعايير');
  });
});

describe('guided coach', () => {
  const ctx = (k: string, last?: string, ok?: boolean): CoachContext => ({ key: k, title: k, kind: 'branch', lastChoice: last, lastCorrect: ok, material: { simpler: `بسيط ${k}`, example: `مثال ${k}`, why: `سبب ${k}`, next: [`تالي ${k}`] } });
  it('answers from the current lesson', () => {
    expect(reply('example', ctx('العمارة'), 'a23', [])).toContain('مثال العمارة');
    expect(reply('example', ctx('الري'), 'a23', [])).toContain('مثال الري');
  });
  it('responds to the last wrong choice', () => {
    expect(reply('why', ctx('x', 'خيار خاطئ', false), 'a23', [])).toContain('خيار خاطئ');
  });
  it('branches on repeated questions and age band', () => {
    const first = reply('simpler', ctx('x'), 'a10', []);
    const second = reply('simpler', ctx('x'), 'a10', [{ from: 'learner', text: '', intent: 'simpler' }]);
    expect(first).not.toEqual(second);
  });
});

describe('preschool content', () => {
  it('builds a story that uses every choice', () => {
    const s = buildStory({ character: 'cat', place: 'river', action: 'friend' });
    expect(s.request).toContain('قطة على شاطئ دجلة');
    expect(s.request).toContain('تلعب');
    expect(s.sentences.join(' ')).toContain('دجلة');
    expect(s.sentences.join(' ')).toContain('الأرنب');
  });
  it('uses correct number agreement', () => {
    expect(countPhrase('pencils', 3)).toBe('ثلاثة أقلام');
    expect(countPhrase('dates', 3)).toBe('ثلاث تمرات');
    expect(countPhrase('pencils', 2)).toBe('قلمان');
  });
});

describe('branches', () => {
  it('two branches produce substantively different worked prompts', () => {
    const a = fields[0].branches[0].good, b = fields[7].branches[1].good;
    const words = (s: string) => new Set(s.split(/\s+/));
    const wa = words(a), wb = words(b);
    const shared = [...wa].filter((w) => wb.has(w)).length;
    expect(shared / Math.min(wa.size, wb.size)).toBeLessThan(0.25);
  });
});

import { parseNumber, sumAreas, inconsistentRows } from '../../src/content/house';
import { expandQuery, normalize } from '../../src/lib/catalog';
import { storyFollowup, storyGuideLine } from '../../src/content/preschool';

describe('house exercise numbers', () => {
  it('accepts Arabic-Indic, Extended and Western digits', () => {
    expect(parseNumber('٢٠٠')).toBe(200);
    expect(parseNumber('200 م²')).toBe(200);
    expect(parseNumber('۲۰۰')).toBe(200);
    expect(parseNumber('مية')).toBeNull();
  });
  it('the second example is deliberately inconsistent', () => { expect(sumAreas(inconsistentRows)).toBe(194); });
});

describe('library search', () => {
  it('normalizes diacritics and hamza forms', () => { expect(normalize('بَيْتٌ أَخْضَر')).toBe(normalize('بيت اخضر')); });
  it('expands Iraqi aliases', () => {
    expect(expandQuery('مخطط منزل').flat()).toContain(normalize('خريطة بيت'));
    expect(expandQuery('حاسبة').flat()).toContain(normalize('حاسوب'));
    expect(expandQuery('برومبت').flat()).toContain(normalize('طلب'));
  });
});

describe('story state', () => {
  it('follow-up uses the active animal and place', () => {
    const f = storyFollowup({ character: 'bird', place: 'river', action: 'date' });
    expect(f.request).toBe('احكِ لي قصة عن عصفور يبحث عن تمرة.');
    expect(f.options.find((o) => o.best)!.text).toBe('شاطئ دجلة');
  });
  it('guide line names the current animal and offers one next change', () => {
    expect(storyGuideLine({}, false, null).opening).toContain('اختر حيواناً');
    const l = storyGuideLine({ character: 'turtle', place: 'roof', action: 'sing' }, true, 'place');
    expect(l.opening).toContain('قصتنا عن السلحفاة على سطح البيت');
    expect(l.opening).toContain('تسوّي');
  });
});

describe('studio: no restating the same content', () => {
  const base = { goal: '', audience: '', inputs: '', constraints: '', format: 'جدول', verify: 'بدون خطوة تحقق إضافية' };
  it('a concept alone is enough for «شرح مفهوم»', () => {
    const b = buildPrompt({ ...base, service: 'explain', extra: { concept: 'الفائدة المركّبة' } });
    expect(b.missing).toEqual([]);
    expect(b.text).toContain('مهمتي: أن أفهم الفائدة المركّبة.');
    expect(b.text.match(/الفائدة المركّبة/g)!.length).toBe(1);
  });
  it('a goal alone is enough too, and defaults are not counted as supplied', () => {
    const b = buildPrompt({ ...base, service: 'explain', goal: 'أن أفهم الكسور', extra: {} });
    expect(b.missing).toEqual([]);
    expect(b.supplied).toEqual(['المهمة']);
    expect(b.next).toContain('الجمهور');
  });
});
