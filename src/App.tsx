import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './lib/app';
import { brand } from './content/brand';
import { CoachButton } from './components/Coach';
import { QuestionMark } from './components/Art';
import Home from './screens/Home';
import PathScreen from './screens/PathScreen';
import KidsScreen from './screens/KidsScreen';
import BranchScreen from './screens/BranchScreen';
import HouseScreen from './screens/HouseScreen';
import { to } from './routes';

const SchoolScreen = lazy(() => import('./screens/SchoolScreen'));
const MarshesScreen = lazy(() => import('./screens/MarshesScreen'));
const FollowupScreen = lazy(() => import('./screens/FollowupScreen'));
const StudioScreen = lazy(() => import('./screens/StudioScreen'));
const GuideScreen = lazy(() => import('./screens/GuideScreen'));
const ProgressScreen = lazy(() => import('./screens/ProgressScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));

function useOnline() {
  const [on, setOn] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true), b = () => setOn(false);
    window.addEventListener('online', a); window.addEventListener('offline', b);
    return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b); };
  }, []);
  return on;
}

function Shell() {
  const loc = useLocation();
  const { band } = useApp();
  const online = useOnline();
  const main = useRef<HTMLElement>(null);
  // Move focus to the new screen heading on navigation (keeps orientation for keyboard and screen readers).
  useEffect(() => {
    const h = main.current?.querySelector<HTMLElement>('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0 });
  }, [loc.pathname]);
  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); main.current?.focus(); }}>تخطَّ إلى المحتوى</a>
      <header className="top">
        <Link to={to.home()} className="brand" aria-label={`${brand.platform}: الصفحة الأولى`}>
          <span className="logo"><QuestionMark lit={5} size={26} label="" /></span>
          <span><b>{brand.platform}</b><small>{brand.firstPath}</small></span>
        </Link>
        <nav aria-label="التنقل الرئيس">
          <NavLink to={band ? to.path(band) : to.home()}>مساري</NavLink>
          <NavLink to={to.studio()}>مولّد الطلبات</NavLink>
          <NavLink to={to.progress()}>تقدّمي</NavLink>
          <NavLink to={to.guide()}>دليل البداية</NavLink>
          <NavLink to={to.settings()} aria-label="الإعدادات">⚙︎</NavLink>
        </nav>
      </header>
      {!online && <p className="offline-banner" role="status">أنت غير متصل. الدروس ومرشد الدرس ومولّد الطلبات تعمل دون اتصال بعد أول تحميل ناجح؛ المحادثة المباشرة تحتاج اتصالاً.</p>}
      <main id="main" ref={main} tabIndex={-1}>
        <div className="screen" key={loc.pathname}>
          <Suspense fallback={<p className="sub">جارٍ التحميل…</p>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/path/:band" element={<PathScreen />} />
              <Route path="/kids/:family" element={<KidsScreen />} />
              <Route path="/school/:band/:topic" element={<SchoolScreen />} />
              <Route path="/field/:field/:branch" element={<BranchScreen />} />
              <Route path="/house" element={<HouseScreen />} />
              <Route path="/project/marshes" element={<MarshesScreen />} />
              <Route path="/followup/:id" element={<FollowupScreen />} />
              <Route path="/studio" element={<StudioScreen />} />
              <Route path="/guide" element={<GuideScreen />} />
              <Route path="/progress" element={<ProgressScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </main>
      <footer>
        <p>{brand.formalTitle}</p>
        <p>شعارها: «{brand.slogan}» · إعداد {brand.owner}</p>
      </footer>
      <CoachButton />
    </>
  );
}

function NotFound() {
  return (
    <section className="panel">
      <h1>لم نجد هذه الصفحة</h1>
      <p>ربما تغيّر الرابط. ابدأ من اختيار الفئة العمرية.</p>
      <Link className="btn action" to={to.home()}>إلى البداية</Link>
    </section>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </AppProvider>
  );
}
