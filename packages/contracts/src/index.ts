/**
 * Shared Northstar types. Field names follow the engine
 * (northstar-engine backend/app/models/schemas.py, services/citizen/studies.py
 * and population.py), translated to camelCase.
 */

/** Lifecycle of a study as the studio shows it. */
export type StudyState =
  | 'draft'
  | 'ready'
  | 'running'
  | 'complete'
  | 'partial'
  | 'failed'
  | 'archived';

/** Studio tabs for a study. */
export type StudyTab = 'brief' | 'population' | 'research' | 'responses';

/** What a figure may claim: a level, only a direction, or only a ranking. */
export type ClaimClass = 'level' | 'direction' | 'ranking';

/** Placeholder tokens used in fixtures and display strings instead of real values. */
export type PlaceholderToken = '[SHARE]' | '[BAND]' | '[N]' | '[SEED]' | '[OPTION]' | '[COST]' | '[NAME]';

export const PLACEHOLDER_TOKENS = [
  '[SHARE]',
  '[BAND]',
  '[N]',
  '[SEED]',
  '[OPTION]',
  '[COST]',
  '[NAME]',
] as const satisfies readonly PlaceholderToken[];

/** Engine question types (StudyQuestion.question_type), which select the reliability band. */
export type QuestionType =
  | 'mood_direction'
  | 'consensus_trust'
  | 'neutral_factual'
  | 'concrete_habit'
  | 'values_identity'
  | 'intention_virtue';

/** Engine response formats (StudyQuestion.format). */
export type ResponseFormat = 'likert' | 'single_choice' | 'multi_select' | 'ranking' | 'free_text' | 'price_trial';

/** One displayed number. `band` is in percentage points; omit when no defensible band exists. */
export interface FigureValue {
  value: number;
  band?: number;
  claim?: ClaimClass;
  /** The sentence that qualifies the figure. */
  caption?: string;
  state?: 'ok' | 'withheld' | 'stale';
}

/** A Likert or option distribution; `shares[i]` belongs to `anchors[i]`. */
export interface Distribution {
  anchors: string[];
  shares: number[];
}

export type MarketStatus = 'roster-ready' | 'covered' | 'registered' | 'none';

export interface MarketStatusEntry {
  /** ISO 3166-1 alpha-2 code. */
  code: string;
  status: MarketStatus;
  /** For 'covered': the market whose roster covers this one. */
  coveredBy?: string;
}

/** Estimated run cost, or null when no estimate exists. */
export type CostEstimate = { amount: number; currency: string; basis: string } | null;

/** The panel a study runs against (engine PopulationSpec / PanelCreateRequest). */
export interface PopulationRef {
  /** Market code, e.g. 'FI'. */
  code: string;
  panelId?: string;
  /** Panel size (engine `count`). */
  size: number;
  seed?: number;
  label?: string;
}

/** One question in the battery (engine StudyQuestion). */
export interface ResearchItem {
  key: string;
  question: string;
  type: QuestionType;
  format?: ResponseFormat;
  /** One anchor sentence per Likert step, step 1 first. */
  anchors?: string[];
  options?: string[];
  result?: {
    distribution: Distribution;
    headline?: FigureValue;
  };
}

export interface Study {
  id: string;
  title: string;
  state: StudyState;
  tab?: StudyTab;
  population: PopulationRef;
  objectives: string[];
  items: ResearchItem[];
  /** ISO 8601 timestamp. */
  createdAt: string;
  updatedAt?: string;
  cost?: CostEstimate;
}

/**
 * Known market statuses. FI and JP have raked rosters, AX is served by the
 * FI roster, US is registered without a roster (engine population.py).
 */
export const MARKET_STATUS = {
  FI: { code: 'FI', status: 'roster-ready' },
  JP: { code: 'JP', status: 'roster-ready' },
  AX: { code: 'AX', status: 'covered', coveredBy: 'FI' },
  US: { code: 'US', status: 'registered' },
} as const satisfies Record<string, MarketStatusEntry>;

export type KnownMarketCode = keyof typeof MARKET_STATUS;

/** Status for any market code (case-insensitive); unknown codes are 'none'. */
export function marketStatus(code: string): MarketStatusEntry {
  const upper = code.trim().toUpperCase();
  const known = (MARKET_STATUS as Record<string, MarketStatusEntry | undefined>)[upper];
  return known ? { ...known } : { code: upper, status: 'none' };
}
