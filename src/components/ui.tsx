import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useApp } from '../lib/app';
import { speak, stopSpeaking, watchVoices, type VoiceState } from '../lib/speech';
import type { Highlight, QuizQuestion, FollowupScenario, SkillId } from '../content/types';
import { elementLabels } from '../content/index';
import { Pic } from './Art';

export function Panel({ title, sub, children, id, className = '' }: { title?: ReactNode; sub?: ReactNode; children: ReactNode; id?: string; className?: string }) {
  return (
    <section className={`panel ${className}`} id={id} aria-labelledby={id && title ? `${id}-h` : undefined}>
      {title && <h2 id={id ? `${id}-h` : undefined}>{title}</h2>}
      {sub && <p className="sub">{sub}</p>}
      {children}
    </section>
  );
}

export const SampleTag = () => <span className="tag sample" title="محتوى مكتوب مسبقاً للتعليم، وليس جواباً مباشراً من نموذج ذكاء اصطناعي">مثال تعليمي</span>;

/** Renders text with phrases highlighted by kind. Newly revealed highlights animate once. */
export function Highlighted({ text, highlights, show = true }: { text: string; highlights: Highlight[]; show?: boolean }) {
  const parts = useMemo(() => {
    if (!show || !highlights.length) return [{ t: text }];
    const marks = highlights
      .map((h) => ({ ...h, i: text.indexOf(h.text) }))
      .filter((h) => h.i >= 0)
      .sort((a, b) => a.i - b.i);
    const out: { t: string; kind?: Highlight['kind'] }[] = [];
    let pos = 0;
    for (const m of marks) {
      if (m.i < pos) continue;
      if (m.i > pos) out.push({ t: text.slice(pos, m.i) });
      out.push({ t: m.text, kind: m.kind });
      pos = m.i + m.text.length;
    }
    if (pos < text.length) out.push({ t: text.slice(pos) });
    return out;
  }, [text, highlights, show]);
  return (
    <p className="prompt-text">
      {parts.map((p, i) =>
        p.kind ? (
          <mark key={i} className={`hl hl-${p.kind}`}>
            {p.t}
            <span className="sr-only"> ({elementLabels[p.kind].short})</span>
          </mark>
        ) : (
          <span key={i}>{p.t}</span>
        )
      )}
    </p>
  );
}

export function Legend({ kinds }: { kinds: Highlight['kind'][] }) {
  const uniq = Array.from(new Set(kinds));
  return (
    <ul className="legend" aria-label="مفتاح الألوان">
      {uniq.map((k) => (
        <li key={k}><span className={`hl hl-${k}`}>{elementLabels[k].short}</span> {elementLabels[k].label}</li>
      ))}
    </ul>
  );
}

