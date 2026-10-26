import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button, Card, Field, Grid, IconButton, Input, Link, Menu, NorthstarProvider, Panel, Stack, Surface, Switch, Table, TableBody, TableCell,
  TableHead, TableHeaderCell, TableRow, Tabs, Tag, Toast, Tooltip, type ResolvedTheme,
} from '@northstar-js/react';
import { Backdrop } from './backdrop';

const meta = { title: 'Northstar/Interactions', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const Star = () => (
  <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
    <path d="M8 0.5 9.3 6.7 15.5 8 9.3 9.3 8 15.5 6.7 9.3 0.5 8 6.7 6.7Z" fill="currentColor" />
  </svg>
);

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
    <NorthstarProvider theme={theme} material="glass" style={{ padding: 24, background: 'var(--ns-color-ground)' }}>
      <Backdrop minHeight={0}>
        <Stack gap={24}>
          <Stack direction="row" align="center" justify="between" wrap gap={12}>
            <Stack direction="row" align="center" gap={8}>
              <span style={{ color: 'var(--ns-color-signal)', display: 'inline-flex' }}>
                <Star />
              </span>
              <strong style={{ fontSize: 'var(--ns-font-size-15)' }}>Northstar interactions · {label}</strong>
            </Stack>
            <Tabs.Root defaultValue="population" indicator="glass">
              <Tabs.List label={`Study sections, ${label}`}>
                <Tabs.Trigger value="brief">Brief</Tabs.Trigger>
                <Tabs.Trigger value="population">Population</Tabs.Trigger>
                <Tabs.Trigger value="research">Research</Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
          </Stack>

          <Grid columns={{ min: 220 }} gap={16}>
            <Card variant="spotlight" interactive title={<Link href="#" tone="neutral">Weekday lunch</Link>} description="Spotlight · lifts on hover and focus" actions={<Tag tone="signal">Running</Tag>}>
              <span style={{ color: 'var(--ns-color-text-2)' }}>[N] questions · [M] agents</span>
            </Card>
            <Card variant="glass" orbit title="Run in progress" description="Glass · orbit border">
              <Button size="sm" loading>Running</Button>
            </Card>
            <Card title="Solid" description="The quiet default" footer={<Button size="sm" success>Saved</Button>}>
              <span style={{ color: 'var(--ns-color-text-2)' }}>Opaque, no blur.</span>
            </Card>
          </Grid>

          <Stack direction="row" gap={16} wrap align="start">
            <Panel title="Controls" style={{ flex: '1 1 300px' }}>
              <Stack gap={12}>
                <Stack direction="row" gap={8} wrap align="center">
                  <SaveButton />
                  <Button material="glass" magnetic>Glass</Button>
                  <Tooltip content="Points the study at a market" material="glass">
                    <IconButton material="glass" label="Set north" icon={<Star />} />
                  </Tooltip>
                </Stack>
                <Field label="Study name">
                  <Input defaultValue="Weekday lunch" />
                </Field>
                <Stack direction="row" gap={16} align="center" wrap>
                  <Switch defaultChecked>Live updates</Switch>
                  <Tag onRemove={() => {}}>Age 25–34</Tag>
                  <Tag tone="signal" onRemove={() => {}}>Uusimaa</Tag>
                </Stack>
                <p style={{ margin: 0, color: 'var(--ns-color-text-2)' }}>
                  Read the <Link href="#">method note</Link> before quoting a level.
                </p>
              </Stack>
            </Panel>

            <Stack gap={12} style={{ flex: '1 1 260px' }}>
              <Surface depth={3} style={{ padding: 4, minWidth: 200 }} aria-label={`Menu preview, ${label}`} role="group">
                <div className="ns-menu__label">Study</div>
                <div className="ns-menu__item" style={{ background: 'var(--ns-material-spotlight)' }}>
                  <span className="ns-menu__text">Duplicate</span>
                  <span className="ns-menu__shortcut">D</span>
                </div>
                <div className="ns-menu__item">
                  <span className="ns-menu__text">Archive</span>
                </div>
              </Surface>
              <Toast tone="signal" title="Run queued" description="[N] respondents" onDismiss={() => {}} />
              <Menu.Root>
                <Menu.Trigger className="ns-button ns-button--secondary ns-button--glass ns-size-md">Open a glass menu</Menu.Trigger>
                <Menu.Content>
                  <Menu.Item shortcut="R">Rename</Menu.Item>
                  <Menu.Item shortcut="D">Duplicate</Menu.Item>
                </Menu.Content>
              </Menu.Root>
            </Stack>
          </Stack>

          <Table interactive caption={`Studies, ${label}`}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Study</TableHeaderCell>
                <TableHeaderCell numeric>Agents</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {['Weekday lunch', 'Commuting'].map((name) => (
                <TableRow key={name}>
                  <TableCell>
                    <Link href="#" tone="neutral">{name}</Link>
                  </TableCell>
                  <TableCell numeric>[N]</TableCell>
                  <TableCell>
                    <Tag>Draft</Tag>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      </Backdrop>
    </NorthstarProvider>
  );
}

export const NightAndDay: Story = {
  name: 'Night and Day',
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(560px, 1fr))' }}>
      <Board theme="night" />
      <Board theme="day" />
    </div>
  ),
};

export const Night: Story = { render: () => <Board theme="night" /> };
export const Day: Story = { render: () => <Board theme="day" /> };
