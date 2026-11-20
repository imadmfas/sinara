import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fields, fieldById } from '../content/index';
import { services, formats, verifySteps } from '../content/services';
import { buildPrompt, serviceById, type BuilderInput } from '../lib/promptBuilder';
import { useApp, useLesson } from '../lib/app';
import { isAdult } from '../content/ages';
import { liveConfigured } from '../lib/live';
import { CopyButton, Panel } from '../components/ui';
import { QuestionMark } from '../components/Art';
import { ar, findVariant, type CatalogCase, type CatalogVariant } from '../lib/catalog';
import { modeGuides } from '../content/catalogGuide';
import { Link, useNavigate } from 'react-router-dom';
import type { BuiltPrompt } from '../lib/promptBuilder';

/** A suggestion only: never filled in as if the learner had supplied it. */
export const suggestAudience = (band: string | null) => band === 'a7' || band === 'a10' ? 'تلميذ في المدرسة' : band === 'a13' ? 'طلبة الإعدادية' : band === 'a18' ? 'متعلّم يبدأ التخصص' : 'زملاء في العمل';

export default function StudioScreen() {
  const [params] = useSearchParams();
  const { settings } = useApp();
  const tpl = params.get('template');
  if (tpl) return <TemplateStudio key={tpl} id={tpl} />;
  const full = params.get('mode') === 'full' || (settings.expertise === 'experienced' && params.get('mode') !== 'guided');
  return full ? <FullStudio /> : <BeginnerStudio />;
}

function defaultsFor(fieldId: string | undefined, branchId: string | undefined, band: string | null): Partial<BuilderInput> {
  const f = fieldById(fieldId);
  const b = f?.branches.find((x) => x.id === branchId);
  if (!b) return { goal: '', audience: '', inputs: '', constraints: '' };
  const pick = (k: string) => b.highlights.filter((h) => h.kind === k).map((h) => h.text).join('، ');
  return {
    goal: pick('task') || b.weak.replace(/[.؟]$/, ''),
    audience: pick('audience'),
    inputs: pick('data'),
    constraints: pick('constraint')
  };
}

