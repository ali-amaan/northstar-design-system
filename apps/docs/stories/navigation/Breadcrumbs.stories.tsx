import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs } from '@northstar-js/react';

const meta = { title: 'Navigation/Breadcrumbs' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <Breadcrumbs items={[{ label: 'Workspace', href: '#' }, { label: 'Studies', href: '#' }, { label: '[NAME]' }]} /> };
