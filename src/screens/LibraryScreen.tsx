import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useApp, useLesson } from '../lib/app';
import { ar, downloadAll, kb, loadChunk, loadManifest, offlineState, removeDownload, search, type CatalogCase, type CatalogVariant, type Manifest } from '../lib/catalog';
import { fields } from '../content/index';
import { modeGuides } from '../content/catalogGuide';
import { to } from '../routes';

const PAGE = 12;
const childBand = (b: string | null) => b === 'a4' || b === 'a7' || b === 'a10';

export default function LibraryScreen() {
  const { band } = useApp();
  const [params, setParams] = useSearchParams();
  const loc = useLocation();
  const [m, setM] = useState<Manifest | null>(null);
  const [err, setErr] = useState('');
  const [adultOk, setAdultOk] = useState(() => { try { return sessionStorage.getItem('sinara.libraryAdult') === '1'; } catch { return false; } });
  const q = params.get('q') ?? '';
  const [draft, setDraft] = useState(q);
  const f = { q, field: params.get('f') ?? '', mode: params.get('m') ?? '', age: params.get('a') ?? '', level: params.get('l') ?? '', output: params.get('o') ?? '' };
  const pages = Math.max(1, Number(params.get('p') ?? '1') || 1);
  useLesson({ key: 'library', title: 'مكتبة البرومبتات', kind: 'library', material: {
    simpler: 'ابحث بكلمة من عملك، ثم انسخ الطلب أو خصّصه بمعطياتك.',
    example: 'اكتب «مخطط منزل» أو «فلوس» أو «موبايل» وشوف النتائج.',
    why: 'كل طلب في المكتبة يذكر الدور والمهمة والمعطيات وشكل الناتج ومعيار القبول.',
    next: ['خصّص هذا الطلب بمعطياتي.', 'ما سؤال المتابعة المناسب بعد الجواب؟', 'كيف أتحقق من الناتج؟']
  } }, '/library');

  useEffect(() => { loadManifest().then(setM).catch(() => setErr('تعذّر تحميل المكتبة. إذا كنت دون اتصال فنزّل المكتبة كاملة حين يعود الاتصال.')); }, []);
  useEffect(() => setDraft(q), [q]);
  // Debounced search into the URL (keeps Back, refresh and share links stable).
  useEffect(() => {
    if (draft === q) return;
    const t = setTimeout(() => update({ q: draft, p: '' }), 300);
    return () => clearTimeout(t);
  }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => (m ? search(m, f, band) : []), [m, f.q, f.field, f.mode, f.age, f.level, f.output, band]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = results.slice(0, pages * PAGE);

  // Restore scroll position when returning with Back.
  const key = `sinara.libScroll:${loc.search}`;
  const restored = useRef(false);
  useLayoutEffect(() => {
    if (!m || restored.current) return;
    restored.current = true;
    const y = Number(sessionStorage.getItem(key) || '0');
    if (y) requestAnimationFrame(() => window.scrollTo({ top: y }));
  }, [m, key]);
  useEffect(() => {
    const save = () => sessionStorage.setItem(key, String(window.scrollY));
    window.addEventListener('scroll', save, { passive: true });
    return () => { save(); window.removeEventListener('scroll', save); };
  }, [key]);

  function update(p: Record<string, string>) {
    const n = new URLSearchParams(params);
    Object.entries(p).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    setParams(n, { replace: true });
  }

  if (childBand(band) && !adultOk) {
    return (
      <section className="panel">
        <h1>مكتبة البرومبتات</h1>
        <p>هذه المكتبة للمعلّمين والأهل والكبار. للأطفال أنشطة مصمّمة لهم في «مساري».</p>
        <div className="row">
          <Link className="btn action" to={to.path(band!)}>إلى أنشطة الأطفال</Link>
          <button type="button" onClick={() => { sessionStorage.setItem('sinara.libraryAdult', '1'); setAdultOk(true); }}>أنا شخص كبير، أكمل إلى المكتبة</button>
        </div>
      </section>
    );
  }

  const c = m?.counts;
  return (
    <>
      <section className="panel">
        <p className="eyebrow">أحتاج نموذجاً الآن</p>
        <h1>مكتبة البرومبتات</h1>
        {c && (
          <p className="counts" data-testid="catalog-counts">
            {c.usableVariants === c.variants
              ? <>{ar(c.cases)} موقفاً تطبيقياً، و{ar(c.variants)} صيغة</>
              : <>{ar(c.casesWithUsable)} موقفاً تطبيقياً، و{ar(c.usableVariants)} صيغة متاحة، و{ar(c.byStatus.held)} محجوزة للمراجعة</>}
          </p>
        )}
        <p className="sub">صيغ تعليمية مولّدة بمدخلات خيالية، فُحصت آلياً ({c ? ar(c.byStatus.validated) : '…'}) ولم تُراجَع بشرياً بعد ({c ? ar(c.byStatus.reviewed) : '…'} مراجَعة). عدّل المعطيات إلى معطياتك قبل الاستعمال.</p>
        <form role="search" onSubmit={(e) => { e.preventDefault(); update({ q: draft, p: '' }); }}>
          <label htmlFor="lib-q">ابحث عن طلب</label>
          <div className="row">
            <input id="lib-q" type="search" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="مثلاً: مخطط منزل، جدول مشتريات، موبايل، كتاب رسمي" />
            <button type="submit" className="action">ابحث</button>
          </div>
        </form>
        <details className="filters" open={!!(f.field || f.mode || f.age || f.level || f.output)}>
          <summary>المرشحات</summary>
          <div className="formgrid">
            <Sel id="f-field" label="المجال" value={f.field} onChange={(v) => update({ f: v, p: '' })} options={fields.map((x) => [x.id, x.name])} />
            <Sel id="f-mode" label="نمط العمل" value={f.mode} onChange={(v) => update({ m: v, p: '' })} options={(m?.modes ?? []).map((x) => [x, x])} />
            <Sel id="f-age" label="العمر" value={f.age} onChange={(v) => update({ a: v, p: '' })} options={[['a13', '١٣–١٧'], ['a18', '١٨–٢٢'], ['a23', '٢٣ فأكثر']]} />
            <Sel id="f-level" label="المستوى" value={f.level} onChange={(v) => update({ l: v, p: '' })} options={[['مبتدئ', 'مبتدئ'], ['متوسط', 'متوسط'], ['متقدم', 'متقدم']]} />
            <Sel id="f-out" label="شكل الناتج" value={f.output} onChange={(v) => update({ o: v, p: '' })} options={(m?.outputs ?? []).map((x) => [x, x])} />
          </div>
          <button type="button" onClick={() => { setDraft(''); setParams(new URLSearchParams(), { replace: true }); }}>مسح البحث والمرشحات</button>
        </details>
      </section>

      {err && <p className="feedback retry" role="alert">{err}</p>}
      {!m && !err && <p className="sub" role="status">جارٍ تحميل المكتبة…</p>}
      {m && (
        <section aria-labelledby="res-h">
          <h2 id="res-h" className="results-h" role="status">
            {results.length ? <>وجدنا {ar(results.length)} موقفاً ({ar(results.reduce((s, r) => s + r.variants.length, 0))} صيغة)</> : 'لا نتائج. جرّب كلمة أخرى أو امسح المرشحات.'}
          </h2>
          <ul className="lib-results">
            {shown.map((r, i) => <ResultCard key={r.c.id} c={r.c} variants={r.variants} autoFocus={i === (pages - 1) * PAGE && pages > 1} />)}
          </ul>
          {shown.length < results.length && (
            <button type="button" className="more" onClick={() => update({ p: String(pages + 1) })}>
              اعرض المزيد ({ar(Math.min(PAGE, results.length - shown.length))} من {ar(results.length - shown.length)} متبقية)
            </button>
          )}
          <OfflinePanel m={m} />
        </section>
      )}
    </>
  );
}

function Sel({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: string[][] }) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">الكل</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function ResultCard({ c, variants, autoFocus }: { c: CatalogCase; variants: CatalogVariant[]; autoFocus: boolean }) {
  const [sel, setSel] = useState(variants[0].id);
  const v = variants.find((x) => x.id === sel) ?? variants[0];
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);
  return (
    <li className="lib-card">
      <h3 ref={ref} tabIndex={-1}>{c.title}</h3>
      <p className="sub">{c.domain} · {c.role}</p>
      <p><b>المهمة:</b> {c.goal}</p>
      <label htmlFor={`m-${c.id}`} className="sr-only">نمط العمل لـ {c.title}</label>
      <select id={`m-${c.id}`} value={sel} onChange={(e) => setSel(e.target.value)} className="mode-select">
        {variants.map((x) => <option key={x.id} value={x.id}>{x.mode} · {x.difficulty}</option>)}
      </select>
      <p className="sub">{modeGuides[v.mode].when}</p>
      <div className="row">
        <LibCopy id={v.id} chunk={c.chunk} />
        <Link className="btn" to={`/studio?template=${v.id}`}>خصّصه</Link>
        <Link className="btn" to={`/library/${v.id}`}>تعلّم كيف كُتب</Link>
      </div>
    </li>
  );
}

