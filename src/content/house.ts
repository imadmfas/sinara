// Showcase journey: an Iraqi homeowner's conceptual brief.
// All areas are illustrative teaching figures (مثال تعليمي), not a construction drawing.
// No setbacks or building regulations are stated; those belong to the local authority and a licensed architect.

export interface HouseDetail { id: string; label: string; phrase: string; icon: string }

export const houseStart = 'ارسم لي خريطة بيت';

export const houseDetails: HouseDetail[] = [
  { id: 'plot', label: 'أرض ١٠ × ٢٠ متراً', phrase: 'على أرض أبعادها ١٠ × ٢٠ متراً', icon: '📐' },
  { id: 'street', label: 'الشارع من جهة الشمال', phrase: 'وشارعها من جهة الشمال', icon: '🧭' },
  { id: 'floors', label: 'طابق واحد', phrase: 'بطابق واحد', icon: '🏠' },
  { id: 'bedrooms', label: 'ثلاث غرف نوم', phrase: 'فيه ثلاث غرف نوم', icon: '🛏️' },
  { id: 'courtyard', label: 'فناء داخلي', phrase: 'وفناء داخلي', icon: '🌿' }
];

export const houseOutputPhrase =
  'اقترح جدول مساحات أولياً تقريبياً يحسب الفناء والممرات، وتأكد أن مجموع المساحات يساوي مساحة الأرض. هذا تصوّر للنقاش وسأعرضه على مهندس معماري قبل أي تنفيذ.';

export function houseRequest(selected: string[], withOutput: boolean): string {
  const parts = houseDetails.filter((d) => selected.includes(d.id)).map((d) => d.phrase);
  if (parts.length === 0 && !withOutput) return houseStart;
  const body = `اقترح توزيعاً أولياً لبيت ${parts.join(' ')}`.trim() + '.';
  return withOutput ? `${body} ${houseOutputPhrase}` : body;
}

export interface AreaRow { id: string; name: string; area: number; note?: string }

/** Single-floor concept. Sum = 200 m² = plot area (10 × 20). */
export const areasV1: AreaRow[] = [
  { id: 'master', name: 'غرفة النوم الرئيسية', area: 16 },
  { id: 'bed2', name: 'غرفة النوم الثانية', area: 12 },
  { id: 'bed3', name: 'غرفة النوم الثالثة', area: 12 },
  { id: 'living', name: 'صالة الجلوس', area: 24 },
  { id: 'guest', name: 'غرفة الاستقبال (الضيوف)', area: 16 },
  { id: 'kitchen', name: 'المطبخ', area: 12 },
  { id: 'bath1', name: 'الحمّام الرئيسي', area: 5 },
  { id: 'bath2', name: 'الحمّام الثاني', area: 4 },
  { id: 'circ', name: 'الممرات والحركة', area: 15 },
  { id: 'walls', name: 'الجدران والأعمدة (تقدير)', area: 12 },
  { id: 'court', name: 'الفناء الداخلي', area: 30 },
  { id: 'front', name: 'المساحة المكشوفة الأمامية والمدخل', area: 42, note: 'مقاسها النهائي تحدده تعليمات الجهة المختصة في مدينتك' }
];

/** Revised concept reserving stair access for a possible second floor. Sum stays 200 m². */
export const areasV2: AreaRow[] = areasV1.map((r) => {
  if (r.id === 'guest') return { ...r, area: 12 };
  if (r.id === 'front') return { ...r, area: 36 };
  return r;
}).concat([{ id: 'stair', name: 'بيت الدرج (محجوز للطابق الثاني)', area: 10, note: 'موقعه وعرضه يقررهما المعماري والمهندس الإنشائي' }]);

export const changedInV2 = ['guest', 'front', 'stair'];

export const plotArea = 10 * 20;
export const sumAreas = (rows: AreaRow[]) => rows.reduce((s, r) => s + r.area, 0);

export const newFact = 'معلومة جديدة: العائلة قد تضيف طابقاً ثانياً بعد سنوات.';

export const reviseOptions = [
  {
    id: 'stairs', best: true,
    text: 'إذا أضفنا طابقاً ثانياً لاحقاً، أين نحجز مكان الدرج من الآن، وكم مساحة يأخذ، وما الذي يتغيّر في جدول المساحات؟',
    feedback: 'أحسنت. الدرج يحتاج مكاناً يُحجز من البداية، وإلا اضطررت لهدم جزء من البيت لاحقاً.'
  },
  {
    id: 'facade', best: false,
    text: 'ما ألوان الواجهة والحجر التي تناسب بيتاً من طابقين في شارع شمالي؟',
    feedback: 'سؤال معقول، لكنه مبكر. الألوان لا تغيّر التوزيع، أما مكان الدرج فيغيّره.'
  },
  {
    id: 'second-plan', best: false,
    text: 'ارسم لي الطابق الثاني كاملاً بغرفه وأثاثه حتى أراه الآن.',
    feedback: 'الطابق الثاني يعتمد على قرارات لم تُتخذ بعد. ابدأ بما يجب حجزه في الطابق الأول.'
  },
  {
    id: 'foundation', best: false,
    text: 'هل يتحمّل الأساس طابقاً ثانياً؟ أجبني بنعم أو لا.',
    feedback: 'سؤال مهم جداً، لكن جوابه عند مهندس إنشائي يفحص التصميم والتربة. المساعد لا يستطيع الحكم عليه.'
  }
];

export const architectDecisions = [
  'الارتدادات وتعليمات البناء في مدينتك، وتحددها الجهة المختصة.',
  'تصميم الأساس والهيكل ليحمل طابقاً ثانياً، ويحتاج مهندساً إنشائياً.',
  'موقع الدرج النهائي وعرضه وارتفاع درجاته.',
  'التهوية والإنارة الطبيعية وحماية الجدار الغربي من الحرّ.',
  'تمديدات الماء والكهرباء والصرف للطابقين.'
];

export const finalPrompt =
  'اقترح توزيعاً أولياً لبيت على أرض أبعادها ١٠ × ٢٠ متراً وشارعها من جهة الشمال، بطابق واحد فيه ثلاث غرف نوم وفناء داخلي. العائلة قد تضيف طابقاً ثانياً لاحقاً، فاحجز مكاناً للدرج وبيّن ما يتغيّر في المساحات. اعرض جدول مساحات تقريبياً يحسب الفناء والممرات، وتأكد أن مجموعه ٢٠٠ متر مربع. اذكر القرارات التي يجب أن يحسمها معماري ومهندس إنشائي محليان، ولا تفترض تعليمات بناء غير مذكورة.';
