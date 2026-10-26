import { cssVar, tokens, type ThemeTokenPath } from '@northstar-js/tokens';

/** var(--ns-…, <Night value>) from @northstar-js/tokens. */
export const ref = (path: ThemeTokenPath): string => `var(${cssVar[path]}, ${tokens.themes.night[path]})`;

export const C = {
  text1: ref('color.text.1'),
  text2: ref('color.text.2'),
  text3: ref('color.text.3'),
  signal: ref('color.signal.default'),
  signalWash: ref('color.signal.wash'),
  surface2: ref('color.surface.2'),
  line2: ref('color.line.2'),
} as const;
