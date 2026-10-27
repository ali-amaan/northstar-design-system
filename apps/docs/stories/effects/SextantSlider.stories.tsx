import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SextantSlider } from '@northstar-js/react/effects';

const meta = { title: 'Effects/SextantSlider', component: SextantSlider } satisfies Meta<typeof SextantSlider>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Ticks rise as the index passes; the readout rides on it in Plex Mono. Drag near a starred detent and the thumb catches on it. Arrow keys step normally. */
export const Default: Story = {
  args: { label: 'Panel size', min: 100, max: 1000, step: 25, defaultValue: 300, detents: [300, 500, 1000], format: (v: number) => `${v} agents` },
  render: (args) => (
    <div style={{ maxWidth: 420 }}>
      <SextantSlider {...args} />
    </div>
  ),
};

function ControlledSlider() {
  const [v, setV] = useState(95);
  return (
    <div style={{ maxWidth: 420, display: 'grid', gap: 8 }}>
      <SextantSlider label="Confidence level" min={80} max={99} value={v} onValueChange={setV} detents={[90, 95, 99]} format={(n) => `${n} %`} />
      <span style={{ color: 'var(--ns-color-text-3)', fontSize: 12 }}>Value: {v}</span>
    </div>
  );
}

export const Controlled: Story = { args: { label: 'Confidence level' }, render: () => <ControlledSlider /> };
