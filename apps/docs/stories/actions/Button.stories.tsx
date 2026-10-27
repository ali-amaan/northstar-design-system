import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ButtonGroup, IconButton, LiquidGlass, NorthstarProvider, Pagination, Stack, Tabs, Toolbar, ToolbarItem, type ResolvedTheme } from '@northstar-js/react';
import { ConstellationButton } from '@northstar-js/react/effects';
import { StarBackdrop } from '@northstar-js/react/backdrops';
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

const caption = { color: 'var(--ns-color-text-3)', fontSize: 12, minWidth: 92 } as const;

/** One row of the spin board: a caption and the buttons. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" gap={8} align="center" wrap>
      <span style={caption}>{label}</span>
      {children}
    </Stack>
  );
}

/**
 * Every spin button for one theme: variants, sizes, icon circles (turned
 * knobs), icon-first expand, off glass, and on liquid glass over a star
 * backdrop. `data-spin` marks the targets the screenshot script drives.
 */
function SpinBoard({ theme }: { theme: ResolvedTheme }) {
  const t = (k: string) => `${theme}-${k}`;
  return (
    <NorthstarProvider theme={theme} style={{ padding: 24, background: 'var(--ns-color-ground)' }} data-board={theme}>
      <Stack gap={16}>
        <Row label="Variants">
          <Button variant="primary" icon={<RunIcon size={16} />} data-spin={t('primary')}>
            Run study
          </Button>
          <Button data-spin={t('secondary')}>Secondary</Button>
          <Button variant="ghost" data-spin={t('ghost')}>
            Ghost
          </Button>
          <Button tone="signal" data-spin={t('signal')}>
            Signal
          </Button>
          <Button tone="signal" variant="ghost">
            Signal ghost
          </Button>
          <Button disabled data-spin={t('disabled')}>
            Disabled
          </Button>
          <Button variant="primary" disabled>
            Disabled primary
          </Button>
          <Button variant="primary" loading>
            Running
          </Button>
        </Row>
        <Row label="Sizes">
          <Button size="sm">Small 28</Button>
          <Button size="md">Medium 32</Button>
          <Button size="lg">Large 36</Button>
          <Button size="xl">XL 44</Button>
          <Button size="sm" variant="primary">
            Small
          </Button>
          <Button size="xl" variant="primary">
            XL primary
          </Button>
        </Row>
        <Row label="Icon circles">
          <span data-spin={t('circles')} style={{ display: 'inline-flex', gap: 10, alignItems: 'center', padding: 6 }}>
            <IconButton size="sm" label="Search" icon={<SearchIcon size={16} />} />
            <IconButton label="Add question" icon={<AddIcon size={16} />} data-spin={t('knob')} />
            <IconButton size="lg" label="Settings" icon={<SettingsIcon size={16} />} />
            <IconButton size="xl" label="Duplicate" icon={<DuplicateIcon size={18} />} />
            <IconButton size="lg" variant="primary" label="Run" icon={<RunIcon size={16} />} />
            <IconButton size="xl" variant="primary" label="Run now" icon={<RunIcon size={18} />} />
            <IconButton size="lg" variant="ghost" label="Export" icon={<ExportIcon size={16} />} data-spin={t('ghost-knob')} />
            <IconButton size="lg" disabled label="Locked" icon={<SettingsIcon size={16} />} />
          </span>
        </Row>
        <Row label="Expand">
          <IconButton label="Duplicate study" icon={<DuplicateIcon size={16} />} expand data-spin={t('expand')} />
          <IconButton label="Export as a report" icon={<ExportIcon size={16} />} expand="always" />
          <Button variant="primary" icon={<RunIcon size={16} />} expand="always">
            Run study
          </Button>
          <Button variant="ghost" icon={<ExportIcon size={16} />} expand>
            Export results
          </Button>
          <ButtonGroup attached label="View">
            <Button size="sm">Day</Button>
            <Button size="sm">Week</Button>
            <Button size="sm">Month</Button>
          </ButtonGroup>
          <ConstellationButton variant="primary">Lock population</ConstellationButton>
        </Row>
        <div
          data-spin={t('glass')}
          style={{ position: 'relative', overflow: 'hidden', isolation: 'isolate', borderRadius: 10, padding: 28, minHeight: 180, display: 'flex', alignItems: 'center' }}
        >
          <StarBackdrop variant="constellation-atlas" paused />
          <LiquidGlass style={{ position: 'relative', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Stack direction="row" gap={8} align="center" wrap>
              <Button variant="primary" icon={<RunIcon size={14} />} data-spin={t('glass-primary')}>
                Run study
              </Button>
              <Button data-spin={t('glass-secondary')}>Edit brief</Button>
              <Button variant="ghost" data-spin={t('glass-ghost')}>
                Ghost
              </Button>
              <Button disabled>Disabled</Button>
            </Stack>
            <Stack direction="row" gap={8} align="center" wrap>
              <IconButton label="Add" icon={<AddIcon size={16} />} />
              <IconButton variant="primary" label="Run" icon={<RunIcon size={16} />} />
              <IconButton label="Duplicate study" icon={<DuplicateIcon size={16} />} expand />
              <Toolbar label={`Glass toolbar, ${theme}`}>
                <ToolbarItem label="Search" icon={<SearchIcon size={16} />} />
                <ToolbarItem label="Export" icon={<ExportIcon size={16} />} />
              </Toolbar>
            </Stack>
          </LiquidGlass>
        </div>
        <Row label='finish="soft"'>
          <Button finish="soft" variant="primary">
            Soft primary
          </Button>
          <Button finish="soft">Soft secondary</Button>
          <IconButton finish="soft" label="Soft add" icon={<AddIcon size={16} />} />
          <Button shape="rounded" variant="primary">
            Rounded spin
          </Button>
          <IconButton shape="rounded" label="Rounded settings" icon={<SettingsIcon size={16} />} />
        </Row>
      </Stack>
    </NorthstarProvider>
  );
}

/**
 * Machined spin, the default finish of every button: a conic sweep of
 * machined stops under a fine concentric grain, centred on the button, so an
 * icon-only circle is a turned knob. Hover to see the light band slide across
 * and the sweep turn with the pointer; press to feel the bevel flip; Tab for
 * the Glacier ring. Primary is Glacier-anodized; ghost takes a faint wash on
 * hover and focus; disabled is matte. Night and Day, on and off glass.
 */
export const MachinedSpin: Story = {
  name: 'Machined spin',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(760px, 1fr))' }}>
      <SpinBoard theme="night" />
      <SpinBoard theme="day" />
    </div>
  ),
};

