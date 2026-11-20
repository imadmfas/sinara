// Editorial layer for the imported prompt catalogue (sinara-handoff/catalog/sinara-prompts.json).
// The source records are generated instructional variants with fictional inputs. This file holds the
// crosswalk to Sinara's fields, per-mode teaching notes, search aliases and the curated showcase answers.

export const CATALOG_ORIGIN = 'حزمة تسليم سِينارة ٢٠ تشرين الثاني ٢٠٢٦ — صيغ تعليمية مولّدة بمدخلات خيالية';

/** Editorial shelf (source domain) → existing Sinara field ids. First entry is the primary shelf. */
export const domainCrosswalk: Record<string, string[]> = {
  'التعليم والتدريب': ['teaching'],
  'البحث والعلوم الإنسانية': ['research', 'humanities'],
  'الهندسة والعمارة': ['engineering'],
  'الحاسوب والمهارات الرقمية': ['computing'],
  'الإدارة والأعمال': ['business'],
  'الصحة والتواصل': ['health'],
  'الزراعة والبيئة': ['agriculture'],
  'القانون والإجراءات العامة': ['law'],
  'الإعلام والتصميم': ['arts'],
  'اللغات والكتابة': ['languages'],
  'الأسرة والحياة اليومية': ['everyday'],
  'الحرف والتعلم المهني': ['everyday', 'teaching']
};

/** Case-level extra shelves where an entry clearly belongs to a specific branch as well. */
export const caseBranches: Record<string, string[]> = {
  'SC-001': ['teaching/primary'], 'SC-002': ['teaching/university', 'languages/english-conversation'], 'SC-003': ['teaching/primary'],
  'SC-008': ['computing/digital-literacy'], 'SC-011': ['research/source-review'], 'SC-012': ['research/source-review'],
  'SC-013': ['research/academic-writing'], 'SC-014': ['humanities/sociology'], 'SC-016': ['humanities/philosophy'],
  'SC-017': ['humanities/sociology'], 'SC-019': ['research/academic-writing', 'humanities/creed-religions'],
  'SC-021': ['engineering/architecture'], 'SC-022': ['engineering/architecture'], 'SC-023': ['engineering/civil'],
  'SC-025': ['engineering/electrical'], 'SC-026': ['engineering/mechanical'], 'SC-030': ['engineering/mechanical'],
  'SC-031': ['computing/spreadsheets', 'everyday/shopping'], 'SC-033': ['computing/digital-literacy', 'everyday/digital-skills'],
  'SC-035': ['computing/spreadsheets'], 'SC-036': ['computing/web-design'], 'SC-037': ['computing/programming'],
  'SC-041': ['business/project-management'], 'SC-042': ['business/small-shops', 'business/accounting'], 'SC-044': ['business/small-shops'],
  'SC-048': ['business/marketing'], 'SC-050': ['business/accounting'], 'SC-051': ['health/health-education'],
  'SC-052': ['health/patient-communication'], 'SC-053': ['health/nursing'], 'SC-058': ['health/patient-communication'],
  'SC-061': ['agriculture/palms'], 'SC-062': ['agriculture/home-garden'], 'SC-063': ['agriculture/environment-education'],
  'SC-066': ['agriculture/irrigation'], 'SC-071': ['law/reading-texts', 'law/admin-procedures'], 'SC-072': ['law/official-letters'],
  'SC-079': ['law/admin-procedures'], 'SC-081': ['arts/design'], 'SC-082': ['arts/photography', 'agriculture/palms'],
  'SC-085': ['arts/content-writing'], 'SC-087': ['arts/design'], 'SC-091': ['languages/english-conversation'],
  'SC-092': ['languages/translation'], 'SC-099': ['languages/reading'], 'SC-103': ['everyday/shopping'],
  'SC-105': ['everyday/digital-skills', 'computing/digital-literacy'], 'SC-108': ['everyday/shopping'],
  'SC-109': ['everyday/digital-skills'], 'SC-111': ['teaching/vocational', 'everyday/crafts'], 'SC-113': ['everyday/crafts'],
  'SC-119': ['arts/photography', 'everyday/crafts']
};

/** Domains whose cases may also be offered to 13–17 (by subject matter, never by professional title). */
export const teenDomains = ['الحاسوب والمهارات الرقمية', 'اللغات والكتابة', 'الإعلام والتصميم', 'الزراعة والبيئة'];

export type Difficulty = 'مبتدئ' | 'متوسط' | 'متقدم';

export interface ModeGuide {
  difficulty: Difficulty;
  when: string; // when to use this kind of request
  followup: string; // a useful follow-up question after the first answer
  capability: string; // what the assistant must be able to do
}

