import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraticuleInput } from '@northstar-js/react/effects';

const meta = { title: 'Effects/GraticuleInput', component: GraticuleInput } satisfies Meta<typeof GraticuleInput>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Focus the field: a fine graduated rule is drawn under it from the left. Invalid is a dashed rule and a message, never colour alone. */
export const Default: Story = {
  args: { label: 'Study name', placeholder: 'Pilot, autumn wave', hint: 'Shown to everyone in the workspace' },
  render: (args) => (
    <div style={{ maxWidth: 360, display: 'grid', gap: 20 }}>
      <GraticuleInput {...args} />
      <GraticuleInput label="Sample size" defaultValue="0" error="Enter at least 100 agents" inputMode="numeric" />
    </div>
  ),
};
