import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox, Stack } from '@northstar-js/react';

const meta = { title: 'Forms/Checkbox' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const States: Story = {
  render: () => (
    <Stack gap={8}>
      <Checkbox>Unchecked</Checkbox>
      <Checkbox defaultChecked>Checked</Checkbox>
      <Checkbox indeterminate>Indeterminate</Checkbox>
      <Checkbox disabled>Disabled</Checkbox>
    </Stack>
  ),
};
