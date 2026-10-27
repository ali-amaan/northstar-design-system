import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ButtonGroup, IconButton, LiquidGlass, NorthstarProvider, Pagination, Stack, Tabs, Toolbar, ToolbarItem, type ResolvedTheme } from '@northstar-js/react';
import { ConstellationButton } from '@northstar-js/react/effects';
import { AddIcon, DuplicateIcon, ExportIcon, RunIcon, SearchIcon, SettingsIcon } from '@northstar-js/icons';
import { Backdrop } from '../interactions/backdrop';

const meta = { title: 'Actions/Button' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <Stack gap={16}>
      <Stack direction="row" gap={8} align="center">
        <Button variant="primary">Run study</Button>
        <Button>Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button tone="signal" variant="ghost">Signal</Button>
        <Button disabled>Disabled</Button>
        <Button variant="primary" loading>Running</Button>
      </Stack>
      <Stack direction="row" gap={8} align="center">
        <Button size="sm">Small 28</Button>
        <Button size="md">Medium 32</Button>
        <Button size="lg">Large 36</Button>
        <Button size="xl" variant="primary">XL 44</Button>
      </Stack>
    </Stack>
  ),
};

/** Press springs, focus glow, the north-star spinner and the success check. */
export const Interactions: Story = {
  render: function Render() {
    const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
    const run = () => {
      setState('loading');
      setTimeout(() => setState('done'), 1400);
      setTimeout(() => setState('idle'), 3200);
    };
    return (
      <Backdrop minHeight={220}>
        <Stack gap={16}>
          <Stack direction="row" gap={8} align="center" wrap>
            <Button variant="primary" magnetic loading={state === 'loading'} success={state === 'done'} successLabel="Study saved" onClick={run}>
              Save study
            </Button>
            <Button material="glass" magnetic>Glass, magnetic</Button>
            <Button material="glass" variant="ghost">Glass ghost</Button>
            <Button success>Saved</Button>
            <Button loading>Running</Button>
          </Stack>
          <p style={{ margin: 0, color: 'var(--ns-color-text-2)' }}>Press and hold to feel the press spring; Tab to see the focus ring snap in.</p>
        </Stack>
      </Backdrop>
    );
  },
};

/** `icon` leads; with `expand` only the icon shows and the full label eases open on hover and focus (always on touch). */
export const IconAndExpand: Story = {
  name: 'Icon and expand',
  render: () => (
    <Stack gap={12}>
      <Stack direction="row" gap={8} align="center">
        <Button icon={<DuplicateIcon size={16} />}>Duplicate</Button>
        <Button variant="primary" icon={<RunIcon size={16} />}>
          Run study
        </Button>
      </Stack>
      <Stack direction="row" gap={8} align="center">
        <Button icon={<DuplicateIcon size={16} />} expand>
          Duplicate study
        </Button>
        <Button variant="ghost" icon={<ExportIcon size={16} />} expand>
          Export results as a report
        </Button>
        <Button variant="primary" icon={<RunIcon size={16} />} expand="always">
          Run study
        </Button>
      </Stack>
    </Stack>
  ),
};

/** On liquid glass, secondary and primary buttons are brushed silver; `tone="silver"` asks for it anywhere. */
export const Silver: Story = {
  render: () => (
    <Backdrop minHeight={200}>
      <Stack gap={16}>
        <LiquidGlass style={{ padding: 16, display: 'inline-flex', gap: 8, alignSelf: 'flex-start' }}>
          <Button variant="primary" icon={<RunIcon size={14} />}>
            Run study
          </Button>
          <Button>Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button material="solid">Solid (opt out)</Button>
        </LiquidGlass>
        <Stack direction="row" gap={8}>
          <Button tone="silver">Silver off glass</Button>
          <Button tone="silver" variant="primary">
            Silver primary
          </Button>
        </Stack>
      </Stack>
    </Backdrop>
  ),
};

