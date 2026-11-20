import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp, useLesson } from '../lib/app';
import { anatomy, ar, findVariant, type CatalogCase, type CatalogVariant } from '../lib/catalog';
import { anatomyLabels, modeGuides, showcaseAnswers, CATALOG_ORIGIN } from '../content/catalogGuide';
import { ages } from '../content/ages';
import { CopyButton, SampleTag } from '../components/ui';

const statusLabel = { validated: 'مفحوصة آلياً، لم تُراجَع بشرياً', reviewed: 'مراجَعة تحريرياً', held: 'محجوزة للمراجعة' };
const kindClass = { role: 'hl-audience', inputs: 'hl-data', format: 'hl-format', check: 'hl-verify', guard: 'hl-wait', instruction: 'hl-task' } as const;
const kindLabel = { role: anatomyLabels.role + ' + ' + anatomyLabels.goal, inputs: anatomyLabels.inputs, format: anatomyLabels.format, check: anatomyLabels.check, guard: anatomyLabels.guard, instruction: anatomyLabels.instruction };

export default function TemplateScreen() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { practise, patchCoach } = useApp();
  const [data, setData] = useState<{ c: CatalogCase; v: CatalogVariant; prompt: string } | null | undefined>(undefined);
  useEffect(() => { findVariant(id).then(setData).catch(() => setData(null)); }, [id]);
  useLesson({ key: `tpl-${id}`, title: `طلب ${id}`, kind: 'library', material: { simpler: 'كل سطر في الطلب له وظيفة: لمن، وماذا، وبأي معطيات، وبأي شكل، وكيف نتحقق.', example: id, why: 'معيار القبول يجعلك تحكم على الجواب بدل أن تثق به.', next: [] } }, `/library/${id}`);
  useEffect(() => {
    if (data) patchCoach({ title: data.c.title, material: { simpler: 'كل سطر في الطلب له وظيفة: لمن، وماذا، وبأي معطيات، وبأي شكل، وكيف نتحقق.', example: data.prompt.split('\n')[0], why: `معيار القبول هنا: ${data.c.check}.`, next: [modeGuides[data.v.mode].followup], hint: modeGuides[data.v.mode].when } });
  }, [data, patchCoach]);

  if (data === undefined) return <p className="sub" role="status">جارٍ التحميل…</p>;
  if (data === null) return (
    <section className="panel"><h1>لم نجد هذا الطلب</h1><p>ربما تغيّر رقمه، أو أنك دون اتصال ولم تُنزَّل المكتبة.</p><Link className="btn action" to="/library">إلى المكتبة</Link></section>
  );
  const { c, v, prompt } = data;
  const g = modeGuides[v.mode];
  const shape = (prompt.match(/شكل الجواب: ([^\n]+)/) || [])[1] ?? '';
  const showcase = showcaseAnswers[v.id];
  const share = `${location.origin}${location.pathname}#/library/${v.id}`;
  const held = v.status === 'held';
  return (
    <>
      <section className="panel">
        <p className="eyebrow">{c.domain} · {v.mode}</p>
        <h1>{c.title}</h1>
        <p className="chips static">
          <span className="chip">{v.id}</span><span className="chip">{v.difficulty}</span><span className="chip">{v.output}</span>
          <span className="chip">{c.ages.map((a) => ages.find((x) => x.id === a)?.name).join('، ')}</span>
          <span className={`chip ${held ? 'warn' : ''}`}>{statusLabel[v.status]}</span>
        </p>
        <div className="row">
          <button type="button" onClick={() => (history.length > 1 ? nav(-1) : nav('/library'))}>→ العودة إلى النتائج</button>
        </div>
      </section>

      {held && <p className="feedback retry" role="alert">هذه الصيغة محجوزة: نمط العمل لا يناسب هذا الموقف ({c.caregiver ? 'نشاط مرافق مع طفل' : 'يحتاج مراجعة'}). اختر صيغة أخرى من الموقف نفسه.</p>}

      <section className="panel">
        <h2>متى تستعمله؟</h2>
        <p>{g.when}</p>
        <h2>الطلب الجاهز</h2>
        <p className="prompt-box" dir="rtl">{prompt}</p>
        {!held && (
          <div className="row">
            <CopyButton text={prompt} onCopied={() => practise('task', `library-${v.id}`)} />
            <Link className="btn" to={`/studio?template=${v.id}`}>خصّصه</Link>
            <ShareLink url={share} />
          </div>
        )}
      </section>

      <section className="panel" aria-labelledby="how-h">
        <h2 id="how-h">تعلّم كيف كُتب</h2>
        <ol className="anatomy">
          {anatomy(prompt, c).map((p, i) => (
            <li key={i}><span className={`hl ${kindClass[p.kind]}`}>{kindLabel[p.kind]}</span><p>{p.line}</p></li>
          ))}
        </ol>
        <ul className="facts">
          <li><b>المعطيات الخيالية:</b> {c.inputs}. استبدلها بمعطياتك الحقيقية.</li>
          <li><b>شكل الناتج المتوقع:</b> {shape}</li>
          <li><b>معيار القبول:</b> {c.check}. افحص الجواب به قبل أن تستعمله.</li>
          <li><b>سؤال المتابعة:</b> «{g.followup}»</li>
          <li><b>ما يحتاجه المساعد:</b> {g.capability}{c.waitsForText ? '، ونصّ ترفقه أنت؛ لا تقبل نسبة أي عبارة قبل إرفاقه' : ''}.</li>
          <li><b>المصدر:</b> {CATALOG_ORIGIN}.</li>
        </ul>
      </section>

      {showcase && (
        <section className="panel">
          <h2>جواب نموذجي <SampleTag /></h2>
          <ul>{showcase.lines.map((l) => <li key={l}>{l}</li>)}</ul>
          <p className="note">{showcase.note}</p>
        </section>
      )}

      <section className="panel">
        <h2>صيغ أخرى للموقف نفسه</h2>
        <p className="sub">{ar(c.variants.filter((x) => x.status !== 'held').length)} صيغة متاحة لهذا الموقف، تُعدّ موقفاً واحداً.</p>
        <ul className="mode-links">
          {c.variants.filter((x) => x.id !== v.id && x.status !== 'held').map((x) => <li key={x.id}><Link to={`/library/${x.id}`}>{x.mode}</Link></li>)}
        </ul>
      </section>
    </>
  );
}

function ShareLink({ url }: { url: string }) {
  const [m, setM] = useState('');
  return (
    <span className="copy">
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(url); setM('نُسخ رابط ثابت لهذا الطلب، بلا أي معطيات شخصية.'); } catch { setM(url); } }}>انسخ رابط المشاركة</button>
      <span role="status" className="sub">{m}</span>
    </span>
  );
}
