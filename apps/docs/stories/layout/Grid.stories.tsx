import type { Meta, StoryObj } from '@storybook/react-vite';
import { Grid, Skeleton } from '@northstar-js/react';

const meta = { title: 'Layout/Grid' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const AutoFill: Story = { render: () => <Grid columns={{ min: 160 }} gap={12}>{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} shape="block" />)}</Grid> };
export const ThreeColumns: Story = { render: () => <Grid columns={3}>{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} shape="block" />)}</Grid> };