/** Every button in one place, for one theme: pills by default, circles when icon-only, spin and soft finishes, and the rounded opt-out. */
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
        <NorthstarProvider theme={theme} buttonFinish="soft" liquidGlass={false} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--ns-color-text-3)', fontSize: 12 }}>buttonFinish="soft"</span>
          <Button variant="primary">Soft primary</Button>
          <Button>Soft secondary</Button>
          <Button variant="ghost">Soft ghost</Button>
          <IconButton label="Add" icon={<AddIcon size={16} />} />
          <Pagination pageCount={3} defaultPage={2} />
        </NorthstarProvider>
        <Stack direction="row" gap={8} align="center" wrap>
          <span style={{ color: 'var(--ns-color-text-3)', fontSize: 12 }}>shape="rounded"</span>
          <Button shape="rounded" variant="primary">
            Rounded primary
          </Button>
          <Button shape="rounded">Rounded</Button>
          <IconButton shape="rounded" label="Settings" icon={<SettingsIcon size={16} />} />
          <Button shape="rounded" finish="soft">
            Rounded soft
          </Button>
        </Stack>
      </Stack>
    </NorthstarProvider>
  );
}

/** Pills, circles and both finishes side by side in Night and Day. */
export const ShapesAndTexture: Story = {
  name: 'Shapes and finishes',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(620px, 1fr))' }}>
      <ShapeBoard theme="night" />
      <ShapeBoard theme="day" />
    </div>
  ),
};
