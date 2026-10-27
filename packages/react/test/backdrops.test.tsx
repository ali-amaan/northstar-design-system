// @vitest-environment jsdom
import './setup.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { BACKDROP_VARIANTS, CAP, StarBackdrop, countMarks, lcg, sceneData, thin } from '../src/backdrops/index.js';

const css = readFileSync(join(__dirname, '../src/backdrops.css'), 'utf8');
const marks = (html: string) => (html.match(/<path|class="ns-bd-b"/g) ?? []).length;

describe('StarBackdrop', () => {
  it.each(BACKDROP_VARIANTS)('%s renders deterministically and is hidden from assistive tech', (variant) => {
    const a = renderToString(<StarBackdrop variant={variant} />);
    const b = renderToString(<StarBackdrop variant={variant} />);
    expect(a).toBe(b);
    expect(a).toContain('aria-hidden="true"');
    expect(a).toContain(`ns-backdrop--${variant}`);
    expect(marks(a)).toBeGreaterThan(0);
    const { container } = render(<StarBackdrop variant={variant} density="low" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelectorAll('svg, .ns-bd-stage')).toHaveLength(1);
    expect(root.querySelector('a, button, input, [tabindex]')).toBeNull();
  });

  it('never calls Math.random', () => {
    const spy = vi.spyOn(Math, 'random');
    for (const v of BACKDROP_VARIANTS) renderToString(<StarBackdrop variant={v} density="high" />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('uses the designs’ LCG exactly and thins evenly, keeping signal stars', () => {
    const r = lcg(20261027);
    const first = r();
    expect(first).toBeCloseTo(((20261027 * 1664525 + 1013904223) % 4294967296) / 4294967296, 15);
    const items = Array.from({ length: 100 }, (_, i) => ({ i, keep: i === 99 }));
    const kept = thin(items, 0.5);
    expect(kept.length).toBeGreaterThan(45);
    expect(kept.length).toBeLessThan(56);
    expect(kept.some((k) => k.i === 99)).toBe(true);
    expect(thin(items, 1)).toBe(items);
  });

  it('caps marks by density, and high is the approved design', () => {
    for (const v of BACKDROP_VARIANTS) {
      const low = countMarks(sceneData(v, 'low'));
      const medium = countMarks(sceneData(v, 'medium'));
      const high = countMarks(sceneData(v, 'high'));
      expect(low, v).toBeLessThanOrEqual(medium);
      expect(medium, v).toBeLessThanOrEqual(high);
      expect(medium, v).toBeLessThanOrEqual(CAP.medium + 60);
      expect(high, v).toBeLessThanOrEqual(CAP.high);
      expect(sceneData(v, 'medium')).toBe(sceneData(v, 'medium'));
    }
    expect(countMarks(sceneData('fibonacci-sphere', 'high'))).toBe(420);
    expect(countMarks(sceneData('prime-lattice', 'high'))).toBe(540);
  });

  it('takes theme, density, speed, paused and ground; gradient ids are unique per instance', () => {
    const { container } = render(
      <div>
        <StarBackdrop variant="orrery" theme="day" density="high" speed={2} paused ground={false} className="extra" />
        <StarBackdrop variant="orrery" />
      </div>,
    );
    const [a, b] = Array.from(container.querySelectorAll<HTMLElement>('.ns-backdrop'));
    expect(a!.getAttribute('data-theme')).toBe('day');
    expect(a!.getAttribute('data-density')).toBe('high');
    expect(a!.hasAttribute('data-paused')).toBe(true);
    expect(a!.className).toContain('ns-backdrop--bare');
    expect(a!.className).toContain('extra');
    expect(a!.style.getPropertyValue('--ns-bd-speed')).toBe('2');
    expect(b!.hasAttribute('data-paused')).toBe(false);
    const ids = Array.from(container.querySelectorAll('radialGradient')).map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    render(<StarBackdrop variant="meridian-sweep" speed={0} />);
    expect(document.querySelector('.ns-backdrop--meridian-sweep')!.hasAttribute('data-paused')).toBe(true);
  });

  describe('reduced motion', () => {
    const original = window.matchMedia;
    afterEach(() => {
      window.matchMedia = original;
    });

    it('is a still frame', () => {
      window.matchMedia = ((query: string) =>
        ({ matches: query.includes('reduce'), media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList) as typeof window.matchMedia;
      const { container } = render(<StarBackdrop variant="fibonacci-sphere" />);
      expect(container.firstElementChild!.getAttribute('data-motion')).toBe('reduced');
      expect(css).toMatch(/\[data-motion='reduced'\] \* \{ animation: none !important; \}/);
      expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s+\.ns-backdrop \* \{ animation: none !important; \}/);
      // The billboard holds without its animation, so stars still face the viewer.
      expect(css).toContain('transform: translate3d(var(--ns-bd-p)) var(--ns-bd-bill);');
    });
  });

  it('pauses offscreen and while the document is hidden', () => {
    let notify: (entries: Array<{ isIntersecting: boolean }>) => void = () => {};
    const io = vi.fn(function (this: unknown, cb: typeof notify) {
      notify = cb;
      return { observe: () => {}, disconnect: () => {} };
    });
    vi.stubGlobal('IntersectionObserver', io);
    const { container } = render(<StarBackdrop variant="golden-angle" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.hasAttribute('data-idle')).toBe(false);
    act(() => notify([{ isIntersecting: false }]));
    expect(el.hasAttribute('data-idle')).toBe(true);
    act(() => notify([{ isIntersecting: true }]));
    expect(el.hasAttribute('data-idle')).toBe(false);
    const vis = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(el.hasAttribute('data-idle')).toBe(true);
    vis.mockRestore();
    vi.unstubAllGlobals();
    expect(css).toContain(".ns-backdrop:is([data-paused], [data-idle]) * { animation-play-state: paused !important; }");
  });

  it('fills its container, takes no pointer, and only uses --ns-* properties', () => {
    expect(css).toMatch(/\.ns-backdrop \{[^}]*position: absolute;[^}]*inset: 0;[^}]*pointer-events: none;/);
    expect(css).toContain('preserve-3d');
    const vars = [...css.matchAll(/var\((--[a-z0-9-]+)/gi)].map((m) => m[1]!);
    expect(vars.filter((v) => !v.startsWith('--ns-'))).toEqual([]);
    expect(renderToString(<StarBackdrop variant="interference" />)).toContain('preserveAspectRatio="xMidYMid slice"');
  });
});
