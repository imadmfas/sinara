// Ages 4–6. Four activity families. Every visible option changes the authored outcome.
// Stories are original, written for this product. Narration is optional and caregiver-enabled.

export type Gender = 'm' | 'f';

export interface KidChoice { id: string; label: string; icon: string }
export interface StoryCharacter extends KidChoice { gender: Gender; definite: string }
export interface StoryAction extends KidChoice { m: string; f: string }

export const families = [
  { id: 'story', icon: '🐦', name: 'القصص والحيوانات' },
  { id: 'drawing', icon: '🎨', name: 'الألوان والرسم' },
  { id: 'counting', icon: '🔢', name: 'العدّ والألعاب' },
  { id: 'shapes', icon: '🏡', name: 'البيت والأشكال' }
] as const;
export type FamilyId = (typeof families)[number]['id'];

/* ---------- Showcase: the story builder ---------- */
export const storyCharacters: StoryCharacter[] = [
  { id: 'bird', label: 'عصفور', icon: 'bird', gender: 'm', definite: 'العصفور' },
  { id: 'cat', label: 'قطة', icon: 'cat', gender: 'f', definite: 'القطة' },
  { id: 'turtle', label: 'سلحفاة', icon: 'turtle', gender: 'f', definite: 'السلحفاة' }
];
export const storyPlaces: KidChoice[] = [
  { id: 'palms', label: 'بستان النخيل', icon: 'palms' },
  { id: 'river', label: 'شاطئ دجلة', icon: 'river' },
  { id: 'roof', label: 'سطح البيت', icon: 'roof' }
];
export const storyActions: StoryAction[] = [
  { id: 'sing', label: 'يغنّي', icon: 'sing', m: 'يغنّي', f: 'تغنّي' },
  { id: 'date', label: 'يبحث عن تمرة', icon: 'date', m: 'يبحث عن تمرة', f: 'تبحث عن تمرة' },
  { id: 'friend', label: 'يلعب مع صديق', icon: 'friend', m: 'يلعب مع صديق', f: 'تلعب مع صديق' }
];

const opening: Record<string, Record<string, string>> = {
  bird: {
    palms: 'في صباح مشمس، وقف عصفور صغير على سعفة في بستان النخيل.',
    river: 'في صباح مشمس، وقف عصفور صغير على غصن قرب شاطئ دجلة.',
    roof: 'في صباح مشمس، وقف عصفور صغير على حافة سطح البيت.'
  },
  cat: {
    palms: 'في صباح مشمس، تمشّت قطة صغيرة بين جذوع بستان النخيل.',
    river: 'في صباح مشمس، جلست قطة صغيرة على عشب شاطئ دجلة.',
    roof: 'في صباح مشمس، قفزت قطة صغيرة إلى سطح البيت.'
  },
  turtle: {
    palms: 'في صباح مشمس، زحفت سلحفاة صغيرة بهدوء في بستان النخيل.',
    river: 'في صباح مشمس، زحفت سلحفاة صغيرة على رمل شاطئ دجلة.',
    roof: 'في صباح مشمس، صعدت سلحفاة صغيرة درجة درجة إلى سطح البيت.'
  }
};
const middle: Record<string, Record<string, string>> = {
  bird: {
    sing: 'فتح العصفور منقاره وغنّى أغنية فرحة.',
    date: 'بحث العصفور عن تمرة حلوة، فوجد واحدة لامعة.',
    friend: 'لعب العصفور مع صديقه الحمام لعبة الطيران في دوائر.'
  },
  cat: {
    sing: 'رفعت القطة رأسها وغنّت: مياو، مياو، بصوت فرحان.',
    date: 'بحثت القطة عن تمرة سقطت، فوجدتها تحت ورقة خضراء وحملتها إلى جدّتها.',
    friend: 'لعبت القطة مع صديقها الأرنب لعبة الاختباء.'
  },
  turtle: {
    sing: 'غنّت السلحفاة أغنية بطيئة هادئة، وهزّت رأسها مع اللحن.',
    date: 'بحثت السلحفاة عن تمرة، ومشت إليها خطوة خطوة حتى وصلت.',
    friend: 'لعبت السلحفاة مع صديقها العصفور لعبة السباق، وضحك الاثنان.'
  }
};
const closing: Record<string, string> = {
  palms: 'وحين هبّ الهواء، رقص السعف في البستان كأنه يصفّق.',
  river: 'ولمع ماء دجلة تحت الشمس، وسُمع صوت الماء الهادئ.',
  roof: 'ومن فوق السطح ظهر النخيل البعيد، وغابت الشمس بلون برتقالي.'
};

export interface StoryPick { character: string; place: string; action: string }

export function buildStory(p: StoryPick): { request: string; sentences: string[] } {
  const c = storyCharacters.find((x) => x.id === p.character)!;
  const pl = storyPlaces.find((x) => x.id === p.place)!;
  const a = storyActions.find((x) => x.id === p.action)!;
  const verb = c.gender === 'm' ? a.m : a.f;
  return {
    request: `احكِ لي قصة قصيرة من ثلاث جمل عن ${c.label} في ${pl.label} ${verb}.`,
    sentences: [opening[c.id][pl.id], middle[c.id][a.id], closing[pl.id]]
  };
}

