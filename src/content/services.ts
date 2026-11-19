// مولّد الطلبات — the ten original services with service-specific fields.

export interface ServiceField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
  required?: boolean;
  /** Line template; {v} is replaced with the value. */
  line: string;
  /** Why this detail improves the request. */
  why: string;
}

export interface Service {
  id: string;
  name: string;
  output: string;
  fields: ServiceField[];
  /** If set and the field with this id is empty, the prompt asks the assistant to wait for the material. */
  materialField?: string;
  waitLine?: string;
  defaultFormat: string;
}

export const services: Service[] = [
  {
    id: 'explain', name: 'شرح مفهوم', output: 'شرحاً مبسّطاً مع مثال وسؤال يختبر فهمي', defaultFormat: 'خطوات مرقّمة',
    fields: [
      { id: 'concept', label: 'المفهوم', type: 'text', required: true, placeholder: 'مثلاً: الفائدة المركّبة', line: 'المفهوم: {v}.', why: 'تسمية المفهوم تمنع شرحاً عاماً يدور حوله.' },
      { id: 'level', label: 'مستوى المعرفة الحالي', type: 'select', options: ['أسمع به لأول مرة', 'أعرف التعريف ولا أطبّقه', 'أطبّقه وأريد التعمق'], line: 'مستواي: {v}.', why: 'المستوى يضبط بداية الشرح وكثافته.' },
      { id: 'context', label: 'مثال من حياتك', type: 'text', placeholder: 'مثلاً: قرض لشراء سيارة', line: 'اربط الشرح بهذا المثال: {v}.', why: 'المثال القريب يجعل الفكرة قابلة للتطبيق.' }
    ]
  },
  {
    id: 'compare', name: 'مقارنة خيارات', output: 'مقارنة تذكر معايير الاختيار ومزايا كل خيار وحدوده', defaultFormat: 'جدول',
    fields: [
      { id: 'alternatives', label: 'الخيارات', type: 'text', required: true, placeholder: 'مثلاً: منظومة شمسية أو مولّدة أهلية', line: 'الخيارات: {v}.', why: 'المقارنة تحتاج خيارات مسمّاة.' },
      { id: 'criteria', label: 'معايير المقارنة', type: 'text', required: true, placeholder: 'مثلاً: الكلفة الشهرية، الصيانة، الضوضاء', line: 'قارن بهذه المعايير فقط: {v}.', why: 'المعايير تحوّل الرأي إلى مقارنة يمكن مراجعتها.' },
      { id: 'decision', label: 'القرار الذي ستتخذه', type: 'text', placeholder: 'مثلاً: أختار قبل الصيف', line: 'سأستعمل المقارنة لهذا القرار: {v}.', why: 'معرفة القرار تحدد أيّ المعايير أهم.' }
    ]
  },
  {
    id: 'plan', name: 'خطة عمل', output: 'خطة مرتبة بحسب الأولوية وتذكر ما أحتاجه لكل خطوة', defaultFormat: 'جدول',
    fields: [
      { id: 'deadline', label: 'الموعد النهائي', type: 'text', required: true, placeholder: 'مثلاً: بعد أربعة أسابيع', line: 'الموعد النهائي: {v}.', why: 'الموعد يحدد ترتيب الخطوات وحجمها.' },
      { id: 'resources', label: 'الفريق والموارد', type: 'text', placeholder: 'مثلاً: ثلاثة أشخاص وقاعة واحدة', line: 'الموارد المتاحة: {v}.', why: 'الموارد تمنع خطة لا يمكن تنفيذها.' }
    ]
  },
  {
    id: 'visual', name: 'تصميم بصري', output: 'وصفاً بصرياً يحدد العناصر وترتيبها وما ينبغي أن يظهر في الصورة', defaultFormat: 'نقاط قصيرة',
    fields: [
      { id: 'subject', label: 'الموضوع', type: 'text', required: true, placeholder: 'مثلاً: معرض رسم مدرسي', line: 'موضوع الصورة: {v}.', why: 'الموضوع يحدد العنصر الرئيس في الصورة.' },
      { id: 'composition', label: 'التكوين', type: 'text', placeholder: 'مثلاً: نخلة في اليمين ومساحة فارغة في الأعلى', line: 'التكوين: {v}.', why: 'التكوين يضع العناصر في أماكنها بدل تركها للمصادفة.' },
      { id: 'ratio', label: 'نسبة الأبعاد', type: 'select', required: true, options: ['عمودي ٢:٣', 'أفقي ١٦:٩', 'مربّع ١:١', 'عمودي ٩:١٦ للهاتف'], line: 'نسبة الأبعاد: {v}.', why: 'النسبة تحدد مكان النشر: ملصق أو شاشة أو هاتف.' },
      { id: 'textSpace', label: 'مساحة النص', type: 'text', placeholder: 'مثلاً: الثلث العلوي للعنوان العربي', line: 'اترك مساحة للنص: {v}.', why: 'مساحة العنوان تجعل الصورة صالحة للاستعمال.' }
    ]
  },
  {
    id: 'quiz', name: 'إعداد اختبار', output: 'أسئلة متدرجة وأجوبة نموذجية منفصلة وتعليلاً لكل جواب', defaultFormat: 'خطوات مرقّمة',
    fields: [
      { id: 'topic', label: 'موضوع الاختبار', type: 'text', required: true, placeholder: 'مثلاً: الكسور العشرية', line: 'موضوع الاختبار: {v}.', why: 'الموضوع المحدد يمنع أسئلة متفرقة.' },
      { id: 'count', label: 'عدد الأسئلة', type: 'select', options: ['٣', '٥', '١٠'], line: 'عدد الأسئلة: {v}.', why: 'العدد يناسب وقت الحصة.' },
      { id: 'kind', label: 'نوع الأسئلة', type: 'select', options: ['اختيار من متعدد بإجابة واحدة', 'أسئلة قصيرة', 'مسائل تطبيقية'], line: 'نوع الأسئلة: {v}. اجعل البدائل الخاطئة معقولة ومتقاربة في الطول.', why: 'البدائل المعقولة تقيس الفهم، والطول المتقارب يمنع التخمين.' }
    ]
  },
  {
    id: 'summarize', name: 'تلخيص نص', output: 'ملخصاً يستند حصراً إلى النص الذي سأقدمه', defaultFormat: 'نقاط قصيرة',
    materialField: 'source', waitLine: 'سأرسل النص في الرسالة التالية. انتظر النص قبل التلخيص.',
    fields: [
      { id: 'source', label: 'النص المطلوب تلخيصه', type: 'textarea', placeholder: 'الصق النص هنا، أو اتركه فارغاً لترسله لاحقاً', line: 'النص:\n«{v}»', why: 'التلخيص من نص معطى يمنع إضافة معلومات من خارجه.' },
      { id: 'length', label: 'طول الملخص', type: 'select', options: ['ثلاث نقاط', 'فقرة من خمسة أسطر', 'جملة واحدة'], line: 'طول الملخص: {v}.', why: 'الطول المحدد يجبر على اختيار الأهم.' }
    ]
  },
  {
    id: 'message', name: 'صياغة رسالة', output: 'مسودة رسالة تناسب الجهة المذكورة وتنتهي بطلب واضح', defaultFormat: 'فقرة قصيرة',
    fields: [
      { id: 'recipient', label: 'إلى من؟', type: 'text', required: true, placeholder: 'مثلاً: عميد الكلية', line: 'المرسل إليه: {v}.', why: 'الجهة تحدد درجة الرسمية والتحية.' },
      { id: 'purpose', label: 'الطلب', type: 'text', required: true, placeholder: 'مثلاً: حجز قاعة يوم الخميس', line: 'الغرض: {v}.', why: 'الطلب الواضح يجعل الرسالة تنتهي بما تريده.' },
      { id: 'tone', label: 'النبرة', type: 'select', options: ['رسمية', 'ودية مهذبة', 'مختصرة جداً'], line: 'النبرة: {v}. اترك خانات فارغة للتواريخ والأرقام الرسمية.', why: 'النبرة تناسب العلاقة، والخانات الفارغة تمنع اختلاق أرقام.' }
    ]
  },
  {
    id: 'review', name: 'مراجعة مسودة', output: 'ملاحظات على مسودتي تبين موضع كل تعديل وسببه', defaultFormat: 'جدول',
    materialField: 'draft', waitLine: 'سأرسل المسودة في الرسالة التالية. انتظر المسودة قبل المراجعة.',
    fields: [
      { id: 'draft', label: 'المسودة', type: 'textarea', placeholder: 'الصق المسودة هنا، أو اتركها فارغة لترسلها لاحقاً', line: 'المسودة:\n«{v}»', why: 'المراجعة تكون على نصك أنت.' },
      { id: 'criteria', label: 'معايير المراجعة', type: 'text', required: true, placeholder: 'مثلاً: وضوح الحجة، الأخطاء النحوية', line: 'راجع بهذه المعايير: {v}.', why: 'المعايير تحدد ما يُنظر فيه وما يُترك.' },
      { id: 'rewrite', label: 'إذن إعادة الكتابة', type: 'select', required: true, options: ['لا تُعِد الكتابة؛ أشر إلى المواضع فقط', 'اقترح بديلاً للجمل المشار إليها فقط', 'يمكنك إعادة صياغة الفقرات مع الحفاظ على المعنى'], line: 'حدود التعديل: {v}.', why: 'الإذن يحمي صوتك وفكرتك من تغيير لم تطلبه.' }
    ]
  },
  {
    id: 'brainstorm', name: 'عصف ذهني', output: 'ثلاث أفكار مختلفة، مع خطوة أولى لتجربة كل واحدة', defaultFormat: 'نقاط قصيرة',
    fields: [
      { id: 'problem', label: 'المشكلة أو الفرصة', type: 'text', required: true, placeholder: 'مثلاً: قلة زوار مكتبة الكلية', line: 'المشكلة: {v}.', why: 'المشكلة المحددة تمنع أفكاراً عامة.' },
      { id: 'limits', label: 'ما لا يمكن تغييره', type: 'text', placeholder: 'مثلاً: لا ميزانية إضافية', line: 'الحدود: {v}.', why: 'الحدود تبقي الأفكار قابلة للتجربة.' }
    ]
  },
  {
    id: 'conversation', name: 'تمرين محادثة', output: 'حواراً تفاعلياً يبدأ بسؤال واحد وينتظر إجابتي', defaultFormat: 'حوار',
    fields: [
      { id: 'role', label: 'دور المساعد', type: 'text', required: true, placeholder: 'مثلاً: موظف استقبال فندق', line: 'مثّل هذا الدور: {v}.', why: 'الدور يجعل الحوار قريباً من الموقف الحقيقي.' },
      { id: 'scenario', label: 'الموقف', type: 'text', placeholder: 'مثلاً: حجز غرفة لليلتين', line: 'الموقف: {v}.', why: 'الموقف يحدد المفردات التي تتدرّب عليها.' },
      { id: 'language', label: 'اللغة والمستوى', type: 'text', placeholder: 'مثلاً: الإنجليزية، مستوى متوسط', line: 'اللغة والمستوى: {v}. اسأل سؤالاً واحداً في كل مرة وانتظر جوابي.', why: 'المستوى والانتظار يجعلان التمرين تدريباً فعلياً.' }
    ]
  }
];

export const formats = ['نقاط قصيرة', 'جدول', 'خطوات مرقّمة', 'حوار', 'فقرة قصيرة'];

export const verifySteps = [
  'إذا نقصت معلومة تؤثر في الجواب فاسألني عنها أولاً، وميّز الافتراضات من المعلومات التي أعطيتك إياها.',
  'لا تضع مراجع أو أرقام مواد أو نصوصاً منقولة من ذاكرتك؛ اكتب «يحتاج إلى مصدر» حيث يلزم.',
  'اختم بطريقة أراجع بها الجواب بنفسي (حساب يدوي أو مقارنة بالمصدر).',
  'بدون خطوة تحقق إضافية'
];
