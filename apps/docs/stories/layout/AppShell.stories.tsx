import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell, Sidebar, SidebarSection, SidebarItem, TopBar, Breadcrumbs, Avatar, Button, EmptyState } from '@northstar-js/react';

const meta = { title: 'Layout/AppShell' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AppShell
      style={{ margin: -24 }}
      sidebar={
        <Sidebar header={<strong>Northstar</strong>}>
          <SidebarSection title="Workspace">
            <SidebarItem href="#" active meta={12}>Studies</SidebarItem>
            <SidebarItem href="#">Populations</SidebarItem>
          </SidebarSection>
        </Sidebar>
      }
      topBar={<TopBar end={<><Button variant="primary" size="sm">New study</Button><Avatar name="Ada Lovelace" /></>}><Breadcrumbs items={[{ label: 'Studies', href: '#' }, { label: '[NAME]' }]} /></TopBar>}
    >
      <EmptyState title="No responses yet" description="Run the study to see responses." />
    </AppShell>
  ),
};
