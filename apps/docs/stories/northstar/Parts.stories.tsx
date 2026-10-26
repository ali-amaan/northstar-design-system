import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { StudyState } from '@northstar-js/contracts';
import { studyBorealis, studyCassiopeia } from '@northstar-js/contracts/fixtures';
import { Button } from '@northstar-js/react';
import { ExportMenu, RunConfirm, RunCost, StudyShell, StudyStatus } from '@northstar-js/react/northstar';
import {
  NorthstarLockup, spotIllustrations, statusIllustrations, type SpotName,
} from '@northstar-js/react/illustrations';

const meta = { title: 'Northstar/Parts' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const STATES: StudyState[] = ['draft', 'ready', 'running', 'complete', 'partial', 'failed', 'archived'];

export const Status: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{STATES.map((s) => <StudyStatus key={s} state={s} />)}</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>{STATES.map((s) => <StudyStatus key={s} state={s} variant="inline" />)}</div>
      <p className="ns-study-hint">Under reduced motion the running dial stands still and keeps the word.</p>
    </div>
  ),
};

export const Shell: Story = {
  render: function Render() {
    const [tab, setTab] = useState(studyCassiopeia.tab ?? 'research');
    return (
      <StudyShell study={studyCassiopeia} tab={tab} onTabChange={setTab} style={{ margin: -24, minHeight: 400 }}>
        <p>Content for the {tab} tab.</p>
      </StudyShell>
    );
  },
};

export const Cost: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 24, maxWidth: 280 }}>
      <RunCost estimate={null} onRun={() => {}} />
      <RunCost estimate={studyBorealis.cost} onRun={() => {}} />
    </div>
  ),
};

export const Confirm: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <RunConfirm trigger="Run with estimate" estimate={studyBorealis.cost} studyTitle={studyBorealis.title} onConfirm={() => {}} />
      <RunConfirm trigger="Run without estimate" estimate={null} studyTitle={studyBorealis.title} onConfirm={() => {}} />
    </div>
  ),
};

export const Export: Story = { render: () => <ExportMenu onExport={() => {}} disabledFormats={['csv']} /> };

const SPOT_COPY: Record<SpotName, [string, string, string]> = {
  brief: ['Start with the decision', 'Name the one decision this study informs.', 'Write the brief'],
  population: ['No panel yet', 'The roster is free; writing personas is paid and shows a cost estimate first.', 'Build panel'],
  research: ['No items yet', 'Every anchor passes the free gate before any paid call.', 'Add item'],
  responses: ['No responses yet', 'A cost estimate comes before any paid run.', 'Review and run'],
  search: ['No matches for “[QUERY]”', 'Try a shorter term or another codename.', 'Clear search'],
  offline: ['Can’t reach the engine', 'Your work is kept; reconnect re-fetches, never re-submits.', 'Reconnect'],
  notFound: ['Not on the chart', 'This link is not part of this workspace.', 'Back to studies'],
};

export const Illustrations: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <NorthstarLockup size={32} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {(Object.keys(spotIllustrations) as SpotName[]).map((k) => {
          const Spot = spotIllustrations[k];
          const [h, p, b] = SPOT_COPY[k];
          return (
            <div key={k} className="ns-study-panel ns-study-empty">
              <Spot />
              <p className="ns-study-empty__title">{h}</p>
              <p className="ns-study-hint">{p}</p>
              <Button variant="primary" size="sm">{b}</Button>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {Object.entries(statusIllustrations).map(([k, Mark]) => (
          <div key={k} className="ns-study-panel" style={{ padding: 8 }}>
            <Mark title={k} />
          </div>
        ))}
      </div>
    </div>
  ),
};
