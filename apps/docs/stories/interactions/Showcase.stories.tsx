import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button, Card, Field, FlowStep, FlowSteps, Grid, HoverActions, IconButton, Input, LiquidGlass, Link, NextAction, NorthstarProvider,
  Reveal, Sidebar, SidebarItem, SidebarSection, Stack, Switch, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Tabs, Tag,
  Toast, Toolbar, ToolbarItem, Tooltip, type ResolvedTheme,
} from '@northstar-js/react';
import {
  DuplicateIcon, ExportIcon, MoreIcon, NorthIcon, PopulationIcon, ResearchIcon, RunIcon, SearchIcon, SettingsIcon, StudyIcon,
  BriefIcon, AddIcon,
} from '@northstar-js/icons';
import { Backdrop } from './backdrop';

const meta = { title: 'Northstar/Interactions', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function SaveButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  return (
    <Button
      variant="primary"
      magnetic
      loading={state === 'loading'}
      success={state === 'done'}
      successLabel="Study saved"
      onClick={() => {
        setState('loading');
        setTimeout(() => setState('done'), 1200);
        setTimeout(() => setState('idle'), 3000);
      }}
    >
      Save study
    </Button>
  );
}

function Board({ theme }: { theme: ResolvedTheme }) {
  const label = theme === 'night' ? 'Night' : 'Day';
  return (
    <NorthstarProvider theme={theme} material="glass" style={{ padding: 24, background: 'var(--ns-color-ground)' }} data-board={theme}>
      <Backdrop minHeight={0}>
        <Stack direction="row" gap={20} align="start">
          <Sidebar collapsed label={`Workspace, ${label}`} style={{ height: 'auto', borderRadius: 14, alignSelf: 'stretch' }} className="ns-liquid ns-liquid--md ns-liquid--tint-subtle">
            <SidebarSection title="Workspace">
              <SidebarItem href="#" icon={<StudyIcon size={16} />} active>
                Studies
              </SidebarItem>
              <SidebarItem href="#" icon={<PopulationIcon size={16} />}>Populations</SidebarItem>
              <SidebarItem href="#" icon={<ResearchIcon size={16} />}>Research library</SidebarItem>
              <SidebarItem href="#" icon={<SettingsIcon size={16} />}>Workspace settings</SidebarItem>
            </SidebarSection>
          </Sidebar>

          <Stack gap={24} style={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" align="center" justify="between" wrap gap={12}>
              <Stack direction="row" align="center" gap={8}>
                <span style={{ color: 'var(--ns-color-signal)', display: 'inline-flex' }}>
                  <NorthIcon size={18} />
                </span>
                <strong style={{ fontSize: 'var(--ns-font-size-15)' }}>Northstar interactions · {label}</strong>
              </Stack>
              <Toolbar label={`Study actions, ${label}`} glass>
                <ToolbarItem label="Search studies" icon={<SearchIcon size={16} />} />
                <ToolbarItem label="New study" icon={<AddIcon size={16} />} data-hover-target={theme} />
                <ToolbarItem label="Duplicate" icon={<DuplicateIcon size={16} />} />
                <ToolbarItem label="Export results" icon={<ExportIcon size={16} />} />
                <Tooltip content="More actions" material="glass">
                  <IconButton variant="ghost" label="More actions" icon={<MoreIcon size={16} />} />
                </Tooltip>
              </Toolbar>
            </Stack>

            <LiquidGlass scale="lg" radius={22} style={{ padding: '20px 24px' }} as="section" aria-label={`Liquid glass, ${label}`}>
              <Stack direction="row" align="center" justify="between" wrap gap={16}>
                <Stack gap={4}>
                  <span style={{ fontSize: 'var(--ns-font-size-11)', color: 'var(--ns-color-text-3)', fontFamily: 'var(--ns-font-family-mono)' }}>LIQUID GLASS</span>
                  <strong style={{ fontSize: 'var(--ns-font-size-18)' }}>The backdrop bends at the rim</strong>
                  <span style={{ color: 'var(--ns-color-text-2)' }}>Refraction on Chromium; blur and specular elsewhere; solid under reduced transparency.</span>
                </Stack>
                <Stack direction="row" gap={8}>
                  <Button material="glass">Glass</Button>
                  <SaveButton />
                </Stack>
              </Stack>
            </LiquidGlass>

            <Tabs.Root defaultValue="population" indicator="glass" transition>
              <Tabs.List label={`Study sections, ${label}`}>
                <Tabs.Trigger value="brief">Brief</Tabs.Trigger>
                <Tabs.Trigger value="population">Population</Tabs.Trigger>
                <Tabs.Trigger value="research">Research</Tabs.Trigger>
                <Tabs.Trigger value="responses">Responses</Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>

            <Reveal stagger>
              <Grid columns={{ min: 200 }} gap={16}>
                <Card
                  variant="spotlight"
                  interactive
                  revealActions
                  title={<Link href="#" tone="neutral">Weekday lunch</Link>}
                  description="Hover or focus for actions"
                  actions={
                    <>
                      <IconButton size="sm" variant="ghost" label="Duplicate" icon={<DuplicateIcon size={16} />} />
                      <IconButton size="sm" variant="ghost" label="Export" icon={<ExportIcon size={16} />} />
                    </>
                  }
                >
                  <span style={{ color: 'var(--ns-color-text-2)' }}>[N] questions · [M] agents</span>
                </Card>
                <Card variant="glass" orbit title="Run in progress" description="Liquid glass · orbit">
                  <Button size="sm" loading>Running</Button>
                </Card>
                <Card title="Solid" description="Borderless: tone and shadow" footer={<Button size="sm" success>Saved</Button>}>
                  <span style={{ color: 'var(--ns-color-text-2)' }}>No outline, one hairline.</span>
                </Card>
              </Grid>
            </Reveal>

            <Stack direction="row" gap={16} wrap align="start">
              <Card title="Guided setup" style={{ flex: '1 1 320px' }}>
                <FlowSteps label={`Study setup, ${label}`} defaultValue="population">
                  <FlowStep value="brief" title="Brief" icon={<BriefIcon size={12} />}>
                    <Field label="Study name">
                      <Input defaultValue="Weekday lunch" />
                    </Field>
                    <NextAction />
                  </FlowStep>
                  <FlowStep value="population" title="Population" description="Who answers">
                    <Stack direction="row" gap={8} wrap>
                      <Tag onRemove={() => {}}>Age 25–34</Tag>
                      <Tag tone="signal" onRemove={() => {}}>Uusimaa</Tag>
                    </Stack>
                    <NextAction hint="[N] agents" />
                  </FlowStep>
                  <FlowStep value="research" title="Research">
                    <Switch defaultChecked>Live updates</Switch>
                    <NextAction />
                  </FlowStep>
                  <FlowStep value="responses" title="Responses">
                    <NextAction finishLabel={<><RunIcon size={14} />Run study</>} />
                  </FlowStep>
                </FlowSteps>
              </Card>
              <Stack gap={12} style={{ flex: '1 1 240px' }}>
                <Toast tone="signal" title="Run queued" description="[N] respondents" onDismiss={() => {}} />
                <Table interactive caption={`Studies, ${label}`}>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Study</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>
                        <span className="ns-visually-hidden">Actions</span>
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {['Weekday lunch', 'Commuting'].map((name) => (
                      <TableRow key={name}>
                        <TableCell>
                          <Link href="#" tone="neutral">{name}</Link>
                        </TableCell>
                        <TableCell>
                          <Tag>Draft</Tag>
                        </TableCell>
                        <TableCell>
                          <HoverActions>
                            <IconButton size="sm" variant="ghost" label={`Duplicate ${name}`} icon={<DuplicateIcon size={16} />} />
                          </HoverActions>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p style={{ margin: 0, color: 'var(--ns-color-text-2)' }}>
                  Read the <Link href="#">method note</Link> before quoting a level.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Backdrop>
    </NorthstarProvider>
  );
}

export const NightAndDay: Story = {
  name: 'Night and Day',
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(640px, 1fr))' }}>
      <Board theme="night" />
      <Board theme="day" />
    </div>
  ),
};

export const Night: Story = { render: () => <Board theme="night" /> };
export const Day: Story = { globals: { theme: 'day' }, render: () => <Board theme="day" /> };
