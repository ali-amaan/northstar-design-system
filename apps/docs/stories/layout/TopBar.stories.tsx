import type { Meta, StoryObj } from '@storybook/react-vite';
import { TopBar, Breadcrumbs, Button, Avatar } from '@northstar-js/react';

const meta = { title: 'Layout/TopBar' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <TopBar start={<strong>Northstar</strong>} end={<><Button size="sm">Share</Button><Avatar name="Grace Hopper" /></>}>
      <Breadcrumbs items={[{ label: 'Studies', href: '#' }, { label: '[NAME]' }]} />
    </TopBar>
  ),
};
