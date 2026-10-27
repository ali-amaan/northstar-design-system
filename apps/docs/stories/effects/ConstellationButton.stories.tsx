import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConstellationButton } from '@northstar-js/react/effects';

const meta = { title: 'Effects/ConstellationButton', component: ConstellationButton } satisfies Meta<typeof ConstellationButton>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Press it: a few stars leave the press point on the golden angle, join into a small constellation, then fade. Seeded, so each press repeats across runs. */
export const Default: Story = {
  args: { children: 'Lock population', variant: 'primary' },
  render: (args) => (
    <div style={{ display: 'flex', gap: 16, padding: 48 }}>
      <ConstellationButton {...args} />
      <ConstellationButton variant="secondary" seed={19} stars={7}>
        Save draft
      </ConstellationButton>
      <ConstellationButton size="sm" seed={3} stars={3}>
        Pin
      </ConstellationButton>
    </div>
  ),
};
