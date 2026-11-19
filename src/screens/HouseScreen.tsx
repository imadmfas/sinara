import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as H from '../content/house';
import { arabicDigits } from '../content/preschool';
import { useApp, useLesson } from '../lib/app';
import { QuestionMark, Robot } from '../components/Art';
import { CopyButton, Panel, SampleTag } from '../components/ui';
import { to } from '../routes';

const n = (x: number) => arabicDigits(x);

export default function HouseScreen() {
  const [round, setRound] = useState(0);
  return <HouseJourney key={round} restart={() => setRound((r) => r + 1)} />;
}

function HouseJourney({ restart }: { restart: () => void }) {
  const { practise, play, patchCoach } = useApp();
  const [details, setDetails] = useState<string[]>([]);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [withOutput, setWithOutput] = useState(false);
  const [step, setStep] = useState(1); // 1 brief, 2 table, 3 revise, 4 revised, 5 finish
  const [sumGuess, setSumGuess] = useState<number | null>(null);
  const [revisePick, setRevisePick] = useState<string | null>(null);
  const [sum2Checked, setSum2Checked] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);

  const material = useMemo(() => ({
    simpler: 'قل للمساعد مساحة الأرض، ومن أين الشارع، وكم غرفة، ثم اطلب جدولاً تتأكد من مجموعه.',
    example: H.finalPrompt,
    why: step >= 3 ? 'الدرج يحتاج مكاناً يُحجز من البداية، وتغيير مساحة يجب أن يقابله نقص في مساحة أخرى حتى يبقى المجموع ٢٠٠.' : 'الأبعاد والاتجاه وعدد الغرف تغيّر التوزيع، والجدول يتيح التحقق من المجموع.',
    next: ['إذا أضفنا طابقاً ثانياً، أين نحجز الدرج؟', 'أيّ الغرف تحتاج حماية من شمس الغرب؟', 'ما القرارات التي يجب أن يحسمها المعماري؟'],
    hint: step === 1 ? `أضف التفاصيل واحدة واحدة. بقي ${n(H.houseDetails.length - details.length)}.` : step === 2 ? 'اجمع عمود المساحة وقارنه بـ ١٠ × ٢٠.' : step === 3 ? 'أيّ سؤال يغيّر التوزيع الآن، وأيّها يمكن تأجيله؟' : 'راجع الصفوف الملوّنة: ما الذي زاد وما الذي نقص؟'
  }), [step, details.length]);
  useLesson({ key: 'house', title: 'ارسم لي خريطة بيت', kind: 'house', material }, '/house');
  useEffect(() => { patchCoach({ material }); }, [material, patchCoach]);
  useEffect(() => { if (step > 1) stepRef.current?.focus(); }, [step]);

  const toggle = (id: string) => {
    play('note');
    setDetails((d) => {
      const on = d.includes(id);
      setLastAdded(on ? null : id);
      return on ? d.filter((x) => x !== id) : [...d, id];
    });
    patchCoach({ lastChoice: H.houseDetails.find((d) => d.id === id)!.label, lastCorrect: true });
  };
  const request = H.houseRequest(details, withOutput);
  const allDetails = details.length === H.houseDetails.length;
  const lit = Math.min(5, details.length);

  const checkSum = (g: number) => {
    setSumGuess(g);
    if (g === H.plotArea) { practise('verify', 'house'); play('chime'); } else play('soft');
  };
  const pickRevise = (id: string) => {
    setRevisePick(id);
    const o = H.reviseOptions.find((x) => x.id === id)!;
    patchCoach({ lastChoice: o.text, lastCorrect: o.best });
    if (o.best) { practise('followup', 'house'); play('chime'); } else play('soft');
  };

  return (
    <>
      <section className="panel">
        <p className="eyebrow">🏗️ العمارة · رحلة كاملة</p>
        <h1>ارسم لي خريطة بيت</h1>
        <p className="sub">من طلب غامض إلى تصوّر أولي يناقشه صاحب البيت مع معماري. كل الأرقام هنا أمثلة تعليمية، وهذا ليس مخططاً إنشائياً.</p>
        <ol className="steps">{['أضف التفاصيل', 'افحص الجدول', 'معلومة جديدة', 'راجع التعديل', 'الطلب النهائي'].map((t, i) => <li key={t} className={i + 1 === step ? 'on' : i + 1 < step ? 'done' : ''}>{t}</li>)}</ol>
        <button type="button" onClick={restart}>↺ جرّب من جديد</button>
      </section>

      <Panel title="١. أضف ما يغيّر التوزيع">
        <div className="beforeafter">
          <div className="bubble-row big">
            <QuestionMark lit={lit} size={80} label={`أضاء ${lit} من ٥ أجزاء`} />
            <div className="bubble learner">
              <span className="who">{details.length ? 'طلبك الآن' : 'الطلب الأول'}</span>
              <p className="prompt-text" aria-live="polite">
                {renderRequest(request, details, lastAdded)}
              </p>
            </div>
          </div>
          {!details.length && (
            <div className="bubble sample">
              <span className="who">جواب محتمل للطلب الأول <SampleTag /></span>
              <p>بيت فيه صالة كبيرة وغرفتان ومطبخ وحمّام، والمدخل من الأمام.</p>
              <p className="sub">لم يعرف الجواب مساحة أرضك، ولا جهة الشارع، ولا عدد الغرف التي تحتاجها.</p>
            </div>
          )}
        </div>
        <div className="chips" role="group" aria-label="تفاصيل البيت">
          {H.houseDetails.map((d) => (
            <button key={d.id} type="button" className="chip detail" aria-pressed={details.includes(d.id)} onClick={() => toggle(d.id)}>
              <span aria-hidden="true">{d.icon}</span> {d.label}
            </button>
          ))}
        </div>
        <label className="inline">
          <input type="checkbox" checked={withOutput} onChange={(e) => { setWithOutput(e.target.checked); if (e.target.checked) practise('format', 'house'); }} />
          اطلب جدول مساحات تقريبياً، وأخبر المساعد أنك ستعرضه على معماري
        </label>
        {allDetails && !withOutput && <p className="hint">💡 حددتَ البيت. اطلب الآن شكل الناتج: جدول يمكن التحقق منه.</p>}
        <button type="button" className="action" disabled={!allDetails || !withOutput} onClick={() => { practise('task', 'house'); practise('constraint', 'house'); setStep(Math.max(step, 2)); }}>اعرض الجواب التعليمي</button>
      </Panel>

      {step >= 2 && (
        <div ref={stepRef} tabIndex={-1}>
          <Panel title={<>٢. جدول المساحات الأولي <SampleTag /></>} sub="تصوّر للنقاش بطابق واحد. المساحات تقريبية وتشمل الفناء والممرات والجدران.">
            <div className="house-layout">
              <PlotSketch />
              <AreaTable rows={H.areasV1} />
            </div>
            <div className="check">
              <p><b>تحقق قبل أن تعتمد الجدول:</b> كم مجموع عمود المساحة؟ وهل يساوي مساحة الأرض (<bdi>١٠ × ٢٠</bdi>)؟</p>
              <div className="choices row" role="group" aria-label="مجموع المساحات">
                {[190, 200, 210].map((g) => (
                  <button key={g} type="button" className={`choice ${sumGuess === g ? (g === H.plotArea ? 'right' : 'wrong') : ''}`} aria-pressed={sumGuess === g} onClick={() => checkSum(g)}><bdi>{n(g)}</bdi> م²</button>
                ))}
              </div>
              {sumGuess !== null && (
                <p className={`feedback ${sumGuess === H.plotArea ? 'ok' : 'retry'}`} role="status">
                  {sumGuess === H.plotArea
                    ? <>صحيح. المجموع <bdi>{n(H.sumAreas(H.areasV1))}</bdi> م²، ويساوي <bdi>١٠ × ٢٠ = ٢٠٠</bdi>. لو اختلف المجموع لطلبت من المساعد تصحيح الجدول قبل أي نقاش.</>
                    : 'اجمع مرة ثانية. ابدأ بغرف النوم، ثم أضف الصالة والاستقبال والمطبخ، ثم الحمّامات والممرات والجدران، ثم الفناء والمساحة الأمامية.'}
                </p>
              )}
              {sumGuess === H.plotArea && step === 2 && <button type="button" className="action" onClick={() => setStep(3)}>تابع</button>}
            </div>
          </Panel>
        </div>
      )}

      {step >= 3 && (
        <Panel title="٣. معلومة جديدة">
          <div className="newfact"><Robot state="hint" size={44} look={-1} /><p><b>{H.newFact}</b> أيّ سؤال يساعدك على مراجعة التصوّر الآن؟</p></div>
          <div className="choices" role="group" aria-label="سؤال المراجعة">
            {H.reviseOptions.map((o) => (
              <button key={o.id} type="button" className={`choice ${revisePick === o.id ? (o.best ? 'right' : 'wrong') : ''}`} aria-pressed={revisePick === o.id}
                disabled={revisePick === 'stairs' && !o.best} onClick={() => pickRevise(o.id)}>{o.text}</button>
            ))}
          </div>
          {revisePick && <p className={`feedback ${revisePick === 'stairs' ? 'ok' : 'retry'}`} role="status">{H.reviseOptions.find((o) => o.id === revisePick)!.feedback}{revisePick !== 'stairs' && ' جرّب سؤالاً آخر.'}</p>}
          {revisePick === 'stairs' && step === 3 && <button type="button" className="action" onClick={() => setStep(4)}>اعرض التصوّر المعدّل</button>}
        </Panel>
      )}

      {step >= 4 && (
        <Panel title={<>٤. التصوّر بعد حجز الدرج <SampleTag /></>} sub="الصفوف الملوّنة تغيّرت: أُضيف بيت الدرج، وصغرت غرفة الاستقبال والمساحة الأمامية حتى يبقى المجموع مساوياً لمساحة الأرض.">
          <AreaTable rows={H.areasV2} changed={H.changedInV2} before={H.areasV1} />
          <div className="row">
            <button type="button" onClick={() => { setSum2Checked(true); practise('verify', 'house'); play('note'); }}>تحقق من المجموع مرة ثانية</button>
            {sum2Checked && <p className="feedback ok" role="status">المجموع <bdi>{n(H.sumAreas(H.areasV2))}</bdi> م². زاد الدرج ١٠، ونقص الاستقبال ٤ والمساحة الأمامية ٦.</p>}
          </div>
          <h3>قرارات يحسمها معماري ومهندس إنشائي محليان</h3>
          <ul className="decisions">{H.architectDecisions.map((d) => <li key={d}>{d}</li>)}</ul>
          {sum2Checked && step === 4 && <button type="button" className="action" onClick={() => setStep(5)}>اعرض الطلب النهائي</button>}
        </Panel>
      )}

      {step >= 5 && (
        <Panel title="٥. طلبك النهائي">
          <p className="prompt-box">{H.finalPrompt}</p>
          <div className="row">
            <CopyButton text={H.finalPrompt} onCopied={() => { practise('task', 'house'); play('chime'); }} />
            <Link className="btn" to={to.studio('engineering', 'architecture')}>عدّله في مولّد الطلبات</Link>
          </div>
          <p className="feedback ok"><Robot state="feedback" size={30} /> أكملت الرحلة: حدّدت البيت، وتحققت من المجموع مرتين، وسألت السؤال الذي يغيّر التصوّر، وعرفت ما يقرره أهل الاختصاص.</p>
        </Panel>
      )}
    </>
  );
}

