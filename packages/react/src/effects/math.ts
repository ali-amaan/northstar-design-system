// Deterministic maths for the effects layer. Nothing here calls Math.random:
// every "scatter" is seeded, so a server render, a client render and a
// screenshot all agree.

/** The golden angle in degrees: 360 × (1 − 1/φ). Vogel's sunflower spacing. */
export const GOLDEN_ANGLE = 137.50776405003785;
const GOLDEN_RAD = (GOLDEN_ANGLE * Math.PI) / 180;

/** The first primes, used for timings that should never fall into step. */
export const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37] as const;

/** First Fibonacci numbers (1, 1, 2, 3, 5, …). */
export function fibonacci(n: number): number[] {
  const out: number[] = [];
  let a = 1;
  let b = 1;
  for (let i = 0; i < n; i++) {
    out.push(a);
    [a, b] = [b, a + b];
  }
  return out;
}

/** Mulberry32: a tiny seeded PRNG, uniform in [0, 1). */
export function seeded(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Vogel's spiral: point `i` of `n` on a unit disc, golden-angle spaced. */
export function vogel(i: number, n: number): { x: number; y: number; r: number; a: number } {
  const r = Math.sqrt((i + 0.5) / n);
  const a = i * GOLDEN_RAD;
  return { x: r * Math.cos(a), y: r * Math.sin(a), r, a };
}

/** Points of a Lissajous figure x = sin(a·t + δ), y = sin(b·t), as an SVG path on a box of `size`. */
export function lissajousPath(a: number, b: number, size: number, delta = Math.PI / 2, steps = 160): string {
  const h = size / 2;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = h + h * Math.sin(a * t + delta);
    const y = h + h * Math.sin(b * t);
    d += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${d}Z`;
}

/** Round to 2 dp for stable SVG/CSS output. */
export const r2 = (n: number): number => Math.round(n * 100) / 100;

/** The four-point north star, centred on (x, y) with outer radius `o` and waist `w`. */
export function starPath(x: number, y: number, o: number, w = o * 0.2): string {
  const p = (a: number, b: number) => `${r2(a)} ${r2(b)}`;
  return `M${p(x, y - o)} L${p(x + w, y - w)} L${p(x + o, y)} L${p(x + w, y + w)} L${p(x, y + o)} L${p(x - w, y + w)} L${p(x - o, y)} L${p(x - w, y - w)}Z`;
}

export const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));
