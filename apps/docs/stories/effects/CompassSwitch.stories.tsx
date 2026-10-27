import type { Meta, StoryObj } from '@storybook/react-vite';
import { CompassSwitch } from '@northstar-js/react/effects';

const meta = { title: 'Effects/CompassSwitch', component: CompassSwitch } satisfies Meta<typeof CompassSwitch>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Off, the needle rests at west; on, the thumb crosses and the needle swings to north and settles, like a damped compass. */
export const Default: Story = {
  args: { children: 'Weight to census margins' },
  render: (args) => (
    <div style={{ display: 'grid', gap: 14 }}>
      <CompassSwitch {...args} />
      <CompassSwitch defaultChecked>Lock population</CompassSwitch>
      <CompassSwitch disabled>Disabled</CompassSwitch>
    </div>
  ),
};
