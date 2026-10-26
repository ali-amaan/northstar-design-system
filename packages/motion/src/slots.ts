import type { MotionTheme, SlotColors } from './types.js';

/**
 * The slot colours each theme's scenes were authored with (the generators' THEMES tables).
 * `bgColor` is the ground used for cut-outs in the larger scenes.
 */
export const THEME_SLOTS: Readonly<Record<MotionTheme, Readonly<Record<string, string>>>> = {
  night: { accent: '#93B4E0', ink: '#E8EAEE', muted: '#848A94', bgColor: '#08090C' },
  day: { accent: '#2F5D9A', ink: '#06080C', muted: '#656A75', bgColor: '#FFFFFF' },
};

export function toRgba(c: string | readonly number[]): number[] {
  if (typeof c !== 'string') return [c[0] ?? 0, c[1] ?? 0, c[2] ?? 0, c[3] ?? 1];
  const m = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(c.trim());
  if (!m || !m[1]) throw new Error(`not a hex colour: ${c}`);
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, m[2] ? parseInt(m[2], 16) / 255 : 1];
}

type Json = unknown;

/**
 * Returns a copy of a Lottie document with its slots set to `colors`, and every property that points at a
 * slot (`{ "sid": "ink" }`) replaced by that slot's static value. Resolving in place means the result plays
 * in any lottie-web build, whether or not it reads `slots` itself.
 */
export function applySlots<T>(animation: T, colors: SlotColors): T {
  const doc = animation as { slots?: Record<string, { p: { a: number; k: Json } }> };
  const values: Record<string, Json> = {};
  for (const [sid, slot] of Object.entries(doc.slots ?? {})) values[sid] = slot.p.k;
  for (const [sid, c] of Object.entries(colors)) values[sid] = toRgba(c);
  const walk = (v: Json): Json => {
    if (Array.isArray(v)) return v.map(walk);
    if (!v || typeof v !== 'object') return v;
    const o = v as Record<string, Json>;
    if (typeof o.sid === 'string' && o.sid in values && !('k' in o)) return { a: 0, k: values[o.sid] };
    const out: Record<string, Json> = {};
    for (const [k, x] of Object.entries(o)) out[k] = walk(x);
    return out;
  };
  const out = walk(animation) as { slots?: Record<string, { p: { a: number; k: Json } }> };
  if (out.slots) for (const sid of Object.keys(out.slots)) out.slots[sid] = { p: { a: 0, k: values[sid] } };
  return out as T;
}
