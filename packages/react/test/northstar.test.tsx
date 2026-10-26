// @vitest-environment jsdom
import './setup.js';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ResearchItem, StudyTab } from '@northstar-js/contracts';
import { studyAurora, studyBorealis, studyCassiopeia } from '@northstar-js/contracts/fixtures';
import { NorthstarProvider } from '../src/index.js';
import {
  BriefForm, ExportMenu, PopulationPanel, ResearchBuilder, ResponsesView, RunConfirm, RunCost, StudyShell, StudyStatus,
  type BriefValue,
} from '../src/northstar/index.js';
import { EmptyBrief, NorthstarLockup, StatusRunning, spotIllustrations } from '../src/illustrations/index.js';
import { expectNoAxeViolations } from './a11y.js';

function setReducedMotion(reduce: boolean) {
  window.matchMedia = (query: string) =>
    ({
      matches: reduce && query.includes('reduce'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

describe('StudyStatus', () => {
  it('shows a shape and a word for every state', async () => {
    const states = ['draft', 'ready', 'running', 'complete', 'partial', 'failed', 'archived'] as const;
    render(<div>{states.map((s) => <StudyStatus key={s} state={s} />)}</div>);
    for (const w of ['Draft', 'Ready', 'Running', 'Complete', 'Partial', 'Failed', 'Archived']) expect(screen.getByText(w)).toBeTruthy();
    const icons = new Set(Array.from(document.querySelectorAll('[data-ns-icon]')).map((e) => e.getAttribute('data-ns-icon')));
    expect(icons.size).toBe(states.length);
    await expectNoAxeViolations();
  });

  it('sweeps when running, and stands still with the word under reduced motion', () => {
    setReducedMotion(false);
    const { unmount } = render(<StudyStatus state="running" />);
    expect(document.querySelector('[data-state="running"]')?.getAttribute('data-motion')).toBe('sweep');
    unmount();
    setReducedMotion(true);
    render(<StudyStatus state="running" />);
    expect(document.querySelector('[data-state="running"]')?.getAttribute('data-motion')).toBe('still');
    expect(screen.getByText('Running')).toBeTruthy();
    setReducedMotion(false);
  });

  it('takes strings from messages', () => {
    render(<StudyStatus state="draft" messages={{ states: { draft: 'Luonnos' } as never }} />);
    expect(screen.getByText('Luonnos')).toBeTruthy();
  });
});

describe('StudyShell', () => {
  function Controlled({ onChange }: { onChange: (t: StudyTab) => void }) {
    const [tab, setTab] = useState<StudyTab>('brief');
    return (
      <StudyShell
        study={studyAurora}
        tab={tab}
        onTabChange={(t) => {
          onChange(t);
          setTab(t);
        }}
        tabMeta={{ brief: '1/5' }}
        saveState="saved"
        panels={{ brief: <p>Brief panel</p>, population: <p>Population panel</p>, research: <p>Research panel</p>, responses: <p>Responses panel</p> }}
        aside={<p>Rail</p>}
      />
    );
  }

  it('renders four tabs in order and is controlled', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Brief1/5', 'Population', 'Research', 'Responses']);
    expect(screen.getByRole('tablist', { name: 'Study sections' })).toBeTruthy();
    expect(screen.getByText('Brief panel')).toBeTruthy();
    await userEvent.click(screen.getByRole('tab', { name: 'Research' }));
    expect(onChange).toHaveBeenLastCalledWith('research');
    expect(screen.getByText('Research panel')).toBeTruthy();
    expect(screen.getByRole('complementary', { name: 'Study properties' })).toBeTruthy();
    await expectNoAxeViolations();
  });

  it('moves between tabs with arrow keys, Home and End', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    screen.getByRole('tab', { name: /Brief/ }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('population');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Population' }));
    await userEvent.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith('responses');
    await userEvent.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith('brief');
  });

  it('does not change tab when controlled without a handler update', async () => {
    render(<StudyShell study={studyAurora} tab="population">content</StudyShell>);
    await userEvent.click(screen.getByRole('tab', { name: 'Research' }));
    expect(screen.getByRole('tab', { name: 'Population' }).getAttribute('aria-selected')).toBe('true');
  });
});

describe('BriefForm', () => {
  it('edits name, decision and objectives; Enter adds, Backspace on empty removes', async () => {
    const onChange = vi.fn<(v: BriefValue) => void>();
    render(<BriefForm defaultValue={{ title: 'Study Aurora', decision: '', objectives: ['[OPTION]'] }} onValueChange={onChange} maxObjectives={3} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Decision this study informs' }), 'X');
    expect(onChange).toHaveBeenLastCalledWith({ title: 'Study Aurora', decision: 'X', objectives: ['[OPTION]'] });
    const o1 = screen.getByRole('textbox', { name: 'Objective O1' });
    await userEvent.click(o1);
    await userEvent.keyboard('{Enter}');
    expect(screen.getAllByRole('textbox', { name: /Objective O/ })).toHaveLength(2);
    await new Promise((r) => requestAnimationFrame(r));
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Objective O2' }));
    await userEvent.keyboard('{Backspace}');
    expect(screen.getAllByRole('textbox', { name: /Objective O/ })).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Remove objective O1' }));
    expect(screen.queryByRole('textbox', { name: /Objective O/ })).toBeNull();
    await expectNoAxeViolations();
  });

  it('stops adding at the maximum', async () => {
    render(<BriefForm defaultValue={{ title: '', decision: '', objectives: ['a', 'b'] }} maxObjectives={2} />);
    expect((screen.getByRole('button', { name: 'Add' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('2 of 2')).toBeTruthy();
  });
});

describe('PopulationPanel', () => {
  const composition = [
    { label: 'Group A', rows: [{ label: '[OPTION] 1', margin: 0.5, panel: 0.5 }, { label: '[OPTION] 2', margin: 0.5, panel: 0.5 }] },
  ];

  it('shows market status, size, seed, composition and the one-population scope', async () => {
    const onRebuild = vi.fn();
    const onSize = vi.fn();
    render(<PopulationPanel population={{ code: 'FI', size: 0, seed: 0 }} composition={composition} onRebuild={onRebuild} onSizeChange={onSize} />);
    expect(document.querySelector('[data-part="market-status"]')?.getAttribute('data-status')).toBe('roster-ready');
    expect(screen.getByRole('img', { name: /Group A/ })).toBeTruthy();
    expect(screen.getByText(/One population per study/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Rebuild' }));
    expect(onRebuild).toHaveBeenCalled();
    await expectNoAxeViolations();
  });

  it('shows the empty state before margins arrive and locks when read-only', () => {
    render(<PopulationPanel population={{ code: 'US', size: 0 }} readOnly />);
    expect(screen.getByText('No panel yet')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Rebuild' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('ResearchBuilder', () => {
  const items: ResearchItem[] = [
    { key: 'a', question: 'Q A', type: 'mood_direction', format: 'likert', anchors: ['1', '2', '3', '4', '5'] },
    { key: 'b', question: 'Q B', type: 'concrete_habit', format: 'single_choice' },
    { key: 'c', question: 'Q C', type: 'neutral_factual', format: 'ranking' },
  ];
  const order = () => screen.getAllByRole('listitem').map((li) => within(li).getByText(/^Q /).textContent);

  it('adds, reorders by button and Alt+Arrow, and removes', async () => {
    const onItems = vi.fn();
    render(<ResearchBuilder defaultItems={items} onItemsChange={onItems} createItem={(i) => ({ key: `n${i}`, question: 'Q new', type: 'mood_direction' })} />);
    await userEvent.click(screen.getByRole('button', { name: 'Move R1 down' }));
    expect(order()).toEqual(['Q B', 'Q A', 'Q C']);
    const second = screen.getByText('Q A', { selector: '.ns-research__q' }).closest('button')!;
    second.focus();
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(order()).toEqual(['Q B', 'Q C', 'Q A']);
    await userEvent.click(screen.getByRole('button', { name: 'Remove R1' }));
    expect(order()).toEqual(['Q C', 'Q A']);
    await userEvent.click(screen.getByRole('button', { name: /Item/ }));
    expect(order()).toEqual(['Q C', 'Q A', 'Q new']);
    expect(onItems).toHaveBeenCalledTimes(4);
    expect((screen.getByRole('button', { name: 'Move R1 up' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('edits wording, type and anchors and marks anchors that need a fix', async () => {
    const onItems = vi.fn<(v: ResearchItem[]) => void>();
    render(
      <ResearchBuilder
        defaultItems={items}
        onItemsChange={onItems}
        anchorIssues={{ a: [{ anchor: 1, message: 'Too close to anchor 1.' }] }}
      />,
    );
    expect(screen.getByText('Fix')).toBeTruthy();
    const a2 = screen.getByRole('textbox', { name: 'Anchor 2' });
    expect(a2.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(a2.getAttribute('aria-describedby')!)?.textContent).toContain('Too close');
    expect(screen.getByRole('img', { name: 'Needs a fix' })).toBeTruthy();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Question type' }), 'values_identity');
    expect(onItems.mock.lastCall![0][0]!.type).toBe('values_identity');
    await userEvent.type(screen.getByRole('textbox', { name: 'Wording' }), '!');
    expect(onItems.mock.lastCall![0][0]!.question).toBe('Q A!');
    await userEvent.click(screen.getByText('Q B', { selector: '.ns-research__q' }));
    expect(screen.getByRole('textbox', { name: 'Wording' })).toHaveProperty('value', 'Q B');
    await expectNoAxeViolations();
  });

  it('shows the empty state', () => {
    render(<ResearchBuilder defaultItems={[]} />);
    expect(screen.getByText('No items yet')).toBeTruthy();
  });
});

describe('ResponsesView', () => {
  it('groups figures by objective with optional band, claim and caption', async () => {
    render(<ResponsesView study={studyBorealis} />);
    expect(screen.getByRole('heading', { level: 2, name: studyBorealis.objectives[0]! })).toBeTruthy();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(document.querySelectorAll('[data-part="figure"]')).toHaveLength(2);
    expect(document.querySelector('[data-claim="level"] [data-part="band"]')).toBeTruthy();
    expect(document.querySelector('[data-claim="direction"] [data-part="band"]')).toBeNull();
    await expectNoAxeViolations();
  });

  it('renders a figure without band, claim or caption', () => {
    const study = { ...studyBorealis, items: [{ ...studyBorealis.items[0]!, result: { ...studyBorealis.items[0]!.result!, headline: { value: 0 } } }] };
    render(<ResponsesView study={study} />);
    const fig = document.querySelector('[data-part="figure"]')!;
    expect(fig.querySelector('[data-part="band"]')).toBeNull();
    expect(fig.querySelector('[data-part="caption"]')).toBeNull();
  });

  it('puts unmapped items under "Other items" and shows the empty state without results', () => {
    const { unmount } = render(<ResponsesView study={studyBorealis} objectiveOf={(_, i) => (i === 0 ? 0 : undefined)} />);
    expect(screen.getByRole('heading', { name: 'Other items' })).toBeTruthy();
    unmount();
    render(<ResponsesView study={studyCassiopeia} />);
    expect(screen.getByText('No responses yet')).toBeTruthy();
  });
});

describe('RunCost and RunConfirm', () => {
  it('shows "Cost unavailable" and disables the run without an estimate', async () => {
    const onRun = vi.fn();
    render(<RunCost estimate={null} onRun={onRun} />);
    expect(screen.getByText('Cost unavailable')).toBeTruthy();
    const run = screen.getByRole('button', { name: 'Run study' }) as HTMLButtonElement;
    expect(run.disabled).toBe(true);
    await userEvent.click(run);
    expect(onRun).not.toHaveBeenCalled();
    await expectNoAxeViolations();
  });

  it('formats an estimate and runs', async () => {
    const onRun = vi.fn();
    render(<RunCost estimate={{ amount: 0, currency: 'EUR', basis: '[COST] estimate' }} onRun={onRun} />);
    expect(screen.getByText('€0.00')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Run study' }));
    expect(onRun).toHaveBeenCalledOnce();
  });

  it('confirms in a dialog; Escape cancels; no estimate disables confirm', async () => {
    const onConfirm = vi.fn();
    const { unmount } = render(
      <NorthstarProvider theme="night">
        <RunConfirm trigger="Run" estimate={{ amount: 0, currency: 'EUR', basis: '' }} studyTitle="Study Borealis" onConfirm={onConfirm} />
      </NorthstarProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    const dialog = screen.getByRole('dialog', { name: 'Run this study?' });
    await expectNoAxeViolations();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Run study' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(dialog.isConnected).toBe(false);
    unmount();
    render(<RunConfirm defaultOpen estimate={null} onConfirm={onConfirm} />);
    expect(within(screen.getByRole('dialog')).getByText('Cost unavailable')).toBeTruthy();
    expect((within(screen.getByRole('dialog')).getByRole('button', { name: 'Run study' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('ExportMenu', () => {
  it('opens with the keyboard and exports the chosen format', async () => {
    const onExport = vi.fn();
    render(<ExportMenu onExport={onExport} disabledFormats={['csv']} />);
    const trigger = screen.getByRole('button', { name: 'Export' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(document.activeElement?.textContent).toBe('Export PDF');
    await expectNoAxeViolations();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onExport).toHaveBeenCalledWith('spec');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

describe('illustrations', () => {
  it('are decorative by default and named with a title', async () => {
    render(
      <div>
        <EmptyBrief />
        <StatusRunning title="Running" />
        <NorthstarLockup />
        <NorthstarLockup markOnly />
      </div>,
    );
    expect(document.querySelector('svg.ns-illustration')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('img', { name: 'Running' })).toBeTruthy();
    expect(screen.getByText('Northstar')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Northstar' })).toBeTruthy();
    expect(Object.keys(spotIllustrations)).toHaveLength(7);
    await expectNoAxeViolations();
  });
});
