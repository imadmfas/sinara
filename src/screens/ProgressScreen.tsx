import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ages } from '../content/ages';
import { skillLabels } from '../content/index';
import type { AgeBandId, SkillId } from '../content/types';
import { useApp, useLesson } from '../lib/app';
import { defaultMaterial } from '../lib/coach';
import { to } from '../routes';

export default function ProgressScreen() {
  const { state, band, resetBand, deleteDraft } = useApp();
  const [view, setView] = useState<AgeBandId | null>(band);
  const [confirm, setConfirm] = useState(false);
  useLesson({ key: 'progress', title: 'تقدّمي', kind: 'progress', material: defaultMaterial }, '/progress');
  const p = view ? state.progress[view] : undefined;
  return (
    <>
      <section className="panel">
        <h1>تقدّمي</h1>
        <p className="sub">التقدّم محفوظ على هذا الجهاز فقط، ومنفصل لكل فئة عمرية، فيستطيع أفراد العائلة استعمال جهاز واحد. تُحسب المهارة عند فعل حقيقي: اختيار صحيح، أو تحقق، أو سؤال متابعة. فتح الصفحة لا يُحسب.</p>
        <div className="row" role="group" aria-label="الفئة العمرية">
          {ages.map((a) => <button key={a.id} type="button" aria-pressed={view === a.id} onClick={() => { setView(a.id); setConfirm(false); }}>{a.icon} {a.name}</button>)}
        </div>
      </section>
      {view && (
        <section className="panel">
          <h2>ما تدرّبتَ عليه</h2>
          {p?.lastRoute && <p><Link className="btn action" to={p.lastRoute}>متابعة من حيث توقفت: {p.lastTitle}</Link></p>}
          <ul className="skills">
            {(Object.keys(skillLabels) as SkillId[]).map((k) => {
              const s = p?.skills[k];
              return (
                <li key={k} className={s ? 'done' : ''}>
                  <span className="symbol" aria-hidden="true">{skillLabels[k].icon}</span>
                  <div><b>{skillLabels[k].label}</b><small>{skillLabels[k].desc}</small></div>
                  <span className="count">{s ? `تدرّبتَ ${s.count.toLocaleString('ar-IQ')} مرة` : 'لم تتدرّب بعد'}</span>
                </li>
              );
            })}
          </ul>
          <p className="sub">دروس أنجزتَ فيها فعلاً: {(p?.completed.length ?? 0).toLocaleString('ar-IQ')}</p>
          {!confirm ? <button type="button" onClick={() => setConfirm(true)}>مسح تقدّم هذه الفئة</button> : (
            <div className="feedback retry" role="alertdialog" aria-labelledby="rc"><p id="rc">سيُمسح تقدّم فئة {ages.find((a) => a.id === view)!.name} فقط. هل أنت متأكد؟</p><div className="row"><button type="button" className="action" onClick={() => { resetBand(view); setConfirm(false); }}>نعم، امسح</button><button type="button" onClick={() => setConfirm(false)}>إلغاء</button></div></div>
          )}
        </section>
      )}
      {state.savedDrafts.length > 0 && (
        <section className="panel">
          <h2>مسودات حفظها بالغ على هذا الجهاز</h2>
          <ul className="drafts">{state.savedDrafts.map((d) => <li key={d.id}><b>{d.label}</b><pre>{d.text}</pre><button type="button" onClick={() => deleteDraft(d.id)}>حذف</button></li>)}</ul>
        </section>
      )}
      {!view && <section className="panel"><p>اختر فئة عمرية لترى تقدّمها، أو <Link to={to.home()}>ابدأ من هنا</Link>.</p></section>}
    </>
  );
}
