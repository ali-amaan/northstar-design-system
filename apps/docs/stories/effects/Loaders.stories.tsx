import type { Meta, StoryObj } from '@storybook/react-vite';
import { FibonacciLoader, LissajousLoader, OrbitSpinner } from '@northstar-js/react/effects';

const meta = { title: 'Effects/Loaders' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const row = { display: 'flex', gap: 32, alignItems: 'center' } as const;

/** Two planets on Kepler periods (T ∝ a^1.5) round a north star. */
export const OrbitSpinnerStory: Story = {
  name: 'OrbitSpinner',
  render: () => (
    <div style={row}>
      <OrbitSpinner size={24} />
      <OrbitSpinner size={40} label="Building population" />
      <OrbitSpinner size={64} />
    </div>
  ),
};

/** Seeds on the golden angle (Vogel's sunflower); the pulse runs out along the spiral arms. */
export const FibonacciLoaderStory: Story = {
  name: 'FibonacciLoader',
  render: () => (
    <div style={row}>
      <FibonacciLoader size={32} seeds={21} />
      <FibonacciLoader size={48} seeds={34} />
      <FibonacciLoader size={72} seeds={55} />
    </div>
  ),
};

/** A point tracing x = cos 3t, y = sin 2t with transforms only; other ratios draw other figures. */
export const LissajousLoaderStory: Story = {
  name: 'LissajousLoader',
  render: () => (
    <div style={row}>
      <LissajousLoader size={40} />
      <LissajousLoader size={40} ratio={[5, 4]} period={5} />
      <LissajousLoader size={40} ratio={[1, 2]} period={3} />
      <LissajousLoader size={64} ratio={[3, 4]} period={4.2} />
    </div>
  ),
};
