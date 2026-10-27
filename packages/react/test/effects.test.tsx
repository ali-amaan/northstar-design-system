// @vitest-environment jsdom
import './setup.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  CompassSwitch, ConstellationBreadcrumb, ConstellationButton, ConstellationCheckbox, CountUp, FibonacciLoader, GOLDEN_ANGLE, GraticuleInput,
  HorizonDivider, KbdKeycap, LissajousLoader, MeridianTabs, OrbitAvatar, OrbitSpinner, PRIMES, PrimeSkeleton, ProgressSextant, RadioOrbit,
  RadioOrbitGroup, RollingNumber, SextantSlider, SineAccordion, SineDisclosure, StarfieldEmptyState, StarLink, StarPagination, TagOrbit,
  ToastComet, TooltipCompass, fibonacci, initialsOf, seeded, starPath, vogel,
} from '../src/effects/index.js';
import { expectNoAxeViolations } from './a11y.js';

function withReducedMotion<T>(fn: () => T): T {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({ ...original(query), matches: query.includes('reduce') })) as typeof window.matchMedia;
  try {
    return fn();
  } finally {
    window.matchMedia = original;
  }
}

describe('effects maths', () => {
  it('is deterministic and uses the named constants', () => {
    const a = seeded(42);
    const b = seeded(42);
    const xs = Array.from({ length: 5 }, () => a());
    expect(Array.from({ length: 5 }, () => b())).toEqual(xs);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(GOLDEN_ANGLE).toBeCloseTo(137.508, 3);
    expect(fibonacci(8)).toEqual([1, 1, 2, 3, 5, 8, 13, 21]);
    expect(PRIMES.slice(0, 5)).toEqual([2, 3, 5, 7, 11]);
    const p = vogel(0, 10);
    expect(p.r).toBeCloseTo(Math.sqrt(0.05));
    expect(starPath(6, 6, 5)).toMatch(/^M6 1 /);
  });

  it('renders identically on the server twice (no randomness)', () => {
    const tree = (
      <div>
        <StarfieldEmptyState title="No studies yet" />
        <FibonacciLoader />
        <LissajousLoader />
        <OrbitSpinner />
        <ProgressSextant value={40} label="Progress" />
      </div>
    );
    expect(renderToString(tree)).toBe(renderToString(tree));
  });
});

describe('StarLink', () => {
  it('is a real link with a hidden star and an external note', async () => {
    render(
      <p>
        Read the <StarLink href="#method">method note</StarLink> or <StarLink href="https://example.org" external>the source</StarLink>.
      </p>,
    );
    const link = screen.getByRole('link', { name: 'method note' });
    expect(link.getAttribute('href')).toBe('#method');
    expect(link.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    const ext = screen.getByRole('link', { name: /the source \(opens in a new tab\)/ });
    expect(ext.getAttribute('target')).toBe('_blank');
    expect(ext.getAttribute('rel')).toContain('noopener');
    await expectNoAxeViolations();
  });
});

describe('ConstellationButton', () => {
  it('is a pill by default with the shared tactile texture, and takes shape="rounded"', () => {
    render(
      <div>
        <ConstellationButton>Pill</ConstellationButton>
        <ConstellationButton shape="rounded">Rounded</ConstellationButton>
      </div>,
    );
    expect(screen.getByRole('button', { name: 'Pill' }).className).not.toContain('ns-fx-cbutton--rounded');
    expect(screen.getByRole('button', { name: 'Rounded' }).className).toContain('ns-fx-cbutton--rounded');
    const fx = readFileSync(join(__dirname, '../src/effects.css'), 'utf8');
    expect(fx).toContain('border-radius: var(--ns-radius-control-pill);');
    expect(fx).toMatch(/\.ns-fx-cbutton::after \{[^}]*repeating-linear-gradient/);
  });

  it('clicks, emits a seeded burst that clears, and is keyboard operable', async () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    render(<ConstellationButton onClick={onClick} stars={4}>Lock population</ConstellationButton>);
    const btn = screen.getByRole('button', { name: 'Lock population' });
    fireEvent.click(btn, { detail: 1, clientX: 10, clientY: 10 });
    expect(onClick).toHaveBeenCalledTimes(1);
    const burst = btn.querySelector('.ns-fx-burst')!;
    expect(burst.getAttribute('aria-hidden')).toBe('true');
    expect(burst.querySelectorAll('.ns-fx-burst__pt')).toHaveLength(4);
    expect(burst.querySelectorAll('.ns-fx-burst__ln')).toHaveLength(3);
    act(() => void vi.advanceTimersByTime(1200));
    expect(btn.querySelector('.ns-fx-burst')).toBeNull();
    vi.useRealTimers();
    btn.focus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(2);
    await expectNoAxeViolations();
  });

  it('repeats the same scatter for the same seed and press', () => {
    const html = () => {
      const { container, unmount } = render(<ConstellationButton seed={3}>Go</ConstellationButton>);
      fireEvent.click(screen.getByRole('button'), { detail: 1, clientX: 5, clientY: 5 });
      const out = container.querySelector('.ns-fx-burst')!.innerHTML;
      unmount();
      return out;
    };
    expect(html()).toBe(html());
  });

  it('emits nothing under reduced motion', () => {
    withReducedMotion(() => {
      render(<ConstellationButton>Go</ConstellationButton>);
      fireEvent.click(screen.getByRole('button'), { detail: 1, clientX: 5, clientY: 5 });
      expect(document.querySelector('.ns-fx-burst')).toBeNull();
    });
  });
});

