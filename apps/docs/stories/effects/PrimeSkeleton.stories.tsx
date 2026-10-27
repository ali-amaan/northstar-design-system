import type { Meta, StoryObj } from '@storybook/react-vite';
import { PrimeSkeleton } from '@northstar-js/react/effects';

const meta = { title: 'Effects/PrimeSkeleton', component: PrimeSkeleton } satisfies Meta<typeof PrimeSkeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Each line's shimmer runs on a prime period (1.5, 2.5, 3.5, 5.5 s …), so the block never pulses in step. */
export const Default: Story = { args: { lines: 4 }, render: (args) => <div style={{ maxWidth: 420 }}><PrimeSkeleton {...args} /></div> };

export const Card: Story = {
  render: () => (
    <div style={{ maxWidth: 360, padding: 16, border: '1px solid var(--ns-color-line-1)', borderRadius: 12, display: 'grid', gap: 14 }}>
      <PrimeSkeleton lines={1} widths={[40]} lineHeight={16} />
      <PrimeSkeleton lines={3} />
    </div>
  ),
};
