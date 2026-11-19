import { useEffect, useRef, useState } from 'react';
import { useApp } from '../lib/app';
import { intentLabels, kidIntents, opening, reply, type CoachTurn, type Intent } from '../lib/coach';
import { liveConfigured, startAdultSession, streamChat, getToken, LIMITS, LiveError, type LiveMessage } from '../lib/live';
import { isAdult } from '../content/ages';
import { brand } from '../content/brand';
import { Robot, type RobotState } from './Art';
import { SpeakButton } from './ui';

/** The small labelled help button and the guide drawer (dialog). */
export function CoachButton() {
  const { coachOpen, setCoachOpen, band } = useApp();
  const btn = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !coachOpen) btn.current?.focus({ preventScroll: true });
    wasOpen.current = coachOpen;
  }, [coachOpen]);
  return (
    <>
      <button ref={btn} type="button" className={`coach-fab ${band === 'a4' ? 'kid' : ''}`} aria-haspopup="dialog" aria-expanded={coachOpen} aria-label={`مساعدة ${brand.guide}: افتح المساعد`} onClick={() => setCoachOpen(true)}>
        <Robot state="idle" size={band === 'a4' ? 54 : 40} />
        <span>{band === 'a4' ? brand.guide : `مساعدة ${brand.guide}`}</span>
      </button>
      {coachOpen && <CoachDialog onClose={() => setCoachOpen(false)} />}
    </>
  );
}