describe('KbdKeycap', () => {
  it('presses while its key is held', () => {
    render(<KbdKeycap listen="k">K</KbdKeycap>);
    const cap = screen.getByText('K').closest('kbd')!;
    expect(cap.hasAttribute('data-pressed')).toBe(false);
    fireEvent.keyDown(window, { key: 'K' });
    expect(cap.hasAttribute('data-pressed')).toBe(true);
    fireEvent.keyUp(window, { key: 'k' });
    expect(cap.hasAttribute('data-pressed')).toBe(false);
  });
});

describe('loaders and progress', () => {
  it('announce themselves as status with a label', async () => {
    render(
      <div>
        <OrbitSpinner label="Building population" />
        <FibonacciLoader seeds={13} />
        <LissajousLoader ratio={[5, 4]} />
        <PrimeSkeleton lines={4} />
      </div>,
    );
    expect(screen.getAllByRole('status')).toHaveLength(4);
    expect(screen.getAllByRole('status')[0]!.textContent).toBe('Building population');
    expect(document.querySelectorAll('.ns-fx-seed')).toHaveLength(13);
    expect(document.querySelectorAll('.ns-fx-pskel__line')).toHaveLength(4);
    await expectNoAxeViolations();
  });

  it('ProgressSextant is a progressbar with clamped values and lit graduations', async () => {
    const { rerender } = render(<ProgressSextant value={50} label="Fieldwork" />);
    const bar = screen.getByRole('progressbar', { name: 'Fieldwork' });
    expect(bar.getAttribute('aria-valuenow')).toBe('50');
    expect(bar.getAttribute('aria-valuetext')).toBe('50%');
    expect(bar.querySelectorAll('[data-on]')).toHaveLength(13);
    rerender(<ProgressSextant value={140} label="Fieldwork" />);
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
    await expectNoAxeViolations();
  });
});

describe('CompassSwitch', () => {
  it('toggles by click and keyboard, controlled and uncontrolled', async () => {
    const onChange = vi.fn();
    render(<CompassSwitch onCheckedChange={onChange}>Weight to census</CompassSwitch>);
    const sw = screen.getByRole('switch', { name: 'Weight to census' });
    expect(sw.getAttribute('aria-checked')).toBe('false');
    await userEvent.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(sw.getAttribute('data-state')).toBe('on');
    sw.focus();
    await userEvent.keyboard(' ');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(onChange.mock.calls).toEqual([[true], [false]]);
    await expectNoAxeViolations();
  });

  it('respects a controlled value', async () => {
    render(<CompassSwitch checked aria-label="Locked" />);
    const sw = screen.getByRole('switch', { name: 'Locked' });
    await userEvent.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('true');
  });
});

