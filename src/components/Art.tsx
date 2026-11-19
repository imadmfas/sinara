// Original illustrations for سِينارة, drawn as inline SVG (no external or licensed assets).

import type { CSSProperties } from 'react';

/** The brand mark: a question mark whose segments light up as a request gains useful detail. */
export function QuestionMark({ lit, total = 5, size = 120, label }: { lit: number; total?: number; size?: number; label?: string }) {
  const segs = Array.from({ length: total }, (_, i) => i);
  // Path for the hook of the question mark split into `total - 1` arcs, plus the dot.
  const arcs = [
    'M30 44 C30 22 46 12 60 12',
    'M60 12 C76 12 90 24 90 40',
    'M90 40 C90 56 76 62 66 70',
    'M66 70 C60 75 60 82 60 92'
  ];
  return (
    <svg className="qmark" width={size} height={size * 1.25} viewBox="0 0 120 150" role="img" aria-label={label ?? `علامة السؤال: أضاء ${lit} من ${total}`}>
      <g transform="translate(120 0) scale(-1 1)">
        {arcs.map((d, i) => (
          <path key={i} d={d} className={i < lit ? 'seg on' : 'seg'} strokeWidth="14" strokeLinecap="round" fill="none" />
        ))}
      </g>
      <circle cx="60" cy="124" r="10" className={segs.length - 1 < lit ? 'seg dot on' : 'seg dot'} />
    </svg>
  );
}

export type RobotState = 'idle' | 'hint' | 'speaking' | 'waiting' | 'feedback' | 'unavailable';

/** فَطين — compact silhouette, expressive eyes. State changes the eyes, antenna and mouth. */
export function Robot({ state = 'idle', size = 56, look = 0, title }: { state?: RobotState; size?: number; look?: -1 | 0 | 1; title?: string }) {
  const eyeDx = look * 3;
  const mouth = {
    idle: 'M24 44 Q32 48 40 44',
    hint: 'M25 44 Q32 46 39 44',
    speaking: 'M26 43 Q32 50 38 43 Z',
    waiting: 'M26 45 L38 45',
    feedback: 'M23 42 Q32 52 41 42',
    unavailable: 'M26 46 Q32 43 38 46'
  }[state];
  return (
    <svg className={`robot robot-${state}`} width={size} height={size} viewBox="0 0 64 64" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <line x1="32" y1="6" x2="32" y2="14" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      <circle className="antenna" cx="32" cy="6" r="4" fill={state === 'unavailable' ? '#9aa9a3' : 'var(--apricot)'} />
      <rect x="8" y="14" width="48" height="40" rx="15" fill="var(--jade)" />
      <rect x="13" y="20" width="38" height="28" rx="11" fill="#e8f3ec" />
      <g className="eyes">
        <ellipse cx={24 + eyeDx} cy="32" rx={state === 'waiting' ? 4 : 4.5} ry={state === 'unavailable' ? 1.5 : 5.5} fill="var(--ink)" />
        <ellipse cx={40 + eyeDx} cy="32" rx={state === 'waiting' ? 4 : 4.5} ry={state === 'unavailable' ? 1.5 : 5.5} fill="var(--ink)" />
        {state !== 'unavailable' && <><circle cx={25.5 + eyeDx} cy="30" r="1.4" fill="#fff" /><circle cx={41.5 + eyeDx} cy="30" r="1.4" fill="#fff" /></>}
      </g>
      <path d={mouth} stroke="var(--ink)" strokeWidth="2.4" fill={state === 'speaking' ? 'var(--ink)' : 'none'} strokeLinecap="round" />
      <rect x="4" y="28" width="5" height="12" rx="2.5" fill="var(--ink)" />
      <rect x="55" y="28" width="5" height="12" rx="2.5" fill="var(--ink)" />
    </svg>
  );
}

const S = ({ children, size = 72, label, style }: { children: React.ReactNode; size?: number; label?: string; style?: CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label} style={style} className="pic">
    {children}
  </svg>
);