function renderRequest(text: string, _details: string[], last: string | null) {
  const d = last ? H.houseDetails.find((x) => x.id === last) : null;
  if (!d || !text.includes(d.phrase)) return text;
  const i = text.indexOf(d.phrase);
  return <>{text.slice(0, i)}<mark className="hl hl-data new">{d.phrase}</mark>{text.slice(i + d.phrase.length)}</>;
}

function AreaTable({ rows, changed = [], before }: { rows: H.AreaRow[]; changed?: string[]; before?: H.AreaRow[] }) {
  const total = H.sumAreas(rows);
  return (
    <table className="areas">
      <caption className="sr-only">جدول المساحات التقريبية بالمتر المربع</caption>
      <thead><tr><th scope="col">الفضاء</th><th scope="col">المساحة التقريبية (م²)</th>{before && <th scope="col">قبل</th>}</tr></thead>
      <tbody>
        {rows.map((r) => {
          const b = before?.find((x) => x.id === r.id);
          return (
            <tr key={r.id} className={changed.includes(r.id) ? 'changed' : ''}>
              <th scope="row">{r.name}{r.note && <small>{r.note}</small>}{changed.includes(r.id) && <span className="sr-only"> (تغيّر)</span>}</th>
              <td><bdi>{n(r.area)}</bdi></td>
              {before && <td><bdi>{b ? n(b.area) : '—'}</bdi></td>}
            </tr>
          );
        })}
      </tbody>
      <tfoot><tr><th scope="row">المجموع</th><td><bdi>{n(total)}</bdi></td>{before && <td><bdi>{n(H.sumAreas(before))}</bdi></td>}</tr></tfoot>
    </table>
  );
}

