import { useEffect, useRef, useState, type CSSProperties, type Ref } from 'react';
import type { AnimationItem } from 'lottie-web';
import { getScene, loadScene } from './scenes.js';
import { loadLottie } from './load-lottie.js';
import { applySlots, THEME_SLOTS } from './slots.js';
import type { MotionTheme, SlotColors } from './types.js';

const REDUCED = '(prefers-reduced-motion: reduce)';

/** True while the user asks for reduced motion. False on the server and where matchMedia is missing. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(REDUCED);
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

function themeFrom(el: Element | null): MotionTheme {
  const t = el?.closest('[data-theme]')?.getAttribute('data-theme');
  return t === 'day' ? 'day' : 'night';
}

export interface LottieProps {
  /** Scene name, e.g. "ns-north-settle". */
  scene: string;
  /** Which theme's scene and slot colours. Defaults to the nearest `data-theme` ancestor, else night. */
  theme?: MotionTheme;
  /** Defaults to how the scene was authored (index `loop`). Always off under reduced motion. */
  loop?: boolean;
  /** Defaults to true. Off under reduced motion, which shows the final frame instead. */
  autoplay?: boolean;
  /** Overrides for individual slot colours. */
  slots?: SlotColors;
  /** Preloaded Lottie JSON for the scene, skipping the fetch. */
  animationData?: unknown;
  /** Accessible name. Defaults to the scene's caption; pass "" to mark the scene decorative. */
  label?: string;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
  onReady?: (animation: AnimationItem) => void;
}

/** A Northstar Lottie scene played with lottie-web (SVG renderer), coloured from the theme's slots. */
export function Lottie({ scene, theme, loop, autoplay = true, slots, animationData, label, className, style, ref, onReady }: LottieProps) {
  const box = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const [resolvedTheme, setResolvedTheme] = useState<MotionTheme>(theme ?? 'night');
  const slotKey = JSON.stringify(slots ?? {});

  useEffect(() => {
    setResolvedTheme(theme ?? themeFrom(box.current));
  }, [theme]);

  useEffect(() => {
    const container = box.current;
    if (!container) return;
    let cancelled = false;
    let anim: AnimationItem | undefined;
    const t = resolvedTheme;
    const entry = getScene(scene, t);
    (async () => {
      const data = animationData ?? (await loadScene(scene, t));
      const lottie = await loadLottie();
      if (cancelled) return;
      const colored = applySlots(data, { ...THEME_SLOTS[t], ...(JSON.parse(slotKey) as SlotColors) });
      anim = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: reduced ? false : (loop ?? entry?.loop ?? false),
        autoplay: reduced ? false : autoplay,
        animationData: colored as object,
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
      });
      if (reduced) {
        const still = () => anim?.goToAndStop(Math.max(0, anim.totalFrames - 1), true);
        still();
        anim.addEventListener('DOMLoaded', still);
      }
      onReady?.(anim);
    })().catch(err => {
      if (!cancelled) console.error(`@northstar-js/motion: ${t}/${scene} failed to load`, err);
    });
    return () => {
      cancelled = true;
      anim?.destroy();
    };
    // onReady is a callback; re-running for a new identity would restart the scene.
  }, [scene, resolvedTheme, loop, autoplay, reduced, slotKey, animationData]);

  const name = label ?? getScene(scene, resolvedTheme)?.caption ?? scene;
  const a11y = name ? { role: 'img', 'aria-label': name } : { 'aria-hidden': true as const };
  return (
    <div
      ref={el => {
        box.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      className={className}
      style={style}
      data-ns-scene={scene}
      data-reduced-motion={reduced ? '' : undefined}
      {...a11y}
    />
  );
}
