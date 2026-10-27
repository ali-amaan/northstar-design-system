import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConstellationButton, ToastComet } from '@northstar-js/react/effects';

const meta = { title: 'Effects/ToastComet', component: ToastComet } satisfies Meta<typeof ToastComet>;
export default meta;
type Story = StoryObj<typeof meta>;

function Launcher() {
  const [n, setN] = useState(0);
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: 'grid', gap: 24, justifyItems: 'start', padding: 24 }}>
      <ConstellationButton
        variant="primary"
        onClick={() => {
          setN((x) => x + 1);
          setOpen(true);
        }}
      >
        Save study
      </ConstellationButton>
      {open ? <ToastComet key={n} title="Study saved" description={`Draft ${n} of the autumn pilot.`} onDismiss={() => setOpen(false)} /> : null}
    </div>
  );
}

/** The toast arrives on a short arc, two axes on two curves, with a tail of light that thins as it settles. */
export const Default: Story = { args: { title: 'Study saved' }, render: () => <Launcher /> };

export const Static: Story = { args: { title: 'Run complete', description: '300 agents answered 12 questions.', onDismiss: () => {} } };
