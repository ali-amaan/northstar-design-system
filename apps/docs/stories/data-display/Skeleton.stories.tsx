import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton, Stack } from '@northstar-js/react';

const meta = { title: 'Data display/Skeleton' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Stack gap={8} style={{ maxWidth: 320 }} aria-busy="true" aria-label="Loading">
      <Skeleton width="60%" />
      <Skeleton />
      <Skeleton shape="block" />
      <Skeleton shape="circle" />
    </Stack>
  ),
};