function PlotSketch() {
  return (
    <svg className="plot" viewBox="0 0 140 250" role="img" aria-label="رسم توضيحي للأرض: ١٠ أمتار عرضاً و٢٠ متراً عمقاً، والشارع من جهة الشمال">
      <rect x="0" y="0" width="140" height="22" fill="#d7dfd8" />
      <text x="70" y="15" textAnchor="middle" fontSize="11" fill="#163e38">الشارع (شمال)</text>
      <rect x="10" y="28" width="120" height="216" fill="#fffdf6" stroke="#163e38" strokeWidth="2" />
      <rect x="10" y="28" width="120" height="50" fill="#eef5ee" />
      <text x="70" y="57" textAnchor="middle" fontSize="10" fill="#4c645d">مساحة أمامية ومدخل</text>
      <rect x="10" y="78" width="120" height="166" fill="#e5f1ae" opacity=".5" />
      <rect x="45" y="130" width="50" height="42" fill="#a2dcd2" />
      <text x="70" y="155" textAnchor="middle" fontSize="10" fill="#163e38">فناء</text>
      <text x="70" y="215" textAnchor="middle" fontSize="10" fill="#163e38">البناء</text>
      <text x="70" y="248" textAnchor="middle" fontSize="9" fill="#4c645d" direction="ltr">10 m × 20 m</text>
      <path d="M126 40 L126 30 M122 34 L126 30 L130 34" stroke="#00675a" strokeWidth="2" fill="none" />
    </svg>
  );
}
