// @vitest-environment jsdom
import './setup.js';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Dialog, Menu, NorthstarProvider, Popover, Sheet, Toaster, Tooltip, toast } from '../src/index.js';
import { expectNoAxeViolations } from './a11y.js';

function DialogDemo({ onOpenChange }: { onOpenChange?: (o: boolean) => void }) {
  return (
    <NorthstarProvider theme="day">
      <Dialog.Root {...(onOpenChange ? { onOpenChange } : {})}>
        <Dialog.Trigger className="ns-button">Lock population</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Header>
            <div>
              <Dialog.Title>Lock the population?</Dialog.Title>
              <Dialog.Description>You can unlock it later.</Dialog.Description>
            </div>
            <Dialog.Close />
          </Dialog.Header>
          <Dialog.Footer>
            <Dialog.Close className="ns-button">Cancel</Dialog.Close>
            <Button variant="primary">Lock</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </NorthstarProvider>
  );
}

describe('Dialog', () => {
  it('opens, traps focus, closes on Escape and restores focus', async () => {
    const onOpenChange = vi.fn();
    render(<DialogDemo onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole('button', { name: 'Lock population' });
    await userEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Lock the population?' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-describedby')).toBeTruthy();
    // portal carries the theme
    expect(dialog.closest('.ns-portal')?.getAttribute('data-theme')).toBe('day');
    expect(dialog.contains(document.activeElement)).toBe(true);
    await expectNoAxeViolations();
    // Tab cycles: Close(x) -> Cancel -> Lock -> back to Close(x)
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Lock' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('closes on outside press and via Dialog.Close', async () => {
    render(<DialogDemo />);
    await userEvent.click(screen.getByRole('button', { name: 'Lock population' }));
    await userEvent.click(document.querySelector('.ns-overlay') as Element);
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Lock population' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Sheet', () => {
  it('is a modal dialog from the edge', async () => {
    render(
      <Sheet.Root>
        <Sheet.Trigger>Filters</Sheet.Trigger>
        <Sheet.Content side="right">
          <Sheet.Header><Sheet.Title>Filters</Sheet.Title><Sheet.Close /></Sheet.Header>
          <Sheet.Body><input aria-label="Name" /></Sheet.Body>
        </Sheet.Content>
      </Sheet.Root>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    const sheet = screen.getByRole('dialog', { name: 'Filters' });
    expect(sheet.className).toContain('ns-sheet--right');
    await expectNoAxeViolations();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Popover', () => {
  it('toggles from the trigger and dismisses on Escape and outside press', async () => {
    render(
      <div>
        <Popover.Root>
          <Popover.Trigger>Details</Popover.Trigger>
          <Popover.Content>
            <Popover.Title>Band</Popover.Title>
            <p>[BAND]</p>
          </Popover.Content>
        </Popover.Root>
        <button>outside</button>
      </div>,
    );
    const trigger = screen.getByRole('button', { name: 'Details' });
    await userEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('dialog', { name: 'Band' })).toBeTruthy();
    await expectNoAxeViolations();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Menu', () => {
  it('opens with ArrowDown, roves, typeaheads, selects with Enter, and returns focus', async () => {
    const onRename = vi.fn();
    const onArchive = vi.fn();
    render(
      <Menu.Root>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content>
          <Menu.Label>Study</Menu.Label>
          <Menu.Item onSelect={onRename}>Rename</Menu.Item>
          <Menu.Item disabled>Duplicate</Menu.Item>
          <Menu.Separator />
          <Menu.Item onSelect={onArchive} shortcut="⌘⌫">Archive</Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    );
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(document.activeElement?.textContent).toBe('Rename');
    await expectNoAxeViolations();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent).toContain('Archive'); // disabled skipped
    await userEvent.keyboard('{Home}');
    expect(document.activeElement?.textContent).toBe('Rename');
    await userEvent.keyboard('a');
    expect(document.activeElement?.textContent).toContain('Archive');
    await userEvent.keyboard('{Enter}');
    expect(onArchive).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(onRename).not.toHaveBeenCalled();
  });

  it('opens on ArrowUp focusing the last item', async () => {
    render(
      <Menu.Root>
        <Menu.Trigger>More</Menu.Trigger>
        <Menu.Content>
          <Menu.Item>One</Menu.Item>
          <Menu.Item>Two</Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    );
    screen.getByRole('button', { name: 'More' }).focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement?.textContent).toBe('Two');
  });
});

describe('Tooltip', () => {
  it('shows on focus, describes the trigger, hides on Escape and blur', async () => {
    render(
      <Tooltip content="Measured error band">
        <button>Band</button>
      </Tooltip>,
    );
    await userEvent.tab();
    const tip = screen.getByRole('tooltip');
    expect(tip.textContent).toBe('Measured error band');
    expect(screen.getByRole('button').getAttribute('aria-describedby')).toBe(tip.id);
    await expectNoAxeViolations();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows on hover after the delay', async () => {
    vi.useFakeTimers();
    try {
      render(
        <Tooltip content="Hint" delay={300}>
          <button>Hover me</button>
        </Tooltip>,
      );
      const { fireEvent } = await import('@testing-library/react');
      fireEvent.pointerEnter(screen.getByRole('button'));
      expect(screen.queryByRole('tooltip')).toBeNull();
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.getByRole('tooltip')).toBeTruthy();
      fireEvent.pointerLeave(screen.getByRole('button'));
      expect(screen.queryByRole('tooltip')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('Toast', () => {
  it('queues toasts in a polite live region, dismisses by button and by timer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(<Toaster />);
      act(() => {
        toast({ title: 'Study saved', duration: 1000 });
        toast({ title: 'Run queued', description: '[N] respondents', duration: 0, action: { label: 'View', onClick: () => {} } });
      });
      const region = screen.getByRole('status');
      expect(region.getAttribute('aria-live')).toBe('polite');
      expect(screen.getByText('Study saved')).toBeTruthy();
      await expectNoAxeViolations();
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.queryByText('Study saved')).toBeNull();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.click(screen.getByRole('button', { name: 'Dismiss' }));
      expect(screen.queryByText('Run queued')).toBeNull();
    } finally {
      act(() => toast.dismiss());
      vi.useRealTimers();
    }
  });
});