/** Every button in one place, for one theme: pills by default, circles when icon-only, the tactile texture per variant, silver on glass, and the rounded opt-out. */
function ShapeBoard({ theme }: { theme: ResolvedTheme }) {
  return (
    <NorthstarProvider theme={theme} style={{ padding: 24, background: 'var(--ns-color-ground)' }} data-board={theme}>
      <Stack gap={20}>
        <Stack direction="row" gap={8} align="center" wrap>
          <Button variant="primary" icon={<RunIcon size={16} />} data-hover-target={`${theme}-primary`}>
            Run study
          </Button>
          <Button data-hover-target={`${theme}-secondary`}>Secondary</Button>
          <Button variant="ghost" data-hover-target={`${theme}-ghost`}>
            Ghost
          </Button>
          <Button tone="signal">Signal</Button>
          <Button disabled>Disabled</Button>
          <ConstellationButton variant="primary">Lock population</ConstellationButton>
        </Stack>
        <Stack direction="row" gap={8} align="center" wrap>
          <IconButton size="sm" label="Search" icon={<SearchIcon size={16} />} />
          <IconButton label="Add question" icon={<AddIcon size={16} />} data-hover-target={`${theme}-icon`} />
          <IconButton size="lg" variant="primary" label="Run" icon={<RunIcon size={16} />} />
          <IconButton size="xl" variant="ghost" label="Settings" icon={<SettingsIcon size={16} />} />
          <IconButton label="Duplicate study" icon={<DuplicateIcon size={16} />} expand data-hover-target={`${theme}-expand`} />
          <Button variant="ghost" icon={<ExportIcon size={16} />} expand>
            Export results as a report
          </Button>
          <ButtonGroup attached label="View">
            <Button size="sm">Day</Button>
            <Button size="sm">Week</Button>
            <Button size="sm">Month</Button>
          </ButtonGroup>
        </Stack>
        <Stack direction="row" gap={16} align="center" wrap>
          <Tabs.Root defaultValue="a" indicator="solid">
            <Tabs.List aria-label={`Pill tabs, ${theme}`}>
              <Tabs.Trigger value="a">Overview</Tabs.Trigger>
              <Tabs.Trigger value="b">Responses</Tabs.Trigger>
              <Tabs.Trigger value="c">Population</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
          <Pagination pageCount={9} defaultPage={4} />
        </Stack>
        <LiquidGlass style={{ padding: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <Button variant="primary" icon={<RunIcon size={14} />} data-hover-target={`${theme}-silver`}>
            Run study
          </Button>
          <Button>Silver secondary</Button>
          <IconButton label="Add" icon={<AddIcon size={16} />} />
          <Button variant="ghost">Ghost</Button>
          <Toolbar label={`Glass toolbar, ${theme}`}>
            <ToolbarItem label="Search" icon={<SearchIcon size={16} />} />
            <ToolbarItem label="Export" icon={<ExportIcon size={16} />} />
          </Toolbar>
        </LiquidGlass>
        <Stack direction="row" gap={8} align="center" wrap>
          <span style={{ color: 'var(--ns-color-text-3)', fontSize: 12 }}>shape="rounded"</span>
          <Button shape="rounded" variant="primary">
            Rounded primary
          </Button>
          <Button shape="rounded">Rounded</Button>
          <IconButton shape="rounded" label="Settings" icon={<SettingsIcon size={16} />} />
          <Button shape="rounded" tone="silver">
            Rounded silver
          </Button>
        </Stack>
      </Stack>
    </NorthstarProvider>
  );
}

/** Pills, circles and texture side by side in Night and Day. Hover a button to see the ghost texture come in and the silver sheen turn. */
export const ShapesAndTexture: Story = {
  name: 'Shapes and texture',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(620px, 1fr))' }}>
      <ShapeBoard theme="night" />
      <ShapeBoard theme="day" />
    </div>
  ),
};
