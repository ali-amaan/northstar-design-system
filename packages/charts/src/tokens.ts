import { cssVar, tokens, type ThemeTokenPath } from '@northstar-js/tokens';

/** var(--ns-…, <Night value>) from @northstar-js/tokens, so a chart renders even without tokens.css. */
const ref = (path: ThemeTokenPath): string => `var(${cssVar[path]}, ${tokens.themes.night[path]})`;

/** CSS variables used by charts. */
export const v = {
  signal: ref('color.signal.default'),
  signalWash: ref('color.signal.wash'),
  signalEdge: ref('color.signal.edge'),
  text1: ref('color.text.1'),
  text2: ref('color.text.2'),
  text3: ref('color.text.3'),
  line1: ref('color.line.1'),
  line2: ref('color.line.2'),
  surface2: ref('color.surface.2'),
  mono: 'var(--ns-font-mono, "IBM Plex Mono", ui-monospace, monospace)',
  sans: 'var(--ns-font-sans, Inter, system-ui, sans-serif)',
} as const;

/** Ordinal Likert ramp, five steps (color.data.likert.1-5). */
export const likertRamp = [
  ref('color.data.likert.1'),
  ref('color.data.likert.2'),
  ref('color.data.likert.3'),
  ref('color.data.likert.4'),
  ref('color.data.likert.5'),
] as const;
