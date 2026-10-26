import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, Stack } from '@northstar-js/react';

const meta = { title: 'Data display/Avatar' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {
  render: () => (
    <Stack direction="row" gap={8} align="center">
      <Avatar name="Ada Lovelace" size="sm" />
      <Avatar name="Grace Hopper" />
      <Avatar name="alan.turing@example.org" size="lg" />
    </Stack>
  ),
};
