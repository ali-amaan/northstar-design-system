import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Card, IconButton, LiquidGlass, NorthstarProvider, Stack, Surface, Toolbar, ToolbarItem, type ResolvedTheme } from '@northstar-js/react';
import { AddIcon, DuplicateIcon, ExportIcon, RunIcon, SearchIcon, SettingsIcon } from '@northstar-js/icons';
import { Backdrop } from '../interactions/backdrop';

const meta = {
  title: 'Surfaces/LiquidGlass',
  component: LiquidGlass,
  parameters: {
    docs: {
      description: {
        component:
          'Liquid glass: an SVG displacement filter used as a backdrop-filter bends the backdrop at the rim (Chromium), with a specular highlight, rim light, inner glow and a faint glacier tint. Safari and Firefox get blur plus the specular layers; reduced transparency and forced colours get the opaque solid. `material="glass"` on Surface, Card, Panel, Button, Tabs and the overlays uses the same material. Glass corners are tight for precision (`radius.glass.*`: 10px panels and bars, never fully round); buttons on glass keep the default machined spin finish, as pills (`shape="rounded"` gives them 7px corners).',
      },
    },
  },
} satisfies Meta<typeof LiquidGlass>;
export default meta;
type Story = StoryObj<typeof meta>;

function Scene({ theme }: { theme: ResolvedTheme }) {
  return (
    <NorthstarProvider theme={theme} style={{ padding: 24, background: 'var(--ns-color-ground)' }}>
      <Backdrop minHeight={360}>
        <Stack gap={24}>
          <Stack direction="row" gap={20} wrap align="center">
            {(['sm', 'md', 'lg'] as const).map((s) => (
              <LiquidGlass key={s} scale={s} style={{ width: 180, padding: 20 }}>
                <strong>Preset {s}</strong>
                <p style={{ margin: '6px 0 0', color: 'var(--ns-color-text-2)' }}>Shared filter</p>
              </LiquidGlass>
            ))}
            <LiquidGlass scale={60} radius="panel" style={{ width: 220, padding: 20 }}>
              <strong>Measured, scale 60</strong>
              <p style={{ margin: '6px 0 0', color: 'var(--ns-color-text-2)' }}>Its own filter, sized to the box</p>
            </LiquidGlass>
          </Stack>
          <Stack direction="row" gap={16} wrap align="center">
            <LiquidGlass radius="bar" scale="sm" style={{ padding: '4px 4px 4px 14px', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <span>Bar, 10px corners</span>
              <Button variant="primary" size="sm">Run</Button>
            </LiquidGlass>
            <Toolbar label={`Glass toolbar, ${theme}`} glass>
              <ToolbarItem label="Search" icon={<SearchIcon size={16} />} />
              <ToolbarItem label="New study" icon={<AddIcon size={16} />} />
              <ToolbarItem label="Duplicate" icon={<DuplicateIcon size={16} />} />
              <ToolbarItem label="Export" icon={<ExportIcon size={16} />} />
            </Toolbar>
            <LiquidGlass tint="signal" style={{ padding: 16 }}>Signal tint</LiquidGlass>
            <Surface material="solid" style={{ padding: 16 }}>Solid fallback</Surface>
          </Stack>
        </Stack>
      </Backdrop>
    </NorthstarProvider>
  );
}

export const NightAndDay: Story = {
  name: 'Night and Day',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(560px, 1fr))' }}>
      <Scene theme="night" />
      <Scene theme="day" />
    </div>
  ),
};

function SpinOnGlass({ theme }: { theme: ResolvedTheme }) {
  return (
    <NorthstarProvider theme={theme} style={{ padding: 24, background: 'var(--ns-color-ground)' }}>
      <Backdrop minHeight={300}>
        <Stack gap={20}>
          <LiquidGlass style={{ padding: 20, maxWidth: 560 }} data-shot="spin-bar">
            <Stack gap={12}>
              <strong>Buttons on glass are machined spin</strong>
              <Stack direction="row" gap={8} align="center" wrap>
                <Button variant="primary" icon={<RunIcon size={14} />}>
                  Run study
                </Button>
                <Button icon={<DuplicateIcon size={14} />}>Duplicate</Button>
                <Button>Secondary</Button>
                <Button variant="ghost">Ghost (hover for the wash)</Button>
                <Button disabled>Disabled</Button>
              </Stack>
              <Stack direction="row" gap={8} align="center" wrap>
                <IconButton expand label="Export as a report" icon={<ExportIcon size={16} />} />
                <IconButton expand="always" label="Settings" icon={<SettingsIcon size={16} />} />
                <Button size="sm">Small</Button>
                <Button size="lg" variant="primary">
                  Large primary
                </Button>
                <Button finish="soft">Opted out (soft)</Button>
              </Stack>
            </Stack>
          </LiquidGlass>
          <Stack direction="row" gap={16} align="start" wrap>
            <Card variant="glass" title="Glass card" description="10px corners; the actions are spin" footer={<Button variant="primary">Open</Button>} style={{ width: 260 }}>
              Header actions and footers on glass take the finish too.
            </Card>
            <Stack gap={8}>
              <span style={{ color: 'var(--ns-color-text-2)' }}>Off glass, the same finish:</span>
              <Stack direction="row" gap={8}>
                <Button tone="silver">tone=&quot;silver&quot; (alias)</Button>
                <Button variant="primary">Spin primary</Button>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Backdrop>
    </NorthstarProvider>
  );
}

/**
 * Machined spin on glass: the default button finish holds on liquid glass
 * too (a conic sweep under a concentric grain that turns with the pointer, a
 * light band that slides across on hover and focus, a bevel that flips when
 * pressed). Primary is Glacier-anodized. Ink holds 4.5:1 on the lightest and
 * darkest stop (tooling/contrast). `finish="soft"` opts a button out.
 */
export const SpinOnGlassStory: Story = {
  name: 'Spin buttons on glass',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(560px, 1fr))' }}>
      <SpinOnGlass theme="night" />
      <SpinOnGlass theme="day" />
    </div>
  ),
};

export const Playground: Story = {
  args: { scale: 'md', radius: 'panel', tint: 'subtle', floating: true, children: 'Liquid glass' },
  render: (args) => (
    <Backdrop>
      <LiquidGlass {...args} style={{ width: 280, padding: 24 }} />
    </Backdrop>
  ),
};