/** Picture choices for the preschool journeys. */
export function Pic({ name, size = 72 }: { name: string; size?: number }) {
  switch (name) {
    case 'bird':
      return <S size={size}><ellipse cx="40" cy="46" rx="22" ry="17" fill="#f2a65a" /><circle cx="56" cy="32" r="11" fill="#f2a65a" /><circle cx="59" cy="30" r="2.5" fill="#163e38" /><path d="M67 32 L76 34 L67 37 Z" fill="#e8b923" /><path d="M24 44 Q36 30 46 46 Z" fill="#d98236" /><path d="M18 50 L6 46 L14 56 Z" fill="#d98236" /><line x1="36" y1="62" x2="34" y2="72" stroke="#163e38" strokeWidth="2.5" /><line x1="44" y1="62" x2="46" y2="72" stroke="#163e38" strokeWidth="2.5" /></S>;
    case 'cat':
      return <S size={size}><ellipse cx="40" cy="54" rx="20" ry="16" fill="#8a7a6b" /><circle cx="40" cy="32" r="16" fill="#8a7a6b" /><path d="M26 24 L28 8 L38 20 Z M54 24 L52 8 L42 20 Z" fill="#8a7a6b" /><circle cx="34" cy="31" r="2.6" fill="#163e38" /><circle cx="46" cy="31" r="2.6" fill="#163e38" /><path d="M38 37 L42 37 L40 40 Z" fill="#e0868e" /><path d="M60 58 Q76 50 70 36" stroke="#8a7a6b" strokeWidth="6" fill="none" strokeLinecap="round" /><path d="M24 38 L12 36 M24 41 L12 43 M56 38 L68 36 M56 41 L68 43" stroke="#163e38" strokeWidth="1.2" /></S>;
    case 'turtle':
      return <S size={size}><ellipse cx="38" cy="48" rx="26" ry="17" fill="#3f8f5f" /><path d="M20 46 Q38 26 56 46" fill="#5fb07c" /><path d="M30 40 L38 34 L46 40 L38 46 Z" fill="#3f8f5f" opacity=".6" /><circle cx="66" cy="46" r="8" fill="#9ccf86" /><circle cx="68" cy="44" r="1.8" fill="#163e38" /><rect x="18" y="58" width="9" height="8" rx="3" fill="#9ccf86" /><rect x="48" y="58" width="9" height="8" rx="3" fill="#9ccf86" /></S>;
    case 'palms':
      return <S size={size}><rect x="0" y="60" width="80" height="20" fill="#e9d8a6" /><path d="M24 62 Q26 40 28 24" stroke="#8b5a2b" strokeWidth="5" fill="none" /><path d="M28 24 Q14 18 6 28 M28 24 Q20 10 10 12 M28 24 Q36 10 48 14 M28 24 Q42 20 46 32" stroke="#2f9a55" strokeWidth="5" fill="none" strokeLinecap="round" /><circle cx="26" cy="30" r="3" fill="#8b5a2b" /><circle cx="31" cy="30" r="3" fill="#8b5a2b" /><path d="M58 62 Q59 48 60 38" stroke="#8b5a2b" strokeWidth="4" fill="none" /><path d="M60 38 Q50 34 46 42 M60 38 Q66 28 74 32 M60 38 Q56 28 50 28" stroke="#2f9a55" strokeWidth="4" fill="none" strokeLinecap="round" /></S>;
    case 'river':
      return <S size={size}><rect x="0" y="0" width="80" height="44" fill="#dff0f4" /><circle cx="62" cy="16" r="8" fill="#f6c453" /><rect x="0" y="40" width="80" height="12" fill="#b6d98f" /><path d="M0 56 Q20 50 40 56 T80 56 V80 H0 Z" fill="#4aa3c7" /><path d="M8 64 Q16 60 24 64 M40 70 Q48 66 56 70" stroke="#fff" strokeWidth="2" fill="none" /></S>;
    case 'roof':
      return <S size={size}><rect x="0" y="0" width="80" height="80" fill="#ffe7cf" /><circle cx="18" cy="18" r="9" fill="#ee7d3b" /><rect x="10" y="42" width="60" height="38" fill="#e9d8a6" /><rect x="6" y="38" width="68" height="6" fill="#c9a86b" /><rect x="20" y="54" width="10" height="12" fill="#9fc6d6" /><rect x="50" y="54" width="10" height="12" fill="#9fc6d6" /><path d="M60 38 L60 26 M56 30 L64 30" stroke="#163e38" strokeWidth="2" /></S>;
    case 'sing':
      return <S size={size}><path d="M28 56 V22 L58 16 V50" stroke="#00675a" strokeWidth="5" fill="none" /><ellipse cx="22" cy="58" rx="8" ry="6" fill="#00675a" /><ellipse cx="52" cy="52" rx="8" ry="6" fill="#00675a" /></S>;
    case 'date':
      return <S size={size}><ellipse cx="40" cy="44" rx="14" ry="22" fill="#8b4a22" /><ellipse cx="35" cy="36" rx="4" ry="9" fill="#b0683a" opacity=".7" /><path d="M40 22 Q44 12 52 10" stroke="#5a7d2b" strokeWidth="3" fill="none" /></S>;
    case 'friend':
      return <S size={size}><circle cx="26" cy="30" r="10" fill="#f2a65a" /><rect x="16" y="42" width="20" height="24" rx="8" fill="#f2a65a" /><circle cx="54" cy="30" r="10" fill="#a2dcd2" /><rect x="44" y="42" width="20" height="24" rx="8" fill="#a2dcd2" /><path d="M36 50 L44 50" stroke="#163e38" strokeWidth="4" strokeLinecap="round" /></S>;
    default:
      return <span className="emoji" aria-hidden="true" style={{ fontSize: size * 0.6 }}>{name}</span>;
  }
}

