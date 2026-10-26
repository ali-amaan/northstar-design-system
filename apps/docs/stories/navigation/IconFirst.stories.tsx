import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Card, HoverActions, IconButton, List, ListItem, NorthstarProvider, Sidebar, SidebarItem, SidebarSection, Stack, Toolbar, ToolbarItem,
  type ResolvedTheme,
} from '@northstar-js/react';
import {
  AddIcon, DuplicateIcon, ExportIcon, HistoryIcon, MoreIcon, PopulationIcon, ResearchIcon, ResponsesIcon, SearchIcon, SettingsIcon, StudyIcon,
} from '@northstar-js/icons';

const meta = {
  title: 'Navigation/Icon-first',
  parameters: {
    docs: {
      description: {
        component:
          'Icon-led controls: the icon shows, and on hover or keyboard focus the item eases open to its full label (never cut with an ellipsis). The label is always the accessible name; plain icon buttons keep a tooltip. Secondary actions on cards, rows and list items ease in on hover and focus-within and stay visible on touch.',
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Board({ theme }: { theme: ResolvedTheme }) {
  return (
    <NorthstarProvider theme={theme} style={{ padding: 24, background: 'var(--ns-color-ground)' }}>
      <Stack direction="row" gap={24} align="start">
        <Sidebar collapsed label={`Workspace, ${theme}`} style={{ height: 360, borderRadius: 12 }}>
          <SidebarSection title="Workspace">
            <SidebarItem href="#" icon={<StudyIcon size={16} />} active meta="12">
              Studies
            </SidebarItem>
            <SidebarItem href="#" icon={<PopulationIcon size={16} />}>Populations</SidebarItem>
            <SidebarItem href="#" icon={<ResearchIcon size={16} />}>Research library</SidebarItem>
            <SidebarItem href="#" icon={<ResponsesIcon size={16} />}>Responses and reports</SidebarItem>
            <SidebarItem href="#" icon={<SettingsIcon size={16} />}>Workspace settings</SidebarItem>
          </SidebarSection>
        </Sidebar>
        <Stack gap={20} style={{ flex: 1 }}>
          <Toolbar label={`Study toolbar, ${theme}`}>
            <ToolbarItem label="Search studies" icon={<SearchIcon size={16} />} />
            <ToolbarItem label="New study" icon={<AddIcon size={16} />} />
            <ToolbarItem label="Version history" icon={<HistoryIcon size={16} />} />
            <ToolbarItem label="Export results as a report" icon={<ExportIcon size={16} />} />
          </Toolbar>
          <Stack direction="row" gap={8} align="center">
            <IconButton expand label="Duplicate study" icon={<DuplicateIcon size={16} />} />
            <IconButton expand="always" variant="primary" label="New study" icon={<AddIcon size={16} />} />
            <IconButton variant="ghost" label="More actions" icon={<MoreIcon size={16} />} />
          </Stack>
          <Card
            title="Weekday lunch"
            description="Actions appear on hover and focus"
            revealActions
            actions={<IconButton size="sm" variant="ghost" label="Duplicate" icon={<DuplicateIcon size={16} />} />}
          >
            [N] questions
          </Card>
          <List>
            {['Weekday lunch', 'Commuting', 'Saturday errands'].map((t) => (
              <ListItem
                key={t}
                title={t}
                end={
                  <HoverActions>
                    <IconButton size="sm" variant="ghost" label={`Duplicate ${t}`} icon={<DuplicateIcon size={16} />} />
                    <IconButton size="sm" variant="ghost" label={`Export ${t}`} icon={<ExportIcon size={16} />} />
                  </HoverActions>
                }
              />
            ))}
          </List>
        </Stack>
      </Stack>
    </NorthstarProvider>
  );
}

export const NightAndDay: Story = {
  name: 'Night and Day',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(560px, 1fr))' }}>
      <Board theme="night" />
      <Board theme="day" />
    </div>
  ),
};
