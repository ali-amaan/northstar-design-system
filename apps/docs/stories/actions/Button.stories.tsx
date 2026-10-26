import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Stack } from '@northstar-js/react';

const meta = { title: 'Actions/Button' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <Stack gap={16}>
      <Stack direction="row" gap={8} align="center">
        <Button variant="primary">Run study</Button>
        <Button>Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button tone="signal" variant="ghost">Signal</Button>
        <Button disabled>Disabled</Button>
        <Button variant="primary" loading>Running</Button>
      </Stack>
      <Stack direction="row" gap={8} align="center">
        <Button size="sm">Small 28</Button>
        <Button size="md">Medium 32</Button>
        <Button size="lg">Large 36</Button>
        <Button size="xl" variant="primary">XL 44</Button>
      </Stack>
    </Stack>
  ),
};
