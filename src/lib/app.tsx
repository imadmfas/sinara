import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AgeBandId, SkillId } from '../content/types';
import { load, save, practise as practiseFn, rememberRoute as rememberFn, resetBand as resetFn, type AppState, type Settings } from './store';
import { setEffects, sfx } from './sound';
import { stopSpeaking } from './speech';
import { defaultMaterial, type CoachContext } from './coach';

interface AppApi {
  state: AppState;
  band: AgeBandId | null;
  setBand: (b: AgeBandId | null) => void;
  settings: Settings;
  updateSettings: (p: Partial<Settings>) => void;
  practise: (skill: SkillId, lessonKey?: string) => void;
  remember: (route: string, title: string) => void;
  resetBand: (b: AgeBandId) => void;
  saveDraft: (label: string, text: string) => void;
  deleteDraft: (id: string) => void;
  coach: CoachContext;
  setCoach: (c: CoachContext) => void;
  patchCoach: (p: Partial<CoachContext>) => void;
  coachOpen: boolean;
  setCoachOpen: (o: boolean) => void;
  announce: (msg: string) => void;
  play: (k: keyof typeof sfx) => void;
}

const Ctx = createContext<AppApi | null>(null);

export const homeCoach: CoachContext = { key: 'home', title: 'البداية', kind: 'home', material: defaultMaterial };

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => load());
  const [coach, setCoachState] = useState<CoachContext>(homeCoach);
  const [coachOpen, setCoachOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    save(state);
  }, [state]);

  useEffect(() => { setEffects(state.settings.effects); }, [state.settings.effects]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('calm', state.settings.calm);
    root.classList.toggle('simple', state.settings.simple);
  }, [state.settings.calm, state.settings.simple]);

  const setBand = useCallback((b: AgeBandId | null) => setState((s) => ({ ...s, band: b })), []);
  const updateSettings = useCallback((p: Partial<Settings>) => {
    if (p.narration === false) stopSpeaking();
    setState((s) => ({ ...s, settings: { ...s.settings, ...p } }));
  }, []);
  const practise = useCallback((skill: SkillId, key?: string) => setState((s) => practiseFn(s, skill, key)), []);
  const remember = useCallback((r: string, t: string) => setState((s) => rememberFn(s, r, t)), []);
  const resetBand = useCallback((b: AgeBandId) => setState((s) => resetFn(s, b)), []);
  const saveDraft = useCallback((label: string, text: string) => setState((s) => ({ ...s, savedDrafts: [{ id: String(Date.now()), label, text, at: Date.now() }, ...s.savedDrafts].slice(0, 20) })), []);
  const deleteDraft = useCallback((id: string) => setState((s) => ({ ...s, savedDrafts: s.savedDrafts.filter((d) => d.id !== id) })), []);
  const setCoach = useCallback((c: CoachContext) => setCoachState(c), []);
  const patchCoach = useCallback((p: Partial<CoachContext>) => setCoachState((c) => ({ ...c, ...p })), []);
  const announce = useCallback((m: string) => { setMsg(''); setTimeout(() => setMsg(m), 30); }, []);
  const play = useCallback((k: keyof typeof sfx) => sfx[k](), []);

  const api = useMemo<AppApi>(() => ({
    state, band: state.band, setBand, settings: state.settings, updateSettings, practise, remember, resetBand, saveDraft, deleteDraft,
    coach, setCoach, patchCoach, coachOpen, setCoachOpen, announce, play
  }), [state, setBand, updateSettings, practise, remember, resetBand, saveDraft, deleteDraft, coach, setCoach, patchCoach, coachOpen, announce, play]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="sr-only" role="status" aria-live="polite">{msg}</div>
    </Ctx.Provider>
  );
}

export function useApp(): AppApi {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}

/** Registers the current lesson with the guide and remembers it for «متابعة من حيث توقفت». */
export function useLesson(ctx: CoachContext, route: string) {
  const { setCoach, remember } = useApp();
  useEffect(() => {
    setCoach(ctx);
    remember(route, ctx.title);
    stopSpeaking();
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.key, route]);
}
