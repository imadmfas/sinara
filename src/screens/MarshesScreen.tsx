import { useState } from 'react';
import { Link } from 'react-router-dom';
import { marshesProject as M } from '../content/index';
import { useApp, useLesson } from '../lib/app';
import { Panel, SampleTag } from '../components/ui';
import { QuestionMark } from '../components/Art';
import { to } from '../routes';

export default function MarshesScreen() {
  const [round, setRound] = useState(0);
  return <Project key={round} restart={() => setRound((r) => r + 1)} />;
}

function Project({ restart }: { restart: () => void }) {
  const { practise, play, patchCoach } = useApp();
  const [q, setQ] = useState<string | null>(null);
  const [flag, setFlag] = useState<number | null>(null);
  const [revised, setRevised] = useState(false);
  const [own, setOwn] = useState('');
  useLesson({ key: 'marshes', title: 'مشروع الأهوار', kind: 'marshes', material: {
    simpler: 'اختر سؤالاً صغيراً، ثم افحص كل رقم في الجواب قبل أن تضعه في العرض.',
    example: M.request,
    why: 'الأرقام والتواريخ ادعاءات محددة، وقد يكتبها النموذج بثقة وهي خاطئة. لذلك تحتاج مصدراً.',
    next: ['ضع علامة «يحتاج إلى مصدر» عند كل رقم.', 'اقترح سؤالاً للنقاش في آخر العرض.', 'أين أبحث عن عدد السكان في مصدر رسمي؟'],
    hint: 'ابحث عن جملة فيها رقم.'
  } }, '/project/marshes');
  const good = M.questionOptions.find((o) => o.id === q)?.best;
  return (
    <>
      <section className="panel">
        <p className="eyebrow">💡 ١٣–١٧ سنة · مشروع مدرسي</p>
        <h1>عرض عن الأهوار</h1>
        <p className="sub">المشروع مشروعك: المساعد يقترح، وأنت تختار وتتحقق وتكتب خاتمتك.</p>
        <div className="row"><button type="button" onClick={restart}>↺ جرّب من جديد</button><Link className="btn" to={to.path('a13')}>مساري</Link></div>
      </section>
      <Panel title="١. صغّر السؤال">
        <div className="bubble-row"><QuestionMark lit={good ? 4 : 1} size={40} /><p className="prompt-text">«{M.vague}»</p></div>
        <p><b>أيّ سؤال تستطيع إنجازه في أسبوع وخمس شرائح؟</b></p>
        <div className="choices">{M.questionOptions.map((o) => <button key={o.id} type="button" className={`choice ${q === o.id ? (o.best ? 'right' : 'wrong') : ''}`} aria-pressed={q === o.id} onClick={() => { setQ(o.id); patchCoach({ lastChoice: o.text, lastCorrect: o.best }); if (o.best) { practise('task', 'marshes'); play('chime'); } else play('soft'); }}>{o.text}</button>)}</div>
        {q && <p className={`feedback ${good ? 'ok' : 'retry'}`} role="status">{M.questionOptions.find((o) => o.id === q)!.feedback}</p>}
      </Panel>
      {good && (
        <Panel title="٢. افحص المخطط" sub={`طلبك: ${M.request}`}>
          <div className="bubble sample"><span className="who">المخطط المقترح <SampleTag /></span>
            <p><b>أيّ سطر يحتاج إلى مصدر قبل أن تعرضه؟</b></p>
            <div className="choices">{M.outline.map((l, i) => <button key={i} type="button" className={`choice ${flag === i ? (i === M.claimLine ? 'right' : 'wrong') : ''}`} aria-pressed={flag === i} onClick={() => { setFlag(i); if (i === M.claimLine) { practise('verify', 'marshes'); play('chime'); } else play('soft'); }}>{l}</button>)}</div>
          </div>
          {flag !== null && <p className={`feedback ${flag === M.claimLine ? 'ok' : 'retry'}`} role="status">{flag === M.claimLine ? M.claimFeedback.right : M.claimFeedback.wrong}</p>}
        </Panel>
      )}
      {flag === M.claimLine && (
        <Panel title="٣. راجع الطلب">
          <p className="prompt-box">{M.revisedRequest}</p>
          {!revised ? <button type="button" className="action" onClick={() => { setRevised(true); practise('followup', 'marshes'); play('note'); }}>أرسل المتابعة</button> : (
            <div className="bubble sample revised"><span className="who">المخطط بعد المراجعة <SampleTag /></span><ul>{M.revisedOutline.map((l, i) => <li key={i} className={i === M.claimLine ? 'changed' : ''}>{l}</li>)}</ul></div>
          )}
        </Panel>
      )}
      {revised && (
        <Panel title="٤. خاتمتك أنت">
          <label htmlFor="own-end">{M.ownWork}</label>
          <textarea id="own-end" rows={3} value={own} onChange={(e) => setOwn(e.target.value)} />
          <p className="sub">ما تكتبه هنا لا يُحفظ ولا يُرسل. انسخه إلى عرضك.</p>
          {own.trim().length > 20 && <p className="feedback ok">جميل. هذه الخاتمة من تفكيرك، وهي أهم ما يقيّمه معلّمك.</p>}
        </Panel>
      )}
    </>
  );
}
