import { useApp, useLesson } from '../lib/app';
import { defaultMaterial } from '../lib/coach';
import { useVoice } from '../components/ui';
import { sfx } from '../lib/sound';
import { liveConfigured } from '../lib/live';
import { brand } from '../content/brand';

export default function SettingsScreen() {
  const { settings, updateSettings } = useApp();
  const voice = useVoice();
  useLesson({ key: 'settings', title: 'الإعدادات', kind: 'other', material: defaultMaterial }, '/settings');
  const toggle = (k: 'effects' | 'narration' | 'calm' | 'simple', label: string, desc: string) => (
    <label className="setting">
      <input type="checkbox" checked={settings[k]} onChange={(e) => { updateSettings({ [k]: e.target.checked }); if (k === 'effects' && e.target.checked) setTimeout(() => sfx.click(), 50); }} />
      <span><b>{label}</b><small>{desc}</small></span>
    </label>
  );
  return (
    <section className="panel">
      <h1>الإعدادات</h1>
      {toggle('effects', 'المؤثرات الصوتية', 'نقرة خفيفة ونغمة عند الإنجاز. كل صوت له علامة مرئية.')}
      {toggle('narration', 'القراءة بصوت الجهاز', voice === 'available' ? 'يوجد صوت عربي في هذا الجهاز. يقرأ النص حين تضغط «استمع».' : 'لا يوجد صوت عربي في هذا الجهاز الآن، فيقرأ المرافق النص بصوته.')}
      {toggle('calm', 'الوضع الهادئ', 'يوقف الحركة والانتقالات. يُطبَّق تلقائياً إذا طلب نظامك تقليل الحركة.')}
      {toggle('simple', 'الواجهة المبسّطة', 'خط أكبر وأزرار أوسع، مناسبة لكبار السن والمستخدم الجديد.')}
      <h2>الخصوصية</h2>
      <p>نحفظ الفئة العمرية والتقدّم والإعدادات على هذا الجهاز فقط. لا نطلب اسماً أو مدرسة أو صورة أو عنواناً. ما تكتبه في الحقول لا يُحفظ إلا إذا ضغط بالغ «احفظ المسودة».</p>
      <h2>المحادثة الذكية المباشرة</h2>
      <p>{liveConfigured() ? 'مهيّأة على خادم منفصل، وتُفتح للبالغين فقط بعد تحقق الخادم من رمز البالغ.' : 'غير مهيّأة في هذه النسخة. يعمل «مرشد الدرس» المحلي في كل الأعمار ودون إنترنت.'}</p>
      <p className="sub">{brand.formalTitle} · {brand.owner}</p>
    </section>
  );
}
