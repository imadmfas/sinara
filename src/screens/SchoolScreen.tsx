import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { allSchoolTopics } from '../content/school';
import { useApp, useLesson } from '../lib/app';
import type { QuizQuestion } from '../content/types';
import { Panel, Quiz, SampleTag } from '../components/ui';
import { QuestionMark } from '../components/Art';
import { to } from '../routes';

export default function SchoolScreen() {
  const { band: b, topic: tid } = useParams();
  const t = allSchoolTopics.find((x) => x.id === tid);
  const { band, setBand } = useApp();
  const [round, setRound] = useState(0);
  const [hint, setHint] = useState(false);
  const [solved, setSolved] = useState(false);
  const young = b === 'a7';
  const key = `school-${tid}`;
  useLesson(t ? { key, title: t.name, kind: 'school', material: { simpler: young ? 'السؤال الجيد يقول ماذا تريد بالضبط.' : 'قارن الجوابين: أيّهما يساعدك تتعلّم أو تجرّب؟', example: t.better, why: t.diff.feedbackRight, next: ['هل يمكن أن تعطيني مثالاً من بيتي؟', 'أعطني تلميحاً قبل الحل.', 'كيف أتأكد من الجواب؟'], hint: t.hint } } : { key: 'x', title: '', kind: 'other', material: { simpler: '', example: '', why: '', next: [] } }, `/school/${b}/${tid}`);
  useEffect(() => { if ((b === 'a7' || b === 'a10') && band !== b) setBand(b); }, [b, band, setBand]);
  if (!t || (b !== 'a7' && b !== 'a10')) return <Navigate to={to.home()} replace />;

  const pickQ: QuizQuestion = {
    id: `${t.id}-pick`, skill: 'task', prompt: 'أيّ سؤال أفضل؟',
    options: [
      { id: 'better', text: t.better, correct: true, feedback: 'أحسنت! هذا السؤال يقول بالضبط ماذا تريد.' },
      { id: 'vague', text: t.vague, feedback: `سؤال قصير جداً. ${t.hint}` },
      { id: 'off', text: t.off, feedback: t.offFeedback }
    ].sort((a, c) => (a.id + t.id).length % 3 - (c.id + t.id).length % 3)
  };
  const diffQ: QuizQuestion = {
    id: `${t.id}-diff`, skill: 'verify', prompt: 'اختر فرقاً واحداً صحيحاً بين الجوابين:',
    options: [
      { id: 'r', text: t.diff.right, correct: true, feedback: t.diff.feedbackRight },
      { id: 'w1', text: t.diff.wrong[0], feedback: t.diff.feedbackWrong[0] },
      { id: 'w2', text: t.diff.wrong[1], feedback: t.diff.feedbackWrong[1] }
    ].sort((a, c) => (t.id.length + a.id.charCodeAt(0)) % 3 - (t.id.length + c.id.charCodeAt(0)) % 3)
  };

  return (
    <div key={round}>
      <section className="panel">
        <p className="eyebrow">{t.interestName} · {young ? '٧–٩ سنوات' : '١٠–١٢ سنة'}</p>
        <h1>{t.name}</h1>
        <div className="row">
          <button type="button" onClick={() => { setRound((r) => r + 1); setHint(false); setSolved(false); }}>↺ جرّب من جديد</button>
          <Link className="btn" to={to.path(b)}>موضوع آخر</Link>
        </div>
      </section>
      {young ? (
        <Panel title="لنجرّب سؤالاً" sub="اقرأ مع كبير إذا احتجت. اختر، وإذا لم يكن الأنسب تحصل على تلميح وتجرّب مرة ثانية.">
          <Quiz q={pickQ} lessonKey={key} onCorrect={() => setSolved(true)} />
          {solved && (
            <div className="bubble sample">
              <span className="who">الجواب <SampleTag /></span>
              <ul>{t.sampleBetter.map((l) => <li key={l}>{l}</li>)}</ul>
              <p className="sub">جرّب ما يقوله الجواب، ثم أخبر معلّمك أو أهلك بما وجدت.</p>
            </div>
          )}
        </Panel>
      ) : (
        <Panel title="جرّب وقارن" sub="سؤالان عن الموضوع نفسه، وجوابان. اقرأهما ثم اشرح فرقاً واحداً.">
          <div className="compare2">
            <div className="example weak"><b>السؤال (أ)</b><div className="bubble-row"><QuestionMark lit={1} size={30} label="سؤال غامض" /><p>{t.vague}</p></div><div className="bubble sample"><span className="who">الجواب (أ) <SampleTag /></span><ul>{t.sampleVague.map((l) => <li key={l}>{l}</li>)}</ul></div></div>
            <div className="example"><b>السؤال (ب)</b><div className="bubble-row"><QuestionMark lit={4} size={30} label="سؤال واضح" /><p>{t.better}</p></div><div className="bubble sample"><span className="who">الجواب (ب) <SampleTag /></span><ul>{t.sampleBetter.map((l) => <li key={l}>{l}</li>)}</ul></div></div>
          </div>
          {!hint ? <button type="button" onClick={() => setHint(true)}>💡 أعطني تلميحاً أولاً</button> : <p className="hint">💡 {t.hint}</p>}
          <Quiz q={diffQ} lessonKey={key} onCorrect={() => setSolved(true)} />
          {solved && <p className="note">الآن جرّب على الورقة: اكتب سؤالك أنت عن «{t.name}» وأضف إليه تفصيلاً واحداً يجعل الجواب يساعدك أكثر.</p>}
        </Panel>
      )}
    </div>
  );
}