/** Which sentences depend on which slot. Used to highlight the changed part. */
export const storyDependencies: Record<keyof StoryPick, number[]> = {
  character: [0, 1],
  place: [0, 2],
  action: [1]
};

export const slotLabels: Record<keyof StoryPick, { label: string; icon: string }> = {
  character: { label: 'الحيوان', icon: 'cat' },
  place: { label: 'المكان', icon: 'palms' },
  action: { label: 'ماذا يفعل', icon: 'sing' }
};

export const caregiverCue = 'اسأله: شنو تغيّر بالقصة من غيّرنا المكان؟';

/* ---------- Colors and drawing ---------- */
export const drawObjects: KidChoice[] = [
  { id: 'palm', label: 'نخلة', icon: '🌴' },
  { id: 'flower', label: 'زهرة', icon: '🌷' },
  { id: 'butterfly', label: 'فراشة', icon: '🦋' }
];
export const drawColors = [
  { id: 'green', label: 'أخضر', icon: '🟢', hex: '#2f9a55' },
  { id: 'yellow', label: 'أصفر', icon: '🟡', hex: '#e8b923' },
  { id: 'orange', label: 'برتقالي', icon: '🟠', hex: '#ee7d3b' }
];
export const drawSizes = [
  { id: 'big', label: 'كبيرة', icon: '⬛' },
  { id: 'small', label: 'صغيرة', icon: '▪️' }
];
export function drawingSteps(obj: string, color: string, size: string) {
  const c = drawColors.find((x) => x.id === color)!.label;
  const big = size === 'big';
  const o = drawObjects.find((x) => x.id === obj)!.label;
  const shape: Record<string, string[]> = {
    palm: [`ارسم جذعاً ${big ? 'طويلاً' : 'قصيراً'} في وسط الورقة.`, `ارسم سعفاً ${c} في الأعلى.`, 'أضف ثلاث تمرات تحت السعف.'],
    flower: [`ارسم ساقاً ${big ? 'طويلة' : 'قصيرة'}.`, `ارسم خمس بتلات بلون ${c}.`, 'أضف ورقتين على الساق.'],
    butterfly: [`ارسم جسماً ${big ? 'طويلاً' : 'صغيراً'} في الوسط.`, `ارسم جناحين بلون ${c}.`, 'أضف نقاطاً على الجناحين.']
  };
  return {
    request: `ساعدني أرسم ${o} ${big ? 'كبيرة' : 'صغيرة'} بلون ${c} بثلاث خطوات.`,
    steps: shape[obj]
  };
}

/* ---------- Counting and games ---------- */
export const countItems = [
  { id: 'dates', label: 'تمرات', icon: '🟤', gender: 'f' as Gender, one: 'تمرة', two: 'تمرتان', plural: 'تمرات' },
  { id: 'balls', label: 'كرات', icon: '⚽', gender: 'f' as Gender, one: 'كرة', two: 'كرتان', plural: 'كرات' },
  { id: 'pencils', label: 'أقلام', icon: '✏️', gender: 'm' as Gender, one: 'قلم', two: 'قلمان', plural: 'أقلام' }
];
export const countNumbers = [3, 4, 5];
const numF: Record<number, string> = { 3: 'ثلاث', 4: 'أربع', 5: 'خمس' };
const numM: Record<number, string> = { 3: 'ثلاثة', 4: 'أربعة', 5: 'خمسة' };
/** Correct Arabic number–noun agreement for 1–5. */
export function countPhrase(itemId: string, n: number): string {
  const it = countItems.find((x) => x.id === itemId)!;
  if (n === 1) return `${it.one} واحدة`.replace('قلم واحدة', 'قلم واحد');
  if (n === 2) return it.two;
  return `${it.gender === 'm' ? numM[n] : numF[n]} ${it.plural}`;
}
export const arabicDigits = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

/* ---------- Home and shapes ---------- */
export const shapeBases = [
  { id: 'square', label: 'مربّع', icon: '🟥' },
  { id: 'rect', label: 'مستطيل', icon: '▬' }
];
export const shapeRoofs = [
  { id: 'triangle', label: 'مثلّث', icon: '🔺' },
  { id: 'dome', label: 'نصف دائرة', icon: '◓' }
];
export const shapeExtras = [
  { id: 'door', label: 'باب', icon: '🚪' },
  { id: 'window', label: 'نافذة', icon: '🪟' },
  { id: 'palm', label: 'نخلة جنبه', icon: '🌴' }
];
export function shapeDescription(base: string, roof: string, extra: string) {
  const b = shapeBases.find((x) => x.id === base)!.label;
  const r = shapeRoofs.find((x) => x.id === roof)!.label;
  const e = shapeExtras.find((x) => x.id === extra)!.label;
  return {
    request: `ساعدني أصنع بيتاً من الورق: جداره ${b}، وسقفه ${r}، وفيه ${e}.`,
    lines: [
      `ضع ${b === 'مربّع' ? 'المربّع' : 'المستطيل'} على الطاولة ليصير جداراً.`,
      `ضع ${r === 'مثلّث' ? 'المثلّث' : 'نصف الدائرة'} فوقه ليصير سقفاً.`,
      extra === 'palm' ? 'ارسم نخلة صغيرة جنب البيت.' : `ارسم ${e} في الجدار.`
    ]
  };
}
