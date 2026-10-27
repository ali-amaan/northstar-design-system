// Deterministic maths for the star backdrops. Nothing here calls Math.random:
// every scatter comes from the same linear congruential generator the approved
// designs used, so the server, the client and every screenshot agree.

/** The four-point north star on a unit box, scaled per star with `transform`. */
export const STAR = 'M0 -1L.2 -.2L1 0L.2 .2L0 1L-.2 .2L-1 0L-.2 -.2Z';

/** CSS polygon of the same star, for the 3D (HTML) scenes. */
export const STAR_CLIP = 'polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%)';

/** The design frame every scene is drawn in; the root covers its container with it (slice). */
export const FRAME = { w: 720, h: 450 } as const;

/**
 * Numerical Recipes LCG, exactly as in the approved designs:
 * seed = (seed × 1664525 + 1013904223) mod 2³², returned as [0, 1).
 * The products stay below 2⁵³, so the doubles are exact.
 */
export function lcg(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

export type BackdropDensity = 'low' | 'medium' | 'high';

/** Share of the approved element count kept at each density. `high` is the approved design. */
export const DENSITY: Record<BackdropDensity, number> = { low: 0.35, medium: 0.65, high: 1 };

/**
 * Hard ceiling on drawn marks per backdrop at each density, whatever the
 * design's own count: the share is lowered until the scene fits. `high` is
 * set above every approved design, so it always draws the full design.
 */
export const CAP: Record<BackdropDensity, number> = { low: 240, medium: 480, high: 1800 };

const PHI_FRAC = 0.6180339887498949;

/**
 * Low-discrepancy thinning: keeps item i when frac(i·φ) < share, so whatever
 * is left stays evenly spread over the field, and the same items survive on
 * every render. Items marked `keep` (the Glacier stars, the north star) always stay.
 */
export function thin<T extends { keep?: boolean }>(items: T[], share: number): T[] {
  if (share >= 1) return items;
  return items.filter((it, i) => it.keep || (i * PHI_FRAC) % 1 < share);
}

/** One decimal place, as the designs print coordinates. */
export const f1 = (n: number): string => n.toFixed(1);
/** Two decimal places. */
export const f2 = (n: number): string => n.toFixed(2);

/** The golden angle in radians, π(3 − √5). */
export const GOLDEN = Math.PI * (3 - Math.sqrt(5));
