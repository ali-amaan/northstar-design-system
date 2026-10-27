import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConstellationButton, CountUp, RollingNumber } from '@northstar-js/react/effects';

const meta = { title: 'Effects/RollingNumber', component: RollingNumber } satisfies Meta<typeof RollingNumber>;
export default meta;
type Story = StoryObj<typeof meta>;

function Odometer() {
  const [n, setN] = useState(1284);
  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
      <span style={{ fontSize: 32, color: 'var(--ns-color-text-1)' }}>
        <RollingNumber value={n} />
      </span>
      <ConstellationButton onClick={() => setN((x) => x + 1 + ((x * 37) % 913))}>Add agents</ConstellationButton>
    </div>
  );
}

/** An odometer: every digit is a reel that rolls to its figure, units first, each higher place a beat later. */
export const Default: Story = { args: { value: 1284 }, render: () => <Odometer /> };

/** CountUp rolls from zero to its value once mounted. */
export const CountUpStory: Story = {
  name: 'CountUp',
  args: { value: 0.42 },
  render: () => (
    <div style={{ display: 'flex', gap: 32, fontSize: 24, color: 'var(--ns-color-text-1)' }}>
      <CountUp value={0.42} format={{ style: 'percent' }} />
      <CountUp value={10000} />
      <CountUp value={38} />
    </div>
  ),
};
