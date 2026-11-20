import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { labLessons, problemLabels, type LabLesson, type ProblemKind } from '../content/lab';
import { useApp, useLesson } from '../lib/app';
import { Panel, SampleTag } from '../components/ui';
import { to } from '../routes';

export default function LabScreen() {
  const { id } = useParams();
  const lesson = labLessons.find((l) => l.id === id);
  const [round, setRound] = useState(0);
  useLesson({ key: `lab-${id ?? 'index'}`, title: lesson ? lesson.title : 'غيّر كلمة، شوف الفرق', kind: 'lab', material: {
    simpler: 'غيّر شيئاً واحداً فقط في الطلب، ثم قارن الجوابين.',
    example: lesson?.changed || 'أضف «خطوة واحدة في كل مرة» وشوف كيف يتغيّر الجواب.',
    why: lesson?.rule || 'تغيير واحد يجعل أثره واضحاً؛ تغييرات كثيرة معاً تخفي السبب.',
    next: ['ما التغيير الواحد الذي يخدم هدفي أكثر؟', 'هل المشكلة حدّ في الأداة أم بيانات ناقصة أم جواب خاطئ؟']
  } }, id ? `/lab/${id}` : '/lab');
  if (!lesson) {
    return (
      <section className="panel">
        <p className="eyebrow">التجربة المميزة في سِينارة</p>
        <h1>غيّر كلمة، شوف الفرق</h1>
        <p>في كل تجربة: تتوقع ما سيتغيّر، ثم تغيّر تعليمة واحدة فقط، وتقارن جوابين، وتحكم بمعيار مكتوب أيهما يخدم غرضك. الطلب القصير الكافي ينجح أيضاً؛ لا نكافئ الطول ولا الزخرفة.</p>
        <ul className="lab-list">
          {labLessons.map((l) => (
            <li key={l.id}><Link className="card" to={l.link ?? to.lab(l.id)}><b>{l.title}</b><small>{l.who}، {l.band}، تدريب على: {l.media}</small></Link></li>
          ))}
        </ul>
      </section>
    );
  }
  if (lesson.link) return <Navigate to={lesson.link} />;
  return <LabRun key={`${lesson.id}-${round}`} l={lesson} restart={() => setRound((r) => r + 1)} />;
}

function Navigate({ to: href }: { to: string }) {
  return <section className="panel"><h1>تابع في الرحلة الكاملة</h1><Link className="btn action" to={href}>افتح الرحلة</Link></section>;
}

type Opt = { text: string; correct?: boolean; feedback: string };
function Choice({ q, options, onRight, name }: { q: string; options: Opt[]; onRight: () => void; name: string }) {
  const { play } = useApp();
  const [p, setP] = useState<number | null>(null);
  // Deterministic order so the right answer is not always first (and never chosen by position or length).
  const shift = (q.length + name.length) % options.length;
  options = [...options.slice(shift), ...options.slice(0, shift)];
  const right = p !== null && options[p].correct;
  return (
    <div className="quiz" data-step={name}>
      <p className="q-prompt"><b>{q}</b></p>
      <div className="choices" role="group" aria-label={q}>
        {options.map((o, i) => (
          <button key={i} type="button" className={`choice ${p === i ? (o.correct ? 'right' : 'wrong') : ''}`} aria-pressed={p === i} disabled={right && !o.correct}
            onClick={() => { setP(i); if (o.correct) { play('chime'); onRight(); } else play('soft'); }}>{o.text}</button>
        ))}
      </div>
      {p !== null && <p className={`feedback ${right ? 'ok' : 'retry'}`} role="status">{options[p].feedback}{!right && ' جرّب خياراً آخر.'}</p>}
    </div>
  );
}

function LabRun({ l, restart }: { l: LabLesson; restart: () => void }) {
  const { practise } = useApp();
  const [step, setStep] = useState(0);
  const go = (n: number) => setStep((s) => Math.max(s, n));
  const key = `lab-${l.id}`;
  const before = l.base.prompt;
  const added = l.after.prompt.slice(before.length).trim();
  return (
    <>
      <section className="panel">
        <p className="eyebrow">غيّر كلمة، شوف الفرق · {l.media}</p>
        <h1>{l.title}</h1>
        <p><b>{l.who}:</b> {l.goal}</p>
        <button type="button" onClick={restart}>↺ جرّب من جديد</button>
      </section>

      <Panel title="١. الطلب الأول وجوابه">
        <p className="prompt-box">{l.base.prompt}</p>
        <div className="bubble sample"><span className="who">الجواب <SampleTag /></span><ul>{l.base.output.map((x) => <li key={x}>{x}</li>)}</ul></div>
        <Choice name="edit" q="غيّر تعليمة واحدة فقط. أيّ تغيير يخدم الهدف؟" options={l.edits} onRight={() => { go(1); practise('constraint', key); }} />
      </Panel>

      {step >= 1 && (
        <Panel title="٢. توقّع قبل أن ترى">
          <Choice name="predict" q={l.predict.q} options={l.predict.options} onRight={() => go(2)} />
        </Panel>
      )}

      {step >= 2 && (
        <Panel title="٣. قارن الجوابين">
          <p className="prompt-box">{before} <mark className="hl hl-constraint new">{added}<span className="sr-only"> (التعليمة التي غيّرتها)</span></mark></p>
          <div className="compare2">
            <div className="bubble sample"><span className="who">قبل التغيير <SampleTag /></span><ul>{l.base.output.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div className="bubble sample revised"><span className="who">بعد التغيير <SampleTag /></span><ul>{l.after.output.map((x, i) => <li key={x} className={l.after.changedLines.includes(i) ? 'changed' : ''}>{x}</li>)}</ul></div>
          </div>
          <Choice name="judge" q={l.judge.q} options={l.judge.options} onRight={() => { go(3); practise('verify', key); }} />
          {step >= 3 && <p className="note"><b>قاعدة الحكم:</b> {l.rule}</p>}
        </Panel>
      )}

      {step >= 3 && (
        <Panel title="٤. ما نوع المشكلة؟">
          <p className="prompt-box">{l.problem.case}</p>
          <Choice name="problem" q="هل هذا حدّ في الأداة، أم بيانات ناقصة، أم جواب خاطئ؟"
            options={(Object.keys(problemLabels) as ProblemKind[]).map((k) => ({ text: problemLabels[k], correct: k === l.problem.kind, feedback: k === l.problem.kind ? l.problem.explain : 'أعد التفكير: هل كانت الأداة قادرة أصلاً؟ وهل أعطيناها ما تحتاجه؟' }))}
            onRight={() => go(4)} />
        </Panel>
      )}

      {step >= 4 && (
        <Panel title="٥. موقف جديد (الجواب مخفي حتى تختار)">
          <p>{l.second.scenario}</p>
          <Choice name="second" q={l.second.q} options={l.second.options} onRight={() => { go(5); practise('followup', key); }} />
          {step >= 5 && (
            <>
              <div className="bubble sample revised"><span className="who">الجواب بعد طلبك <SampleTag /></span><p>{l.second.answer}</p></div>
              <p className="feedback ok" role="status" data-testid="lab-done">أنجزت التجربة. {l.done}</p>
              <Link className="btn" to={to.lab()}>تجربة أخرى</Link>
            </>
          )}
        </Panel>
      )}
    </>
  );
}
