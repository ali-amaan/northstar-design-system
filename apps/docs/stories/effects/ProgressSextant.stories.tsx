import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressSextant } from '@northstar-js/react/effects';

const meta = { title: 'Effects/ProgressSextant', component: ProgressSextant } satisfies Meta<typeof ProgressSextant>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Twenty-four graduations, a major one every quarter, and an index arm that swings to the reading. */
export const Default: Story = { args: { value: 62, label: 'Fieldwork' } };

export const Running: Story = {
  args: { value: 0, label: 'Fieldwork' },
  render: (args) => {
    const [v, setV] = useState(8);
    useEffect(() => {
      const id = setInterval(() => setV((x) => (x >= 100 ? 8 : x + 13)), 1300);
      return () => clearInterval(id);
    }, []);
    return (
      <div style={{ display: 'flex', gap: 32 }}>
        <ProgressSextant {...args} value={v} />
        <ProgressSextant value={v * 3} max={300} label="Agents answered" width={200} format={(n, m) => `${n} / ${m}`} />
      </div>
    );
  },
};
