// @vitest-environment jsdom
import './setup.js';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import userEvent from '@testing-library/user-event';
import {
  Button, Card, Dialog, IconButton, Link, Menu, NorthstarProvider, Panel, Popover, Sheet, Surface, Switch, Table, TableBody,
  TableCell, TableHead, TableHeaderCell, TableRow, Tabs, Toast, Tooltip,
} from '../src/index.js';
import { expectNoAxeViolations } from './a11y.js';

/** jsdom has no layout; give elements a box so pointer maths has something to work with. */
function withBox(el: HTMLElement, w = 200, h = 100) {
  el.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: w, bottom: h, width: w, height: h, toJSON: () => ({}) });
}

function pointerMove(el: HTMLElement, x: number, y: number, pointerType = 'mouse') {
  const e = new MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y });
  Object.defineProperty(e, 'pointerType', { value: pointerType });
  el.dispatchEvent(e);
}

describe('Surface, Card, Panel', () => {
  it('Surface is glass by default and can be solid, at three depths', async () => {
    render(
      <div>
        <Surface data-testid="glass">Glass</Surface>
        <Surface data-testid="solid" material="solid" depth={3} as="section" aria-label="Solid surface">Solid</Surface>
      </div>,
    );
    expect(screen.getByTestId('glass').className).toContain('ns-material--glass');
    const solid = screen.getByTestId('solid');
    expect(solid.tagName).toBe('SECTION');
    expect(solid.className).toContain('ns-material--solid');
    expect(solid.className).toContain('ns-depth-3');
    await expectNoAxeViolations();
  });

  it('Card renders title, description, actions, body and footer in every variant', async () => {
    render(
      <div>
        {(['solid', 'glass', 'spotlight'] as const).map((v) => (
          <Card key={v} variant={v} title={`Card ${v}`} description="Twelve agents" actions={<Button size="sm">Open</Button>} footer={<Button size="sm">Run</Button>}>
            Body {v}
          </Card>
        ))}
      </div>,
    );
    for (const v of ['solid', 'glass', 'spotlight']) {
      const heading = screen.getByRole('heading', { name: `Card ${v}` });
      const card = heading.closest('.ns-card')!;
      expect(card.className).toContain(`ns-card--${v}`);
      expect(card.className).toContain(v === 'solid' ? 'ns-material--solid' : 'ns-material--glass');
      expect(card.textContent).toContain(`Body ${v}`);
    }
    expect(screen.getAllByRole('button', { name: 'Run' })).toHaveLength(3);
    await expectNoAxeViolations();
  });

  it('spotlight tracks the pointer in CSS variables without re-rendering, and ignores touch', async () => {
    let renders = 0;
    function Probe() {
      renders++;
      return <span>probe</span>;
    }
    render(
      <Card variant="spotlight" data-testid="card">
        <Probe />
      </Card>,
    );
    const card = screen.getByTestId('card');
    withBox(card);
    const before = renders;
    pointerMove(card, 10, 10, 'touch');
    expect(card.hasAttribute('data-pointer')).toBe(false);
    pointerMove(card, 40, 30);
    pointerMove(card, 50, 25);
    expect(card.hasAttribute('data-pointer')).toBe(true);
    await waitFor(() => expect(card.style.getPropertyValue('--ns-mx')).toBe('50.0px'));
    expect(card.style.getPropertyValue('--ns-my')).toBe('25.0px');
    expect(renders).toBe(before);
    fireEvent.pointerLeave(card);
    expect(card.hasAttribute('data-pointer')).toBe(false);
  });

  it('solid cards attach no pointer tracking', () => {
    render(<Card data-testid="card">Plain</Card>);
    const card = screen.getByTestId('card');
    withBox(card);
    pointerMove(card, 10, 10);
    expect(card.hasAttribute('data-pointer')).toBe(false);
    expect(card.className).not.toContain('ns-reactive');
  });

  it('interactive and orbit cards expose their modifiers; the action inside stays keyboard reachable', async () => {
    const onClick = vi.fn();
    render(
      <Card variant="glass" interactive orbit title="Brief">
        <Button onClick={onClick}>Open brief</Button>
      </Card>,
    );
    const card = screen.getByRole('heading', { name: 'Brief' }).closest('.ns-card')!;
    expect(card.className).toContain('ns-card--interactive');
    expect(card.className).toContain('ns-card--orbit');
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open brief' }));
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('Panel is a labelled region and follows the provider material', async () => {
    render(
      <NorthstarProvider theme="night" material="glass">
        <Panel title="Population" actions={<IconButton label="Panel settings" icon={<svg aria-hidden="true" />} />}>
          Margins
        </Panel>
        <Panel title="Solid one" variant="solid" flush>
          Rows
        </Panel>
      </NorthstarProvider>,
    );
    const region = screen.getByRole('region', { name: 'Population' });
    expect(region.className).toContain('ns-material--glass');
    expect(screen.getByRole('region', { name: 'Solid one' }).className).toContain('ns-material--solid');
    await expectNoAxeViolations();
  });

  it('renders on the server', () => {
    const html = renderToString(
      <Card variant="spotlight" title="Server">
        <Surface>Glass</Surface>
      </Card>,
    );
    expect(html).toContain('ns-card--spotlight');
    expect(html).toContain('ns-material--glass');
  });
});

describe('Button interactions', () => {
  it('keeps its API: loading still disables and marks busy, with the north-star spinner', async () => {
    render(<Button variant="primary" loading>Run study</Button>);
    const b = screen.getByRole('button');
    expect(b.hasAttribute('disabled')).toBe(true);
    expect(b.getAttribute('aria-busy')).toBe('true');
    expect(b.querySelector('.ns-spinner--star')).toBeTruthy();
    expect(b.textContent).toContain('Loading');
    await expectNoAxeViolations();
  });

  it('success shows the check and adds the success label to the accessible name', async () => {
    const { rerender } = render(<Button>Save</Button>);
    expect(screen.getByRole('button').querySelector('.ns-button__check')).toBeNull();
    rerender(<Button success successLabel="Saved">Save</Button>);
    const b = screen.getByRole('button', { name: /Saved/ });
    expect(b.getAttribute('data-success')).toBe('true');
    expect(b.querySelector('.ns-button__check')).toBeTruthy();
    expect(b.hasAttribute('disabled')).toBe(false);
    // Loading wins over success.
    rerender(<Button success loading>Save</Button>);
    expect(screen.getByRole('button').querySelector('.ns-button__check')).toBeNull();
    await expectNoAxeViolations();
  });

  it('magnetic leans toward the pointer and lets go on leave; clicks and keys are unaffected', async () => {
    const onClick = vi.fn();
    render(<Button magnetic onClick={onClick}>Pull</Button>);
    const b = screen.getByRole('button');
    withBox(b, 100, 40);
    expect(b.getAttribute('data-magnetic')).toBe('true');
    pointerMove(b, 100, 40);
    await waitFor(() => expect(b.style.getPropertyValue('--ns-mag-x')).toBe('4.00px'));
    expect(b.style.getPropertyValue('--ns-mag-y')).toBe('4.00px');
    fireEvent.pointerLeave(b);
    expect(b.style.getPropertyValue('--ns-mag-x')).toBe('');
    await userEvent.click(b);
    b.focus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('magnetic holds still under reduced motion', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ ...original(q), matches: q.includes('reduced-motion') })) as typeof window.matchMedia;
    try {
      render(<Button magnetic>Still</Button>);
      const b = screen.getByRole('button');
      withBox(b, 100, 40);
      pointerMove(b, 100, 40);
      await waitFor(() => expect(b.style.getPropertyValue('--ns-mx')).toBe('100.0px'));
      expect(b.style.getPropertyValue('--ns-mag-x')).toBe('');
    } finally {
      window.matchMedia = original;
    }
  });

  it('glass material applies to the button and still forwards refs', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button material="glass" ref={ref}>Glass</Button>);
    expect(ref.current).toBe(screen.getByRole('button'));
    expect(ref.current!.className).toContain('ns-button--glass');
  });
});

