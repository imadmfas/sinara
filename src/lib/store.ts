import type { AgeBandId, SkillId } from '../content/types';

// Private, local, versioned state. Only the age band is collected (never a name, school or photo).
// Progress is kept separately per age band so a shared family device works.

export const STORAGE_KEY = 'sinara.state';
export const SCHEMA_VERSION = 2;

export interface Settings {
  effects: boolean; // sound effects, muted by default
  narration: boolean; // device Arabic voice for reading aloud, off by default
  calm: boolean; // manual calm mode: no motion
  simple: boolean; // simple interface: larger text, fewer options per screen
  expertise: 'beginner' | 'experienced';
}

export interface BandProgress {
  skills: Partial<Record<SkillId, { count: number; last: number }>>;
  completed: string[]; // lesson keys
  lastRoute?: string;
  lastTitle?: string;
}

export interface AppState {
  version: number;
  band: AgeBandId | null;
  settings: Settings;
  progress: Partial<Record<AgeBandId, BandProgress>>;
  /** Drafts are kept only if an adult explicitly saves one. */
  savedDrafts: { id: string; text: string; at: number; label: string }[];
}

export const defaultSettings: Settings = { effects: false, narration: false, calm: false, simple: false, expertise: 'beginner' };

export const emptyState = (): AppState => ({ version: SCHEMA_VERSION, band: null, settings: { ...defaultSettings }, progress: {}, savedDrafts: [] });

/** Migrate older stored shapes forward. v1 kept a flat `skills` map without per-band progress. */
export function migrate(raw: unknown): AppState {
  const s = emptyState();
  if (!raw || typeof raw !== 'object') return s;
  const r = raw as Record<string, unknown>;
  if (r.version === 1) {
    const band = (r.band as AgeBandId) ?? null;
    s.band = band;
    if (band && r.skills && typeof r.skills === 'object') s.progress[band] = { skills: r.skills as BandProgress['skills'], completed: [] };
    if (r.settings && typeof r.settings === 'object') s.settings = { ...defaultSettings, ...(r.settings as Partial<Settings>) };
    return s;
  }
  if (r.version === SCHEMA_VERSION) {
    return {
      ...s,
      ...(r as unknown as AppState),
      settings: { ...defaultSettings, ...((r.settings as Partial<Settings>) || {}) },
      progress: (r.progress as AppState['progress']) || {},
      savedDrafts: Array.isArray(r.savedDrafts) ? (r.savedDrafts as AppState['savedDrafts']) : []
    };
  }
  return s;
}

export function load(): AppState {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    return t ? migrate(JSON.parse(t)) : emptyState();
  } catch {
    return emptyState();
  }
}

export function save(s: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable (private mode): the app keeps working in memory */
  }
}

export function practise(s: AppState, skill: SkillId, lessonKey?: string): AppState {
  if (!s.band) return s;
  const p: BandProgress = s.progress[s.band] ?? { skills: {}, completed: [] };
  const cur = p.skills[skill] ?? { count: 0, last: 0 };
  const completed = lessonKey && !p.completed.includes(lessonKey) ? [...p.completed, lessonKey] : p.completed;
  return { ...s, progress: { ...s.progress, [s.band]: { ...p, completed, skills: { ...p.skills, [skill]: { count: cur.count + 1, last: Date.now() } } } } };
}

export function rememberRoute(s: AppState, route: string, title: string): AppState {
  if (!s.band) return s;
  const p: BandProgress = s.progress[s.band] ?? { skills: {}, completed: [] };
  if (p.lastRoute === route) return s;
  return { ...s, progress: { ...s.progress, [s.band]: { ...p, lastRoute: route, lastTitle: title } } };
}

export function resetBand(s: AppState, band: AgeBandId): AppState {
  const progress = { ...s.progress };
  delete progress[band];
  return { ...s, progress };
}
