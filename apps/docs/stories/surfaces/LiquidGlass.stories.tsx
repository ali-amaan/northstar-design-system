import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, LiquidGlass, NorthstarProvider, Stack, Surface, Toolbar, ToolbarItem, type ResolvedTheme } from '@northstar-js/react';
import { AddIcon, DuplicateIcon, ExportIcon, SearchIcon } from '@northstar-js/icons';
import { Backdrop } from '../interactions/backdrop';

const meta = {
  title: 'Surfaces/LiquidGlass',
  component: LiquidGlass,
  parameters: {
    docs: {
      description: {
        component:
          'Liquid glass: an SVG displacement filter used as a backdrop-filter bends the backdrop at the rim (Chromium), with a specular highlight, rim light, inner glow and a faint glacier tint. Safari and Firefox get blur plus the specular layers; reduced transparency and forced colours get the opaque solid. `material="glass"` on Surface, Card, Panel, Button, Tabs and the overlays uses the same material.',
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
            <LiquidGlass scale={60} radius={28} style={{ width: 220, padding: 20 }}>
              <strong>Measured, scale 60</strong>
              <p style={{ margin: '6px 0 0', color: 'var(--ns-color-text-2)' }}>Its own filter, sized to the box</p>
            </LiquidGlass>
          </Stack>
          <Stack direction="row" gap={16} wrap align="center">
            <LiquidGlass radius="pill" scale="sm" style={{ padding: '6px 6px 6px 16px', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <span>Pill, thin and iOS-like</span>
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

export const Playground: Story = {
  args: { scale: 'md', radius: 20, tint: 'subtle', floating: true, children: 'Liquid glass' },
  render: (args) => (
    <Backdrop>
      <LiquidGlass {...args} style={{ width: 280, padding: 24 }} />
    </Backdrop>
  ),
};