describe('SextantSlider', () => {
  it('is a labelled native range with a mono readout and keyboard steps', async () => {
    const onChange = vi.fn();
    render(<SextantSlider label="Sample size" defaultValue={40} detents={[50]} onValueChange={onChange} format={(v) => `${v} agents`} />);
    const slider = screen.getByRole('slider', { name: 'Sample size' });
    expect(slider.getAttribute('aria-valuetext')).toBe('40 agents');
    expect(document.querySelector('output')?.textContent).toBe('40 agents');
    // Native range: the browser maps arrow keys to a change event (jsdom does not step ranges).
    expect(slider.getAttribute('type')).toBe('range');
    fireEvent.change(slider, { target: { value: '41' } });
    expect(onChange).toHaveBeenLastCalledWith(41);
    await expectNoAxeViolations();
  });

  it('catches on a detent while dragged, but not from the keyboard', () => {
    const onChange = vi.fn();
    render(<SextantSlider label="Share" defaultValue={10} detents={[50]} onValueChange={onChange} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '49' } });
    expect(onChange).toHaveBeenLastCalledWith(49);
    fireEvent.pointerDown(slider);
    fireEvent.change(slider, { target: { value: '51' } });
    expect(onChange).toHaveBeenLastCalledWith(50);
    expect(document.querySelector('.ns-fx-sslider__detent[data-on]')).not.toBeNull();
    fireEvent.pointerUp(window);
    fireEvent.change(slider, { target: { value: '52' } });
    expect(onChange).toHaveBeenLastCalledWith(52);
  });
});

describe('ConstellationCheckbox', () => {
  it('checks with click and Space, and supports the mixed state', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<ConstellationCheckbox onCheckedChange={onChange}>Include pilot answers</ConstellationCheckbox>);
    const box = screen.getByRole('checkbox', { name: 'Include pilot answers' }) as HTMLInputElement;
    await userEvent.click(box);
    expect(box.checked).toBe(true);
    box.focus();
    await userEvent.keyboard(' ');
    expect(box.checked).toBe(false);
    expect(onChange.mock.calls).toEqual([[true], [false]]);
    rerender(<ConstellationCheckbox indeterminate>Include pilot answers</ConstellationCheckbox>);
    expect(box.indeterminate).toBe(true);
    await expectNoAxeViolations();
  });
});

describe('RadioOrbit', () => {
  it('is a native radio group with a legend and arrow-key selection', async () => {
    const onChange = vi.fn();
    render(
      <RadioOrbitGroup legend="Panel size" defaultValue="300" onValueChange={onChange}>
        <RadioOrbit value="100">100 agents</RadioOrbit>
        <RadioOrbit value="300" description="Recommended">300 agents</RadioOrbit>
        <RadioOrbit value="1000">1,000 agents</RadioOrbit>
      </RadioOrbitGroup>,
    );
    expect(screen.getByRole('group', { name: 'Panel size' })).toBeTruthy();
    const r300 = screen.getByRole('radio', { name: /300 agents/ }) as HTMLInputElement;
    expect(r300.checked).toBe(true);
    await userEvent.click(screen.getByRole('radio', { name: '1,000 agents' }));
    expect(onChange).toHaveBeenLastCalledWith('1000');
    expect((screen.getByRole('radio', { name: '1,000 agents' }) as HTMLInputElement).checked).toBe(true);
    await expectNoAxeViolations();
  });
});