describe('Link, Switch, Table', () => {
  it('Link keeps its semantics and stays keyboard focusable', async () => {
    render(<Link href="/method">Method</Link>);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Method' }));
    await expectNoAxeViolations();
  });

  it('Switch toggles by click and Space', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch onCheckedChange={onCheckedChange}>Live updates</Switch>);
    const sw = screen.getByRole('switch', { name: 'Live updates' });
    await userEvent.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('true');
    sw.focus();
    await userEvent.keyboard(' ');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(onCheckedChange).toHaveBeenCalledTimes(2);
    await expectNoAxeViolations();
  });

  it('interactive tables mark themselves and pass axe', async () => {
    render(
      <Table interactive caption="Studies">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell numeric>n</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>
              <Link href="/s/1">Weekday lunch</Link>
            </TableCell>
            <TableCell numeric>300</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('table').className).toContain('ns-table--interactive');
    await expectNoAxeViolations();
  });
});

describe('Tabs indicator', () => {
  it('renders one hidden indicator and keeps the keyboard model', async () => {
    const onValueChange = vi.fn();
    render(
      <Tabs.Root defaultValue="brief" indicator="glass" onValueChange={onValueChange}>
        <Tabs.List label="Study">
          <Tabs.Trigger value="brief">Brief</Tabs.Trigger>
          <Tabs.Trigger value="population">Population</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="brief">Brief panel</Tabs.Content>
        <Tabs.Content value="population">Population panel</Tabs.Content>
      </Tabs.Root>,
    );
    const list = screen.getByRole('tablist');
    const marks = list.querySelectorAll('.ns-tabs__indicator');
    expect(marks).toHaveLength(1);
    expect(marks[0]!.getAttribute('aria-hidden')).toBe('true');
    expect(list.closest('.ns-tabs')!.className).toContain('ns-tabs--glass');
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    screen.getByRole('tab', { name: 'Brief' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenCalledWith('population');
    expect(screen.getByRole('tabpanel').textContent).toBe('Population panel');
    await expectNoAxeViolations();
  });

  it('moves the indicator to the selected tab once it can measure', async () => {
    const offsets = { brief: 0, population: 80 };
    const spy = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.getAttribute('role') === 'tab' ? 72 : 0;
    });
    const left = vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (this: HTMLElement) {
      return offsets[this.getAttribute('data-value') as keyof typeof offsets] ?? 0;
    });
    try {
      render(
        <Tabs.Root defaultValue="brief">
          <Tabs.List label="Study">
            <Tabs.Trigger value="brief">Brief</Tabs.Trigger>
            <Tabs.Trigger value="population">Population</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>,
      );
      const list = screen.getByRole('tablist');
      const mark = list.querySelector<HTMLElement>('.ns-tabs__indicator')!;
      expect(list.hasAttribute('data-indicator')).toBe(true);
      expect(mark.style.transform).toBe('translate(0px, 0px)');
      expect(mark.style.width).toBe('72px');
      await userEvent.click(screen.getByRole('tab', { name: 'Population' }));
      expect(mark.style.transform).toBe('translate(80px, 0px)');
    } finally {
      spy.mockRestore();
      left.mockRestore();
    }
  });
});

