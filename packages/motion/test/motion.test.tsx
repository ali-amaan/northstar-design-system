// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { loadAnimation } = vi.hoisted(() => ({ loadAnimation: vi.fn() }));
vi.mock('../src/load-lottie.js', () => ({ loadLottie: async () => ({ loadAnimation }) }));

import { applySlots, getScene, Lottie, scenes, THEME_SLOTS, toRgba } from '../src/index.js';

const sceneDir = join(import.meta.dirname, '..', 'scenes');
const read = (file: string) => JSON.parse(readFileSync(join(sceneDir, file), 'utf8'));

function fakeAnim() {
  return { totalFrames: 66, goToAndStop: vi.fn(), addEventListener: vi.fn(), destroy: vi.fn() };
}
function setReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: matches && q.includes('reduce'),
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  loadAnimation.mockReset();
  loadAnimation.mockImplementation(fakeAnim);
  setReducedMotion(false);
});
afterEach(cleanup);

describe('scene index', () => {
  it('has every scene in both themes with a caption', () => {
    expect(scenes.length).toBe(60);
    for (const s of scenes) {
      expect(s.caption.length).toBeGreaterThan(0);
      expect(s.bytes).toBeLessThan(600000);
      expect(getScene(s.name, s.theme === 'day' ? 'night' : 'day')).toBeDefined();
    }
  });
  it('carries what the world scenes must print', () => {
    const w = getScene('ns-world-focus', 'day');
    expect(w?.family).toBe('world');
    expect(Object.keys(w?.mustPrint ?? {})).toContain('provenance');
  });
  it('knows which scenes loop', () => {
    expect(getScene('ns-calibrate')?.loop).toBe(true);
    expect(getScene('ns-north-settle')?.loop).toBe(false);
  });
});

describe('applySlots', () => {
  it('resolves every slot reference to the theme colour', () => {
    const doc = read('night/instruments/ns-calibrate.json');
    const out = applySlots(doc, { ink: '#FF0000' });
    const text = JSON.stringify(out);
    expect(text).not.toContain('"sid"');
    expect(out.slots.ink.p.k).toEqual([1, 0, 0, 1]);
    expect(text).toContain(JSON.stringify([1, 0, 0, 1]));
    expect(JSON.stringify(doc)).toContain('"sid"'); // input untouched
  });
  it('parses hex', () => expect(toRgba('#2F5D9A').map(v => Math.round(v * 255))).toEqual([47, 93, 154, 255]));
});

describe('<Lottie>', () => {
  const data = read('night/instruments/ns-north-settle.json');

  it('plays with the theme slot colours and the authored loop', async () => {
    render(<Lottie scene="ns-north-settle" theme="day" animationData={data} />);
    await waitFor(() => expect(loadAnimation).toHaveBeenCalledTimes(1));
    const opts = loadAnimation.mock.calls[0]?.[0];
    expect(opts.loop).toBe(false);
    expect(opts.autoplay).toBe(true);
    expect(opts.animationData.slots.accent.p.k).toEqual(toRgba(THEME_SLOTS.day.accent ?? ''));
  });

  it('loops when the scene is a loop and has an accessible name from its caption', async () => {
    const { container } = render(<Lottie scene="ns-calibrate" animationData={read('night/instruments/ns-calibrate.json')} />);
    await waitFor(() => expect(loadAnimation).toHaveBeenCalled());
    expect(loadAnimation.mock.calls[0]?.[0].loop).toBe(true);
    expect(container.firstElementChild?.getAttribute('aria-label')).toBe('running');
  });

  it('follows the nearest data-theme', async () => {
    render(
      <div data-theme="day">
        <Lottie scene="ns-north-settle" animationData={data} />
      </div>,
    );
    await waitFor(() => expect(loadAnimation).toHaveBeenCalled());
    const last = loadAnimation.mock.calls.at(-1)?.[0];
    expect(last.animationData.slots.ink.p.k).toEqual(toRgba(THEME_SLOTS.day.ink ?? ''));
  });

  it('under reduced motion shows the last frame and does not loop', async () => {
    setReducedMotion(true);
    const anims: ReturnType<typeof fakeAnim>[] = [];
    loadAnimation.mockImplementation(() => {
      const a = fakeAnim();
      anims.push(a);
      return a;
    });
    render(<Lottie scene="ns-calibrate" loop animationData={data} />);
    await waitFor(() => expect(anims.at(-1)?.goToAndStop).toHaveBeenCalledWith(65, true));
    const opts = loadAnimation.mock.calls.at(-1)?.[0];
    expect(opts.loop).toBe(false);
    expect(opts.autoplay).toBe(false);
  });

  it('destroys the animation on unmount', async () => {
    const a = fakeAnim();
    loadAnimation.mockImplementation(() => a);
    const { unmount } = render(<Lottie scene="ns-north-settle" animationData={data} />);
    await waitFor(() => expect(loadAnimation).toHaveBeenCalled());
    unmount();
    expect(a.destroy).toHaveBeenCalled();
  });
});
