import type { AgeBand, AgeBandId } from './types';

export const ages: AgeBand[] = [
  { id: 'a4', icon: '🧸', name: '٤–٦ سنوات', tagline: 'ألعب مع كبير', title: 'بماذا نلعب اليوم؟', lead: 'للكبير المرافق: اقرأ الخيارات ودع الطفل يشير إلى الصورة التي يحبها.' },
  { id: 'a7', icon: '🎒', name: '٧–٩ سنوات', tagline: 'أستكشف وأتعلّم', title: 'ماذا تحب أن تستكشف؟', lead: 'اختر اهتماماً ثم موضوعاً، ونجرّب سؤالاً معاً.' },
  { id: 'a10', icon: '🔎', name: '١٠–١٢ سنة', tagline: 'أشرح وأجرّب', title: 'ماذا تحب أن تجرّب؟', lead: 'اختر موضوعاً، وقارن جوابين، واشرح الفرق بينهما.' },
  { id: 'a13', icon: '💡', name: '١٣–١٧ سنة', tagline: 'أدرس وأنجز مشروعاً', title: 'أيّ مجال تريد أن تجرّبه؟', lead: 'ابنِ مشروعاً مدرسياً، وافحص الأدلة، وراجع طلبك.' },
  { id: 'a18', icon: '📚', name: '١٨–٢٢ سنة', tagline: 'أدرس أو أتعلّم مهنة', title: 'في أيّ تخصص تريد أن تتدرّب؟', lead: 'اختر مجالاً وتخصصاً فرعياً، وحوّل مهمتك إلى طلب له معيار تحقق.' },
  { id: 'a23', icon: '🌿', name: '٢٣ سنة فأكثر', tagline: 'أستخدمه في عملي وحياتي', title: 'في أيّ مجال تريد استخدام الذكاء الاصطناعي؟', lead: 'اختر مجالاً ثم تخصصاً فرعياً، أو اذهب مباشرة إلى مولّد الطلبات.' }
];

export const ageById = (id: string | undefined): AgeBand | undefined => ages.find((a) => a.id === id);
export const isAdult = (id: AgeBandId | null | undefined) => id === 'a18' || id === 'a23';
export const isSchool = (id: AgeBandId | null | undefined) => id === 'a7' || id === 'a10';
