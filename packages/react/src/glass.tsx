'use client';
// Liquid glass. The refraction is an SVG filter used as a backdrop-filter:
// a displacement map that is neutral (50 % grey) in the body and ramps at the
// rim, so the backdrop bends inward at the edges like light through a thick
// lens; three displacements at slightly different scales split the colour at
// the rim (chromatic aberration), then a little frost and saturation.
// Only Chromium applies url() filters in backdrop-filter, so the root gets
// data-ns-liquid="refract" there; everywhere else the CSS falls back to blur
// plus the specular layers, and to the opaque solid under reduced
// transparency, in forced colours, and without backdrop-filter.
import { useEffect, useId, useRef, useState } from 'react';
import { cx, mergeRefs } from './internal/util.js';

/** Mirrors `material.liquid.*` in @northstar-js/tokens (checked by a test). */
export const LIQUID = {
  scale: { sm: 14, md: 28, lg: 44 },
  bevel: 0.16,
  aberration: 2,
  frost: 0.6,
  /** Mirrors `radius.glass.*`: tight corners for precision, never fully round. */
  radius: { panel: 10, bar: 10, control: 7, inner: 6 },
} as const;
export type LiquidSize = keyof typeof LIQUID.scale;
/** A `radius.glass.*` step, `pill` (now the bar radius, not fully round) or `full` (a true circle or capsule). */
export type LiquidRadius = number | keyof typeof LIQUID.radius | 'pill' | 'full';

/**
 * The displacement map as an SVG data URI. Red carries x, green carries y;
 * each ramps from 1 to 0.5 across the rim and stays at 0.5 (no movement) in
 * the body. With `w`/`h` the rim is in true pixels; without, it is a fraction
 * of a stretched 100 × 100 box, which is close enough for small controls.
 */
export function displacementMap(w = 100, h = 100, bevel: number = LIQUID.bevel, radius = 0): string {
  const b = Math.max(1, Math.min(w, h) * bevel);
  const fx = Math.min(0.5, b / w);
  const fy = Math.min(0.5, b / h);
  const r = Math.min(radius, Math.min(w, h) / 2);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">` +
    `<defs><linearGradient id="x" x2="1"><stop offset="0" stop-color="#f00"/><stop offset="${fx}" stop-color="#800000"/><stop offset="${1 - fx}" stop-color="#800000"/><stop offset="1" stop-color="#000"/></linearGradient>` +
    `<linearGradient id="y" x2="0" y2="1"><stop offset="0" stop-color="#0f0"/><stop offset="${fy}" stop-color="#008000"/><stop offset="${1 - fy}" stop-color="#008000"/><stop offset="1" stop-color="#000"/></linearGradient>` +
    `<filter id="s"><feGaussianBlur stdDeviation="${(b / 3).toFixed(1)}"/></filter></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#x)"/><rect width="${w}" height="${h}" fill="url(#y)" style="mix-blend-mode:screen"/>` +
    `<rect x="${b}" y="${b}" width="${Math.max(0, w - 2 * b)}" height="${Math.max(0, h - 2 * b)}" rx="${Math.max(0, r - b)}" fill="#808000" filter="url(#s)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function channel(name: 'R' | 'G' | 'B') {
  const m = { R: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', G: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', B: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0' };
  return m[name];
}

interface FilterProps {
  id: string;
  scale: number;
  map: string;
  aberration?: number;
  frost?: number;
  width?: number;
  height?: number;
}

/** One refraction filter. Shared presets use a stretched map; LiquidGlass with a numeric scale renders its own, measured. */
export function LiquidFilter({ id, scale, map, aberration = LIQUID.aberration, frost = LIQUID.frost, width, height }: FilterProps) {
  const box = width && height ? { x: 0, y: 0, width, height, filterUnits: 'userSpaceOnUse' as const } : { x: '0%', y: '0%', width: '100%', height: '100%' };
  const img = width && height ? { width, height } : { width: '100%', height: '100%' };
  return (
    <filter id={id} {...box} colorInterpolationFilters="sRGB">
      <feImage href={map} x="0" y="0" {...img} preserveAspectRatio="none" result="map" />
      {(['R', 'G', 'B'] as const).map((c, i) => (
        <feDisplacementMap key={c} in="SourceGraphic" in2="map" scale={scale + (i - 1) * aberration * -1} xChannelSelector="R" yChannelSelector="G" result={`d${c}`} />
      ))}
      {(['R', 'G', 'B'] as const).map((c) => (
        <feColorMatrix key={c} in={`d${c}`} type="matrix" values={channel(c)} result={`c${c}`} />
      ))}
      <feBlend in="cR" in2="cG" mode="screen" result="rg" />
      <feBlend in="rg" in2="cB" mode="screen" result="rgb" />
      <feGaussianBlur in="rgb" stdDeviation={frost} result="frost" />
      <feColorMatrix in="frost" type="saturate" values="1.5" />
    </filter>
  );
}

let defsUsers = 0;
let defsHost: HTMLElement | null = null;

function supportsRefraction(): boolean {
  if (typeof navigator === 'undefined' || typeof CSS === 'undefined' || !CSS.supports?.('backdrop-filter', 'url(#a)')) return false;
  const brands = (navigator as Navigator & { userAgentData?: { brands?: Array<{ brand: string }> } }).userAgentData?.brands;
  if (brands) return brands.some((b) => /Chromium|Chrome|Edge/.test(b.brand));
  return /Chrome\/|Chromium\/|Edg\//.test(navigator.userAgent) && !/Firefox\//.test(navigator.userAgent);
}

/**
 * The shared filter defs (`#ns-liquid-sm|md|lg`), inserted once into
 * document.body however many providers mount, and removed with the last one.
 * Also marks <html data-ns-liquid="refract"> where refraction is supported.
 */
export function useLiquidDefs(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;
    defsUsers++;
    if (!defsHost) {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      svg.setAttribute('width', '0');
      svg.setAttribute('height', '0');
      svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none');
      svg.setAttribute('data-ns-liquid-defs', '');
      const map = displacementMap();
      const parts = (Object.keys(LIQUID.scale) as LiquidSize[]).map((size) => {
        const s = LIQUID.scale[size];
        const ch = (['R', 'G', 'B'] as const)
          .map((c, i) => `<feDisplacementMap in="SourceGraphic" in2="map" scale="${s - (i - 1) * LIQUID.aberration}" xChannelSelector="R" yChannelSelector="G" result="d${c}"/><feColorMatrix in="d${c}" type="matrix" values="${channel(c)}" result="c${c}"/>`)
          .join('');
        return `<filter id="ns-liquid-${size}" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB"><feImage href="${map}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map"/>${ch}<feBlend in="cR" in2="cG" mode="screen" result="rg"/><feBlend in="rg" in2="cB" mode="screen" result="rgb"/><feGaussianBlur in="rgb" stdDeviation="${LIQUID.frost}" result="f"/><feColorMatrix in="f" type="saturate" values="1.5"/></filter>`;
      });
      svg.innerHTML = `<defs>${parts.join('')}</defs>`;
      document.body.appendChild(svg);
      defsHost = svg as unknown as HTMLElement;
      if (supportsRefraction()) document.documentElement.setAttribute('data-ns-liquid', 'refract');
    }
    return () => {
      defsUsers--;
      if (defsUsers <= 0 && defsHost) {
        defsHost.remove();
        defsHost = null;
        defsUsers = 0;
        document.documentElement.removeAttribute('data-ns-liquid');
      }
    };
  }, [enabled]);
}

