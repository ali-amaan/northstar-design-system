// @vitest-environment jsdom
import './setup.js';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import userEvent from '@testing-library/user-event';
import {
  AppShell, Avatar, Badge, Banner, Button, ButtonGroup, EmptyState, Grid, IconButton, Kbd, Link, List, ListItem,
  NorthstarProvider, Skeleton, Stack, Stale, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Tag, TopBar,
  initials, useNorthstar,
} from '../src/index.js';
import { expectNoAxeViolations } from './a11y.js';

describe('NorthstarProvider', () => {
  it('writes data-theme and data-density in server HTML for an explicit theme', () => {
    const html = renderToString(<NorthstarProvider theme="day" density="compact">x</NorthstarProvider>);
    expect(html).toContain('data-theme="day"');
    expect(html).toContain('data-density="compact"');
  });

  it('omits data-theme on the server for system so tokens.css follows the OS', () => {
    const html = renderToString(<NorthstarProvider theme="system">x</NorthstarProvider>);
    expect(html).not.toContain('data-theme');
  });

  it('exposes theme, density and merged messages through useNorthstar', () => {
    function Probe() {
      const ns = useNorthstar();
      return <span>{`${ns.resolvedTheme}/${ns.density}/${ns.messages.close}/${ns.messages.clear}`}</span>;
    }
    render(<NorthstarProvider theme="night" density="comfortable" messages={{ close: 'Sulje' }}><Probe /></NorthstarProvider>);
    expect(screen.getByText('night/comfortable/Sulje/Clear')).toBeTruthy();
  });

  it('can write the attributes on <html>', () => {
    render(<NorthstarProvider theme="day" applyToDocument>x</NorthstarProvider>);
    expect(document.documentElement.getAttribute('data-theme')).toBe('day');
  });
});

describe('actions', () => {
  it('Button clicks, and loading disables it and marks it busy', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Run study</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Run study' }));
    expect(onClick).toHaveBeenCalledOnce();
    rerender(<Button onClick={onClick} loading variant="primary">Run study</Button>);
    const b = screen.getByRole('button');
    expect(b.hasAttribute('disabled')).toBe(true);
    expect(b.getAttribute('aria-busy')).toBe('true');
    await expectNoAxeViolations();
  });

  it('Button is reachable with the keyboard and activates on Enter and Space', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button'));
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('IconButton has its label as accessible name; ButtonGroup and Link pass axe', async () => {
    render(
      <div>
        <ButtonGroup label="View" attached>
          <Button>List</Button>
          <IconButton label="Settings" icon={<svg aria-hidden="true" />} />
        </ButtonGroup>
        <Link href="/method">Method</Link>
        <Link href="https://example.org" external>Docs</Link>
      </div>,
    );
    expect(screen.getByRole('button', { name: 'Settings' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'View' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Docs' }).getAttribute('rel')).toBe('noreferrer');
    await expectNoAxeViolations();
  });
});

describe('layout', () => {
  it('AppShell has one main landmark and a skip link; Stack and Grid render', async () => {
    render(
      <AppShell sidebar={<nav aria-label="Primary">nav</nav>} topBar={<TopBar start="Studies" end={<Avatar name="Ada Lovelace" />} />}>
        <Stack direction="row" gap={8}><span>a</span><span>b</span></Stack>
        <Grid columns={{ min: 120 }}><span>c</span></Grid>
      </AppShell>,
    );
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Skip to content' }).getAttribute('href')).toBe('#ns-main');
    await expectNoAxeViolations();
  });
});

describe('data display', () => {
  it('Avatar shows initials and never a star', async () => {
    expect(initials('Ada Lovelace')).toBe('AL');
    expect(initials('prince')).toBe('PR');
    expect(initials('')).toBe('?');
    render(<Avatar name="Grace Hopper" />);
    const a = screen.getByRole('img', { name: 'Grace Hopper' });
    expect(a.textContent).toBe('GH');
    expect(a.querySelector('svg')).toBeNull();
    await expectNoAxeViolations();
  });

  it('Table supports sortable headers with aria-sort', async () => {
    const onSort = vi.fn();
    render(
      <Table caption="Shares">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Option</TableHeaderCell>
            <TableHeaderCell numeric sort="descending" onSort={onSort}>Share</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow><TableCell>[OPTION]</TableCell><TableCell numeric>[SHARE]</TableCell></TableRow>
        </TableBody>
      </Table>,
    );
    const th = screen.getByRole('columnheader', { name: /Share/ });
    expect(th.getAttribute('aria-sort')).toBe('descending');
    await userEvent.click(screen.getByRole('button', { name: /Share/ }));
    expect(onSort).toHaveBeenCalledOnce();
    await expectNoAxeViolations();
  });

  it('Tag remove button, Badge, Kbd, List, EmptyState, Skeleton, Stale, Banner pass axe', async () => {
    const onRemove = vi.fn();
    render(
      <div>
        <Tag onRemove={onRemove}>Finland</Tag>
        <Badge tone="signal">[N]</Badge>
        <Kbd>⌘K</Kbd>
        <List>
          <ListItem title="Study [NAME]" description="Draft" end={<Badge>3</Badge>} />
        </List>
        <EmptyState title="No studies yet" description="Create one to start." action={<Button>New study</Button>} />
        <Skeleton width={120} />
        <Stale detail="refreshed [N] days ago"><p>[SHARE]</p></Stale>
        <Banner title="Cost unavailable" onDismiss={() => {}}>The estimate endpoint is not ready.</Banner>
        <Banner urgent title="Run failed" />
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove Finland' }));
    expect(onRemove).toHaveBeenCalledOnce();
    expect(screen.getByText('Stale')).toBeTruthy();
    expect(document.querySelector('.ns-stale')?.hasAttribute('data-stale')).toBe(true);
    expect(screen.getByRole('alert').textContent).toContain('Run failed');
    expect(screen.getByRole('status').textContent).toContain('Cost unavailable');
    await expectNoAxeViolations();
  });
});
