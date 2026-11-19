import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { branchById, elementLabels, fieldById, kindToSkill, shortPromptNote } from '../content/index';
import type { ElementKind } from '../content/types';
import { useApp, useLesson } from '../lib/app';
import { QuestionMark } from '../components/Art';
import { CopyButton, Followup, Highlighted, Legend, Panel, Quiz } from '../components/ui';
import { to } from '../routes';

const allKinds: ElementKind[] = ['task', 'audience', 'data', 'constraint', 'format', 'verify', 'wait'];

export default function BranchScreen() {
  const { field: fid, branch: bid } = useParams();
  const field = fieldById(fid);
  const branch = branchById(fid, bid);
  const { band, practise, play } = useApp();
  const [round, setRound] = useState(0);
  const key = `branch-${fid}-${bid}`;
  useLesson(
    field && branch
      ? { key, title: `${branch.name} · ${field.name}`, kind: 'branch', material: { simpler: branch.simpler, example: branch.good, why: branch.why, next: field.followup.options.filter((o) => o.best).map((o) => o.text).concat(['ما الذي يحتاج إلى تحقق في الجواب؟']), hint: `ابحث في الطلب المحسّن عن: ${branch.highlights.map((h) => elementLabels[h.kind].short).filter((v, i, a) => a.indexOf(v) === i).join('، ')}.` } }
      : { key: 'missing', title: '', kind: 'other', material: { simpler: '', example: '', why: '', next: [] } },
    `/field/${fid}/${bid}`
  );
  if (!field || !branch) return <Navigate to={to.home()} replace />;
  const kinds = Array.from(new Set(branch.highlights.map((h) => h.kind)));
  return (
    <div key={round}>
      <section className="panel">
        <p className="eyebrow">{field.icon} {field.name}</p>
        <h1>{branch.name}</h1>
        <nav className="anchors" aria-label="أقسام الدرس">
          <a href={`#${key}-compare`} onClick={(e) => { e.preventDefault(); document.getElementById(`${key}-compare`)?.scrollIntoView(); }}>قُل ولا تقل</a>
          <a href={`#${key}-test`} onClick={(e) => { e.preventDefault(); document.getElementById(`${key}-test`)?.scrollIntoView(); }}>اختبر نفسك</a>
          <a href={`#${key}-next`} onClick={(e) => { e.preventDefault(); document.getElementById(`${key}-next`)?.scrollIntoView(); }}>شنو نسأل بعدها؟</a>
          <Link to={to.studio(field.id, branch.id)}>مولّد الطلبات</Link>
        </nav>
        <div className="row">
          <button type="button" onClick={() => setRound((r) => r + 1)}>↺ جرّب من جديد</button>
          <Link className="btn" to={band ? to.path(band) : to.home()}>تخصص آخر</Link>
          {branch.id === 'architecture' && <Link className="btn action" to={to.house()}>الرحلة الكاملة: خريطة البيت</Link>}
        </div>
      </section>

      <Compare key={`c-${round}`} id={`${key}-compare`} weak={branch.weak} good={branch.good} highlights={branch.highlights} why={branch.why} kinds={kinds}
        onFound={(found) => { found.forEach((k) => practise(kindToSkill(k), key)); play('note'); }} band={band} branchName={branch.name} />

      <Panel title="اختبر نفسك" id={`${key}-test`} sub="سؤال، ثم مثال جديد تنقل إليه المهارة، ثم جواب تعليمي فيه خطأ تفحصه.">
        <QuizSequence fieldId={field.id} lessonKey={key} />
      </Panel>

      <Panel title="شنو نسأل بعدها؟" id={`${key}-next`} sub={field.followup.title}>
        <Followup s={field.followup} lessonKey={key} />
      </Panel>

      <Panel title="خذ الطلب إلى عملك">
        <p className="prompt-box">{branch.good}</p>
        <div className="row">
          <CopyButton text={branch.good} onCopied={() => practise('task', key)} />
          <Link className="btn" to={to.studio(field.id, branch.id)}>عدّله في مولّد الطلبات</Link>
        </div>
      </Panel>
    </div>
  );
}

