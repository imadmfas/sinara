import { fieldBases } from './branches';
import { fieldQuizzes } from './fieldQuizzes';
import { fieldFollowups } from './followups';
import type { ElementKind, Field, SkillId } from './types';

export const fields: Field[] = fieldBases.map((f) => ({ ...f, quiz: fieldQuizzes[f.id], followup: fieldFollowups[f.id] }));

export const fieldById = (id?: string) => fields.find((f) => f.id === id);
export const branchById = (fieldId?: string, branchId?: string) => fieldById(fieldId)?.branches.find((b) => b.id === branchId);

export const allBranches = fields.flatMap((f) => f.branches.map((b) => ({ field: f, branch: b })));

export const elementLabels: Record<ElementKind, { label: string; short: string }> = {
  task: { label: 'المهمة المحددة', short: 'المهمة' },
  audience: { label: 'لمن الناتج', short: 'الجمهور' },
  data: { label: 'المعطيات والمثال', short: 'المعطيات' },
  constraint: { label: 'القيد أو الشرط', short: 'القيد' },
  format: { label: 'شكل الناتج', short: 'الشكل' },
  verify: { label: 'طريقة التحقق', short: 'التحقق' },
  wait: { label: 'انتظار النص قبل البدء', short: 'الانتظار' }
};

export const skillLabels: Record<SkillId, { label: string; desc: string; icon: string }> = {
  task: { label: 'تحديد المهمة', desc: 'قلت بوضوح ماذا تريد أن تفعل بالنتيجة.', icon: '🎯' },
  constraint: { label: 'إضافة قيد', desc: 'حدّدت زمناً أو طولاً أو أداة أو جمهوراً.', icon: '📏' },
  format: { label: 'اختيار الشكل', desc: 'اخترت جدولاً أو خطوات أو حواراً يناسب الاستعمال.', icon: '🧾' },
  verify: { label: 'التحقق من ادعاء', desc: 'راجعت رقماً أو مصدراً أو حساباً قبل الاعتماد عليه.', icon: '🔎' },
  followup: { label: 'سؤال المتابعة', desc: 'لاحظت ما ينقص الجواب وطلبت ما يكمله.', icon: '↩️' }
};

export const kindToSkill = (k: ElementKind): SkillId =>
  k === 'format' ? 'format' : k === 'verify' || k === 'wait' ? 'verify' : k === 'task' ? 'task' : 'constraint';

export const shortPromptNote =
  'متى يكفي الطلب القصير؟ حين يكون السؤال عن معلومة عامة مستقرة لا تتعلق بك، مثل «كم يوماً في السنة الكبيسة؟». أما حين يعتمد الجواب على ظروفك أو ستستعمله في عمل، فالتفاصيل توفّر عليك جولات من التصحيح.';

/* Teen showcase: a school presentation about the Iraqi marshes (ages 13–17). */
export const marshesProject = {
  vague: 'اكتب لي عرضاً عن الأهوار.',
  questionOptions: [
    { id: 'boats', best: true, text: 'كيف يتنقّل سكان أهوار جنوب العراق، ولماذا تناسب القوارب الصغيرة هذا المكان؟', feedback: 'أحسنت. سؤال صغير تستطيع البحث فيه خلال أسبوع وتقديمه في خمس شرائح.' },
    { id: 'everything', best: false, text: 'كل شيء عن الأهوار منذ أقدم العصور إلى اليوم، بالتفصيل الكامل.', feedback: 'الموضوع واسع جداً على أسبوع واحد وخمس شرائح.' },
    { id: 'photos', best: false, text: 'أجمل صور الأهوار مع كلمات مؤثرة تحت كل صورة.', feedback: 'الصور تخدم العرض، لكنها لا تحدد سؤالاً تجيب عنه.' }
  ],
  request:
    'أنا طالب في الإعدادية. أعدّ عرضاً من خمس شرائح عن سؤالي: كيف يتنقّل سكان أهوار جنوب العراق، ولماذا تناسب القوارب الصغيرة هذا المكان؟ اقترح عنواناً لكل شريحة وجملة واحدة.',
  outline: [
    'الشريحة ١: الأهوار مسطحات مائية واسعة في جنوب العراق.',
    'الشريحة ٢: الماء الضحل والقصب الكثيف يجعلان الطرق البرية قليلة.',
    'الشريحة ٣: يعيش في الأهوار اليوم أكثر من مليون ونصف شخص يتنقلون بالقوارب.',
    'الشريحة ٤: القارب الخشبي الضيق يمر بين القصب ويطفو في الماء الضحل.',
    'الشريحة ٥: سؤال للنقاش: ماذا يحدث للتنقل حين ينخفض منسوب الماء؟'
  ],
  claimLine: 2,
  claimFeedback: {
    right: 'أحسنت. رقم السكان ادعاء محدد يحتاج مصدراً رسمياً أو كتاباً. قد يكون الرقم خاطئاً تماماً.',
    wrong: 'هذه الجملة وصف عام أو سؤال. ابحث عن جملة فيها رقم محدد.'
  },
  revisedRequest:
    'أعد المخطط نفسه، وضع علامة «يحتاج إلى مصدر» عند كل رقم أو تاريخ، ولا تكتب أرقاماً من ذاكرتك. سأبحث عنها بنفسي في كتاب المدرسة وموقع رسمي.',
  revisedOutline: [
    'الشريحة ١: الأهوار مسطحات مائية واسعة في جنوب العراق.',
    'الشريحة ٢: الماء الضحل والقصب الكثيف يجعلان الطرق البرية قليلة.',
    'الشريحة ٣: يتنقل كثير من السكان بالقوارب. [يحتاج إلى مصدر: عدد السكان الحالي]',
    'الشريحة ٤: القارب الخشبي الضيق يمر بين القصب ويطفو في الماء الضحل.',
    'الشريحة ٥: سؤال للنقاش: ماذا يحدث للتنقل حين ينخفض منسوب الماء؟'
  ],
  ownWork: 'اكتب أنت خاتمة الشريحة الخامسة بكلماتك. هذا جزء المشروع الذي يُظهر تفكيرك.'
};