type GlassTag = 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'nav' | 'span' | 'li';

export interface LiquidGlassProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Refraction strength. A preset (`sm` for controls, `md` for cards and bars,
   * `lg` for sheets and dialogs) uses the shared filter; a number (px of
   * displacement) renders a filter measured to this element.
   */
  scale?: LiquidSize | number;
  /**
   * Corner radius: px, or a `radius.glass.*` step (`panel`, `bar`, `control`,
   * `inner`). `pill` is the bar radius (glass is no longer fully round);
   * `full` is a true capsule. Default `panel` (10px).
   */
  radius?: LiquidRadius;
  /** Lift with a soft drop shadow. Default true. */
  floating?: boolean;
  /** Glacier tint strength. `none` keeps only the neutral body. */
  tint?: 'none' | 'subtle' | 'signal';
  as?: GlassTag;
  ref?: React.Ref<HTMLElement>;
}

/**
 * Thin, refractive glass in the iOS 26 manner: the backdrop bends at the rim,
 * a specular highlight sits on the top-left, a rim of light runs round the
 * edge with an inner glow under it, and the body carries a faint glacier tint.
 */
export function LiquidGlass({ scale = 'md', radius = 'panel', floating = true, tint = 'subtle', as: Tag = 'div', className, style, ref, children, ...rest }: LiquidGlassProps) {
  const custom = typeof scale === 'number';
  const fid = `ns-lg-${useId().replace(/:/g, '')}`;
  const node = useRef<HTMLElement | null>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = node.current;
    if (!custom || !el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      setBox((b) => (b && b.w === w && b.h === h ? b : w > 0 && h > 0 ? { w, h } : b));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [custom]);
  const step = radius === 'pill' ? 'bar' : radius;
  const r = typeof step === 'number' ? step : step === 'full' ? 9999 : LIQUID.radius[step];
  const vars: Record<string, string> = {
    '--ns-liquid-radius': typeof step === 'number' ? `${step}px` : step === 'full' ? '9999px' : `var(--ns-radius-glass-${step})`,
  };
  if (custom && box) vars['--ns-liquid-filter'] = `url(#${fid})`;
  return (
    <Tag
      {...(rest as React.HTMLAttributes<HTMLElement>)}
      ref={mergeRefs(ref, (el: HTMLElement | null) => {
        node.current = el;
      }) as React.Ref<never>}
      className={cx('ns-liquid', !custom && `ns-liquid--${scale}`, floating && 'ns-liquid--floating', `ns-liquid--tint-${tint}`, className)}
      style={{ ...vars, ...style } as React.CSSProperties}
    >
      {custom && box && (
        <svg className="ns-liquid__defs" aria-hidden="true" focusable="false" width="0" height="0">
          <LiquidFilter id={fid} scale={scale} map={displacementMap(box.w, box.h, LIQUID.bevel, r)} width={box.w} height={box.h} />
        </svg>
      )}
      {children}
    </Tag>
  );
}
