/**
 * Placeholder fixtures. Display strings use placeholder tokens only; numeric
 * values are obviously synthetic (zeros and even splits), never plausible results.
 */
import type { Distribution, FigureValue, Study } from './index.js';

const ANCHORS = ['[OPTION] 1', '[OPTION] 2', '[OPTION] 3', '[OPTION] 4', '[OPTION] 5'];

export const placeholderDistribution: Distribution = {
  anchors: ANCHORS,
  shares: [0.2, 0.2, 0.2, 0.2, 0.2],
};

export interface FigureFixture {
  figure: FigureValue;
  /** How the figure would be displayed, in placeholder tokens. */
  display: string;
}

export const figures = {
  level: {
    figure: { value: 0, band: 0, claim: 'level', caption: '[SHARE] ± [BAND] of [N] respondents.', state: 'ok' },
    display: '[SHARE] ± [BAND]',
  },
  direction: {
    figure: { value: 0, claim: 'direction', caption: 'Direction only; the level is not reported.', state: 'ok' },
    display: '[OPTION] leads',
  },
  ranking: {
    figure: { value: 0, claim: 'ranking', caption: 'Ranking between items, never the level.', state: 'ok' },
    display: '[OPTION] ranks first of [N]',
  },
  withheld: {
    figure: { value: 0, claim: 'level', caption: 'Withheld: below the reporting gate.', state: 'withheld' },
    display: '[SHARE]',
  },
  stale: {
    figure: { value: 0, band: 0, claim: 'level', caption: 'Stale: panel [SEED] has been rebuilt.', state: 'stale' },
    display: '[SHARE] ± [BAND]',
  },
} as const satisfies Record<string, FigureFixture>;

export const studyAurora: Study = {
  id: 'study-aurora',
  title: 'Study Aurora',
  state: 'draft',
  tab: 'brief',
  population: { code: 'FI', size: 0, label: '[N] adults, seed [SEED]' },
  objectives: ['Screen [OPTION] against [OPTION].'],
  items: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  cost: null,
};

export const studyBorealis: Study = {
  id: 'study-borealis',
  title: 'Study Borealis',
  state: 'complete',
  tab: 'responses',
  population: { code: 'FI', panelId: 'panel-borealis', size: 0, seed: 0, label: '[N] adults, seed [SEED]' },
  objectives: ['Rank [OPTION] options for [NAME].'],
  items: [
    {
      key: 'item-1',
      question: '[NAME]: how much do you agree with [OPTION]?',
      type: 'mood_direction',
      format: 'likert',
      anchors: ANCHORS,
      result: { distribution: placeholderDistribution, headline: figures.level.figure },
    },
    {
      key: 'item-2',
      question: '[NAME]: would you choose [OPTION]?',
      type: 'intention_virtue',
      format: 'likert',
      anchors: ANCHORS,
      result: { distribution: placeholderDistribution, headline: figures.direction.figure },
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  cost: { amount: 0, currency: 'EUR', basis: '[COST] per [N] respondents' },
};

export const studyCassiopeia: Study = {
  id: 'study-cassiopeia',
  title: 'Study Cassiopeia',
  state: 'running',
  tab: 'research',
  population: { code: 'JP', size: 0, label: '[N] adults' },
  objectives: ['Direction of [OPTION] for [NAME].'],
  items: [{ key: 'item-1', question: '[NAME]: [OPTION]?', type: 'concrete_habit', anchors: ANCHORS }],
  createdAt: '2026-01-01T00:00:00.000Z',
  cost: { amount: 0, currency: 'EUR', basis: '[COST] estimate' },
};

export const studyDraco: Study = {
  id: 'study-draco',
  title: 'Study Draco',
  state: 'failed',
  population: { code: 'US', size: 0 },
  objectives: [],
  items: [],
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const studies: readonly Study[] = [studyAurora, studyBorealis, studyCassiopeia, studyDraco];
