import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ageById, ages } from '../content/ages';
import { fields } from '../content/index';
import { families } from '../content/preschool';
import { schoolInterests } from '../content/school';
import { useApp, useLesson } from '../lib/app';
import { defaultMaterial } from '../lib/coach';
import { Pic } from '../components/Art';
import { to } from '../routes';

const norm = (s: string) => s.replace(/[ًٌٍَُِّْـ]/g, '').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase();

export default function PathScreen() {
  const { band: bandParam } = useParams();
  const age = ageById(bandParam);
  const { setBand, band, settings, updateSettings, play } = useApp();
  useEffect(() => { if (age && band !== age.id) setBand(age.id); }, [age, band, setBand]);
  useLesson({ key: `path-${bandParam}`, title: age?.title ?? 'مساري', kind: 'other', material: defaultMaterial }, `/path/${bandParam}`);
  const [interest, setInterest] = useState<string | null>(null);
  const [field, setField] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const hits = useMemo(() => {
    const n = norm(q.trim());
    if (!n) return [];
    return fields.flatMap((f) => f.branches.filter((b) => norm(b.name + ' ' + f.name + ' ' + b.good).includes(n)).map((b) => ({ f, b }))).slice(0, 20);
  }, [q]);
  if (!age) return <Navigate to={to.home()} replace />;

  const other = ages.filter((a) => a.id !== age.id);
  return (
    <>
      <section className="panel">
        <p className="eyebrow">{age.icon} {age.name}</p>
        <h1>{age.title}</h1>
        <p className="sub">{age.lead}</p>
        <details className="switch-age"><summary>تبديل الفئة العمرية</summary>
          <div className="row">{other.map((a) => <Link key={a.id} className="btn" to={to.path(a.id)}>{a.icon} {a.name}</Link>)}</div>
        </details>
      </section>

      {age.id === 'a4' && (
        <section className="panel">
          <h2>اختر لعبة</h2>
          <div className="kidchoices">
            {families.map((f) => (
              <Link key={f.id} className="picbtn big" to={to.kids(f.id)} onClick={() => play('click')}>
                <Pic name={f.icon} size={78} /><b>{f.name}</b>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(age.id === 'a7' || age.id === 'a10') && (
        <section className="panel">
          <h2>اختر اهتماماً</h2>
          <div className="topics">
            {schoolInterests.slice(0, age.id === 'a7' ? 5 : undefined).map((i) => (
              <button key={i.id} type="button" aria-pressed={interest === i.id} onClick={() => { play('click'); setInterest(i.id); }}>
                <span className="symbol" aria-hidden="true">{i.icon}</span><b>{i.name}</b>
              </button>
            ))}
          </div>
          {interest && (
            <div className="sublist">
              <h3>اختر موضوعاً</h3>
              <div className="row">
                {schoolInterests.find((i) => i.id === interest)!.topics.map((t) => <Link key={t.id} className="btn" to={to.school(age.id, t.id)}>{t.name}</Link>)}
              </div>
            </div>
          )}
          <p className="sub">ولأطفال الصفوف الأولى: <Link to={to.followup('fu-school-dates')}>لعبة عدّ التمر</Link> · <Link to={to.followup('fu-school-fractions')}>مثال الكسور</Link></p>
        </section>
      )}

      {age.id === 'a13' && (
        <section className="panel">
          <h2>مشروع مدرسي كامل</h2>
          <p>ابنِ عرضاً عن الأهوار: اختر سؤالاً صغيراً، واطلب مخططاً، وحدّد الادعاء الذي يحتاج مصدراً، ثم اكتب خاتمتك بنفسك.</p>
          <Link className="btn action" to={to.marshes()}>ابدأ مشروع الأهوار</Link>
        </section>
      )}

      {(age.id === 'a13' || age.id === 'a18' || age.id === 'a23') && (
        <>
          {age.id === 'a23' && (
            <section className="panel">
              <h2>كيف تحب أن نبدأ؟</h2>
              <div className="row">
                <button type="button" aria-pressed={settings.expertise === 'beginner'} onClick={() => updateSettings({ expertise: 'beginner' })}>أنا جديد: اشرح لي خطوة خطوة</button>
                <button type="button" aria-pressed={settings.expertise === 'experienced'} onClick={() => updateSettings({ expertise: 'experienced' })}>عندي خبرة</button>
                <Link className="btn action" to={to.studio()}>اذهب مباشرة إلى مولّد الطلبات</Link>
              </div>
              <label className="inline"><input type="checkbox" checked={settings.simple} onChange={(e) => updateSettings({ simple: e.target.checked })} /> واجهة مبسّطة بخط أكبر</label>
            </section>
          )}
          <section className="panel">
            <h2>ابحث عن تخصصك</h2>
            <label htmlFor="branch-search" className="sr-only">ابحث في التخصصات</label>
            <input id="branch-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="مثلاً: الصيدلة، الري، الترجمة" />
            {q.trim() && (
              <ul className="results" aria-live="polite">
                {hits.length ? hits.map(({ f, b }) => <li key={b.id}><Link to={to.branch(f.id, b.id)}>{b.name}</Link> <small>· {f.name}</small></li>) : <li>لا نتيجة. جرّب كلمة أخرى.</li>}
              </ul>
            )}
          </section>
          <section className="panel">
            <h2>أو اختر مجالاً</h2>
            <div className="topics">
              {fields.map((f) => (
                <button key={f.id} type="button" aria-pressed={field === f.id} onClick={() => { play('click'); setField(f.id); }}>
                  <span className="symbol" aria-hidden="true">{f.icon}</span><b>{f.name}</b>
                </button>
              ))}
            </div>
            {field && (
              <div className="sublist">
                <h3>اختر التخصص الفرعي</h3>
                <div className="row">
                  {fields.find((f) => f.id === field)!.branches.map((b) => <Link key={b.id} className="btn" to={to.branch(field, b.id)}>{b.name}</Link>)}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
