import type { AgeBandId } from '../content/types';
import { brand } from '../content/brand';

// مرشد الدرس — the offline guided coach. A local branching conversation built from the
// current lesson's content, the learner's last choice and the age band. No network calls.

export type Intent = 'simpler' | 'example' | 'why' | 'next' | 'hint';

export interface CoachMaterial {
  simpler: string;
  example: string;
  why: string;
  next: string[];
  hint?: string;
  /** Stage-aware first line (used by the preschool story). */
  opening?: string;
}

export interface CoachContext {
  key: string;
  title: string;
  kind: 'home' | 'kids' | 'school' | 'branch' | 'house' | 'followup' | 'studio' | 'guide' | 'marshes' | 'progress' | 'library' | 'lab' | 'other';
  lastChoice?: string;
  lastCorrect?: boolean;
  material: CoachMaterial;
}

export interface CoachTurn { from: 'learner' | 'guide'; text: string; intent?: Intent }

export const intentLabels: Record<Intent, string> = {
  simpler: 'اشرح أبسط',
  example: 'أعطني مثالاً',
  why: 'ليش هذا الجواب؟',
  next: 'شنو أسأل بعدها؟',
  hint: 'أعطني تلميحاً'
};

/** Illustrated reply buttons for the preschool conversation. */
export const kidIntents: { intent: Intent; icon: string; label: string }[] = [
  { intent: 'hint', icon: '👉', label: 'شنو أختار؟' },
  { intent: 'example', icon: '🖼️', label: 'مثال' },
  { intent: 'next', icon: '❓', label: 'شنو نسأل بعدها؟' }
];

export function opening(ctx: CoachContext, band: AgeBandId | null): string {
  if (ctx.material.opening) return ctx.material.opening;
  if (band === 'a4') return `آني ${brand.guide}. نلعب «${ctx.title}». اختر صورة، وأنا أساعدك.`;
  if (band === 'a7' || band === 'a10') return `أنا ${brand.guide}، مرشد الدرس. نحن في «${ctx.title}». اختر سؤالاً تحت، وأجيبك من هذا الدرس.`;
  return `أنا ${brand.guide}، مرشد الدرس. أساعدك في «${ctx.title}»${ctx.lastChoice ? `، وآخر اختيار لك: «${trim(ctx.lastChoice)}»` : ''}. هذه ردود محلية مكتوبة مسبقاً لهذا الدرس.`;
}

const trim = (s: string, n = 70) => (s.length > n ? s.slice(0, n) + '…' : s);

export function reply(intent: Intent, ctx: CoachContext, band: AgeBandId | null, history: CoachTurn[]): string {
  const asked = history.filter((h) => h.from === 'learner' && h.intent === intent).length; // times asked before this turn
  const m = ctx.material;
  const kid = band === 'a4';
  const young = band === 'a7' || band === 'a10';
  switch (intent) {
    case 'simpler': {
      if (asked === 0) return kid ? shorten(m.simpler) : m.simpler;
      if (asked === 1) return kid ? 'كل ما نضيف شي، يتغيّر الجواب. جرّب!' : `بكلمة واحدة: التفصيل. ${young ? 'كل تفصيل تضيفه يقرّب الجواب مما تريد.' : 'كل تفصيل يؤثر في الجواب يستحق أن يُذكر.'}`;
      return 'جرّب الآن بنفسك على الشاشة، ثم ارجع إليّ إذا احتجت تلميحاً.';
    }
    case 'example': {
      const prefix = kid ? '' : 'مثال من هذا الدرس: ';
      if (asked === 0) return `${prefix}${m.example}`;
      return kid ? 'جرّب صورة ثانية، وشوف شنو يتغيّر.' : `مثال آخر: غيّر تفصيلاً واحداً في الطلب السابق (الجمهور أو الطول أو الشكل)، وتوقّع كيف سيتغيّر الجواب قبل أن تراه.`;
    }
    case 'why': {
      if (ctx.lastChoice !== undefined && ctx.lastCorrect === false)
        return `اخترت «${trim(ctx.lastChoice)}». ${young || kid ? 'قريب! ' : ''}هذا الاختيار ينقصه شيء: ${m.why} جرّب مرة ثانية.`;
      if (ctx.lastChoice !== undefined && ctx.lastCorrect)
        return `اخترت «${trim(ctx.lastChoice)}»، وهو مناسب لأن ${lowerFirst(m.why)}`;
      return m.why;
    }
    case 'next': {
      const n = m.next[asked % Math.max(1, m.next.length)] ?? 'ماذا ينقص الجواب لتستعمله فعلاً؟';
      return kid ? n : `سؤال متابعة مقترح: «${n}»`;
    }
    case 'hint':
      return m.hint ?? (kid ? 'اختر الصورة اللي تحبها، وشوف القصة شلون تتغيّر.' : 'ابحث في الطلب عن التفصيل الذي يغيّر الجواب: المدة، الجمهور، المعطيات، أو طريقة التحقق.');
  }
}

const shorten = (s: string) => s.split(/[.،]/)[0] + '.';
const lowerFirst = (s: string) => s;

export const defaultMaterial: CoachMaterial = {
  simpler: 'كل سؤال جيد يقول ثلاثة أشياء: ماذا تريد، ولمن، وكيف تتأكد من الجواب.',
  example: 'بدل «ساعدني بالدراسة» قل: «اشرح لي الكسور بمثال كعكة، ثم اسألني سؤالاً واحداً».',
  why: 'التفاصيل التي تذكرها هي ما يستعمله المساعد ليقترب مما تريد.',
  next: ['ماذا ينقص هذا الجواب حتى أستعمله؟', 'هل يمكنك أن تختصره لجمهوري؟', 'ما الذي يحتاج إلى تحقق هنا؟']
};