/** Single-best-answer question with per-choice feedback and retry. */
export function Quiz({ q, onCorrect, lessonKey, flawLine, lines }: { q: QuizQuestion; onCorrect?: () => void; lessonKey: string; flawLine?: number; lines?: string[] }) {
  const { practise, play, patchCoach } = useApp();
  const [picked, setPicked] = useState<string | null>(null);
  const [tried, setTried] = useState<string[]>([]);
  const done = picked !== null && q.options.find((o) => o.id === picked)?.correct;
  const fb = useRef<HTMLDivElement>(null);
  useEffect(() => { setPicked(null); setTried([]); }, [q.id]);
  const choose = (id: string) => {
    if (done) return;
    const o = q.options.find((x) => x.id === id)!;
    setPicked(id);
    setTried((t) => (t.includes(id) ? t : [...t, id]));
    patchCoach({ lastChoice: o.text, lastCorrect: !!o.correct });
    if (o.correct) { play('chime'); practise(q.skill, lessonKey); onCorrect?.(); } else play('soft');
    setTimeout(() => fb.current?.focus(), 0);
  };
  const current = q.options.find((o) => o.id === picked);
  return (
    <div className="quiz" data-quiz={q.id}>
      {lines && (
        <div className="sample-answer" aria-label="جواب تعليمي فيه خطأ">
          <SampleTag />
          <ol>
            {lines.map((l, i) => <li key={i} className={done && i === flawLine ? 'flaw' : ''}>{l}{done && i === flawLine && <span className="sr-only"> (هذا السطر فيه المشكلة)</span>}</li>)}
          </ol>
        </div>
      )}
      <p className="q-prompt"><b>{q.prompt}</b></p>
      <div className="choices" role="group" aria-label="الخيارات">
        {q.options.map((o) => {
          const state = picked === o.id ? (o.correct ? 'right' : 'wrong') : tried.includes(o.id) ? 'tried' : '';
          return (
            <button key={o.id} type="button" className={`choice ${state}`} aria-pressed={picked === o.id} disabled={!!done && !o.correct} onClick={() => choose(o.id)}>
              <span className="mark" aria-hidden="true">{state === 'right' ? '✓' : state === 'wrong' || state === 'tried' ? '↺' : '○'}</span>
              <span>{o.text}</span>
            </button>
          );
        })}
      </div>
      <div className={`feedback ${current ? (current.correct ? 'ok' : 'retry') : ''}`} ref={fb} tabIndex={-1} role="status">
        {current && (
          <>
            <b>{current.correct ? 'إجابة مناسبة.' : 'ليس هذا الخيار الأنسب.'}</b> {current.feedback}
            {!current.correct && <span className="retry-note"> جرّب خياراً آخر.</span>}
          </>
        )}
      </div>
    </div>
  );
}

/** «شنو نسأل بعدها؟» — first request, sample answer with an omission, choose or compose a follow-up, revised sample. */
export function Followup({ s, lessonKey, kid = false }: { s: FollowupScenario; lessonKey: string; kid?: boolean }) {
  const { practise, play, patchCoach } = useApp();
  const [picked, setPicked] = useState<string | null>(null);
  const [own, setOwn] = useState('');
  const [ownState, setOwnState] = useState<'idle' | 'match' | 'nomatch'>('idle');
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { setPicked(null); setOwn(''); setOwnState('idle'); setRevealed(false); }, [s.id]);
  const best = s.options.find((o) => o.best)!;
  const choose = (id: string) => {
    const o = s.options.find((x) => x.id === id)!;
    setPicked(id);
    patchCoach({ lastChoice: o.text, lastCorrect: !!o.best });
    if (o.best) { setRevealed(true); practise('followup', lessonKey); play('chime'); } else play('soft');
  };
  const tryOwn = () => {
    const t = own.trim();
    if (!t) return;
    const ok = s.keywords.some((k) => t.includes(k));
    setOwnState(ok ? 'match' : 'nomatch');
    if (ok) { setRevealed(true); practise('followup', lessonKey); play('chime'); }
  };
  const fbText = picked ? s.options.find((o) => o.id === picked)!.feedback : '';
  return (
    <div className="followup" data-followup={s.id}>
      <div className="bubble learner"><span className="who">الطلب الأول</span><p>{s.request}</p></div>
      <div className="bubble sample">
        <span className="who">الجواب <SampleTag /></span>
        <ul>{s.answer.map((l, i) => <li key={i}>{l}</li>)}</ul>
      </div>
      <p className="q-prompt"><b>{kid ? 'شنو نسأل بعدها؟' : 'ماذا ينقص هذا الجواب؟ اختر سؤال المتابعة الأنسب.'}</b></p>
      {!revealed && <p className="hint">💡 {s.hint}</p>}
      <div className={kid ? 'kidchoices' : 'choices'} role="group" aria-label="أسئلة المتابعة">
        {s.options.map((o) => (
          <button key={o.id} type="button" className={`choice ${picked === o.id ? (o.best ? 'right' : 'wrong') : ''}`} aria-pressed={picked === o.id} disabled={revealed && !o.best} onClick={() => choose(o.id)}>
            {kid && o.icon && <span className="symbol" aria-hidden="true">{o.icon}</span>}
            <span>{o.text}</span>
          </button>
        ))}
      </div>
      {fbText && <div className={`feedback ${picked === best.id ? 'ok' : 'retry'}`} role="status">{fbText}</div>}
      {!kid && !revealed && (
        <div className="compose">
          <label htmlFor={`own-${s.id}`}>أو اكتب سؤال متابعة بكلماتك</label>
          <div className="row">
            <input id={`own-${s.id}`} value={own} maxLength={240} onChange={(e) => { setOwn(e.target.value); setOwnState('idle'); }} placeholder="اكتب ما ينقص الجواب" />
            <button type="button" onClick={tryOwn} disabled={!own.trim()}>جرّب سؤالي</button>
          </div>
          {ownState === 'nomatch' && <p className="feedback retry" role="status">سؤالك لا يلمس النقص بعد. اقرأ التلميح، أو جرّب أحد الخيارات.</p>}
          <small>يُقارَن سؤالك محلياً بكلمات مفتاحية في هذا الدرس، ولا يُرسل إلى أي جهة.</small>
        </div>
      )}
      {revealed && (
        <div className="reveal">
          <p className="omission"><b>ما كان ينقص:</b> {s.omission}</p>
          {ownState === 'match' && <div className="bubble learner"><span className="who">سؤالك</span><p>{own}</p></div>}
          <div className="bubble sample revised">
            <span className="who">الجواب بعد المتابعة <SampleTag /></span>
            <ul>{s.revised.map((l, i) => <li key={i} className={s.changed.includes(i) ? 'changed' : ''}>{l}{s.changed.includes(i) && <span className="sr-only"> (سطر جديد أو متغيّر)</span>}</li>)}</ul>
          </div>
          <p className="note">{s.note}</p>
        </div>
      )}
    </div>
  );
}