describe('GraticuleInput', () => {
  it('labels the field and wires hint and error', async () => {
    const { rerender } = render(<GraticuleInput label="Study name" hint="Shown to your workspace" />);
    const input = screen.getByRole('textbox', { name: 'Study name' });
    expect(input.getAttribute('aria-describedby')).toContain('hint');
    rerender(<GraticuleInput label="Study name" hint="Shown to your workspace" error="Name is required" />);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain('error');
    await userEvent.type(input, 'Pilot');
    expect((input as HTMLInputElement).value).toBe('Pilot');
    await expectNoAxeViolations();
  });
});

describe('MeridianTabs', () => {
  const tabs = [
    { value: 'brief', label: 'Brief', content: 'Brief panel' },
    { value: 'population', label: 'Population', content: 'Population panel' },
    { value: 'archive', label: 'Archive', content: 'Archive panel', disabled: true },
    { value: 'results', label: 'Results', content: 'Results panel' },
  ];

  it('follows the tabs pattern with arrows, Home and End, skipping disabled tabs', async () => {
    const onChange = vi.fn();
    render(<MeridianTabs tabs={tabs} label="Study" onValueChange={onChange} />);
    expect(screen.getByRole('tablist', { name: 'Study' })).toBeTruthy();
    const brief = screen.getByRole('tab', { name: 'Brief' });
    expect(brief.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel').textContent).toBe('Brief panel');
    brief.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Population' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Results' }));
    await userEvent.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith('brief');
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tabpanel').textContent).toBe('Results panel');
    expect(document.querySelector('.ns-fx-mtabs__hop--go')).not.toBeNull();
    await expectNoAxeViolations();
  });
});

describe('StarPagination', () => {
  it('pages with buttons, marks the current page and windows long runs', async () => {
    function Harness() {
      const [p, setP] = useState(1);
      return <StarPagination count={20} page={p} onPageChange={setP} />;
    }
    render(<Harness />);
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(screen.getByRole('button', { name: 'Previous page' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page');
    expect(nav.querySelectorAll('.ns-fx-spage__dot')).toHaveLength(7);
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByRole('button', { name: 'Page 2' }).getAttribute('aria-current')).toBe('page');
    await userEvent.click(screen.getByRole('button', { name: 'Page 5' }));
    expect(screen.getByRole('button', { name: 'Page 8' })).toBeTruthy();
    expect(nav.textContent).toContain('5 / 20');
    await expectNoAxeViolations();
  });
});

describe('ConstellationBreadcrumb', () => {
  it('is a labelled list of links ending at the current page', async () => {
    render(<ConstellationBreadcrumb items={[{ label: 'Studies', href: '#s' }, { label: 'Pilot', href: '#p' }, { label: 'Results' }]} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumbs' })).toBeTruthy();
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getByText('Results').getAttribute('aria-current')).toBe('page');
    await expectNoAxeViolations();
  });
});

describe('RollingNumber and CountUp', () => {
  it('exposes the formatted value as text and hides the reels', async () => {
    const { rerender } = render(<RollingNumber value={1234} />);
    expect(screen.getByText('1,234')).toBeTruthy();
    const reels = document.querySelector('.ns-fx-roll__reels')!;
    expect(reels.getAttribute('aria-hidden')).toBe('true');
    expect(reels.querySelectorAll('.ns-fx-roll__col')).toHaveLength(4);
    const units = reels.querySelectorAll<HTMLElement>('.ns-fx-roll__reel')[3]!;
    expect(units.style.getPropertyValue('--ns-fx-d')).toBe('4');
    rerender(<RollingNumber value={1239} />);
    expect(reels.querySelectorAll<HTMLElement>('.ns-fx-roll__reel')[3]).toBe(units);
    expect(units.style.getPropertyValue('--ns-fx-d')).toBe('9');
    await expectNoAxeViolations();
  });

  it('CountUp starts at `from` and reaches the value', async () => {
    render(<CountUp value={42} format={{ style: 'percent' }} from={0} />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 40));
    });
    expect(screen.getByText('4,200%')).toBeTruthy();
  });
});

