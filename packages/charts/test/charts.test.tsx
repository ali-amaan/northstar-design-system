// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import {
  ClaimInstrument, Composition, Distribution, Figure, Legend, Ranking, RunProgress, Tooltip, Axis,
} from '../src/index.js';

afterEach(cleanup);

describe('Figure', () => {
  it('renders only the value when extras are omitted', () => {
    const { container } = render(<Figure value={0.42} />);
    expect(screen.getByText('42%')).toBeTruthy();
    expect(container.querySelector('[data-part="band"]')).toBeNull();
    expect(container.querySelector('[data-part="claim"]')).toBeNull();
    expect(container.querySelector('figcaption')).toBeNull();
  });
  it('renders band, claim and caption when given', () => {
    const { container } = render(<Figure value={0.42} band={6} claim="level" caption="Of [N] respondents." />);
    expect(container.querySelector('[data-part="band"]')?.textContent).toBe('± 6 pp');
    expect(screen.getByText('Level')).toBeTruthy();
    expect(screen.getByText('Of [N] respondents.')).toBeTruthy();
  });
  it('shows withheld and stale states with words, not opacity', () => {
    render(<Figure value={0.42} band={6} state="withheld" />);
    expect(screen.getByText('Withheld')).toBeTruthy();
    expect(screen.queryByText('42%')).toBeNull();
    cleanup();
    const { container } = render(<Figure value={0.42} state="stale" />);
    expect(screen.getByText('Stale')).toBeTruthy();
    expect((container.firstChild as HTMLElement).style.border).toContain('dashed');
  });
  it('is locale-aware', () => {
    render(<Figure value={0.425} digits={1} locale="fi" />);
    expect(screen.getByText(/42,5/)).toBeTruthy();
  });
});

describe('Distribution', () => {
  it('draws one segment per anchor and labels the shares', () => {
    const anchors = ['1', '2', '3', '4', '5'];
    const { container } = render(<Distribution anchors={anchors} shares={[0.1, 0.2, 0.4, 0.2, 0.1]} />);
    expect(container.querySelectorAll('[data-part="segment"]')).toHaveLength(5);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('3 40%');
  });
});

describe('Composition', () => {
  it('draws margin ticks and panel bars', () => {
    const { container } = render(
      <Composition margins={[{ label: 'A', margin: 0.5, panel: 0.48 }, { label: 'B', margin: 0.5 }]} />,
    );
    expect(container.querySelectorAll('[data-part="margin"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-part="panel"]')).toHaveLength(1);
  });
});

describe('Ranking', () => {
  it('orders items and has no values', () => {
    const { container } = render(<Ranking items={['x', 'y', 'z']} />);
    const ranks = [...container.querySelectorAll('[data-part="rank"]')].map((g) => g.getAttribute('data-rank'));
    expect(ranks).toEqual(['1', '2', '3']);
    expect(container.textContent).not.toMatch(/%/);
  });
});

describe('ClaimInstrument', () => {
  it('level: node and capped band', () => {
    const { container } = render(<ClaimInstrument claim="level" value={0.6} band={5} />);
    expect(container.querySelector('[data-mark="node"]')).toBeTruthy();
    expect(container.querySelector('[data-part="band"]')).toBeTruthy();
  });
  it('direction: needle, no number', () => {
    const { container } = render(<ClaimInstrument claim="direction" direction={1} />);
    expect(container.querySelector('[data-part="needle"]')).toBeTruthy();
    expect(container.textContent).toBe('');
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Direction: right of the meridian');
  });
  it('ranking: one node at the rank', () => {
    const { container } = render(<ClaimInstrument claim="ranking" rank={2} of={5} />);
    expect(container.querySelectorAll('[data-mark="node"]')).toHaveLength(1);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Ranking: 2 of 5');
  });
});

describe('RunProgress', () => {
  it('reports progress accessibly and in words', () => {
    render(<RunProgress done={3} total={10} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('3');
    expect(bar.getAttribute('aria-valuetext')).toBe('Running: 3 of 10 items');
    expect(screen.getByText('Running')).toBeTruthy();
  });
  it('marks failure with a shape', () => {
    const { container } = render(<RunProgress done={3} total={10} state="failed" />);
    expect(container.querySelector('[data-mark="failed"]')).toBeTruthy();
  });
});

describe('Axis, Legend, Tooltip', () => {
  it('axis ticks and meridian', () => {
    const { container } = render(<svg><Axis length={200} meridian={50} /></svg>);
    expect(container.querySelectorAll('[data-part="tick"]')).toHaveLength(5);
    expect(container.querySelector('[data-part="meridian"]')).toBeTruthy();
  });
  it('legend items', () => {
    render(<Legend items={[{ label: 'Panel', color: 'red' }, { label: 'Margin', color: 'blue', shape: 'line' }]} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
  it('tooltip only when open', () => {
    const { rerender } = render(<Tooltip>hi</Tooltip>);
    expect(screen.queryByRole('tooltip')).toBeNull();
    rerender(<Tooltip open>hi</Tooltip>);
    expect(screen.getByRole('tooltip').textContent).toBe('hi');
  });
});
