import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Stack } from '@northstar-js/react';

const meta = { title: 'Data display/Badge' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Stack direction="row" gap={6}>
      <Badge>12</Badge>
      <Badge variant="solid">[N]</Badge>
      <Badge tone="signal">New</Badge>
      <Badge tone="signal" variant="solid">3</Badge>
    </Stack>
  ),
};
