// @vitest-environment jsdom
import './setup.js';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Breadcrumbs, Pagination, Sidebar, SidebarItem, SidebarSection, Tabs } from '../src/index.js';
import { expectNoAxeViolations } from './a11y.js';

describe('Tabs', () => {
  it('roves with arrows, activates automatically, wraps, and supports Home/End', async () => {
    const onValueChange = vi.fn();
    render(
      <Tabs.Root defaultValue="brief" onValueChange={onValueChange}>
        <Tabs.List label="Study">
          <Tabs.Trigger value="brief">Brief</Tabs.Trigger>
          <Tabs.Trigger value="population">Population</Tabs.Trigger>
          <Tabs.Trigger value="research" disabled>Research</Tabs.Trigger>
          <Tabs.Trigger value="responses">Responses</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="brief">Brief panel</Tabs.Content>
        <Tabs.Content value="population">Population panel</Tabs.Content>
        <Tabs.Content value="responses">Responses panel</Tabs.Content>
      </Tabs.Root>,
    );
    const brief = screen.getByRole('tab', { name: 'Brief' });
    expect(brief.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel', { name: 'Brief' }).textContent).toBe('Brief panel');
    await expectNoAxeViolations();
    await userEvent.tab();
    expect(document.activeElement).toBe(brief);
    await userEvent.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith('population');
    await userEvent.keyboard('{ArrowRight}'); // skips disabled
    expect(onValueChange).toHaveBeenLastCalledWith('responses');
    await userEvent.keyboard('{ArrowRight}'); // wraps
    expect(onValueChange).toHaveBeenLastCalledWith('brief');
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tabpanel').textContent).toBe('Responses panel');
    // only the selected tab is in the tab order
    expect(screen.getAllByRole('tab').filter((t) => t.tabIndex === 0)).toHaveLength(1);
  });

  it('is controllable', async () => {
    const onValueChange = vi.fn();
    render(
      <Tabs.Root value="a" onValueChange={onValueChange}>
        <Tabs.List label="X">
          <Tabs.Trigger value="a">A</Tabs.Trigger>
          <Tabs.Trigger value="b">B</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A</Tabs.Content>
        <Tabs.Content value="b">B</Tabs.Content>
      </Tabs.Root>,
    );
    await userEvent.click(screen.getByRole('tab', { name: 'B' }));
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(screen.getByRole('tab', { name: 'A' }).getAttribute('aria-selected')).toBe('true');
  });
});

describe('Breadcrumbs and Pagination', () => {
  it('Breadcrumbs mark the current page', async () => {
    render(<Breadcrumbs items={[{ label: 'Studies', href: '/studies' }, { label: '[NAME]' }]} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumbs' })).toBeTruthy();
    expect(screen.getByText('[NAME]').getAttribute('aria-current')).toBe('page');
    await expectNoAxeViolations();
  });

  it('Pagination moves between pages and collapses long ranges', async () => {
    const onPageChange = vi.fn();
    render(<Pagination pageCount={20} defaultPage={10} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: 'Page 10' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getAllByText('…')).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(11);
    await userEvent.click(screen.getByRole('button', { name: 'Page 20' }));
    expect(screen.getByRole('button', { name: 'Next page' }).hasAttribute('disabled')).toBe(true);
    await expectNoAxeViolations();
  });
});

describe('Sidebar', () => {
  it('is a labelled navigation with a current item', async () => {
    render(
      <Sidebar label="Workspace" header="Northstar">
        <SidebarSection title="Studies">
          <SidebarItem href="#a" active meta={3}>All studies</SidebarItem>
          <SidebarItem href="#b">Archived</SidebarItem>
        </SidebarSection>
      </Sidebar>,
    );
    expect(screen.getByRole('navigation', { name: 'Workspace' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /All studies/ }).getAttribute('aria-current')).toBe('page');
    await expectNoAxeViolations();
  });
});
