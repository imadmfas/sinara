import { Link, useNavigate } from 'react-router-dom';
import { ages } from '../content/ages';
import { brand } from '../content/brand';
import { useApp, useLesson, homeCoach } from '../lib/app';
import { QuestionMark, Robot } from '../components/Art';
import { to } from '../routes';
import type { AgeBandId } from '../content/types';

export default function Home() {
  const { band, setBand, state, play } = useApp();
  const nav = useNavigate();
  useLesson(homeCoach, '/');
  const pick = (id: AgeBandId) => { play('click'); setBand(id); nav(to.path(id)); };
  const resume = band ? state.progress[band] : undefined;
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">{brand.firstPath}</p>
          <h1>{brand.slogan}</h1>
          <p>تعلّم كيف تحدد هدفك، وتسأل سؤالاً مفيداً، وتفحص الجواب، وتعرف ما ينقصه، ثم تسأل سؤال متابعة أفضل. بأمثلة من البيت والمدرسة والعمل في العراق.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <QuestionMark lit={3} size={110} />
          <Robot state="idle" size={70} />
        </div>
      </section>

      <section className="panel ways" aria-labelledby="ways-h">
        <h2 id="ways-h" className="sr-only">طريقان للبدء</h2>
        <div className="cards two">
          <a className="card way" href="#ages-h" onClick={(e) => { e.preventDefault(); if (band) nav(to.path(band)); else document.getElementById('ages-h')?.scrollIntoView(); document.querySelector<HTMLElement>('.agecard')?.focus({ preventScroll: true }); }}>
            <span className="symbol" aria-hidden="true">🌱</span>
            <b>تعلّم كيف تسأل</b>
            <small>اختر فئتك العمرية وابدأ أول نشاط الآن، دون تسجيل.</small>
          </a>
          <Link className="card way" to={to.library()}>
            <span className="symbol" aria-hidden="true">📚</span>
            <b>أحتاج نموذجاً الآن</b>
            <small>ابحث في مكتبة البرومبتات، وانسخ طلباً جاهزاً أو خصّصه.</small>
          </Link>
          <Link className="card way" to={to.lab()}>
            <span className="symbol" aria-hidden="true">🔁</span>
            <b>غيّر كلمة، شوف الفرق</b>
            <small>ستّ تجارب قصيرة: غيّر تعليمة واحدة وقارن الجوابين.</small>
          </Link>
        </div>
      </section>

      {resume?.lastRoute && resume.lastRoute !== '/' && (
        <section className="panel resume">
          <h2>متابعة من حيث توقفت</h2>
          <p>آخر نشاط في فئة {ages.find((a) => a.id === band)?.name}: <b>{resume.lastTitle}</b></p>
          <div className="row">
            <Link className="btn action" to={resume.lastRoute}>متابعة</Link>
            <Link className="btn" to={to.path(band!)}>تبديل النشاط</Link>
          </div>
        </section>
      )}

      <section className="panel" aria-labelledby="ages-h">
        <h2 id="ages-h">اختر فئتك العمرية</h2>
        <p className="sub">يتغيّر النشاط والمثال وطريقة التدريب مع اختيارك. نحفظ الفئة العمرية فقط على هذا الجهاز.</p>
        <div className="ages">
          {ages.map((a) => (
            <button key={a.id} type="button" className="agecard" aria-pressed={band === a.id} onClick={() => pick(a.id)}>
              <span className="symbol" aria-hidden="true">{a.icon}</span>
              <span><b>{a.name}</b><small>{a.tagline}</small></span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel showcase" aria-labelledby="show-h">
        <h2 id="show-h">جرّب رحلة كاملة</h2>
        <div className="cards">
          <Link className="card" to={to.kids('story')} onClick={() => setBand('a4')}>
            <span className="symbol" aria-hidden="true">🐦</span>
            <b>قصة الطفل والمرافق</b>
            <small>٤–٦ سنوات · يختار الطفل بالصور، ويرى القصة تتغيّر</small>
          </Link>
          <Link className="card" to={to.house()}>
            <span className="symbol" aria-hidden="true">🏗️</span>
            <b>ارسم لي خريطة بيت</b>
            <small>للكبار · من طلب غامض إلى تصوّر يُعرض على معماري</small>
          </Link>
          <Link className="card" to={to.studio()}>
            <span className="symbol" aria-hidden="true">🧰</span>
            <b>مولّد الطلبات</b>
            <small>لأصحاب الخبرة: اذهب مباشرة إلى بناء طلبك</small>
          </Link>
        </div>
      </section>

      <section className="panel name-story">
        <h2>لماذا «{brand.platform}»؟</h2>
        <p>{brand.nameStory}</p>
        <p className="sub">{brand.platform} اسم المنصة، و{brand.guide} اسم المرشد الآلي، و«{brand.firstPath}» اسم المسار التعليمي الأول.</p>
      </section>
    </>
  );
}
