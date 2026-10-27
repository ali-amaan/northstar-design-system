// @vitest-environment jsdom
import './setup.js';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import userEvent from '@testing-library/user-event';
import { tokens } from '@northstar-js/tokens';
import {
  Button, Card, FlowStep, FlowSteps, HoverActions, IconButton, LIQUID, LiquidGlass, NextAction, NorthstarProvider, Reveal, Sidebar,
  SidebarItem, SidebarSection, Surface, Toolbar, ToolbarItem, displacementMap, withViewTransition,
} from '../src/index.js';
import { StudyShell } from '../src/northstar/index.js';
import { expectNoAxeViolations } from './a11y.js';

import { studyAurora as study } from '@northstar-js/contracts/fixtures';

describe('LiquidGlass', () => {
  it('mirrors the material.liquid tokens', () => {
    const s = tokens.scales as Record<string, unknown>;
    expect(Number(s['material.liquid.scale.sm'])).toBe(LIQUID.scale.sm);
    expect(Number(s['material.liquid.scale.md'])).toBe(LIQUID.scale.md);
    expect(Number(s['material.liquid.scale.lg'])).toBe(LIQUID.scale.lg);
    expect(Number(s['material.liquid.bevel'])).toBe(LIQUID.bevel);
  });

  it('builds a displacement map that is neutral in the body', () => {
    const svg = decodeURIComponent(displacementMap(200, 80).split(',')[1]!);
    expect(svg).toContain('width="200"');
    expect(svg).toContain('fill="#808000"');
    expect(svg).toContain('mix-blend-mode:screen');
  });

  it('the provider inserts the shared filter defs once, however many providers mount', () => {
    const { unmount } = render(
      <div>
        <NorthstarProvider theme="night">a</NorthstarProvider>
        <NorthstarProvider theme="day">b</NorthstarProvider>
      </div>,
    );
    expect(document.querySelectorAll('[data-ns-liquid-defs]')).toHaveLength(1);
    for (const s of ['sm', 'md', 'lg']) expect(document.getElementById(`ns-liquid-${s}`)).not.toBeNull();
    unmount();
    expect(document.querySelectorAll('[data-ns-liquid-defs]')).toHaveLength(0);
  });

  it('can opt out of the defs', () => {
    const { unmount } = render(<NorthstarProvider liquidGlass={false}>x</NorthstarProvider>);
    expect(document.querySelector('[data-ns-liquid-defs]')).toBeNull();
    unmount();
  });

  it('renders a preset or its own measured filter, and passes axe', async () => {
    render(
      <NorthstarProvider>
        <LiquidGlass data-testid="preset" scale="lg" radius="pill" as="section" aria-label="Glass toolbar">
          Preset
        </LiquidGlass>
        <LiquidGlass data-testid="custom" scale={36}>Custom</LiquidGlass>
      </NorthstarProvider>,
    );
    const preset = screen.getByTestId('preset');
    expect(preset.className).toContain('ns-liquid--lg');
    expect(preset.style.getPropertyValue('--ns-liquid-radius')).toBe('var(--ns-radius-glass-bar)');
    expect(screen.getByTestId('custom').className).not.toContain('ns-liquid--md');
    await expectNoAxeViolations();
  });

  it('material="glass" and Surface keep their class contract and render on the server', () => {
    const html = renderToString(<Surface>Glass</Surface>);
    expect(html).toContain('ns-material--glass');
    expect(renderToString(<LiquidGlass>SSR</LiquidGlass>)).toContain('ns-liquid');
  });
});

describe('icon-led controls', () => {
  it('IconButton expand shows the icon and keeps the full label as text (no tooltip, no ellipsis)', async () => {
    render(<IconButton expand label="Duplicate study" icon={<svg />} />);
    const b = screen.getByRole('button', { name: 'Duplicate study' });
    expect(b.className).toContain('ns-icon-button--expand');
    expect(b.querySelector('.ns-reveal-label__inner')?.textContent).toBe('Duplicate study');
    expect(b.getAttribute('title')).toBeNull();
    expect(b.textContent).not.toContain('…');
    await expectNoAxeViolations();
  });

  it('plain IconButton is unchanged: aria-label and tooltip title', () => {
    render(<IconButton label="Set north" icon={<svg />} />);
    const b = screen.getByRole('button', { name: 'Set north' });
    expect(b.getAttribute('title')).toBe('Set north');
  });

  it('Toolbar roves with arrow keys between icon-led items', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar label="Study actions" glass>
        <ToolbarItem label="Run" icon={<svg />} />
        <ToolbarItem label="Duplicate" icon={<svg />} />
        <ToolbarItem label="Export" icon={<svg />} />
      </Toolbar>,
    );
    const bar = screen.getByRole('toolbar', { name: 'Study actions' });
    expect(bar.className).toContain('ns-liquid');
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Run' }));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Duplicate' }));
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Export' }));
    await expectNoAxeViolations();
  });

  it('a collapsed Sidebar keeps every item named by its full text', async () => {
    render(
      <Sidebar collapsed>
        <SidebarSection title="Workspace">
          <SidebarItem href="#" icon={<svg />} active>
            Studies in progress this quarter
          </SidebarItem>
        </SidebarSection>
      </Sidebar>,
    );
    expect(screen.getByRole('navigation').className).toContain('ns-sidebar--collapsed');
    expect(screen.getByRole('link', { name: 'Studies in progress this quarter' })).toBeTruthy();
    await expectNoAxeViolations();
  });

  it('Card revealActions and HoverActions keep actions in the tab order', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Card title="Weekday lunch" revealActions actions={<Button size="sm">Open</Button>} />
        <p>
          Row <HoverActions><Button size="sm">Archive</Button></HoverActions>
        </p>
      </div>,
    );
    expect(screen.getByRole('button', { name: 'Open' }).parentElement?.className).toContain('ns-hover-actions');
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Archive' }));
    await expectNoAxeViolations();
  });
});

