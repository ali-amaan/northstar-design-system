import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Badge, Breadcrumbs, Button, Card, FlowStep, FlowSteps, HoverActions, IconButton, List, ListItem, Menu, NextAction, NorthstarProvider, Pagination,
  Sidebar, SidebarItem, SidebarSection, Stack, Tabs, Tag, Toolbar, ToolbarItem, type ResolvedTheme,
} from '@northstar-js/react';
import { StudyStatus } from '@northstar-js/react/northstar';
import {
  AddIcon, BriefIcon, DuplicateIcon, ExportIcon, HistoryIcon, LockedIcon, MoreIcon, PopulationIcon, ResearchIcon, ResponsesIcon, RunIcon, SearchIcon,
  SeedIcon, SettingsIcon, StudyIcon,
} from '@northstar-js/icons';

const meta = {
  title: 'Navigation/Icon-first',
  parameters: {
    docs: {
      description: {
        component:
          'Icon-led controls: the icon shows, and on hover or keyboard focus the item eases open to its full label (never cut with an ellipsis; grid 0fr → 1fr on the glide curve, so nothing jumps). Touch screens always show the label. The label is always the accessible name; plain icon buttons keep a tooltip. One shared ExpandLabel drives Button (`icon` + `expand`), IconButton, ToolbarItem, Sidebar, Tabs (`icon` + `expand`), Menu.Trigger, Pagination, Breadcrumbs (`collapse`), Tag, Badge, NextAction Back and the Northstar parts. Secondary actions on cards, rows and list items ease in on hover and focus-within and stay visible on touch.',
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

function System({ theme }: { theme: ResolvedTheme }) {
  return (
    <NorthstarProvider theme={theme} style={{ padding: 24, background: 'var(--ns-color-ground)' }}>
      <Stack gap={20}>
        <Stack direction="row" gap={8} align="center" wrap data-shot="buttons">
          <Button icon={<DuplicateIcon size={16} />} expand>
            Duplicate study
          </Button>
          <Button variant="primary" icon={<RunIcon size={16} />} expand>
            Run study
          </Button>
          <Button variant="ghost" icon={<HistoryIcon size={16} />} expand="always">
            Version history
          </Button>
          <Menu.Root>
            <Menu.Trigger className="ns-button ns-button--ghost ns-size-md" icon={<MoreIcon size={16} />} expand>
              More actions
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item onSelect={() => {}}>Archive</Menu.Item>
              <Menu.Item onSelect={() => {}}>Rename</Menu.Item>
            </Menu.Content>
          </Menu.Root>
        </Stack>
        <Tabs.Root defaultValue="brief" indicator="solid">
          <Tabs.List label={`Study sections, ${theme}`} data-shot="tabs">
            <Tabs.Trigger value="brief" icon={<BriefIcon size={14} />} expand>
              Brief
            </Tabs.Trigger>
            <Tabs.Trigger value="population" icon={<PopulationIcon size={14} />} expand>
              Population
            </Tabs.Trigger>
            <Tabs.Trigger value="research" icon={<ResearchIcon size={14} />} expand>
              Research
            </Tabs.Trigger>
            <Tabs.Trigger value="responses" icon={<ResponsesIcon size={14} />} expand>
              Responses
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
        <Breadcrumbs
          collapse
          data-shot="crumbs"
          items={[
            { label: 'Studies', href: '#' },
            { label: 'Weekday lunch occasions', href: '#', icon: <StudyIcon size={14} /> },
            { label: 'Population', href: '#' },
            { label: 'Panel 2' },
          ]}
        />
        <Stack direction="row" gap={16} align="center" wrap>
          <Pagination pageCount={12} defaultPage={4} />
          <Tag icon={<SeedIcon size={12} />} expand>
            Seeded
          </Tag>
          <Tag tone="signal" icon={<LockedIcon size={12} />} expand="always">
            Locked
          </Tag>
          <Badge icon={<LockedIcon size={12} />} expand>
            Pre-registered
          </Badge>
          <StudyStatus state="running" expand />
          <StudyStatus state="complete" expand />
        </Stack>
        <Card
          title="Weekday lunch"
          description="Header actions are icon-first"
          actions={
            <>
              <IconButton size="sm" variant="ghost" expand label="Duplicate" icon={<DuplicateIcon size={16} />} />
              <IconButton size="sm" variant="ghost" expand label="Export" icon={<ExportIcon size={16} />} />
            </>
          }
          style={{ maxWidth: 520 }}
        >
          [N] questions
        </Card>
        <FlowSteps label={`Setup, ${theme}`} defaultValue="population" compact>
          <FlowStep value="brief" title="Brief">
            <NextAction />
          </FlowStep>
          <FlowStep value="population" title="Population">
            <NextAction hint="Back is icon-first; the next action keeps its words." />
          </FlowStep>
          <FlowStep value="research" title="Research">
            <NextAction />
          </FlowStep>
        </FlowSteps>
      </Stack>
    </NorthstarProvider>
  );
}

/** Every icon-first control in one place. Hover or Tab through to open the labels. */
export const AcrossTheSystem: Story = {
  name: 'Across the system',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(560px, 1fr))' }}>
      <System theme="night" />
      <System theme="day" />
    </div>
  ),
};
