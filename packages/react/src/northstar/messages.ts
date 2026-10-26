import type { QuestionType, ResponseFormat, StudyState, StudyTab } from '@northstar-js/contracts';

/** Every string the Northstar components show. English ships as the default. */
export interface StudyMessages {
  states: Record<StudyState, string>;
  tabs: Record<StudyTab, string>;
  studies: string;
  studySections: string;
  studyProperties: string;
  saved: string;
  saving: string;
  // Brief
  studyName: string;
  decision: string;
  decisionPlaceholder: string;
  objectives: string;
  objectiveCount: (n: number, max: number) => string;
  addObjective: string;
  objectiveLabel: (i: number) => string;
  objectivePlaceholder: string;
  removeObjective: (i: number) => string;
  objectivesHint: string;
  emptyBriefTitle: string;
  emptyBriefBody: string;
  // Population
  market: string;
  size: string;
  seed: string;
  rebuild: string;
  rebuildHint: string;
  composition: string;
  panel: string;
  margin: string;
  scope: string;
  scopeBody: string;
  emptyPopulationTitle: string;
  emptyPopulationBody: string;
  // Research
  items: string;
  addItem: string;
  itemId: (i: number) => string;
  moveUp: (id: string) => string;
  moveDown: (id: string) => string;
  removeItem: (id: string) => string;
  wording: string;
  questionType: string;
  format: string;
  anchors: string;
  anchorLabel: (i: number) => string;
  anchorPasses: string;
  anchorNeedsFix: string;
  needsFix: string;
  anchorHint: string;
  questionTypes: Record<QuestionType, string>;
  formats: Record<ResponseFormat, string>;
  emptyResearchTitle: string;
  emptyResearchBody: string;
  selectItem: string;
  // Responses
  responsesIntro: string;
  itemCount: (n: number) => string;
  otherItems: string;
  distribution: string;
  emptyResponsesTitle: string;
  emptyResponsesBody: string;
  // Run
  run: string;
  runStudy: string;
  estimatedCost: string;
  costUnavailable: string;
  costUnavailableHint: string;
  runConfirmTitle: string;
  runConfirmBody: string;
  cancel: string;
  confirmRun: string;
  // Export
  export: string;
  exportFormats: { pdf: string; spec: string; csv: string };
}

export const enStudy: StudyMessages = {
  states: {
    draft: 'Draft',
    ready: 'Ready',
    running: 'Running',
    complete: 'Complete',
    partial: 'Partial',
    failed: 'Failed',
    archived: 'Archived',
  },
  tabs: { brief: 'Brief', population: 'Population', research: 'Research', responses: 'Responses' },
  studies: 'Studies',
  studySections: 'Study sections',
  studyProperties: 'Study properties',
  saved: 'Saved',
  saving: 'Saving…',
  studyName: 'Study name',
  decision: 'Decision this study informs',
  decisionPlaceholder: 'Name the one decision this study informs.',
  objectives: 'Objectives',
  objectiveCount: (n, max) => `${n} of ${max}`,
  addObjective: 'Add',
  objectiveLabel: (i) => `Objective O${i + 1}`,
  objectivePlaceholder: 'Add an objective…',
  removeObjective: (i) => `Remove objective O${i + 1}`,
  objectivesHint: 'Every research item points at one objective, and Responses groups figures the same way.',
  emptyBriefTitle: 'Start with the decision',
  emptyBriefBody: 'Name the one decision this study informs.',
  market: 'Market',
  size: 'Size',
  seed: 'Seed',
  rebuild: 'Rebuild',
  rebuildHint: 'Deterministic · 0 API calls',
  composition: 'Composition',
  panel: 'Panel',
  margin: 'Margin',
  scope: 'Scope',
  scopeBody: 'One population per study. Results describe it as a whole; groups inside it are not compared.',
  emptyPopulationTitle: 'No panel yet',
  emptyPopulationBody: 'The roster is free; writing personas is paid and shows a cost estimate first.',
  items: 'Items',
  addItem: 'Item',
  itemId: (i) => `R${i + 1}`,
  moveUp: (id) => `Move ${id} up`,
  moveDown: (id) => `Move ${id} down`,
  removeItem: (id) => `Remove ${id}`,
  wording: 'Wording',
  questionType: 'Question type',
  format: 'Format',
  anchors: 'Anchors',
  anchorLabel: (i) => `Anchor ${i + 1}`,
  anchorPasses: 'Passes',
  anchorNeedsFix: 'Needs a fix',
  needsFix: 'Fix',
  anchorHint: 'The anchor check is free and reruns as you type.',
  questionTypes: {
    mood_direction: 'Mood and direction',
    consensus_trust: 'Consensus and trust',
    neutral_factual: 'Neutral factual',
    concrete_habit: 'Concrete habit',
    values_identity: 'Values and identity',
    intention_virtue: 'Intention and virtue',
  },
  formats: {
    likert: 'Likert 5',
    single_choice: 'Single',
    multi_select: 'Multiple',
    ranking: 'Ranking',
    free_text: 'Free text',
    price_trial: 'Price trial',
  },
  emptyResearchTitle: 'No items yet',
  emptyResearchBody: 'Every anchor passes the free gate before any paid call.',
  selectItem: 'Select an item to edit it.',
  responsesIntro: 'Screening signals about the population as a whole, not predictions about any person.',
  itemCount: (n) => `${n} ${n === 1 ? 'item' : 'items'}`,
  otherItems: 'Other items',
  distribution: 'Distribution',
  emptyResponsesTitle: 'No responses yet',
  emptyResponsesBody: 'A cost estimate comes before any paid run.',
  run: 'Run',
  runStudy: 'Run study',
  estimatedCost: 'Estimated cost',
  costUnavailable: 'Cost unavailable',
  costUnavailableHint: 'Running needs a cost estimate. Nothing is spent until you confirm.',
  runConfirmTitle: 'Run this study?',
  runConfirmBody: 'This is a paid run. Nothing is spent until you confirm.',
  cancel: 'Cancel',
  confirmRun: 'Run study',
  export: 'Export',
  exportFormats: { pdf: 'Export PDF', spec: 'Report spec (JSON)', csv: 'Responses (CSV)' },
};

/** Merge partial overrides over the English defaults (one level deep for the record fields). */
export function studyMessages(override?: Partial<StudyMessages>): StudyMessages {
  if (!override) return enStudy;
  return {
    ...enStudy,
    ...override,
    states: { ...enStudy.states, ...override.states },
    tabs: { ...enStudy.tabs, ...override.tabs },
    questionTypes: { ...enStudy.questionTypes, ...override.questionTypes },
    formats: { ...enStudy.formats, ...override.formats },
    exportFormats: { ...enStudy.exportFormats, ...override.exportFormats },
  };
}

export interface WithMessages {
  /** String overrides; English defaults fill the rest. */
  messages?: Partial<StudyMessages> | undefined;
}