export const modeGuides: Record<string, ModeGuide> = {
  'نموذج منجز': { difficulty: 'مبتدئ', capability: 'نص', when: 'حين تحتاج نسخة جاهزة تبدأ منها ثم تعدّلها.', followup: 'أيّ سطر أغيّره إذا تغيّر عدد المشاركين أو الوقت؟' },
  'تجهيز المدخلات': { difficulty: 'متوسط', capability: 'نص وجدول', when: 'قبل أن تطلب الناتج، لتعرف ما ينقصك من معلومات.', followup: 'هذه المعلومة الناقصة: … أعد الترتيب بعد إضافتها.' },
  'قالب قابل للتعبئة': { difficulty: 'مبتدئ', capability: 'نص وجدول', when: 'حين تتكرر المهمة وتريد نموذجاً يملؤه غيرك.', followup: 'أيّ حقل يمكن حذفه دون أن نفقد شيئاً مهماً؟' },
  'تشخيص طلب مبهم': { difficulty: 'متوسط', capability: 'نص', when: 'حين تعرف أن طلبك غامض ولا تعرف أين الغموض.', followup: 'أيّ تغيير من التغييرات كان أكبر أثراً، ولماذا؟' },
  'قرار بين خيارين': { difficulty: 'متوسط', capability: 'نص وجدول', when: 'حين يوجد طريقان معقولان وتحتاج معياراً للاختيار.', followup: 'لو تغيّرت المعلومة الحاسمة، أيّ خيار يصبح أنسب؟' },
  'مثال وخطأه': { difficulty: 'متوسط', capability: 'محادثة متعددة الأدوار', when: 'لتدريب العين على كشف الخطأ قبل الاعتماد على أي جواب.', followup: 'أعطني مثالاً ثانياً فيه خطأ من نوع مختلف.' },
  'مراجعة مخرج': { difficulty: 'متقدم', capability: 'نص', when: 'حين عندك مسودة وتريد مراجعة منظمة لها.', followup: 'أيّ ملاحظة من الملاحظات تؤثر في القرار النهائي أكثر؟' },
  'خطة عمل': { difficulty: 'مبتدئ', capability: 'نص وجدول', when: 'حين تكون المهمة كبيرة وتريد خطوات قصيرة قابلة للمتابعة.', followup: 'ما الخطوة التي يمكن تأجيلها إذا ضاق الوقت؟' },
  'تدريب تفاعلي': { difficulty: 'متوسط', capability: 'محادثة متعددة الأدوار', when: 'حين تريد أن تتدرّب على القرار بنفسك بدل أن تقرأ الجواب.', followup: 'انتقل إلى القرار الثاني، واجعله أصعب قليلاً.' },
  'بطاقة شرح لمبتدئ': { difficulty: 'مبتدئ', capability: 'نص', when: 'حين تشرح المهمة لشخص يجرّبها أول مرة.', followup: 'أعد الشرح بمثال من البيت بدل العمل.' },
  'سيناريو محادثة': { difficulty: 'متوسط', capability: 'محادثة متعددة الأدوار', when: 'لترى كيف يغيّر سؤال توضيحي واحد النتيجة.', followup: 'لو كان جواب السؤال التوضيحي مختلفاً، كيف تتغيّر النتيجة؟' },
  'أسئلة تحقق': { difficulty: 'متوسط', capability: 'نص وجدول', when: 'بعد أن تحصل على ناتج، لتفحصه قبل استعماله.', followup: 'أيّ سؤال من الثلاثة أجيب عنه أولاً، ولماذا؟' },
  'نموذج تسليم': { difficulty: 'متوسط', capability: 'نص', when: 'حين يكمل شخص آخر المهمة بعدك.', followup: 'ما الافتراض الذي يجب أن يتأكد منه من يستلم المهمة؟' },
  'تغيير قيد واحد': { difficulty: 'متوسط', capability: 'نص', when: 'لتفهم أثر شرط واحد على الناتج: «غيّر كلمة، شوف الفرق».', followup: 'جرّب تغيير قيد آخر، وقارن حجم الأثر.' },
  'اكتشاف افتراض': { difficulty: 'متقدم', capability: 'نص', when: 'حين تخشى أن يملأ المساعد الفراغات بتخمين.', followup: 'أيّ الافتراضين أخطر إذا كان خاطئاً؟' },
  'دليل بصري': { difficulty: 'متوسط', capability: 'وصف بصري نصي (لا يولّد صورة بنفسه)', when: 'حين تشرح المهمة بلوحات أو صور يرسمها شخص أو أداة صور.', followup: 'اختصر النص في كل لوحة إلى أربع كلمات.' },
  'اختبار نقل المهارة': { difficulty: 'متقدم', capability: 'محادثة متعددة الأدوار', when: 'لتتأكد أنك فهمت المهارة وتستطيع تطبيقها في موقف جديد.', followup: 'هذا جوابي: … قيّمه بالمعيار نفسه.' },
  'اختصار مهني': { difficulty: 'متقدم', capability: 'نص', when: 'حين تعرف المهمة جيداً وتريد طلباً قصيراً يكفي.', followup: 'متى تكفي النسخة الموجزة، ومتى أحتاج الموسعة؟' },
  'تكييف العرض للجمهور': { difficulty: 'متوسط', capability: 'نص', when: 'حين يقرأ الناتج أكثر من جمهور.', followup: 'أضف نسخة ثالثة لكبير في السن بخط كبير وجمل أقصر.' },
  'سؤال المتابعة': { difficulty: 'متوسط', capability: 'نص', when: 'حين يكون الجواب الأول معقولاً لكن ينقصه تفصيل حاسم.', followup: 'هذا ردي على سؤالك: … أكمل الجواب على أساسه.' }
};