function Steps(props: { onComplete?: () => void; blocked?: boolean }) {
  return (
    <FlowSteps label="Study setup" {...(props.onComplete ? { onComplete: props.onComplete } : {})}>
      <FlowStep value="brief" title="Brief" blocked={props.blocked}>
        <p>Write the brief</p>
        <NextAction />
      </FlowStep>
      <FlowStep value="population" title="Population">
        <p>Pick the population</p>
        <NextAction />
      </FlowStep>
      <FlowStep value="research" title="Research">
        <NextAction finishLabel="Run study" />
      </FlowStep>
    </FlowSteps>
  );
}

describe('Flow', () => {
  it('shows progress and one next action that names the next step', async () => {
    const user = userEvent.setup();
    render(<Steps />);
    const bar = screen.getByRole('progressbar', { name: 'Progress' });
    expect(bar.getAttribute('aria-valuenow')).toBe('1');
    expect(bar.getAttribute('aria-valuetext')).toBe('Step 1 of 3: Brief');
    expect(screen.getByRole('button', { name: 'Brief' }).getAttribute('aria-current')).toBe('step');
    expect(screen.getByRole('button', { name: 'Research' })).toHaveProperty('disabled', true);
    await user.click(screen.getByRole('button', { name: 'Continue to Population' }));
    expect(screen.getByText('Pick the population')).toBeTruthy();
    expect(bar.getAttribute('aria-valuenow')).toBe('2');
    expect(document.activeElement?.textContent).toBe('Population');
    await expectNoAxeViolations();
  });

  it('goes back, marks completed steps, and finishes on the last step', async () => {
    const user = userEvent.setup();
    const done = vi.fn();
    render(<Steps onComplete={done} />);
    await user.click(screen.getByRole('button', { name: 'Continue to Population' }));
    expect(screen.getByRole('button', { name: /^Brief,? ?,? complete$/ })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('Write the brief')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Continue to Population' }));
    await user.click(screen.getByRole('button', { name: 'Continue to Research' }));
    await user.click(screen.getByRole('button', { name: 'Run study' }));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('a blocked step cannot be left', () => {
    render(<Steps blocked />);
    expect(screen.getByRole('button', { name: 'Continue to Population' })).toHaveProperty('disabled', true);
  });

  it('uses the View Transitions API when present and names only the stage', () => {
    const finished = Promise.resolve();
    const start = vi.fn((cb: () => void) => {
      cb();
      return { finished };
    });
    Object.defineProperty(document, 'startViewTransition', { value: start, configurable: true });
    const el = document.createElement('div');
    let ran = false;
    expect(withViewTransition(() => (ran = true), el)).toBe(true);
    expect(ran).toBe(true);
    expect(start).toHaveBeenCalledTimes(1);
    expect(el.style.getPropertyValue('view-transition-name')).toBe('ns-step');
    delete (document as { startViewTransition?: unknown }).startViewTransition;
    expect(withViewTransition(() => {})).toBe(false);
  });
});

describe('StudyShell guided mode', () => {
  it('turns the four tabs into a flow with one next action', async () => {
    const user = userEvent.setup();
    const finish = vi.fn();
    render(<StudyShell study={study} guided onFinish={finish} finishLabel="Read responses" panels={{ brief: <p>Brief panel</p> }} />);
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.getByText('Brief panel')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Continue to Population' }));
    await user.click(screen.getByRole('button', { name: 'Continue to Research' }));
    await user.click(screen.getByRole('button', { name: 'Continue to Responses' }));
    await user.click(screen.getByRole('button', { name: 'Read responses' }));
    expect(finish).toHaveBeenCalled();
    await expectNoAxeViolations();
  });

  it('the default tabbed mode is unchanged', () => {
    render(<StudyShell study={study} />);
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });
});

describe('Reveal', () => {
  it('is visible on the server and reveals when observed', () => {
    expect(renderToString(<Reveal>Hi</Reveal>)).not.toContain('data-reveal');
    const observers: Array<{ cb: IntersectionObserverCallback }> = [];
    class IO {
      cb: IntersectionObserverCallback;
      constructor(cb: IntersectionObserverCallback) {
        this.cb = cb;
        observers.push(this);
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('IntersectionObserver', IO);
    render(
      <Reveal stagger data-testid="r" as="ul">
        <li>One</li>
        <li>Two</li>
      </Reveal>,
    );
    const el = screen.getByTestId('r');
    expect(el.getAttribute('data-reveal')).toBe('pending');
    act(() => observers[0]!.cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(el.getAttribute('data-reveal')).toBe('in');
    vi.unstubAllGlobals();
  });

  it('shows at once under reduced motion', () => {
    const mm = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    render(<Reveal data-testid="rm">Hi</Reveal>);
    expect(screen.getByTestId('rm').getAttribute('data-reveal')).toBe('in');
    window.matchMedia = mm;
    fireEvent.scroll(window);
  });
});
