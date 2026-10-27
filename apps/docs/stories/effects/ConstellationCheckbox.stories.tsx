import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConstellationCheckbox } from '@northstar-js/react/effects';

const meta = { title: 'Effects/ConstellationCheckbox', component: ConstellationCheckbox } satisfies Meta<typeof ConstellationCheckbox>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The tick is a constellation: three stars appear in turn and are joined star to star. */
export const Default: Story = {
  args: { children: 'Include pilot answers' },
  render: (args) => (
    <div style={{ display: 'grid', gap: 12 }}>
      <ConstellationCheckbox {...args} />
      <ConstellationCheckbox defaultChecked>Rake to 2023 margins</ConstellationCheckbox>
      <ConstellationCheckbox indeterminate>Some regions</ConstellationCheckbox>
      <ConstellationCheckbox disabled>Disabled</ConstellationCheckbox>
    </div>
  ),
};