/** Iraqi-Arabic and colloquial aliases expanded during search. Each group is treated as one meaning. */
export const searchAliases: string[][] = [
  ['خريطة بيت', 'مخطط منزل', 'خارطة بيت', 'تصميم بيت', 'بيت', 'منزل'],
  ['حاسبة', 'حاسوب', 'كمبيوتر', 'كومبيوتر', 'لابتوب'],
  ['برومبت', 'برومت', 'طلب', 'سؤال', 'أمر'],
  ['موبايل', 'هاتف', 'تلفون', 'جوال', 'موبايلي'],
  ['صور', 'صورة', 'ألبوم', 'البوم'],
  ['فلوس', 'دينار', 'سعر', 'أسعار', 'كلفة', 'ميزانية'],
  ['محل', 'متجر', 'دكان', 'قرطاسية'],
  ['جدول', 'اكسل', 'إكسل', 'جداول'],
  ['درس', 'حصة', 'محاضرة', 'تدريس'],
  ['مدرسة', 'مدرسي', 'صف', 'طلاب', 'تلاميذ'],
  ['بحث', 'رسالة', 'أطروحة', 'مصادر', 'مراجع'],
  ['نخل', 'نخلة', 'نخيل', 'تمر', 'تمور'],
  ['مريض', 'مراجع', 'مستشفى', 'مركز صحي', 'طبيب', 'دكتور'],
  ['كتاب رسمي', 'مخاطبة', 'معاملة', 'دائرة'],
  ['إنكليزي', 'انكليزي', 'إنجليزي', 'انجليزي', 'إنجليزية'],
  ['خياطة', 'خياط', 'قماش'],
  ['اعلان', 'إعلان', 'منشور', 'بوست', 'ملصق', 'بوستر']
];