export function LibCopy({ id, chunk, label = 'انسخ' }: { id: string; chunk: string; label?: string }) {
  const { practise } = useApp();
  const [msg, setMsg] = useState('');
  const [fallback, setFallback] = useState('');
  const copy = async () => {
    let text = '';
    try { text = (await loadChunk(chunk))[id] ?? ''; } catch { setMsg('تعذّر تحميل الطلب الآن. افتحه وجرّب مرة ثانية.'); return; }
    try {
      if (!navigator.clipboard) throw new Error('no clipboard');
      await navigator.clipboard.writeText(text);
      setMsg('تم نسخ الطلب.');
      setFallback('');
    } catch {
      setFallback(text);
      setMsg('تعذّر النسخ التلقائي. حدّدتُ النص لك؛ استعمل أمر النسخ في جهازك.');
    }
    practise('task', `library-${id}`);
  };
  const ta = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (fallback) { ta.current?.focus(); ta.current?.select(); } }, [fallback]);
  return (
    <span className="copy">
      <button type="button" className="action" onClick={copy}>{label}</button>
      {fallback && <textarea ref={ta} readOnly value={fallback} rows={4} className="copy-fallback" aria-label="نص الطلب للنسخ اليدوي" />}
      <span role="status" className="sub">{msg}</span>
    </span>
  );
}