export function useVoice(): VoiceState {
  const [v, setV] = useState<VoiceState>('unknown');
  useEffect(() => watchVoices(setV), []);
  return v;
}

/** Shows a working audio button only when narration is enabled and an Arabic device voice exists. */
export function SpeakButton({ text, label = 'استمع' }: { text: string; label?: string }) {
  const { settings } = useApp();
  const voice = useVoice();
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => stopSpeaking(), []);
  if (!settings.narration) return <span className="readcue">📖 يقرأ المرافق النص بصوته</span>;
  if (voice !== 'available') return <span className="readcue">📖 لا يوجد صوت عربي في هذا الجهاز؛ يقرأ المرافق النص بصوته</span>;
  return (
    <span className="speak">
      <button type="button" onClick={() => { if (speak(text, () => setSpeaking(false))) setSpeaking(true); }} aria-label={`${label} (صوت الجهاز العربي)`}>🔊 {label}</button>
      {speaking && <button type="button" onClick={() => { stopSpeaking(); setSpeaking(false); }}>⏹ إيقاف</button>}
      <small>صوت الجهاز</small>
    </span>
  );
}

export function CopyButton({ text, onCopied }: { text: string; onCopied?: () => void }) {
  const [msg, setMsg] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('no clipboard');
      await navigator.clipboard.writeText(text);
      setMsg('تم نسخ الطلب.');
      onCopied?.();
    } catch {
      setMsg('تعذّر النسخ التلقائي. حدّدتُ النص لك؛ استعمل أمر النسخ في جهازك.');
      const ta = ref.current;
      if (ta) { ta.hidden = false; ta.focus(); ta.select(); }
      onCopied?.();
    }
  };
  return (
    <span className="copy">
      <button type="button" className="action" onClick={copy}>نسخ</button>
      <textarea ref={ref} hidden readOnly value={text} aria-label="نص للنسخ اليدوي" className="copy-fallback" rows={3} />
      <span role="status" className="sub">{msg}</span>
    </span>
  );
}

export function PicButton({ icon, label, pressed, onClick, big = true }: { icon: string; label: string; pressed: boolean; onClick: () => void; big?: boolean }) {
  return (
    <button type="button" className={`picbtn ${big ? 'big' : ''}`} aria-pressed={pressed} onClick={onClick}>
      <Pic name={icon} size={big ? 78 : 52} />
      <b>{label}</b>
    </button>
  );
}

export function SkillBadge({ skill }: { skill: SkillId }) {
  return <span className={`skill skill-${skill}`}>{skill}</span>;
}
