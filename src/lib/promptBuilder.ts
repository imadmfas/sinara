import { services, type Service } from '../content/services';
import { fieldById } from '../content/index';

export interface BuilderInput {
  service: string;
  field?: string;
  branch?: string;
  goal: string;
  audience: string;
  inputs: string;
  constraints: string;
  format: string;
  verify: string;
  extra: Record<string, string>;
}

export interface BuiltPrompt {
  text: string;
  reasons: { label: string; why: string }[];
  missing: string[];
  waits: boolean;
  /** Details the learner supplied (defaults excluded). */
  supplied: string[];
  /** A concrete, helpful next edit. */
  next: string;
  /** Set when the task line was derived from the service's main field (or vice versa). */
  derived?: string;
}

/** The task can be written once: from the service's main field, or the main field from the task. */
const goalFrom: Record<string, string> = {
  explain: 'أن أفهم {v}', compare: 'أن أختار بين {v}', plan: 'خطة تُنجز {v}', visual: 'تصميم بصري عن {v}', quiz: 'اختبار قصير في {v}',
  summarize: 'تلخيص النص الذي سأرسله', message: 'رسالة إلى {v}', review: 'مراجعة مسودتي', brainstorm: 'أفكار لمعالجة {v}', conversation: 'تمرين محادثة مع {v}'
};
/** Main fields that the task itself can satisfy (same content; no need to type it twice). */
const goalCanFill = new Set(['concept', 'topic', 'problem', 'subject']);

export const serviceById = (id: string): Service => services.find((s) => s.id === id) ?? services[0];

export function buildPrompt(i: BuilderInput): BuiltPrompt {
  const svc = serviceById(i.service);
  const field = fieldById(i.field);
  const branch = field?.branches.find((b) => b.id === i.branch);
  const lines: string[] = [];
  const reasons: BuiltPrompt['reasons'] = [];
  const missing: string[] = [];

  if (field) {
    lines.push(`المجال: ${field.name}${branch ? `، والتخصص: ${branch.name}` : ''}.`);
    reasons.push({ label: 'المجال والتخصص', why: 'يضبطان المصطلحات والأمثلة التي يعرفها أهل التخصص.' });
  }
  const supplied: string[] = [];
  const primary = svc.fields.find((f) => f.required && f.id !== svc.materialField);
  const primaryVal = primary ? (i.extra[primary.id] || '').trim() : '';
  let goal = i.goal.trim().replace(/[.。]$/, '');
  let derived: string | undefined;
  if (goal) supplied.push('المهمة');
  if (!goal && primaryVal && goalFrom[svc.id]) { goal = goalFrom[svc.id].replace('{v}', primaryVal); derived = `كُتبت المهمة من خانة «${primary!.label}»، فلا حاجة إلى تكرارها.`; }
  if (!goal && !primary && goalFrom[svc.id]) { goal = goalFrom[svc.id]; derived = 'المهمة مأخوذة من نوع الخدمة.'; }
  if (goal) {
    lines.push(`مهمتي: ${goal}.`);
    reasons.push({ label: 'المهمة', why: 'تقول ماذا ستفعل بالنتيجة، فيتجه الجواب إليها.' });
  } else missing.push(primary && goalCanFill.has(primary.id) ? `المهمة أو ${primary.label}` : 'المهمة');
  lines.push(`أريد ${svc.output}.`);

  let waits = false;
  for (const f of svc.fields) {
    const v = (i.extra[f.id] || '').trim();
    if (v) {
      supplied.push(f.label);
      if (!(f === primary && derived && goalCanFill.has(f.id))) lines.push(f.line.replace('{v}', v));
      reasons.push({ label: f.label, why: f.why });
    } else if (f.id === svc.materialField) {
      waits = true;
    } else if (f.required) {
      if (f === primary && goalCanFill.has(f.id) && i.goal.trim()) { derived = `مهمتك تكفي بدل خانة «${f.label}».`; continue; }
      if (f === primary && goalCanFill.has(f.id) && !goal) continue; // already reported with the task
      missing.push(f.label);
    }
  }
  if (waits && svc.waitLine) {
    lines.push(svc.waitLine);
    reasons.push({ label: 'انتظار النص', why: 'يمنع المساعد من التخمين قبل أن يرى المادة.' });
  }
  if (i.audience.trim()) {
    supplied.push('الجمهور');
    lines.push(`الجمهور: ${i.audience.trim()}.`);
    reasons.push({ label: 'الجمهور', why: 'يحدد مستوى اللغة وطول الناتج.' });
  }
  if (i.inputs.trim()) {
    supplied.push('المعطيات');
    lines.push(`المعطيات المتوفرة: ${i.inputs.trim()}.`);
    reasons.push({ label: 'المعطيات', why: 'تبني الجواب على ما عندك بدل افتراضات عامة.' });
  }
  if (i.constraints.trim()) {
    supplied.push('القيد');
    lines.push(`التزم بهذا الشرط: ${i.constraints.trim()}.`);
    reasons.push({ label: 'القيد', why: 'يجعل الناتج قابلاً للاستعمال في وقتك ومكانك.' });
  }
  lines.push(`قدّم الناتج في صورة ${i.format}.`);
  reasons.push({ label: 'شكل الناتج', why: 'الشكل المناسب يوفّر عليك إعادة الترتيب.' });
  if (i.verify && !i.verify.startsWith('بدون')) {
    lines.push(i.verify);
    reasons.push({ label: 'خطوة التحقق', why: 'تجعل الجواب قابلاً للمراجعة قبل الاعتماد عليه.' });
  }
  const firstMissing = svc.fields.find((f) => missing.includes(f.label));
  const next = missing.length
    ? missing[0].startsWith('المهمة')
      ? `اكتب ماذا تريد أن تفعل بالنتيجة${primary?.placeholder ? `، مثلاً: ${primary.placeholder.replace('مثلاً: ', '')}` : ''}.`
      : `اكتب «${missing[0]}»${firstMissing?.placeholder ? `، ${firstMissing.placeholder}` : ''}.`
    : !i.audience.trim() ? 'أضف لمن تُعدّ الطلب: الجمهور يغيّر اللغة وطول الجواب.'
    : !i.constraints.trim() ? 'أضف قيداً واحداً (وقت، طول، أداة) يجعل الناتج قابلاً للاستعمال.'
    : 'الطلب جاهز. انسخه، أو غيّر تفصيلاً واحداً وقارن الفرق.';
  return { text: lines.join('\n'), reasons, missing, waits, supplied, next, derived };
}
