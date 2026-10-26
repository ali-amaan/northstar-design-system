import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from '@northstar-js/react';

const meta = { title: 'Navigation/Pagination' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <Pagination pageCount={24} defaultPage={8} /> };