function Compare({ id, weak, good, highlights, why, kinds, onFound, band, branchName }: {
  id: string; weak: string; good: string; highlights: { text: string; kind: ElementKind }[]; why: string; kinds: ElementKind[];
  onFound: (k: ElementKind[]) => void; band: string | null; branchName: string;
}) {
  const [sel, setSel] = useState<ElementKind[]>([]);
  const [revealed, setRevealed] = useState(false);
  const found = sel.filter((k) => kinds.includes(k));
  const extra = sel.filter((k) => !kinds.includes(k));
  const toggle = (k: ElementKind) => setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  return (
    <Panel title="قُل ولا تقل" id={id}>
      <div className="beforeafter">
        <div className="example weak">
          <b>لا تقل</b>
          <div className="bubble-row"><QuestionMark lit={1} size={36} label="طلب غامض" /><p className="prompt-text">{weak}</p></div>
        </div>
        {!revealed ? (
          <div className="identify">
            <p><b>ماذا ينقص هذا الطلب؟</b> اختر كل ما تراه ناقصاً، ثم اكشف الصياغة الأفضل.</p>
            <div className="chips" role="group" aria-label="العناصر الناقصة">
              {allKinds.map((k) => <button key={k} type="button" className={`chip hl-${k}`} aria-pressed={sel.includes(k)} onClick={() => toggle(k)}>{elementLabels[k].label}</button>)}
            </div>
            <button type="button" className="action" disabled={!sel.length} onClick={() => { setRevealed(true); if (found.length) onFound(found); }}>اكشف الصياغة الأفضل</button>
          </div>
        ) : (
          <div className="example good revealed">
            <b>قُل</b>
            <div className="bubble-row"><QuestionMark lit={Math.min(5, kinds.length + 1)} size={36} label="طلب واضح" /><Highlighted text={good} highlights={highlights} /></div>
            <Legend kinds={kinds} />
            <p className="feedback ok" role="status">
              وجدتَ {found.length} من {kinds.length} عناصر أضافتها الصياغة الأفضل.
              {kinds.filter((k) => !sel.includes(k)).length > 0 && <> فاتك: {kinds.filter((k) => !sel.includes(k)).map((k) => elementLabels[k].short).join('، ')}.</>}
              {extra.length > 0 && <> واخترتَ {extra.map((k) => elementLabels[k].short).join('، ')}، وهي غير لازمة في هذا الطلب.</>}
            </p>
            <p><b>لماذا؟</b> {why}</p>
          </div>
        )}
      </div>
      <p className="note">{shortPromptNote}</p>
      {revealed && band === 'a13' && (
        <div className="frame">
          <h3>حوّله إلى مشروع مدرسي</h3>
          <p className="prompt-box">أنا طالب في الإعدادية أستكشف «{branchName}». اقترح سؤالاً صغيراً لمشروع مدرسي يمكنني تنفيذه خلال أسبوع. أعطني خطوتين للبدء ومصدراً أبحث عنه بنفسي، ثم انتظر اختياري.</p>
          <p className="sub">المدة والسؤال المحدد يجعلان المشروع قابلاً للتجربة، وتبقى لك مهمة البحث والاختيار.</p>
        </div>
      )}
      {revealed && band === 'a18' && (
        <div className="frame">
          <h3>معيار تقويم الطلب</h3>
          <p className="sub">استعمله لتقويم طلبك أو طلب زميلك في التكليف.</p>
          <ul className="rubric">
            {allKinds.map((k) => (
              <li key={k}><span className={`hl hl-${k}`}>{elementLabels[k].short}</span> {elementLabels[k].label}: <b>{kinds.includes(k) ? '✓ موجود في الصياغة الأفضل' : '— غير لازم هنا'}</b></li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

function QuizSequence({ fieldId, lessonKey }: { fieldId: string; lessonKey: string }) {
  const f = fieldById(fieldId)!;
  const [step, setStep] = useState(0);
  const [ok, setOk] = useState(false);
  const q = step === 0 ? f.quiz.main : step === 1 ? f.quiz.transfer : f.quiz.flawed.question;
  return (
    <div>
      <p className="steps" aria-label="مراحل الاختبار">
        {['السؤال', 'مثال جديد', 'افحص جواباً'].map((t, i) => <span key={t} className={i === step ? 'on' : i < step ? 'done' : ''}>{i + 1}. {t}</span>)}
      </p>
      {step === 2 && <p className="sub">الطلب: {f.quiz.flawed.request}</p>}
      <Quiz key={q.id} q={q} lessonKey={lessonKey} onCorrect={() => setOk(true)} lines={step === 2 ? f.quiz.flawed.answer : undefined} flawLine={f.quiz.flawed.flawLine} />
      {ok && (
        <div className="row">
          {step < 2 ? (
            <button type="button" className="action" onClick={() => { setStep(step + 1); setOk(false); }}>{step === 0 ? 'انتقل إلى مثال جديد' : 'افحص جواباً تعليمياً'}</button>
          ) : (
            <button type="button" onClick={() => { setStep(0); setOk(false); }}>أعد الاختبار</button>
          )}
        </div>
      )}
    </div>
  );
}
