import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup, Radio } from '@northstar-js/react';

const meta = { title: 'Forms/Radio' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Group: Story = {
  render: () => (
    <RadioGroup label="Claim class" defaultValue="level">
      <Radio value="level">Level</Radio>
      <Radio value="direction">Direction</Radio>
      <Radio value="ranking">Ranking</Radio>
    </RadioGroup>
  ),
};
