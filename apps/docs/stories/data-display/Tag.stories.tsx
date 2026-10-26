import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag, Stack } from '@northstar-js/react';

const meta = { title: 'Data display/Tag' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Stack direction="row" gap={6}>
      <Tag>Level</Tag>
      <Tag tone="signal">Running</Tag>
      <Tag onRemove={() => {}}>Finland</Tag>
    </Stack>
  ),
};