describe('display effects', () => {
  it('HorizonDivider, StarfieldEmptyState and OrbitAvatar pass axe', async () => {
    render(
      <div>
        <HorizonDivider />
        <HorizonDivider label="Earlier" />
        <StarfieldEmptyState title="No studies yet" description="Draft a brief to start." action={<button type="button">New study</button>} />
        <OrbitAvatar name="Ada Lovelace" />
      </div>,
    );
    expect(screen.getAllByRole('separator')).toHaveLength(2);
    expect(screen.getByRole('group', { name: 'No studies yet' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Ada Lovelace' }).textContent).toBe('AL');
    expect(initialsOf('  grace  brewster hopper ')).toBe('GH');
    await expectNoAxeViolations();
  });

  it('TagOrbit removes after the star fades, or at once under reduced motion', async () => {
    vi.useFakeTimers();
    const onRemove = vi.fn();
    render(<TagOrbit label="Helsinki" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Helsinki' }));
    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.getByText('Helsinki').parentElement!.hasAttribute('data-leaving')).toBe(true);
    act(() => void vi.advanceTimersByTime(400));
    expect(onRemove).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
    const quick = vi.fn();
    withReducedMotion(() => {
      render(<TagOrbit label="Turku" onRemove={quick} />);
      fireEvent.click(screen.getByRole('button', { name: 'Remove Turku' }));
    });
    expect(quick).toHaveBeenCalledTimes(1);
    await expectNoAxeViolations();
  });
});

describe('SineDisclosure and SineAccordion', () => {
  it('disclosure toggles aria-expanded and the region', async () => {
    render(<SineDisclosure title="Method">Raked to published margins.</SineDisclosure>);
    const trigger = screen.getByRole('button', { name: 'Method' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('region')).toBeNull();
    await userEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('region', { name: 'Method' }).textContent).toBe('Raked to published margins.');
    await expectNoAxeViolations();
  });

  it('single accordion keeps one open; arrows move between headers', async () => {
    render(
      <SineAccordion
        items={[
          { value: 'a', title: 'Population', content: 'A' },
          { value: 'b', title: 'Battery', content: 'B' },
          { value: 'c', title: 'Report', content: 'C' },
        ]}
      />,
    );
    const [a, b, c] = screen.getAllByRole('button');
    await userEvent.click(a!);
    await userEvent.click(b!);
    expect(a!.getAttribute('aria-expanded')).toBe('false');
    expect(b!.getAttribute('aria-expanded')).toBe('true');
    b!.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(c);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(a);
    await expectNoAxeViolations();
  });
});

describe('overlays', () => {
  it('TooltipCompass shows on focus, describes the trigger and closes on Escape', async () => {
    render(
      <TooltipCompass content="Raked to 2023 margins">
        <button type="button">Calibrate</button>
      </TooltipCompass>,
    );
    const trigger = screen.getByRole('button', { name: 'Calibrate' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    await act(async () => {
      trigger.focus();
      await new Promise((r) => setTimeout(r, 10));
    });
    const tip = screen.getByRole('tooltip');
    expect(trigger.getAttribute('aria-describedby')).toBe(tip.id);
    await expectNoAxeViolations();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(trigger.getAttribute('aria-describedby')).toBeNull();
  });

  it('ToastComet is a status that dismisses and leaves', async () => {
    vi.useFakeTimers();
    function Harness() {
      const [open, setOpen] = useState(true);
      return <ToastComet title="Study saved" description="Draft 3 of the pilot." open={open} onDismiss={() => setOpen(false)} />;
    }
    render(<Harness />);
    expect(screen.getByRole('status').textContent).toContain('Study saved');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.getByRole('status').hasAttribute('data-leaving')).toBe(true);
    act(() => void vi.advanceTimersByTime(300));
    expect(screen.queryByRole('status')).toBeNull();
    vi.useRealTimers();
  });

  it('ToastComet passes axe', async () => {
    render(<ToastComet title="Run complete" onDismiss={() => {}} />);
    await expectNoAxeViolations();
  });
});
