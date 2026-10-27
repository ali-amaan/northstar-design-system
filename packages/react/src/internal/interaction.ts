'use client';
// The interaction layer's only JavaScript: pointer tracking for spotlights and
// magnetic controls, and a presence hook that lets overlays play an exit
// animation. Everything writes CSS custom properties or attributes straight to
// the element, so pointer movement never re-renders React.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const raf: (cb: () => void) => number =
  typeof window !== 'undefined' && window.requestAnimationFrame
    ? (cb) => window.requestAnimationFrame(cb)
    : (cb) => setTimeout(cb, 16) as unknown as number;
const caf: (id: number) => void =
  typeof window !== 'undefined' && window.cancelAnimationFrame ? (id) => window.cancelAnimationFrame(id) : (id) => clearTimeout(id);

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface PointerOptions {
  /** Pull the element toward the pointer by up to this many px (magnetic). 0 disables. */
  magnetic?: number;
}

/**
 * Tracks the pointer over an element, rAF-throttled, and writes
 * `--ns-mx` / `--ns-my` (px from the top-left, for spotlights and specular
 * highlights), `--ns-pointer-x` / `--ns-pointer-y` (unitless, -1 at the
 * left/top edge to 1 at the right/bottom, for the spin finish's turning
 * sweep) and, when magnetic, `--ns-mag-x` / `--ns-mag-y`. Touch is
 * ignored; the pointer effects are a hover affordance and keyboard focus gets
 * an equivalent centred highlight from CSS.
 */
export function usePointerTracking<T extends HTMLElement>(enabled: boolean | ((el: T) => boolean), options: PointerOptions = {}): React.RefCallback<T> {
  const magnetic = options.magnetic ?? 0;
  const cleanup = useRef<(() => void) | null>(null);
  // A predicate is decided once, when the element mounts (e.g. "am I on glass?").
  const test = useRef(enabled);
  test.current = enabled;
  const key = typeof enabled === 'function' ? 'test' : enabled;
  return useCallback(
    (el: T | null) => {
      cleanup.current?.();
      cleanup.current = null;
      const on = typeof test.current === 'function' ? !!el && test.current(el) : test.current;
      if (!el || !on) return;
      let frame = 0;
      let last: PointerEvent | null = null;
      const flush = () => {
        frame = 0;
        if (!last) return;
        const r = el.getBoundingClientRect();
        const x = last.clientX - r.left;
        const y = last.clientY - r.top;
        el.style.setProperty('--ns-mx', `${x.toFixed(1)}px`);
        el.style.setProperty('--ns-my', `${y.toFixed(1)}px`);
        if (r.width <= 0 || r.height <= 0) return;
        const dx = Math.max(-1, Math.min(1, (x / r.width - 0.5) * 2));
        const dy = Math.max(-1, Math.min(1, (y / r.height - 0.5) * 2));
        el.style.setProperty('--ns-pointer-x', dx.toFixed(3));
        el.style.setProperty('--ns-pointer-y', dy.toFixed(3));
        if (magnetic > 0 && !prefersReducedMotion()) {
          el.style.setProperty('--ns-mag-x', `${(dx * magnetic).toFixed(2)}px`);
          el.style.setProperty('--ns-mag-y', `${(dy * magnetic).toFixed(2)}px`);
        }
      };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === 'touch') return;
        last = e;
        el.setAttribute('data-pointer', '');
        if (!frame) frame = raf(flush);
      };
      const onLeave = () => {
        last = null;
        if (frame) caf(frame);
        frame = 0;
        el.removeAttribute('data-pointer');
        el.style.removeProperty('--ns-pointer-x');
        el.style.removeProperty('--ns-pointer-y');
        el.style.removeProperty('--ns-mag-x');
        el.style.removeProperty('--ns-mag-y');
      };
      el.addEventListener('pointermove', onMove, { passive: true });
      el.addEventListener('pointerleave', onLeave);
      cleanup.current = () => {
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerleave', onLeave);
        if (frame) caf(frame);
      };
    },
    [key, magnetic],
  );
}

function longestAnimation(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  if (!cs.animationName || cs.animationName === 'none') return 0;
  const parse = (s: string) => (s.trim().endsWith('ms') ? parseFloat(s) : parseFloat(s) * 1000) || 0;
  const durations = (cs.animationDuration || '0s').split(',').map(parse);
  const delays = (cs.animationDelay || '0s').split(',').map(parse);
  return Math.max(0, ...durations.map((d, i) => d + (delays[i] ?? 0)));
}

/**
 * Keeps a layer mounted after `open` turns false until its exit animation
 * (`[data-state='closed']` in CSS) has played. With no animation — reduced
 * motion, forced zero durations, or no stylesheet — it unmounts at once.
 */
export function usePresence(open: boolean, ref: React.RefObject<HTMLElement | null>): boolean {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  useIsoLayoutEffect(() => {
    if (open || !mounted) return;
    const el = ref.current;
    const ms = el ? longestAnimation(el) : 0;
    if (!el || ms <= 0) {
      setMounted(false);
      return;
    }
    const done = () => setMounted(false);
    const onEnd = (e: AnimationEvent) => {
      if (e.target === el) done();
    };
    el.addEventListener('animationend', onEnd);
    const t = setTimeout(done, ms + 60);
    return () => {
      el.removeEventListener('animationend', onEnd);
      clearTimeout(t);
    };
  }, [open, mounted]);
  return open || mounted;
}