function CoachDialog({ onClose }: { onClose: () => void }) {
  const { coach, band } = useApp();
  const [mode, setMode] = useState<'guided' | 'live'>(() => { try { return sessionStorage.getItem('sinara.liveDraft') && liveConfigured() && isAdult(band) ? 'live' : 'guided'; } catch { return 'guided'; } });
  const dlg = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const liveAllowed = liveConfigured() && isAdult(band);

  // Escape, close button and system Back all dismiss predictably.
  useEffect(() => {
    history.pushState({ sinaraCoach: true }, '', location.href);
    const onPop = () => { closing.current = true; onClose(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    window.addEventListener('popstate', onPop);
    document.addEventListener('keydown', onKey);
    dlg.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => { window.removeEventListener('popstate', onPop); document.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    if (history.state?.sinaraCoach) history.back(); else onClose();
  };
  // Keep focus inside the dialog.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !dlg.current) return;
    const f = Array.from(dlg.current.querySelectorAll<HTMLElement>('button:not([disabled]),input,textarea,[tabindex="0"]'));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  return (
    <div className="coach-backdrop" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={dlg} className="coach" role="dialog" aria-modal="true" aria-labelledby="coach-title" onKeyDown={onKeyDown}>
        <header>
          <h2 id="coach-title">{brand.guide} <small>· {coach.title}</small></h2>
          <button type="button" className="close" onClick={close} aria-label="إغلاق المساعد" data-autofocus>✕</button>
        </header>
        <div className="tabs" role="tablist" aria-label="وضع المساعد">
          <button role="tab" type="button" aria-selected={mode === 'guided'} onClick={() => setMode('guided')}>مرشد الدرس</button>
          {liveAllowed && <button role="tab" type="button" aria-selected={mode === 'live'} onClick={() => setMode('live')}>محادثة ذكية مباشرة</button>}
        </div>
        {mode === 'guided' ? <Guided /> : <Live onFallback={() => setMode('guided')} />}
      </div>
    </div>
  );
}

function Guided() {
  const { coach, band, play } = useApp();
  const [turns, setTurns] = useState<CoachTurn[]>([]);
  const [robot, setRobot] = useState<RobotState>('waiting');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { setTurns([{ from: 'guide', text: opening(coach, band) }]); }, [coach.key, band]); // switch lesson → switch context
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [turns]);
  const ask = (intent: Intent, label: string) => {
    play('click');
    setRobot('speaking');
    setTurns((t) => {
      const text = reply(intent, coach, band, t);
      return [...t, { from: 'learner', text: label, intent }, { from: 'guide', text }];
    });
    setTimeout(() => setRobot(intent === 'hint' ? 'hint' : 'feedback'), 260);
  };
  const kid = band === 'a4';
  const guideTurns = turns.filter((t) => t.from === 'guide');
  const last = guideTurns[guideTurns.length - 1]?.text ?? '';
  return (
    <div className="guided">
      <p className="mode-note">ردود محلية مكتوبة مسبقاً لهذا الدرس، وتعمل دون إنترنت.</p>
      <div className="log" aria-live="polite">
        {turns.map((t, i) => (
          <div key={i} className={`turn ${t.from}`}>
            {t.from === 'guide' && <Robot state={i === turns.length - 1 ? robot : 'idle'} size={34} />}
            <p>{t.text}</p>
          </div>
        ))}
        <div ref={end} />
      </div>
      {kid && last && <SpeakButton text={last} label="اسمع فَطين" />}
      <div className={kid ? 'kidchoices coach-intents' : 'coach-intents'}>
        {kid
          ? kidIntents.map((k) => <button key={k.intent} type="button" onClick={() => ask(k.intent, k.label)}><span className="symbol" aria-hidden="true">{k.icon}</span>{k.label}</button>)
          : (['simpler', 'example', 'why', 'next'] as Intent[]).map((i) => <button key={i} type="button" onClick={() => ask(i, intentLabels[i])}>{intentLabels[i]}</button>)}
      </div>
    </div>
  );
}

type LiveStatus = 'locked' | 'ready' | 'streaming' | 'error' | 'offline';

function Live({ onFallback }: { onFallback: () => void }) {
  const { coach } = useApp();
  const [status, setStatus] = useState<LiveStatus>(getToken() ? 'ready' : 'locked');
  const [code, setCode] = useState('');
  const [msgs, setMsgs] = useState<LiveMessage[]>([]);
  const [input, setInput] = useState(() => { try { const d = sessionStorage.getItem('sinara.liveDraft') || ''; sessionStorage.removeItem('sinara.liveDraft'); return d.slice(0, LIMITS.maxInput); } catch { return ''; } });
  const [err, setErr] = useState('');
  const ctl = useRef<AbortController | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); ctl.current?.abort(); };
  }, []);
  const explain = (e: unknown) => {
    const k = e instanceof LiveError ? e.kind : 'provider';
    return ({
      offline: 'لا يوجد اتصال بالإنترنت الآن. مرشد الدرس يعمل دون اتصال.',
      unauthorized: 'انتهت جلسة البالغ أو رُفض الرمز. أدخل رمز البالغ من جديد.',
      rate: 'وصلت الخدمة إلى حد الاستعمال المؤقت. انتظر قليلاً ثم أعد المحاولة.',
      provider: 'تعذّر الحصول على رد من مزوّد الخدمة.',
      disabled: 'المحادثة المباشرة غير مفعّلة.',
      aborted: 'أوقفتَ الرد.',
      limit: 'الرسالة أطول من الحد المسموح.'
    } as const)[k];
  };
  const unlock = async () => {
    setErr('');
    try { await startAdultSession(code); setCode(''); setStatus('ready'); }
    catch (e) { setErr(explain(e)); }
  };
  const turnsUsed = msgs.filter((m) => m.role === 'user').length;
  const send = async (retry = false) => {
    const userMsgs = msgs.filter((m) => m.role === 'user');
    const text = retry ? userMsgs[userMsgs.length - 1]?.content ?? '' : input.trim();
    if (!text || turnsUsed >= LIMITS.maxTurns && !retry) return;
    const base = retry ? msgs.slice(0, msgs.map((m) => m.role).lastIndexOf('user')) : msgs;
    const next: LiveMessage[] = [...base, { role: 'user', content: text.slice(0, LIMITS.maxInput) }];
    setMsgs([...next, { role: 'assistant', content: '' }]);
    if (!retry) setInput('');
    setErr('');
    setStatus('streaming');
    const c = new AbortController();
    ctl.current = c;
    try {
      await streamChat(next, { title: coach.title, kind: coach.kind }, (t) => setMsgs((m) => { const copy = [...m]; copy[copy.length - 1] = { role: 'assistant', content: copy[copy.length - 1].content + t }; return copy; }), c.signal);
      setStatus('ready');
    } catch (e) {
      setErr(explain(e));
      setStatus(e instanceof LiveError && e.kind === 'unauthorized' ? 'locked' : e instanceof LiveError && e.kind === 'offline' ? 'offline' : 'error');
      setMsgs((m) => { const l = m[m.length - 1]; return l && l.role === 'assistant' && !l.content ? m.slice(0, -1) : m; });
    }
  };
  return (
    <div className="live">
      <p className="mode-note">محادثة مع نموذج ذكاء اصطناعي عبر خادم مهيّأ. تُرسل رسالتك وعنوان الدرس فقط، ولا تُحفظ المحادثة. <span className={`conn ${online ? 'on' : 'off'}`}>{online ? 'متصل' : 'غير متصل'}</span></p>
      {status === 'locked' ? (
        <div className="unlock">
          <label htmlFor="adult-code">رمز البالغ</label>
          <p className="sub">يتحقق الخادم من الرمز ويمنح جلسة مؤقتة. اختيار الفئة العمرية في التطبيق لا يفتح هذه الميزة.</p>
          <div className="row"><input id="adult-code" type="password" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} /><button type="button" className="action" onClick={unlock} disabled={!code}>تحقق</button></div>
        </div>
      ) : (
        <>
          <div className="log" aria-live="polite">
            {msgs.map((m, i) => <div key={i} className={`turn ${m.role === 'user' ? 'learner' : 'guide live-reply'}`}><p>{m.content || (status === 'streaming' && i === msgs.length - 1 ? '…' : '')}</p>{m.role === 'assistant' && m.content && <small className="tag">رد مباشر من النموذج</small>}</div>)}
          </div>
          <label htmlFor="live-input" className="sr-only">رسالتك</label>
          <textarea id="live-input" rows={2} maxLength={LIMITS.maxInput} value={input} onChange={(e) => setInput(e.target.value)} disabled={status === 'streaming' || turnsUsed >= LIMITS.maxTurns} placeholder="اكتب رسالة متعمّدة. لا تضع أسماء أو بيانات شخصية." />
          <div className="row">
            <small>{input.length}/{LIMITS.maxInput} · {turnsUsed}/{LIMITS.maxTurns} رسالة</small>
            {status === 'streaming'
              ? <button type="button" onClick={() => ctl.current?.abort()}>إيقاف الرد</button>
              : <button type="button" className="action" onClick={() => send()} disabled={!input.trim() || turnsUsed >= LIMITS.maxTurns}>إرسال</button>}
          </div>
        </>
      )}
      {err && (
        <div className="feedback retry" role="alert">
          {err}
          <div className="row">
            {status !== 'locked' && msgs.some((m) => m.role === 'user') && <button type="button" onClick={() => send(true)}>أعد المحاولة</button>}
            <button type="button" onClick={onFallback}>العودة إلى مرشد الدرس</button>
          </div>
        </div>
      )}
    </div>
  );
}
