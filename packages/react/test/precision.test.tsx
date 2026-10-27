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
  NorthstarProvider, Portal, Toolbar, ToolbarItem,
} from '../src/index.js';
import { ConstellationButton } from '../src/effects/index.js';
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

const SPIN = ":is(.ns-button, .ns-fx-cbutton):not(.ns-button--glass, [data-finish='soft'], [data-button-finish='soft'] :not([data-finish='spin']))";
const fxCss = readFileSync(join(__dirname, '../src/effects.css'), 'utf8');

describe('machined spin finish', () => {
  it('is the default finish of every button; finish="soft" and the provider opt out; tone="silver" is an alias', () => {
    render(
      <div>
        <Button>Default</Button>
        <Button finish="soft">Soft</Button>
        <Button tone="silver">Silver</Button>
        <IconButton label="Add" icon={<Glyph />} finish="soft" />
        <NorthstarProvider buttonFinish="soft" data-testid="soft-root">
          <Button>Inherits soft</Button>
          <Button finish="spin">Own spin</Button>
          <Button tone="silver">Silver alias</Button>
          <Toolbar label="T">
            <ToolbarItem label="Run" icon={<Glyph />} />
          </Toolbar>
        </NorthstarProvider>
      </div>,
    );
    const finish = (name: string) => screen.getByRole('button', { name }).getAttribute('data-finish');
    expect(finish('Default')).toBe('spin');
    expect(finish('Soft')).toBe('soft');
    expect(finish('Silver')).toBe('spin');
    expect(screen.getByRole('button', { name: 'Silver' }).className).toContain('ns-button--silver');
    expect(finish('Add')).toBe('soft');
    expect(finish('Inherits soft')).toBe('soft');
    expect(finish('Own spin')).toBe('spin');
    expect(finish('Silver alias')).toBe('spin');
    expect(finish('Run')).toBe('soft');
    expect(screen.getByTestId('soft-root').getAttribute('data-button-finish')).toBe('soft');
  });

  it('marks the provider root and portals, so plain .ns-button elements follow it through CSS', () => {
    render(
      <NorthstarProvider buttonFinish="soft">
        <Portal>
          <button type="button" className="ns-button ns-button--secondary">
            Plain
          </button>
        </Portal>
      </NorthstarProvider>,
    );
    expect(document.querySelector('.ns-portal')?.getAttribute('data-button-finish')).toBe('soft');
    expect(css).toContain("[data-button-finish='soft'] :not([data-finish='spin'])");
  });

  it('Menu.Trigger and ConstellationButton take finish; unset they inherit', () => {
    render(
      <div>
        <Menu.Root>
          <Menu.Trigger className="ns-button ns-button--ghost ns-size-md" icon={<Glyph />} expand finish="soft">
            More
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item onSelect={() => {}}>Archive</Menu.Item>
          </Menu.Content>
        </Menu.Root>
        <ConstellationButton finish="soft">Soft star</ConstellationButton>
        <ConstellationButton>Spin star</ConstellationButton>
      </div>,
    );
    expect(screen.getByRole('button', { name: 'More' }).getAttribute('data-finish')).toBe('soft');
    expect(screen.getByRole('button', { name: 'Soft star' }).getAttribute('data-finish')).toBe('soft');
    expect(screen.getByRole('button', { name: 'Spin star' }).hasAttribute('data-finish')).toBe(false);
    expect(fxCss).toMatch(/\.ns-fx-cbutton::after \{[^}]*repeating-linear-gradient/);
  });

  it('a spin button tracks the pointer and writes -1..1 ratios for the turning sweep', async () => {
    render(<Button>Spin</Button>);
    const b = screen.getByRole('button', { name: 'Spin' });
    b.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40, right: 100, bottom: 40, x: 0, y: 0, toJSON: () => ({}) });
    // jsdom's PointerEvent carries no coordinates, so move with a MouseEvent of the same type.
    b.dispatchEvent(new MouseEvent('pointermove', { clientX: 100, clientY: 10, bubbles: true }));
    expect(b.hasAttribute('data-pointer')).toBe(true);
    await new Promise((r) => setTimeout(r, 40));
    expect(b.style.getPropertyValue('--ns-pointer-x')).toBe('1.000');
    expect(b.style.getPropertyValue('--ns-pointer-y')).toBe('-0.500');
    fireEvent.pointerLeave(b);
    expect(b.style.getPropertyValue('--ns-pointer-x')).toBe('');
  });

  it('draws the metal in ::before (conic sweep and concentric grain, both centred) and the sliding band in ::after', () => {
    expect(css).toContain("@property --ns-spin-angle { syntax: '<angle>'; inherits: false; initial-value: 200deg; }");
    const before = css.slice(css.indexOf(`${SPIN}::before {`));
    expect(before).toMatch(/repeating-radial-gradient\(circle at 50% 50%, var\(--ns-spin-grain-dark\) 0 1px, var\(--ns-spin-grain\) 1px 2px\)/);
    expect(before).toMatch(/conic-gradient\(from var\(--ns-spin-angle\) at 50% 50%, var\(--ns-spin-1\), var\(--ns-spin-2\) 8%/);
    expect(css).toContain(`${SPIN}::after {\n  inset: -1px;`);
    expect(css).toContain('linear-gradient(100deg, transparent 30%, var(--ns-material-spin-sheen) 50%, transparent 70%) 120% 0 / 260% 100% no-repeat');
    expect(css).toContain(`${SPIN}:is(:hover, :focus-visible):not(:disabled)::after { background-position: -20% 0; }`);
    expect(css).toContain('var(--ns-pointer-x, 0) * var(--ns-material-spin-turn)');
    expect(css).toContain(`${SPIN}:focus-visible { outline: 2px solid var(--ns-color-focus); outline-offset: 3px; }`);
    // Glacier-anodized primary and signal; ghost wash; matte disabled.
    expect(css).toContain(`${SPIN}:is(.ns-button--primary, .ns-fx-cbutton--primary, .ns-tone-signal:not(.ns-button--ghost)) {\n  --ns-spin-1: var(--ns-material-spin-signal-stop-1);`);
    expect(css).toContain(`${SPIN}.ns-button--ghost { --ns-spin-on: 0; }`);
    expect(css).toContain('--ns-spin-on: var(--ns-material-spin-ghost);');
    expect(css).toContain(`${SPIN}:disabled:not([data-loading])::before { background: var(--ns-material-spin-matte); }`);
    // One metal system: the brushed silver finish is gone.
    expect(css).not.toContain('--ns-material-silver');
  });

  it('has every fallback: no grain, flat and outlined, system colours, and no motion', () => {
    const tail = css.slice(css.indexOf('machined spin fallbacks'));
    const block = (m: string) => tail.slice(tail.indexOf(m), tail.indexOf('\n}\n', tail.indexOf(m)));
    expect(block('@media (prefers-reduced-transparency: reduce)')).toContain('--ns-spin-grain: transparent; --ns-spin-grain-dark: transparent;');
    expect(block('@media (prefers-contrast: more)')).toContain('background: var(--ns-spin-2);');
    expect(block('@media (prefers-contrast: more)')).toContain('box-shadow: 0 0 0 1px var(--ns-spin-ink);');
    expect(block('@media (forced-colors: active)')).toContain('background: ButtonFace;');
    const rm = block('@media (prefers-reduced-motion: reduce)');
    expect(rm).toContain(`${SPIN}::after { display: none; }`);
    expect(rm).toContain('--ns-spin-angle: var(--ns-material-spin-angle);');
  });

  it('ships spin tokens for both themes', () => {
    for (const t of ['night', 'day'] as const) {
      const roles = tokens.themes[t] as Record<string, string>;
      for (const k of ['stop.1', 'stop.7', 'signal-stop.1', 'ink', 'signal-ink', 'grain-dark', 'sheen', 'shadow', 'shadow-press', 'ghost', 'matte', 'matte-ink'])
        expect(roles[`material.spin.${k}`], `${t} ${k}`).toBeDefined();
    }
  });

  it('every variant, size and the icon circles pass axe with the spin finish', async () => {
    render(
      <div>
        <Button variant="primary">Run</Button>
        <Button>Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button disabled>Disabled</Button>
        <IconButton label="Search" icon={<Glyph />} size="lg" />
        <IconButton label="Copy" icon={<Glyph />} expand />
      </div>,
    );
    await expectNoAxeViolations();
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

describe('pill buttons and tactile texture', () => {
  it('every button is a pill by default; shape="rounded" opts out', () => {
    render(
      <div>
        <Button>Pill</Button>
        <Button shape="rounded">Rounded</Button>
        <IconButton label="Search" icon={<Glyph />} shape="rounded" />
      </div>,
    );
    const pill = screen.getByRole('button', { name: 'Pill' });
    expect(pill.getAttribute('data-shape')).toBe('pill');
    expect(pill.className).not.toContain('ns-button--rounded');
    expect(screen.getByRole('button', { name: 'Rounded' }).className).toContain('ns-button--rounded');
    expect(screen.getByRole('button', { name: 'Search' }).className).toContain('ns-button--rounded');
    expect(css).toMatch(/--ns-button-radius: var\(--ns-radius-control-pill\);\s+border-radius: var\(--ns-button-radius\);/);
    expect(css).toContain('.ns-button.ns-button--rounded,');
    expect(css).toContain('.ns-button.ns-button--rounded.ns-button--glass { --ns-button-radius: var(--ns-radius-glass-control); }');
    expect(parseFloat((tokens.scales as Record<string, string>)['radius.control.pill']!)).toBeGreaterThanOrEqual(999);
  });

  it('icon-only buttons are perfect circles with the icon centred; icon-led ones keep expand', () => {
    render(
      <Toolbar label="Tools">
        <IconButton label="Add" icon={<Glyph />} />
        <ToolbarItem label="Run" icon={<Glyph />} />
      </Toolbar>,
    );
    const add = screen.getByRole('button', { name: 'Add' });
    expect(add.className).toContain('ns-icon-button');
    expect(add.classList.contains('ns-expand-host')).toBe(false);
    expect(css).toContain('.ns-icon-button:not(.ns-expand-host) { aspect-ratio: 1; flex: none; }');
    expect(css).toMatch(/\.ns-icon-button:not\(\.ns-expand-host\) > \.ns-button__label \{ display: inline-flex; align-items: center; justify-content: center;/);
    expectHost(screen.getByRole('button', { name: 'Run' }), 'Run');
    expect(css).toContain('.ns-toolbar .ns-toolbar__item { border-radius: var(--ns-button-radius); }');
  });

  it('tabs, pagination and the spin finish are pills too, each with a rounded opt-out', () => {
    render(
      <div>
        <Tabs.Root defaultValue="a" indicator="glass" shape="rounded" data-testid="tabs">
          <Tabs.List aria-label="T">
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
        <Pagination pageCount={3} shape="rounded" data-testid="pages" />
      </div>,
    );
    expect(screen.getByTestId('tabs').className).toContain('ns-tabs--rounded');
    expect(screen.getByTestId('pages').className).toContain('ns-pagination--rounded');
    expect(css).toContain('.ns-tabs--pill .ns-tabs__indicator { background: var(--ns-color-surface-3); box-shadow: inset 0 0 0 1px var(--ns-color-line-2); border-radius: var(--ns-radius-control-pill); }');
    // The metal follows the button's radius, so pills, circles and rounded corners all hold.
    expect(css).toMatch(/:not\(\[data-finish='spin'\]\)\)::before \{\s+content: '';\s+position: absolute;\s+inset: -1px;\s+z-index: -1;\s+border-radius: inherit;/);
  });

  it('the soft finish carries a fine brushed texture per variant and theme, ghost only on hover, off on spin and glass', () => {
    for (const t of ['night', 'day'] as const) {
      const roles = tokens.themes[t] as Record<string, string>;
      for (const k of ['light', 'dark', 'top', 'bevel-hi', 'bevel-lo']) {
        expect(roles[`material.texture.${k}`], `${t} ${k}`).toBeDefined();
        expect(roles[`material.texture.signal-${k}`], `${t} signal-${k}`).toBeDefined();
      }
    }
    expect(css).toMatch(/\.ns-button::after \{[^}]*repeating-linear-gradient\(180deg, var\(--ns-tex-light\) 0 1px, transparent 1px 3px\)/);
    expect(css).toMatch(/\.ns-button--primary \{\s+--ns-tex-light: var\(--ns-material-texture-signal-light\);/);
    expect(css).toContain(".ns-button:is(.ns-button--secondary, .ns-button--primary) { --ns-tex-on: 1; }");
    expect(css).toContain(".ns-button.ns-button--ghost:is(:hover, :focus-visible, [aria-expanded='true'], [aria-current='page']):not(:disabled, .ns-button--glass) { --ns-tex-on: 1; }");
    expect(css).toContain(`${SPIN} {\n  --ns-tex-on: 0;`);
    const fallbacks = css.slice(css.indexOf('shape and texture fallbacks'));
    for (const m of ['prefers-reduced-transparency: reduce', 'prefers-contrast: more', 'forced-colors: active', 'prefers-reduced-motion: reduce']) expect(fallbacks, m).toContain(m);
  });
});
