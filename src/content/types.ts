// Content types. All learner-facing Arabic copy lives in src/content/*.ts and can be edited
// without touching any screen component. Stable ids are validated by scripts/validate-content.ts.

export type AgeBandId = 'a4' | 'a7' | 'a10' | 'a13' | 'a18' | 'a23';

/** Elements of a good request. Used for highlights, the "what is missing" step and progress. */
export type ElementKind = 'task' | 'audience' | 'data' | 'constraint' | 'format' | 'verify' | 'wait';

/** Skills shown on the تقدّمي screen. */
export type SkillId = 'task' | 'constraint' | 'format' | 'verify' | 'followup';

export interface Highlight {
  text: string; // must be an exact substring of the improved request
  kind: ElementKind;
}

export interface BranchLesson {
  id: string;
  name: string;
  /** A realistic vague request a person in this branch would type. */
  weak: string;
  /** The worked, improved request. */
  good: string;
  highlights: Highlight[];
  /** Why the improved request works, specific to this branch. */
  why: string;
  /** Simpler explanation used by the guided coach (اشرح أبسط). */
  simpler: string;
}

export interface QuizOption {
  id: string;
  text: string;
  correct?: boolean;
  feedback: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  skill: SkillId;
  options: QuizOption[];
}

export interface FlawedAnswer {
  request: string;
  answer: string[];
  /** Index into answer[] of the flawed line (highlighted after the learner answers). */
  flawLine: number;
  question: QuizQuestion;
}

export interface QuizSet {
  main: QuizQuestion;
  transfer: QuizQuestion;
  flawed: FlawedAnswer;
}

export interface FollowupOption {
  id: string;
  text: string;
  icon?: string;
  best?: boolean;
  feedback: string;
}

export interface FollowupScenario {
  id: string;
  title: string;
  request: string;
  /** Sample answer, one line per item. Labelled مثال تعليمي in the UI. */
  answer: string[];
  /** What the sample answer leaves out; revealed after the learner chooses. */
  omission: string;
  hint: string;
  options: FollowupOption[];
  /** Keywords that mark a composed follow-up as addressing the omission (any one matches). */
  keywords: string[];
  revised: string[];
  /** Indexes into revised[] that are new or changed. */
  changed: number[];
  note: string;
}

export interface Field {
  id: string;
  icon: string;
  name: string;
  /** Familiar vague label from the prototype (e.g. ارسم لي خريطة بيت). */
  vague: string;
  branches: BranchLesson[];
  quiz: QuizSet;
  followup: FollowupScenario;
}

export interface AgeBand {
  id: AgeBandId;
  icon: string;
  name: string;
  tagline: string;
  title: string;
  lead: string;
}
