// Optional sound effects synthesised locally with the Web Audio API (no downloaded assets).
// Every sound has a visible equivalent in the UI. Sound starts muted (settings.effects = false).

let ctx: AudioContext | null = null;
let enabled = false;
export const setEffects = (on: boolean) => { enabled = on; };

function ac(): AudioContext | null {
  if (!enabled) return null;
  try {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx ??= new C();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, gain = 0.06, type: OscillatorType = 'sine') {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  click: () => tone(660, 0, 0.08, 0.04, 'triangle'),
  note: () => { tone(784, 0, 0.18); tone(988, 0.08, 0.2, 0.04); },
  chime: () => { tone(659, 0, 0.3); tone(831, 0.12, 0.3); tone(988, 0.24, 0.45); },
  soft: () => tone(392, 0, 0.18, 0.035)
};
