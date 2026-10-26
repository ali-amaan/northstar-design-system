import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, Badge } from '@northstar-js/react';

const meta = { title: 'Layout/Stack' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Row: Story = { render: () => <Stack direction="row" gap={8}>{[1, 2, 3].map((n) => <Badge key={n}>{n}</Badge>)}</Stack> };
export const Column: Story = { render: () => <Stack gap={4}>{[1, 2, 3].map((n) => <Badge key={n}>{n}</Badge>)}</Stack> };
