import { Navigate, useParams, Link } from 'react-router-dom';
import { fieldFollowups, preschoolFollowups, schoolFollowups } from '../content/followups';
import { useLesson, useApp } from '../lib/app';
import { Followup, Panel } from '../components/ui';
import { to } from '../routes';

const all = [...Object.values(fieldFollowups), ...schoolFollowups, ...Object.values(preschoolFollowups)];

export default function FollowupScreen() {
  const { id } = useParams();
  const s = all.find((x) => x.id === id);
  const { band } = useApp();
  const kid = !!s && (Object.values(preschoolFollowups).includes(s) || schoolFollowups.includes(s));
  useLesson(s ? { key: `fu-${id}`, title: s.title, kind: 'followup', material: { simpler: 'انظر ماذا ينقص الجواب، واطلب ذلك بالضبط.', example: s.options.find((o) => o.best)!.text, why: s.omission, next: [s.options.find((o) => o.best)!.text], hint: s.hint } } : { key: 'x', title: '', kind: 'other', material: { simpler: '', example: '', why: '', next: [] } }, `/followup/${id}`);
  if (!s) return <Navigate to={to.home()} replace />;
  return (
    <>
      <section className="panel"><p className="eyebrow">شنو نسأل بعدها؟</p><h1>{s.title}</h1><Link className="btn" to={band ? to.path(band) : to.home()}>مساري</Link></section>
      <Panel><Followup s={s} lessonKey={`fu-${id}`} kid={kid} /></Panel>
    </>
  );
}
