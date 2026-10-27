// @vitest-environment jsdom
import './setup.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tokens } from '@northstar-js/tokens';
import { studyAurora as study } from '@northstar-js/contracts/fixtures';
import {
  Badge, Breadcrumbs, Button, Card, FlowStep, FlowSteps, IconButton, LIQUID, LiquidGlass, Menu, NextAction, Pagination, Surface, Tabs, Tag,
  Toolbar, ToolbarItem,
} from '../src/index.js';
import { ExportMenu, ResearchBuilder, RunCost, StudyShell, StudyStatus } from '../src/northstar/index.js';
import { expectNoAxeViolations } from './a11y.js';

const css = readFileSync(join(__dirname, '../src/styles.css'), 'utf8');
const Glyph = () => <svg width="14" height="14" aria-hidden="true" />;

/** Every icon-first control: a host, its icon slot, and the full label in the expand primitive. */
function expectHost(el: HTMLElement, label: string, mode: 'hover' | 'always' = 'hover') {
  expect(el.classList.contains('ns-expand-host'), `${label} is a host`).toBe(true);
  expect(el.getAttribute('data-expand')).toBe(mode);
  expect(el.querySelector('.ns-expand-icon')).not.toBeNull();
  expect(el.querySelector('.ns-expand__inner')?.textContent).toBe(label);
  expect(el.textContent).not.toContain('…'.repeat(2));
}