/** Curated worked answers for a showcase set (one per collection). Labelled «مثال تعليمي» in the UI. */
export const showcaseAnswers: Record<string, { lines: string[]; note: string }> = {
  'SN-001-01': { lines: ['المجموعات الأربع تأخذ كل منها ثلاث بطاقات.', 'كل مجموعة تضع بطاقاتها في عمودين: «فعل» و«اسم» خلال خمس دقائق.', 'سؤال التعليل: لماذا وضعتم «يكتبُ» في عمود الفعل؟', 'سطر التخصيص: إذا صار الوقت عشر دقائق، احذف جولة التبادل بين المجموعات.'], note: 'النموذج يلتزم بالبطاقات الاثنتي عشرة والمجموعات الأربع، ويضع سؤال تعليل يكشف التخمين.' },
  'SN-011-01': { lines: ['جدول المقارنة: السؤال، العينة، الأداة، النتيجة المذكورة.', 'الملخص (أ): العينة مذكورة. الملخص (ب): العينة «غير مذكورة».', 'سطر التخصيص: أضف عموداً للمنهج إذا أرفقت ملخصاً ثالثاً.'], note: 'يكتب «غير مذكور» بدل التخمين، ولا يضيف دراسات من خارج الملخصين.' },
  'SN-021-01': { lines: ['مساحة الأرض: ١٠ × ٢٠ = ٢٠٠ م².', 'حجز بيت درج بنحو ١٠ م² قرب المدخل الشمالي.', 'تصغير غرفة الاستقبال ٤ م² والمساحة الأمامية ٦ م² حتى يبقى المجموع ٢٠٠.', 'سطر التخصيص: إذا تغيّر اتجاه الواجهة، أعد موضع الدرج أولاً.'], note: 'تصوّر للنقاش؛ القرار الإنشائي للمعماري والمهندس المحليين.' },
  'SN-031-01': { lines: ['الأعمدة: المادة، الكمية، سعر الوحدة (دينار)، المجموع.', 'معادلة المجموع لكل صف: الكمية × سعر الوحدة.', 'المجموع الكلي في آخر صف، مع تحقق يدوي لصف واحد.'], note: 'الأسعار افتراضية، والتحقق اليدوي لصف واحد يكشف خطأ المعادلة.' },
  'SN-041-01': { lines: ['الأسبوع ١: حجز القاعة — المسؤول (أ).', 'الأسبوع ٢: تأكيد المشاركين كتابياً — المسؤول (ب).', 'الأسبوع ٣: الإعلان بعد التأكيد — المسؤول (ج).', 'سطر التخصيص: إذا تقدّم الموعد أسبوعاً، اجمع الأسبوعين الأولين.'], note: 'كل مهمة لها مسؤول، والإعلان يعتمد على التأكيد.' },
  'SN-051-01': { lines: ['اكتب ثلاثة أسئلة فقط تبدأ بأهمها.', 'مثال: «ماذا أفعل إذا تكرر العارض بعد أسبوع؟»', 'لا تكتب اسمك أو رقمك على الورقة.', 'سطر التخصيص: إذا كان وقتك خمس دقائق أضف سؤالاً رابعاً.'], note: 'النموذج ينظّم الأسئلة ولا يقدّم تشخيصاً؛ التشخيص للطبيب.' },
  'SN-061-01': { lines: ['الأعمدة: التاريخ، وقت التشغيل، المدة بالساعات، ملاحظة.', 'صف مثال: ٧/٣، ٦:٠٠ صباحاً، ٢، التربة رطبة عند الجذع.', 'سطر التخصيص: أضف عمود «حالة السعف» في الصيف.'], note: 'بيانات افتراضية؛ مدة الري الفعلية يقررها المرشد الزراعي بعد قراءة السجلّ.' },
  'SN-071-01': { lines: ['الجهة: السكرتارية.', 'الموعد: يوم الأحد.', 'المطلوب: الاستمارة مع رقم النشاط.', 'سطر التخصيص: إذا تغيّر اليوم، عدّل سطر الموعد وحده.'], note: 'تعليمات تدريبية افتراضية، ولا تُنسب إلى قانون.' },
  'SN-081-01': { lines: ['ملصق عمودي: الثلث العلوي للعنوان العربي.', 'الوسط: لوحة خط واحدة كبيرة.', 'الأسفل: الموعد والمكان بخط واضح.', 'سطر التخصيص: إذا صار الملصق أفقياً، ضع العنوان يميناً واللوحة يساراً.'], note: 'وصف بصري يرسمه مصمم أو أداة صور؛ المساعد النصي لا يرسم بنفسه.' },
  'SN-091-01': { lines: ['Seller: Hello, can I help you?', '(انتظار جوابك…)', 'تصحيح واحد بالعربية بعد جوابك.', 'سطر التخصيص: لمستوى متوسط أضف سؤالاً عن السعر.'], note: 'الحوار يترك للمتعلّم دوره، ويصحّح خطأً واحداً.' },
  'SN-101-01': { lines: ['اختر مع الطفل: العصفور، شاطئ دجلة، يبحث عن تمرة.', 'اقرأ القصة بصوتك.', 'غيّرا المكان إلى بستان النخيل، واسأله: شنو تغيّر؟', 'سطر التخصيص: إذا تعب الطفل، اكتفيا بتغيير واحد.'], note: 'مادة للمرافق البالغ؛ الطفل يختار بالصور ولا يكتب.' },
  'SN-111-01': { lines: ['بطاقة الطلب: نوع القطعة، القياسات، القماش، موعد التسليم.', 'خانة «غير مذكور» لكل قياس ناقص.', 'سطر التخصيص: أضف خانة توقيع الزبون عند الاستلام.'], note: 'البطاقة تمنع الخياطة من التخمين في القياسات.' }
};

/** Prompt line labels used by «تعلّم كيف كُتب». Matched by line prefix or position. */
export const anatomyLabels = {
  role: 'لمن الطلب (الدور والجمهور)',
  goal: 'المهمة',
  inputs: 'المعطيات الخيالية',
  instruction: 'نوع العمل المطلوب',
  format: 'شكل الناتج المتوقع',
  check: 'معيار القبول',
  guard: 'حدود وسلامة'
};
