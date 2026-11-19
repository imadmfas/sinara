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

function defaultsFor(fieldId: string | undefined, branchId: string | undefined, band: string | null): Partial<BuilderInput> {
  const f = fieldById(fieldId);
  const b = f?.branches.find((x) => x.id === branchId);
  const audience = band === 'a7' || band === 'a10' ? 'تلميذ في المدرسة' : band === 'a13' ? 'طلبة الإعدادية' : band === 'a18' ? 'متعلّم يبدأ التخصص' : 'زملاء في العمل';
  if (!b) return { goal: '', audience, inputs: '', constraints: '' };
  const pick = (k: string) => b.highlights.filter((h) => h.kind === k).map((h) => h.text).join('، ');
  return {
    goal: pick('task') || b.weak.replace(/[.؟]$/, ''),
    audience: pick('audience') || audience,
    inputs: pick('data'),
    constraints: pick('constraint')
  };
}

export default function StudioScreen() {
  const [params] = useSearchParams();
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
    if (!inp.goal.trim()) { setError('اكتب مهمتك أولاً: ماذا تريد أن تفعل بالنتيجة؟'); goalRef.current?.focus(); return; }
    if (built.missing.length) { setError(`أكمل هذه الخانات: ${built.missing.join('، ')}.`); document.getElementById(`x-${svc.fields.find((f) => f.required && !(inp.extra[f.id] || '').trim())?.id}`)?.focus(); return; }
    if (dirty && !force) { setConfirmOverwrite(true); return; }
    setOutput(built.text); setDirty(false); setStale(false); setConfirmOverwrite(false); play('note');
    practise('task', 'studio');
    if (inp.constraints.trim()) practise('constraint', 'studio');
    if (inp.format !== svc.defaultFormat) practise('format', 'studio');
    if (!inp.verify.startsWith('بدون')) practise('verify', 'studio');
  };
  const reset = () => { setInp({ ...init(), field: '', branch: '', goal: '', inputs: '', constraints: '' }); setOutput(''); setDirty(false); setStale(false); setError(''); setConfirmOverwrite(false); };

  return (
    <>
      <section className="panel">
        <p className="eyebrow">🧰 للمتعلّم وصاحب الخبرة</p>
        <h1>مولّد الطلبات</h1>
        <p className="sub">يبني الطلب على جهازك دون إنترنت. لا يُرسل شيء إلى أي نموذج تلقائياً. انسخ الطلب واستعمله في المساعد الذي تختاره.</p>
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
            <label htmlFor="inputs">المعطيات المتوفرة</label>
            <input id="inputs" value={inp.inputs} onChange={(e) => set({ inputs: e.target.value })} placeholder="مثلاً: أرقام افتراضية، نص سأرفقه" />
            <label htmlFor="cons">قيد أو شرط</label>
            <input id="cons" value={inp.constraints} onChange={(e) => set({ constraints: e.target.value })} placeholder="مثلاً: عشر دقائق، خمسة أسطر" />
          </details>
          <div className="formgrid">
            <div><label htmlFor="fmt">شكل الناتج</label><select id="fmt" value={inp.format} onChange={(e) => set({ format: e.target.value })}>{formats.map((f) => <option key={f}>{f}</option>)}</select></div>
            <div><label htmlFor="ver">خطوة التحقق</label><select id="ver" value={inp.verify} onChange={(e) => set({ verify: e.target.value })}>{verifySteps.map((v) => <option key={v} value={v}>{v.length > 60 ? v.slice(0, 58) + '…' : v}</option>)}</select></div>
          </div>
        </Panel>

        <Panel title="٢. المعاينة الحية" className="preview">
          <div className="bubble-row"><QuestionMark lit={Math.min(5, Math.floor(built.reasons.length / 2))} size={42} label={`عناصر الطلب: ${built.reasons.length}`} /><pre className="live-preview" aria-live="polite">{built.text}</pre></div>
          {built.missing.length > 0 && <p className="hint">ينقص: {built.missing.join('، ')}.</p>}
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
