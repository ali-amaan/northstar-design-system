// @northstar-js/react/backdrops — animated star backdrops. One component,
// fifteen interchangeable variants, all drawn from seeded maths (no
// Math.random) in the 720 × 450 design frame and sliced to cover their
// container. Styles ship in `backdrops.css`; load it after `tokens.css`.
export { StarBackdrop } from './StarBackdrop.js';
export type { StarBackdropProps } from './StarBackdrop.js';
export { BACKDROP_VARIANTS, countMarks, sceneData } from './scenes.js';
export type { BackdropVariant } from './scenes.js';
export { CAP, DENSITY, lcg, thin } from './math.js';
export type { BackdropDensity } from './math.js';
