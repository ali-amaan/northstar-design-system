import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, IconButton, LiquidGlass, NorthstarProvider, type ResolvedTheme } from '@northstar-js/react';
import { BACKDROP_VARIANTS, StarBackdrop, type BackdropVariant, type StarBackdropProps } from '@northstar-js/react/backdrops';
import { AddIcon, RunIcon } from '@northstar-js/icons';

const meta = {
  title: 'Backdrops',
  component: StarBackdrop,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Animated star backdrops: one `StarBackdrop` component, fifteen interchangeable variants ported from the approved design canvas. Each fills its container (absolute, `aria-hidden`, no pointer events) and covers any aspect ratio. Geometry is seeded (no Math.random), memoised and capped by `density`; animation is CSS only, pauses offscreen and while the page is hidden, and is a still frame under reduced motion. Import `@northstar-js/react/backdrops` and load `@northstar-js/react/backdrops.css`.',
      },
    },
  },
} satisfies Meta<typeof StarBackdrop>;
export default meta;
type Story = StoryObj<typeof meta>;

const TITLES: Record<BackdropVariant, string> = {
  'constellation-atlas': 'Constellation atlas',
  orrery: 'Orrery',
  'golden-angle': 'Golden-angle field',
  'prime-lattice': 'Prime lattice',
  'meridian-sweep': 'Meridian sweep',
  interference: 'Interference field',
  'celestial-sphere': 'Celestial sphere',
  'fibonacci-sphere': 'Fibonacci sphere',
  'star-torus': 'Star torus',
  'double-helix': 'Double helix',
  'wave-surface': 'Wave surface',
  'twin-vortex': 'Twin vortex',
  'drifting-blooms': 'Drifting blooms',
  mobius: 'Möbius band',
  'galaxy-3d': 'Galaxy in depth',
};

/** A sample glass card on the backdrop: the glass has something to bend, and its buttons are silver pills. */
function GlassCard({ title, compact = false }: { title: string; compact?: boolean }) {
  return (
    <LiquidGlass style={{ position: 'relative', width: compact ? 216 : 280, padding: compact ? 14 : 18 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ns-color-text-2)' }}>{title}</div>
      <div style={{ fontSize: compact ? 15 : 16, fontWeight: 600, marginTop: 6 }}>Study Aurora</div>
      <div style={{ fontSize: 12, color: 'var(--ns-color-text-2)', marginTop: 4 }}>[N] agents · ready to run</div>
      <div style={{ display: 'flex', gap: 8, marginTop: compact ? 10 : 14, alignItems: 'center' }}>
        <Button variant="primary" size="sm" icon={<RunIcon size={14} />}>
          Run
        </Button>
        <Button size="sm">Edit</Button>
        <IconButton size="sm" label="Add question" icon={<AddIcon size={14} />} />
      </div>
    </LiquidGlass>
  );
}

function Board({ theme }: { theme: ResolvedTheme }) {
  return (
    <NorthstarProvider theme={theme} style={{ padding: 24, background: 'var(--ns-color-ground)' }} data-board={theme}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {BACKDROP_VARIANTS.map((v) => (
          <figure key={v} style={{ margin: 0 }} data-variant-tile={v}>
            <div style={{ position: 'relative', aspectRatio: '16 / 10', overflow: 'hidden', borderRadius: 10, padding: 20, isolation: 'isolate' }}>
              <StarBackdrop variant={v} />
              <GlassCard title={TITLES[v]} compact />
            </div>
            <figcaption style={{ marginTop: 6, fontSize: 12, color: 'var(--ns-color-text-3)' }}>
              {TITLES[v]} · <code>{v}</code>
            </figcaption>
          </figure>
        ))}
      </div>
    </NorthstarProvider>
  );
}

/** Every variant behind a sample liquid-glass card with silver pill buttons, in Night and in Day. */
export const All: Story = {
  render: () => (
    <div>
      <Board theme="night" />
      <Board theme="day" />
    </div>
  ),
};

/** One variant, full bleed, with every control. */
export const Variant: Story = {
  args: { variant: 'constellation-atlas', density: 'medium', speed: 1, paused: false, ground: true },
  argTypes: {
    variant: { control: 'select', options: [...BACKDROP_VARIANTS] },
    theme: { control: 'inline-radio', options: [undefined, 'night', 'day'] },
    density: { control: 'inline-radio', options: ['low', 'medium', 'high'] },
    speed: { control: { type: 'range', min: 0, max: 4, step: 0.25 } },
    paused: { control: 'boolean' },
    ground: { control: 'boolean' },
  },
  render: (args: StarBackdropProps) => (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 48px)', overflow: 'hidden', borderRadius: 12, padding: 48, isolation: 'isolate' }}>
      <StarBackdrop {...args} />
      <div data-theme={args.theme}>
        <GlassCard title={TITLES[args.variant ?? 'constellation-atlas']} />
      </div>
    </div>
  ),
};