describe('ExpandLabel across the system', () => {
  it('Button takes an icon and expands; the label names it, never an aria-label or tooltip', async () => {
    render(
      <div>
        <Button icon={<Glyph />} expand>
          Duplicate study
        </Button>
        <Button icon={<Glyph />} expand="always">
          Share
        </Button>
        <Button icon={<Glyph />}>Plain with icon</Button>
      </div>,
    );
    const dup = screen.getByRole('button', { name: 'Duplicate study' });
    expectHost(dup, 'Duplicate study');
    expect(dup.getAttribute('aria-label')).toBeNull();
    expect(dup.getAttribute('title')).toBeNull();
    expectHost(screen.getByRole('button', { name: 'Share' }), 'Share', 'always');
    const plain = screen.getByRole('button', { name: 'Plain with icon' });
    expect(plain.classList.contains('ns-expand-host')).toBe(false);
    expect(plain.querySelector('.ns-button__icon')).not.toBeNull();
    await expectNoAxeViolations();
  });

  it('IconButton and ToolbarItem use the same primitive', () => {
    render(
      <Toolbar label="Study actions">
        <ToolbarItem label="Run" icon={<Glyph />} />
        <IconButton label="Export" icon={<Glyph />} expand="always" />
      </Toolbar>,
    );
    expectHost(screen.getByRole('button', { name: 'Run' }), 'Run');
    const exp = screen.getByRole('button', { name: 'Export' });
    expectHost(exp, 'Export', 'always');
    expect(exp.className).toContain('ns-icon-button--open');
  });

  it('icon Tabs open to their labels and keep the tab named by its text', async () => {
    const user = userEvent.setup();
    render(
      <Tabs.Root defaultValue="brief">
        <Tabs.List label="Sections">
          <Tabs.Trigger value="brief" icon={<Glyph />} expand>
            Brief
          </Tabs.Trigger>
          <Tabs.Trigger value="population" icon={<Glyph />} expand>
            Population
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="brief">b</Tabs.Content>
        <Tabs.Content value="population">p</Tabs.Content>
      </Tabs.Root>,
    );
    const brief = screen.getByRole('tab', { name: 'Brief' });
    expectHost(brief, 'Brief');
    expect(brief.getAttribute('aria-selected')).toBe('true');
    await user.click(screen.getByRole('tab', { name: 'Population' }));
    expect(screen.getByRole('tab', { name: 'Population' }).getAttribute('aria-selected')).toBe('true');
    await expectNoAxeViolations();
  });

  it('Pagination previous/next are icon-first by default, arrows-only on request', () => {
    const { unmount } = render(<Pagination pageCount={5} defaultPage={2} />);
    expectHost(screen.getByRole('button', { name: 'Previous page' }), 'Previous page');
    const next = screen.getByRole('button', { name: 'Next page' });
    expectHost(next, 'Next page');
    expect(next.querySelector('.ns-expand--end')).not.toBeNull();
    unmount();
    render(<Pagination pageCount={5} expand={false} />);
    expect(screen.getByRole('button', { name: 'Previous page' }).getAttribute('aria-label')).toBe('Previous page');
  });

  it('collapsed Breadcrumbs fold the middle crumbs and keep their full names', async () => {
    render(
      <Breadcrumbs
        collapse
        items={[
          { label: 'Studies', href: '#' },
          { label: 'Weekday lunch occasions', href: '#', icon: <Glyph /> },
          { label: 'Population', href: '#' },
          { label: 'Panel 2' },
        ]}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items[0]!.classList.contains('ns-expand-host')).toBe(false);
    expect(items[3]!.classList.contains('ns-expand-host')).toBe(false);
    expectHost(items[1]!, 'Weekday lunch occasions');
    expect(items[2]!.querySelector('.ns-breadcrumbs__more')?.textContent).toBe('…');
    expect(screen.getByRole('link', { name: 'Weekday lunch occasions' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Population' })).toBeTruthy();
    await expectNoAxeViolations();
  });

  it('Tag and Badge lead with an icon and open to their text', async () => {
    render(
      <p>
        <Tag icon={<Glyph />} expand onRemove={() => {}} removeLabel="Remove Seeded">
          Seeded
        </Tag>
        <Badge icon={<Glyph />} expand>
          Locked
        </Badge>
        <Badge icon={<Glyph />}>12</Badge>
      </p>,
    );
    expectHost(screen.getByText('Seeded').closest('.ns-tag') as HTMLElement, 'Seeded');
    expectHost(screen.getByText('Locked').closest('.ns-badge') as HTMLElement, 'Locked');
    expect((screen.getByText('12').closest('.ns-badge') as HTMLElement).classList.contains('ns-expand-host')).toBe(false);
    await expectNoAxeViolations();
  });

  it('Menu.Trigger and ExportMenu: icon-first, open while the menu is open', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Menu.Root>
          <Menu.Trigger className="ns-button ns-button--ghost ns-size-md" icon={<Glyph />} expand>
            More actions
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item onSelect={() => {}}>Archive</Menu.Item>
          </Menu.Content>
        </Menu.Root>
        <ExportMenu onExport={() => {}} expand />
      </div>,
    );
    const more = screen.getByRole('button', { name: 'More actions' });
    expectHost(more, 'More actions');
    expectHost(screen.getByRole('button', { name: 'Export' }), 'Export');
    await user.click(more);
    expect(more.getAttribute('aria-expanded')).toBe('true');
    await expectNoAxeViolations();
  });

  it('NextAction: Back is icon-first; the next action keeps its full label', async () => {
    const user = userEvent.setup();
    render(
      <FlowSteps label="Setup">
        <FlowStep value="a" title="Brief">
          <NextAction />
        </FlowStep>
        <FlowStep value="b" title="Population">
          <NextAction />
        </FlowStep>
      </FlowSteps>,
    );
    await user.click(document.querySelector<HTMLElement>('.ns-next-action__go')!);
    const back = screen.getByRole('button', { name: 'Back' });
    expectHost(back, 'Back');
    expect(screen.getByRole('button', { name: /Finish/ }).classList.contains('ns-expand-host')).toBe(false);
  });

  it('Northstar parts: StudyShell icon tabs, RunCost icon, StudyStatus chip, ResearchBuilder item actions', async () => {
    const { unmount } = render(<StudyShell study={study} iconTabs="expand" />);
    expectHost(screen.getByRole('tab', { name: 'Brief' }), 'Brief');
    unmount();
    const { unmount: u2 } = render(<StudyShell study={study} />);
    const tab = screen.getByRole('tab', { name: 'Population' });
    expect(tab.querySelector('.ns-tabs__icon svg'), tab.outerHTML).not.toBeNull();
    expect(tab.classList.contains('ns-expand-host')).toBe(false);
    u2();
    render(
      <div>
        <RunCost estimate={{ amount: 12, currency: 'EUR', basis: '1000 agents' }} onRun={() => {}} expand />
        <StudyStatus state="running" expand />
        <ResearchBuilder defaultItems={[{ key: 'a', question: 'Q A', type: 'mood_direction' }]} />
      </div>,
    );
    expectHost(screen.getByRole('button', { name: 'Run study' }), 'Run study');
    expectHost(screen.getByText('Running').closest('.ns-study-status') as HTMLElement, 'Running');
    expectHost(screen.getByRole('button', { name: 'Remove R1' }), 'Remove R1');
    await expectNoAxeViolations();
  });

  it('Card header actions and HoverActions compose with expand buttons and stay reachable', async () => {
    const user = userEvent.setup();
    render(<Card title="Weekday lunch" revealActions actions={<IconButton label="Duplicate" icon={<Glyph />} expand size="sm" variant="ghost" />} />);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Duplicate' }));
  });

  it('the stylesheet opens labels on hover, keyboard focus, selection and touch, with the 0fr to 1fr grid', () => {
    expect(css).toMatch(/\.ns-expand-host \.ns-expand \{\s*grid-template-columns: 0fr;/);
    expect(css).toContain(".ns-expand-host:is(:hover, :focus-visible, :has(:focus-visible), [data-expand='always'], [aria-selected='true'], [aria-expanded='true']) .ns-expand { grid-template-columns: 1fr;");
    expect(css).toMatch(/@media \(hover: none\) \{\s*\.ns-expand-host \.ns-expand \{ grid-template-columns: 1fr;/);
    expect(css).toContain('var(--ns-motion-easing-glide)');
  });
});

describe('brushed silver on glass', () => {
  it('tone="silver" asks for silver anywhere; material="solid" marks the opt-out', () => {
    render(
      <div>
        <Button tone="silver">Silver</Button>
        <Button material="solid">Solid</Button>
      </div>,
    );
    expect(screen.getByRole('button', { name: 'Silver' }).className).toContain('ns-button--silver');
    expect(screen.getByRole('button', { name: 'Solid' }).getAttribute('data-material')).toBe('solid');
  });

  it('turns on by itself inside liquid glass, glass surfaces and [data-material=glass], with every fallback', () => {
    const sel = ".ns-button:is(.ns-button--silver, :where(.ns-liquid, .ns-material--glass, [data-material='glass']) :is(.ns-button--secondary, .ns-button--primary):not(.ns-button--glass, [data-material='solid']))";
    expect(css.split(sel).length - 1).toBeGreaterThanOrEqual(8);
    expect(css).toContain('var(--ns-material-silver-grain)');
    expect(css).toContain('var(--ns-mx, 30%) var(--ns-my, 0%)');
    for (const m of ['@media (prefers-reduced-transparency: reduce)', '@media (forced-colors: active)', '@media (prefers-contrast: more)']) {
      const at = css.lastIndexOf(m);
      expect(css.slice(at, at + 600), m).toContain(sel);
    }
  });

  it('a button on glass tracks the pointer for its sheen', () => {
    render(
      <LiquidGlass>
        <Button>On glass</Button>
      </LiquidGlass>,
    );
    const b = screen.getByRole('button', { name: 'On glass' });
    fireEvent.pointerMove(b, { clientX: 4, clientY: 4 });
    expect(b.hasAttribute('data-pointer')).toBe(true);
  });

  it('ships silver tokens for both themes', () => {
    for (const t of ['night', 'day'] as const) {
      const roles = tokens.themes[t] as Record<string, string>;
      for (const k of ['hi', 'lo', 'signal-hi', 'signal-lo', 'ink', 'grain', 'sheen']) expect(roles[`material.silver.${k}`], `${t} ${k}`).toBeDefined();
    }
  });
});

describe('precision radii', () => {
  it('LIQUID.radius mirrors radius.glass.* and LiquidGlass defaults to the panel step', () => {
    const s = tokens.scales as Record<string, string>;
    for (const k of Object.keys(LIQUID.radius) as Array<keyof typeof LIQUID.radius>) expect(parseFloat(s[`radius.glass.${k}`]!), k).toBe(LIQUID.radius[k]);
    render(
      <div>
        <LiquidGlass data-testid="d">Default</LiquidGlass>
        <LiquidGlass data-testid="full" radius="full">Full</LiquidGlass>
        <LiquidGlass data-testid="n" radius={4}>Px</LiquidGlass>
      </div>,
    );
    expect(screen.getByTestId('d').style.getPropertyValue('--ns-liquid-radius')).toBe('var(--ns-radius-glass-panel)');
    expect(screen.getByTestId('full').style.getPropertyValue('--ns-liquid-radius')).toBe('9999px');
    expect(screen.getByTestId('n').style.getPropertyValue('--ns-liquid-radius')).toBe('4px');
  });

  it('glass surfaces, toolbars and buttons use radius.glass tokens; explicit radii still win', () => {
    render(
      <div>
        <Surface data-testid="g">Glass</Surface>
        <Surface data-testid="s" material="solid">Solid</Surface>
        <Surface data-testid="r" radius={6}>Six</Surface>
      </div>,
    );
    expect(screen.getByTestId('g').className).not.toMatch(/ns-radius-/);
    expect(screen.getByTestId('s').className).toContain('ns-radius-12');
    expect(screen.getByTestId('r').className).toContain('ns-radius-6');
    expect(css).toContain('.ns-toolbar.ns-liquid { --ns-liquid-radius: var(--ns-radius-glass-bar); }');
    expect(css).toMatch(/:where\(\.ns-surface\.ns-material--glass\) \{ border-radius: var\(--ns-radius-glass-panel\); \}/);
    expect(css).not.toContain('--ns-liquid-radius: 14px');
  });
});
