import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchInput } from '@northstar-js/react';

const meta = { title: 'Forms/SearchInput' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <SearchInput style={{ maxWidth: 280 }} placeholder="Search studies" /> };
