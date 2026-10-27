'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { DENSITY, FRAME, type BackdropDensity } from './math.js';
import { SCENES, sceneData, type BackdropVariant } from './scenes.js';

export interface StarBackdropProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Which backdrop. Every variant takes the same props, so they swap freely. Default `constellation-atlas`. */
  variant?: BackdropVariant;
  /** Force Night or Day colours for this backdrop; by default it follows the surrounding theme. */
  theme?: 'night' | 'day';
  /**
   * How many stars: `high` is the approved design, `medium` about 65 % of it
   * and `low` about 35 %, capped at 480 and 240 marks. The signal stars always
   * stay. Default `medium`.
   */
  density?: BackdropDensity;
  /** Animation speed multiplier (2 is twice as fast). 0 holds still. Default 1. */
  speed?: number;
  /** Holds every animation where it is. Backdrops also pause by themselves offscreen and while the page is hidden. */
  paused?: boolean;
  /** Paint the backdrop ground (`--ns-backdrop-ground`). `false` draws the stars only, over whatever is behind. Default true. */
  ground?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

const QUERY = '(prefers-reduced-motion: reduce)';

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(QUERY);
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

/**
 * An animated star field that fills its container: absolutely positioned,
 * `aria-hidden`, never takes the pointer, and covers any aspect ratio (the
 * 720 × 450 design frame is sliced to fit). Geometry is seeded and memoised,
 * so the server and the client draw the same stars. Animations are CSS only;
 * they pause offscreen and while the document is hidden, and under reduced
 * motion the backdrop is a still frame. Load `@northstar-js/react/backdrops.css`.
 */
export function StarBackdrop({
  variant = 'constellation-atlas',
  theme,
  density = 'medium',
  speed = 1,
  paused = false,
  ground = true,
  className,
  style,
  ref,
  ...rest
}: StarBackdropProps) {
  const scene = SCENES[variant] ?? SCENES['constellation-atlas'];
  const id = `ns-bd-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const level: BackdropDensity = density in DENSITY ? density : 'medium';
  const key = scene === SCENES[variant] ? variant : 'constellation-atlas';
  const content = useMemo(() => scene.render(sceneData(key, level) as never, id), [scene, key, level, id]);
  const reduced = useReducedMotion();
  const node = useRef<HTMLDivElement | null>(null);
  const still = !(speed > 0);

  // Pause offscreen and while the page is hidden: written straight to the
  // element, so it never re-renders the scene. 3D scenes are scaled to cover.
  const kind = scene.kind;
  useEffect(() => {
    const el = node.current;
    if (!el || typeof window === 'undefined') return;
    let offscreen = false;
    const sync = () => {
      const idle = offscreen || (typeof document !== 'undefined' && document.visibilityState === 'hidden');
      if (idle) el.setAttribute('data-idle', '');
      else el.removeAttribute('data-idle');
    };
    const io =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver((entries) => {
            for (const e of entries) offscreen = !e.isIntersecting;
            sync();
          })
        : null;
    io?.observe(el);
    const ro =
      kind === '3d' && typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            const k = Math.max(el.clientWidth / FRAME.w, el.clientHeight / FRAME.h);
            if (k > 0) el.style.setProperty('--ns-bd-k', k.toFixed(4));
          })
        : null;
    ro?.observe(el);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      io?.disconnect();
      ro?.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [kind]);

  return (
    <div
      {...rest}
      ref={(el) => {
        node.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) (ref as React.RefObject<HTMLDivElement | null>).current = el;
      }}
      aria-hidden="true"
      data-variant={variant}
      data-density={density}
      data-theme={theme}
      data-paused={paused || still || undefined}
      data-motion={reduced ? 'reduced' : undefined}
      className={['ns-backdrop', `ns-backdrop--${variant}`, `ns-backdrop--${kind}`, ground ? '' : 'ns-backdrop--bare', className ?? ''].filter(Boolean).join(' ')}
      style={{ '--ns-bd-speed': still ? 1 : Math.min(20, Math.max(0.05, speed)), ...style } as React.CSSProperties}
    >
      {content}
    </div>
  );
}