/** Renders the drawing the child composed: object × colour × size. */
export function Drawing({ obj, color, big }: { obj: string; color: string; big: boolean }) {
  const s = big ? 1 : 0.6;
  return (
    <svg width="220" height="200" viewBox="0 0 220 200" role="img" aria-label="الرسمة التي اخترتها" className="drawing">
      <rect width="220" height="200" rx="18" fill="#fffdf6" stroke="#d7dfd8" />
      <g transform={`translate(110 ${big ? 108 : 128}) scale(${s})`}>
        {obj === 'palm' && <><path d="M-4 80 Q0 20 4 -40" stroke="#8b5a2b" strokeWidth="12" fill="none" /><path d="M4 -40 Q-40 -60 -70 -30 M4 -40 Q-20 -90 -50 -84 M4 -40 Q30 -90 64 -80 M4 -40 Q50 -56 70 -20" stroke={color} strokeWidth="12" fill="none" strokeLinecap="round" /><circle cx="-6" cy="-24" r="7" fill="#8b4a22" /><circle cx="8" cy="-22" r="7" fill="#8b4a22" /><circle cx="1" cy="-12" r="7" fill="#8b4a22" /></>}
        {obj === 'flower' && <><path d="M0 80 V-10" stroke="#2f7a45" strokeWidth="8" /><ellipse cx="-20" cy="40" rx="18" ry="8" fill="#2f9a55" /><ellipse cx="20" cy="20" rx="18" ry="8" fill="#2f9a55" />{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-42" rx="15" ry="26" fill={color} transform={`rotate(${a} 0 -20)`} />)}<circle cx="0" cy="-20" r="12" fill="#f6c453" /></>}
        {obj === 'butterfly' && <><ellipse cx="-34" cy="-14" rx="34" ry="28" fill={color} /><ellipse cx="34" cy="-14" rx="34" ry="28" fill={color} /><ellipse cx="-24" cy="30" rx="22" ry="18" fill={color} /><ellipse cx="24" cy="30" rx="22" ry="18" fill={color} /><rect x="-6" y="-40" width="12" height="90" rx="6" fill="#163e38" />{[-38, 38, -24, 24].map((x, i) => <circle key={i} cx={x} cy={i < 2 ? -14 : 30} r="6" fill="#fff" opacity=".8" />)}</>}
      </g>
    </svg>
  );
}

/** Paper house built from the chosen shapes. */
export function PaperHouse({ base, roof, extra }: { base: string; roof: string; extra: string }) {
  const w = base === 'rect' ? 150 : 100;
  const x = 110 - w / 2;
  return (
    <svg width="220" height="200" viewBox="0 0 220 200" role="img" aria-label="البيت الذي صنعته" className="drawing">
      <rect width="220" height="200" rx="18" fill="#fffdf6" stroke="#d7dfd8" />
      <rect x={x} y="90" width={w} height="90" fill="#f2a65a" stroke="#163e38" strokeWidth="3" />
      {roof === 'triangle' ? <path d={`M${x - 10} 90 L110 30 L${x + w + 10} 90 Z`} fill="#c8553d" stroke="#163e38" strokeWidth="3" /> : <path d={`M${x} 90 A${w / 2} ${w / 2.4} 0 0 1 ${x + w} 90 Z`} fill="#c8553d" stroke="#163e38" strokeWidth="3" />}
      {extra === 'door' && <rect x="98" y="132" width="24" height="48" rx="4" fill="#8b5a2b" stroke="#163e38" strokeWidth="2" />}
      {extra === 'window' && <rect x="92" y="108" width="36" height="30" fill="#9fc6d6" stroke="#163e38" strokeWidth="3" />}
      {extra === 'palm' && <g><path d="M196 180 Q198 140 200 110" stroke="#8b5a2b" strokeWidth="5" fill="none" /><path d="M200 110 Q186 100 176 112 M200 110 Q210 96 218 104 M200 110 Q196 96 186 96" stroke="#2f9a55" strokeWidth="5" fill="none" strokeLinecap="round" /></g>}
    </svg>
  );
}