function FullStudio() {
  const [params, setParams] = useSearchParams();
  const { band, practise, play, saveDraft, setCoachOpen } = useApp();
  const adult = isAdult(band);
  const init = () => {
    const fid = params.get('field') ?? '';
    const bid = params.get('branch') ?? '';
    const d = defaultsFor(fid, bid, band);
    const bname = fieldById(fid)?.branches.find((x) => x.id === bid)?.name;
    return { service: 'explain', field: fid, branch: bid, goal: d.goal ?? '', audience: d.audience ?? '', inputs: d.inputs ?? '', constraints: d.constraints ?? '', format: serviceById('explain').defaultFormat, verify: verifySteps[0], extra: (bname ? { concept: bname } : {}) as Record<string, string> };
  };
  const [inp, setInp] = useState<BuilderInput>(init);
  const [output, setOutput] = useState('');
  const [dirty, setDirty] = useState(false); // learner edited the output by hand
  const [stale, setStale] = useState(false); // inputs changed since last generation
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const goalRef = useRef<HTMLTextAreaElement>(null);
  const svc = serviceById(inp.service);
  const built = useMemo(() => buildPrompt(inp), [inp]);
  const field = fieldById(inp.field);
  useLesson({ key: 'studio', title: 'مولّد الطلبات', kind: 'studio', material: {
    simpler: 'املأ المهمة، واختر الخدمة، وسيُبنى طلبك. كل خانة تضيف تفصيلاً يغيّر الجواب.',
    example: built.text.split('\n').slice(0, 3).join(' '),
    why: built.reasons.map((r) => `${r.label}: ${r.why}`).slice(0, 3).join(' '),
    next: ['هل هناك معلومة ناقصة تحتاجها قبل البدء؟ اسألني عنها.', 'اختصر الجواب إلى نصف طوله لجمهوري.', 'ما الافتراضات التي وضعتها؟'],
    hint: built.missing.length ? `ينقص: ${built.missing.join('، ')}.` : 'الطلب مكتمل. جرّب تغيير الخدمة وانظر كيف تتغيّر الخانات.'
  } }, '/studio');

  const set = (p: Partial<BuilderInput>) => { setInp((i) => ({ ...i, ...p })); setStale(true); setError(''); };
  const setExtra = (k: string, v: string) => set({ extra: { ...inp.extra, [k]: v } });
  useEffect(() => { if (!dirty && output) { setOutput(built.text); setStale(false); } }, [built.text]); // eslint-disable-line react-hooks/exhaustive-deps

  const generate = (force = false) => {
    if (built.missing.length && built.missing[0].startsWith('المهمة')) { setError(`اكتب مهمتك أولاً: ماذا تريد أن تفعل بالنتيجة؟ ${built.next}`); goalRef.current?.focus(); return; }
    if (built.missing.length) { setError(`أكمل هذه الخانات: ${built.missing.join('، ')}.`); document.getElementById(`x-${svc.fields.find((f) => f.required && !(inp.extra[f.id] || '').trim())?.id}`)?.focus(); return; }
    if (dirty && !force) { setConfirmOverwrite(true); return; }
    setOutput(built.text); setDirty(false); setStale(false); setConfirmOverwrite(false); play('note');
    practise('task', 'studio');
    if (inp.constraints.trim()) practise('constraint', 'studio');
    if (inp.format !== svc.defaultFormat) practise('format', 'studio');
    if (!inp.verify.startsWith('بدون')) practise('verify', 'studio');
  };
  const reset = () => { setInp({ ...init(), field: '', branch: '', goal: '', audience: '', inputs: '', constraints: '', extra: {} }); setOutput(''); setDirty(false); setStale(false); setError(''); setConfirmOverwrite(false); };

  return (
    <>
      <section className="panel">
        <p className="eyebrow">🧰 للمتعلّم وصاحب الخبرة</p>
        <h1>مولّد الطلبات</h1>
        <p className="sub">يبني الطلب على جهازك دون إنترنت. لا يُرسل شيء إلى أي نموذج تلقائياً. انسخ الطلب واستعمله في المساعد الذي تختاره.</p>
        <div className="row"><span className="chip">المحرر الكامل</span><button type="button" onClick={() => { const n = new URLSearchParams(params); n.set('mode', 'guided'); setParams(n); }}>خطوة خطوة مع مثال</button></div>
      </section>
      <div className="studio">
        <Panel title="١. ما المطلوب؟">
          <label htmlFor="svc">الخدمة</label>
          <select id="svc" value={inp.service} onChange={(e) => set({ service: e.target.value, extra: {}, format: serviceById(e.target.value).defaultFormat })}>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="formgrid">
            <div>
              <label htmlFor="fld">المجال</label>
              <select id="fld" value={inp.field} onChange={(e) => { const d = defaultsFor(e.target.value, '', band); set({ field: e.target.value, branch: '', ...d }); }}>
                <option value="">بدون تحديد</option>
                {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="br">التخصص الفرعي</label>
              <select id="br" value={inp.branch} disabled={!field} onChange={(e) => { const d = defaultsFor(inp.field, e.target.value, band); set({ branch: e.target.value, ...d }); }}>
                <option value="">بدون تحديد</option>
                {field?.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <label htmlFor="goal">ما الذي تريد إنجازه تحديداً؟</label>
          <textarea id="goal" ref={goalRef} rows={2} value={inp.goal} placeholder="اكتب المهمة بكلماتك" aria-invalid={!!error && !inp.goal.trim()} onChange={(e) => set({ goal: e.target.value })} />
          <fieldset className="svc-fields">
            <legend>خانات «{svc.name}»</legend>
            {svc.fields.filter((f) => f.required || f.id === svc.materialField).map((f) => <ExtraField key={f.id} f={f} value={inp.extra[f.id] || ''} onChange={(v) => setExtra(f.id, v)} />)}
            {svc.fields.some((f) => !f.required && f.id !== svc.materialField) && (
              <details>
                <summary>تفاصيل إضافية اختيارية</summary>
                {svc.fields.filter((f) => !f.required && f.id !== svc.materialField).map((f) => <ExtraField key={f.id} f={f} value={inp.extra[f.id] || ''} onChange={(v) => setExtra(f.id, v)} />)}
              </details>
            )}
          </fieldset>
          <details open={!!(inp.audience || inp.inputs || inp.constraints)}>
            <summary>الجمهور والمعطيات والقيود</summary>
            <label htmlFor="aud">لمن تُعدّ هذا الطلب؟</label>
            <input id="aud" value={inp.audience} onChange={(e) => set({ audience: e.target.value })} placeholder="مثلاً: طلبة السنة الأولى" />
            {!inp.audience && <button type="button" className="chip suggest" onClick={() => set({ audience: suggestAudience(band) })}>اقتراح: {suggestAudience(band)}</button>}
            <label htmlFor="inputs">المعطيات المتوفرة</label>
            <input id="inputs" value={inp.inputs} onChange={(e) => set({ inputs: e.target.value })} placeholder="مثلاً: أرقام افتراضية، نص سأرفقه" />
            <label htmlFor="cons">قيد أو شرط</label>
            <input id="cons" value={inp.constraints} onChange={(e) => set({ constraints: e.target.value })} placeholder="مثلاً: عشر دقائق، خمسة أسطر" />
          </details>
          <div className="formgrid">
            <div><label htmlFor="fmt">شكل الناتج {inp.format === svc.defaultFormat && <span className="tag">افتراضي</span>}</label><select id="fmt" value={inp.format} onChange={(e) => set({ format: e.target.value })}>{formats.map((f) => <option key={f}>{f}</option>)}</select></div>
            <div><label htmlFor="ver">خطوة التحقق {inp.verify === verifySteps[0] && <span className="tag">افتراضي</span>}</label><select id="ver" value={inp.verify} onChange={(e) => set({ verify: e.target.value })}>{verifySteps.map((v) => <option key={v} value={v}>{v.length > 60 ? v.slice(0, 58) + '…' : v}</option>)}</select></div>
          </div>
        </Panel>

        <Panel title="٢. المعاينة الحية" className="preview">
          <Readiness built={built} />
          <div className="bubble-row"><QuestionMark lit={Math.min(5, built.supplied.length)} size={42} label={`أضفتَ ${ar(built.supplied.length)} تفاصيل`} /><pre className="live-preview" aria-live="polite">{built.text}</pre></div>
          {built.waits && <p className="note">الطلب يطلب من المساعد أن ينتظر النص قبل أن يبدأ، لأنك لم تلصقه بعد.</p>}
          <div className="row">
            <button type="button" className="action" onClick={() => generate()}>{output ? 'أعد التوليد من المدخلات' : 'ولّد الطلب'}</button>
            <button type="button" onClick={reset}>إعادة ضبط</button>
          </div>
          {error && <p className="feedback retry" role="alert">{error}</p>}
          {confirmOverwrite && (
            <div className="feedback retry" role="alertdialog" aria-labelledby="ow-t">
              <p id="ow-t">عدّلت المسودة بيدك. إعادة التوليد ستستبدل تعديلك.</p>
              <div className="row"><button type="button" className="action" onClick={() => generate(true)}>استبدل التعديل</button><button type="button" onClick={() => setConfirmOverwrite(false)}>احتفظ بتعديلي</button></div>
            </div>
          )}
          {output && (
            <div className="result-box">
              <label htmlFor="output">مسودة طلبك القابلة للتعديل</label>
              <textarea id="output" rows={9} value={output} onChange={(e) => { setOutput(e.target.value); setDirty(true); }} />
              {stale && dirty && <p className="sub">تغيّرت المدخلات بعد تعديلك اليدوي. اضغط «أعد التوليد» إن أردت مسودة جديدة.</p>}
              <div className="row">
                <CopyButton text={output} onCopied={() => practise('task', 'studio')} />
                {adult && <button type="button" onClick={() => { saveDraft(svc.name, output); setSaved('حُفظت المسودة على هذا الجهاز فقط. تجدها في «تقدّمي».'); }}>احفظ المسودة على هذا الجهاز</button>}
                {adult && liveConfigured() && <button type="button" onClick={() => { sessionStorage.setItem('sinara.liveDraft', output); setCoachOpen(true); }}>شارك المسودة مع المحادثة المباشرة</button>}
              </div>
              {saved && <p className="sub" role="status">{saved}</p>}
            </div>
          )}
          <h3>ماذا أضاف كل تفصيل؟</h3>
          <ul className="reasons">{built.reasons.map((r) => <li key={r.label}><b>{r.label}:</b> {r.why}</li>)}</ul>
        </Panel>
      </div>
    </>
  );
}

function ExtraField({ f, value, onChange }: { f: (typeof services)[number]['fields'][number]; value: string; onChange: (v: string) => void }) {
  const id = `x-${f.id}`;
  return (
    <div>
      <label htmlFor={id}>{f.label}{f.required && <span aria-hidden="true"> *</span>}{f.required && <span className="sr-only"> (مطلوب)</span>}</label>
      {f.type === 'select' ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}><option value="">اختر</option>{f.options!.map((o) => <option key={o}>{o}</option>)}</select>
      ) : f.type === 'textarea' ? (
        <textarea id={id} rows={3} value={value} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} value={value} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

/** Distinguishes what the learner supplied, what is a default, and whether the request is ready. */
function Readiness({ built }: { built: BuiltPrompt }) {
  const ready = !built.missing.length;
  return (
    <div className={`readiness ${ready ? 'ok' : ''}`} role="status">
      <p><b>{ready ? 'الطلب جاهز للتوليد.' : `ينقص: ${built.missing.join('، ')}.`}</b> {built.supplied.length ? `أضفتَ ${ar(built.supplied.length)}: ${built.supplied.join('، ')}.` : 'لم تُضف تفاصيل بعد؛ الشكل والتحقق قيم افتراضية.'}</p>
      {built.derived && <p className="sub">{built.derived}</p>}
      <p className="next"><b>الخطوة التالية:</b> {built.next}</p>
    </div>
  );
}

/** Beginner mode: a worked example, then one decision at a time. */
function BeginnerStudio() {
  const { band, practise, play } = useApp();
  const [params, setParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [inp, setInp] = useState<BuilderInput>({ service: 'explain', goal: '', audience: '', inputs: '', constraints: '', format: serviceById('explain').defaultFormat, verify: verifySteps[0], extra: {} });
  const built = useMemo(() => buildPrompt(inp), [inp]);
  const svc = serviceById(inp.service);
  const primary = svc.fields.find((f) => f.required && f.id !== svc.materialField);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (step) heading.current?.focus(); }, [step]);
  useLesson({ key: 'studio-guided', title: 'مولّد الطلبات خطوة خطوة', kind: 'studio', material: {
    simpler: 'قرار واحد في كل خطوة: ماذا تريد، ولمن، وبأي شكل.', example: 'اشرح لي الفائدة المركّبة لموظف جديد بمثال قرض سيارة، في خمس نقاط.',
    why: 'كل خطوة تضيف تفصيلاً واحداً يغيّر الجواب.', next: ['ما الذي ينقص طلبي؟'], hint: built.next } }, '/studio');
  const steps = ['ماذا تريد؟', 'عن ماذا بالضبط؟', 'لمن؟', 'بأي شكل؟', 'طلبك جاهز'];
  const choices = ['explain', 'compare', 'plan', 'message'];
  return (
    <>
      <section className="panel">
        <p className="eyebrow">🧰 خطوة خطوة</p>
        <h1>مولّد الطلبات</h1>
        <div className="example">
          <b>مثال مكتمل</b>
          <p className="prompt-box">اشرح لي الفائدة المركّبة. مستواي: أسمع بها لأول مرة. اربط الشرح بمثال قرض لشراء سيارة. الجمهور: موظف جديد. قدّم الناتج في صورة خمس نقاط، واختم بسؤال يختبر فهمي.</p>
          <p className="sub">فيه أربعة قرارات: المفهوم، والمستوى، والجمهور، والشكل. ستتخذها الآن واحداً واحداً.</p>
        </div>
        <button type="button" onClick={() => { const n = new URLSearchParams(params); n.set('mode', 'full'); setParams(n); }}>انتقل إلى المحرر الكامل</button>
      </section>
      <section className="panel">
        <ol className="steps">{steps.map((t, i) => <li key={t} className={i === step ? 'on' : i < step ? 'done' : ''}>{ar(i + 1)}. {t}</li>)}</ol>
        <h2 ref={heading} tabIndex={-1}>{steps[step]}</h2>
        {step === 0 && (
          <div className="choices">
            {choices.map((id) => <button key={id} type="button" aria-pressed={inp.service === id} onClick={() => { setInp({ ...inp, service: id, format: serviceById(id).defaultFormat, extra: {} }); play('click'); }}>{serviceById(id).name}</button>)}
          </div>
        )}
        {step === 1 && primary && (
          <>
            <label htmlFor="b-primary">{primary.label}</label>
            <input id="b-primary" value={inp.extra[primary.id] || ''} placeholder={primary.placeholder} onChange={(e) => setInp({ ...inp, extra: { ...inp.extra, [primary.id]: e.target.value } })} />
            {svc.fields.filter((f) => f.required && f !== primary).map((f) => (
              <div key={f.id}><label htmlFor={`b-${f.id}`}>{f.label}</label><input id={`b-${f.id}`} value={inp.extra[f.id] || ''} placeholder={f.placeholder} onChange={(e) => setInp({ ...inp, extra: { ...inp.extra, [f.id]: e.target.value } })} /></div>
            ))}
          </>
        )}
        {step === 2 && (
          <>
            <label htmlFor="b-aud">لمن تُعدّ الطلب؟</label>
            <input id="b-aud" value={inp.audience} onChange={(e) => setInp({ ...inp, audience: e.target.value })} placeholder="مثلاً: والدي، أول مرة يستعمل الهاتف" />
            {!inp.audience && <button type="button" className="chip suggest" onClick={() => setInp({ ...inp, audience: suggestAudience(band) })}>اقتراح: {suggestAudience(band)}</button>}
          </>
        )}
        {step === 3 && (
          <div className="choices">{formats.map((f) => <button key={f} type="button" aria-pressed={inp.format === f} onClick={() => { setInp({ ...inp, format: f }); practise('format', 'studio'); }}>{f}</button>)}</div>
        )}
        {step === 4 && (
          <>
            <p className="prompt-box">{built.text}</p>
            <div className="row"><CopyButton text={built.text} onCopied={() => practise('task', 'studio')} /></div>
          </>
        )}
        <Readiness built={built} />
        <div className="row">
          {step > 0 && <button type="button" onClick={() => setStep(step - 1)}>السابق</button>}
          {step < 4 && <button type="button" className="action" disabled={step === 1 && built.missing.length > 0} onClick={() => setStep(step + 1)}>التالي</button>}
        </div>
      </section>
    </>
  );
}

/** «خصّصه»: opens a library template with its fields populated. Template and personal version stay distinct. */
function TemplateStudio({ id }: { id: string }) {
  const nav = useNavigate();
  const { practise } = useApp();
  const [data, setData] = useState<{ c: CatalogCase; v: CatalogVariant; prompt: string } | null | undefined>(undefined);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [text, setText] = useState('');
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  useEffect(() => { findVariant(id).then((d) => { setData(d); if (d) { setVals({ role: d.c.role, goal: d.c.goal, inputs: d.c.inputs, check: d.c.check }); setText(d.prompt); } }).catch(() => setData(null)); }, [id]);
  useLesson({ key: `studio-${id}`, title: `تخصيص ${id}`, kind: 'studio', material: { simpler: 'غيّر المعطيات الخيالية إلى معطياتك، واترك بنية الطلب كما هي.', example: id, why: 'البنية (الدور، المهمة، المعطيات، الشكل، المعيار) هي ما يجعل الطلب صالحاً.', next: [] } }, `/studio?template=${id}`);
  const personal = useMemo(() => {
    if (!data) return '';
    let t = data.prompt;
    (['role', 'goal', 'inputs', 'check'] as const).forEach((k) => { if (vals[k] !== undefined && vals[k] !== data.c[k]) t = t.split(data.c[k]).join(vals[k]); });
    return t;
  }, [data, vals]);
  useEffect(() => { if (!data) return; if (dirty) setPending(personal !== text); else setText(personal); }, [personal]); // eslint-disable-line react-hooks/exhaustive-deps
  if (data === undefined) return <p className="sub" role="status">جارٍ تحميل القالب…</p>;
  if (data === null) return <section className="panel"><h1>لم نجد هذا القالب</h1><Link className="btn action" to="/library">إلى المكتبة</Link></section>;
  const labels: Record<string, string> = { role: 'لمن (الدور)', goal: 'المهمة', inputs: 'المعطيات', check: 'معيار القبول' };
  const changed = (['role', 'goal', 'inputs', 'check'] as const).filter((k) => vals[k] !== data.c[k]);
  return (
    <>
      <section className="panel">
        <p className="eyebrow">خصّص قالباً · {data.v.id}</p>
        <h1>{data.c.title}</h1>
        <p className="sub">{data.v.mode} · غيّر المعطيات الخيالية إلى معطياتك. القالب الأصلي يبقى كما هو.</p>
        <div className="row"><button type="button" onClick={() => nav(-1)}>→ العودة</button><Link className="btn" to={`/library/${data.v.id}`}>تعلّم كيف كُتب</Link></div>
      </section>
      <div className="studio">
        <Panel title="معطياتك">
          {(['role', 'goal', 'inputs', 'check'] as const).map((k) => (
            <div key={k}>
              <label htmlFor={`t-${k}`}>{labels[k]} {vals[k] === data.c[k] ? <span className="tag">من القالب</span> : <span className="tag mine">تعديلك</span>}</label>
              <textarea id={`t-${k}`} rows={2} value={vals[k] ?? ''} onChange={(e) => { setVals({ ...vals, [k]: e.target.value }); if (k === 'inputs') practise('constraint', `studio-${id}`); }} />
            </div>
          ))}
          <button type="button" onClick={() => { setVals({ role: data.c.role, goal: data.c.goal, inputs: data.c.inputs, check: data.c.check }); setText(data.prompt); setDirty(false); setPending(false); }}>أرجع إلى القالب</button>
        </Panel>
        <Panel title={changed.length ? 'نسختك' : 'القالب (لم تعدّله بعد)'} className="preview">
          <label htmlFor="t-out">{changed.length || dirty ? 'نسختك الشخصية القابلة للتعديل' : 'نص القالب'}</label>
          <textarea id="t-out" rows={12} value={text} onChange={(e) => { setText(e.target.value); setDirty(true); }} />
          {pending && (
            <div className="feedback retry" role="alertdialog" aria-labelledby="tp-ow">
              <p id="tp-ow">عدّلت النص بيدك، وتغيّرت المعطيات بعدها. هل تريد استبدال تعديلك بنسخة جديدة من المعطيات؟</p>
              <div className="row"><button type="button" className="action" onClick={() => { setText(personal); setDirty(false); setPending(false); }}>استبدل تعديلي</button><button type="button" onClick={() => setPending(false)}>احتفظ بتعديلي</button></div>
            </div>
          )}
          {changed.length > 0 && <p className="sub">غيّرتَ: {changed.map((k) => labels[k]).join('، ')}.</p>}
          <div className="row"><CopyButton text={text} onCopied={() => practise('task', `studio-${id}`)} /></div>
          <p className="note"><b>قبل أن تستعمل الجواب:</b> افحصه بهذا المعيار: «{vals.check}». ثم اسأل: «{modeGuides[data.v.mode].followup}»</p>
          <details><summary>القالب الأصلي</summary><p className="prompt-box">{data.prompt}</p></details>
        </Panel>
      </div>
    </>
  );
}
