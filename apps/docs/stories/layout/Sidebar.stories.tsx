import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sidebar, SidebarSection, SidebarItem } from '@northstar-js/react';

const meta = { title: 'Layout/Sidebar' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ height: 360 }}>
      <Sidebar header={<strong>Northstar</strong>} footer="v0.1.0">
        <SidebarSection title="Workspace">
          <SidebarItem href="#" active meta={12}>Studies</SidebarItem>
          <SidebarItem href="#" meta={2}>Populations</SidebarItem>
        </SidebarSection>
        <SidebarSection title="Archive">
          <SidebarItem href="#">Archived studies</SidebarItem>
        </SidebarSection>
      </Sidebar>
    </div>
  ),
};