function OfflinePanel({ m }: { m: Manifest }) {
  const [st, setSt] = useState(offlineState());
  const [prog, setProg] = useState<[number, number] | null>(null);
  const [err, setErr] = useState('');
  const ctl = useRef<AbortController | null>(null);
  const size = Object.values(m.chunks).reduce((s, c) => s + c.bytes, 0);
  const current = st?.complete && st.hash === m.sourceHash;
  const start = async () => {
    setErr('');
    const c = new AbortController();
    ctl.current = c;
    setProg([0, Object.keys(m.chunks).length + 1]);
    try { await downloadAll(m, (d, t) => setProg([d, t]), c.signal); setSt(offlineState()); }
    catch (e) { setErr((e as Error).name === 'AbortError' ? 'أوقفتَ التنزيل. النسخة السابقة (إن وُجدت) باقية كما هي.' : 'انقطع التنزيل. النسخة السابقة (إن وُجدت) باقية كما هي؛ أعد المحاولة حين يستقر الاتصال.'); }
    finally { setProg(null); }
  };
  return (
    <section className="panel offline">
      <h2>المكتبة دون اتصال</h2>
      <p className="sub">يعمل البحث والنماذج المختارة دون اتصال بعد أول زيارة. لاستعمال كل الطلبات دون اتصال نزّلها مرة واحدة: الحجم نحو {kb(size)}.</p>
      <p role="status"><b>الحالة:</b> {current ? `منزّلة كاملة (${kb(st!.bytes)})` : st?.complete ? 'منزّلة بنسخة أقدم؛ حدّثها' : 'غير منزّلة'}</p>
      {prog ? (
        <div className="row">
          <progress max={prog[1]} value={prog[0]} aria-label="تقدّم التنزيل" />
          <span>{ar(prog[0])} / {ar(prog[1])}</span>
          <button type="button" onClick={() => ctl.current?.abort()}>إيقاف</button>
        </div>
      ) : (
        <div className="row">
          <button type="button" onClick={start}>{current ? 'أعد التنزيل' : 'نزّل المكتبة كاملة'}</button>
          {st?.complete && <button type="button" onClick={async () => { await removeDownload(); setSt(null); }}>احذف النسخة المنزّلة</button>}
        </div>
      )}
      {err && <p className="feedback retry" role="alert">{err}</p>}
    </section>
  );
}
