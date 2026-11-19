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
}

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
  if (i.goal.trim()) {
    lines.push(`مهمتي: ${i.goal.trim().replace(/[.。]$/, '')}.`);
    reasons.push({ label: 'المهمة', why: 'تقول ماذا ستفعل بالنتيجة، فيتجه الجواب إليها.' });
  } else missing.push('المهمة');
  lines.push(`أريد ${svc.output}.`);

  let waits = false;
  for (const f of svc.fields) {
    const v = (i.extra[f.id] || '').trim();
    if (v) {
      lines.push(f.line.replace('{v}', v));
      reasons.push({ label: f.label, why: f.why });
    } else if (f.id === svc.materialField) {
      waits = true;
    } else if (f.required) missing.push(f.label);
  }
  if (waits && svc.waitLine) {
    lines.push(svc.waitLine);
    reasons.push({ label: 'انتظار النص', why: 'يمنع المساعد من التخمين قبل أن يرى المادة.' });
  }
  if (i.audience.trim()) {
    lines.push(`الجمهور: ${i.audience.trim()}.`);
    reasons.push({ label: 'الجمهور', why: 'يحدد مستوى اللغة وطول الناتج.' });
  }
  if (i.inputs.trim()) {
    lines.push(`المعطيات المتوفرة: ${i.inputs.trim()}.`);
    reasons.push({ label: 'المعطيات', why: 'تبني الجواب على ما عندك بدل افتراضات عامة.' });
  }
  if (i.constraints.trim()) {
    lines.push(`التزم بهذا الشرط: ${i.constraints.trim()}.`);
    reasons.push({ label: 'القيد', why: 'يجعل الناتج قابلاً للاستعمال في وقتك ومكانك.' });
  }
  lines.push(`قدّم الناتج في صورة ${i.format}.`);
  reasons.push({ label: 'شكل الناتج', why: 'الشكل المناسب يوفّر عليك إعادة الترتيب.' });
  if (i.verify && !i.verify.startsWith('بدون')) {
    lines.push(i.verify);
    reasons.push({ label: 'خطوة التحقق', why: 'تجعل الجواب قابلاً للمراجعة قبل الاعتماد عليه.' });
  }
  return { text: lines.join('\n'), reasons, missing, waits };
}