describe('glass layers', () => {
  it('Dialog takes the provider material, marks its state, and closes at once with no exit animation', async () => {
    render(
      <NorthstarProvider theme="day" material="glass">
        <Dialog.Root>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Run study</Dialog.Title>
              <Dialog.Close />
            </Dialog.Header>
            <Dialog.Body>Three hundred agents.</Dialog.Body>
          </Dialog.Content>
        </Dialog.Root>
      </NorthstarProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog', { name: 'Run study' });
    expect(dialog.className).toContain('ns-material--glass');
    expect(dialog.getAttribute('data-state')).toBe('open');
    await expectNoAxeViolations();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open' }));
  });

  it('keeps a closing layer mounted, inert, until its exit animation ends', async () => {
    const real = window.getComputedStyle;
    const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) => {
      const cs = real(el, pseudo);
      if ((el as HTMLElement).getAttribute?.('data-state') === 'closed') {
        return { ...cs, animationName: 'ns-layer-out', animationDuration: '120ms', animationDelay: '0s' } as CSSStyleDeclaration;
      }
      return cs;
    });
    try {
      render(
        <Popover.Root>
          <Popover.Trigger>Filters</Popover.Trigger>
          <Popover.Content label="Filters" material="glass">
            <button type="button">Apply</button>
          </Popover.Content>
        </Popover.Root>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
      const pop = screen.getByRole('dialog', { name: 'Filters' });
      expect(pop.getAttribute('data-state')).toBe('open');
      await userEvent.keyboard('{Escape}');
      expect(pop.isConnected).toBe(true);
      expect(pop.getAttribute('data-state')).toBe('closed');
      expect(pop.hasAttribute('inert')).toBe(true);
      act(() => {
        pop.dispatchEvent(new Event('animationend', { bubbles: true }));
      });
      expect(pop.isConnected).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });

  it('Menu, Sheet, Tooltip and Toast accept material and pass axe', async () => {
    render(
      <NorthstarProvider theme="night">
        <Menu.Root>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Content material="glass">
            <Menu.Item>Duplicate</Menu.Item>
          </Menu.Content>
        </Menu.Root>
        <Tooltip content="Copies the study" material="glass">
          <button type="button">Copy</button>
        </Tooltip>
        <Toast title="Saved" material="glass" />
      </NorthstarProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menu').className).toContain('ns-material--glass');
    expect(screen.getByRole('menu').getAttribute('data-state')).toBe('open');
    await userEvent.keyboard('{Escape}');
    screen.getByRole('button', { name: 'Copy' }).focus();
    const tip = await screen.findByRole('tooltip');
    expect(tip.className).toContain('ns-material--glass');
    expect(screen.getByText('Saved').closest('.ns-toast')!.className).toContain('ns-material--glass');
    await expectNoAxeViolations();
  });

  it('Sheet in glass traps focus like before', async () => {
    render(
      <Sheet.Root>
        <Sheet.Trigger>Details</Sheet.Trigger>
        <Sheet.Content material="glass" side="right">
          <Sheet.Header>
            <Sheet.Title>Agent</Sheet.Title>
            <Sheet.Close />
          </Sheet.Header>
        </Sheet.Content>
      </Sheet.Root>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Details' }));
    const sheet = screen.getByRole('dialog', { name: 'Agent' });
    expect(sheet.className).toContain('ns-material--glass');
    expect(sheet.contains(document.activeElement)).toBe(true);
    await userEvent.tab();
    expect(sheet.contains(document.activeElement)).toBe(true);
    await expectNoAxeViolations();
  });

  it('defaults stay solid without a provider material', async () => {
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>P</Popover.Trigger>
        <Popover.Content label="Solid">x</Popover.Content>
      </Popover.Root>,
    );
    expect(screen.getByRole('dialog', { name: 'Solid' }).className).toContain('ns-material--solid');
  });
});
