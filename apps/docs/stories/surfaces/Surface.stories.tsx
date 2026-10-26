import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface, Stack } from '@northstar-js/react';
import { Backdrop } from '../interactions/backdrop';

const meta = { title: 'Surfaces/Surface' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Materials: Story = {
  render: () => (
    <Backdrop>
      <Stack direction="row" gap={24} wrap>
        {([1, 2, 3] as const).map((d) => (
          <Surface key={d} depth={d} style={{ width: 220, padding: 20 }}>
            <strong>Glass, depth {d}</strong>
            <p style={{ margin: '6px 0 0', color: 'var(--ns-color-text-2)' }}>Blur, saturation, rim and sheen.</p>
          </Surface>
        ))}
        <Surface material="solid" style={{ width: 220, padding: 20 }}>
          <strong>Solid</strong>
          <p style={{ margin: '6px 0 0', color: 'var(--ns-color-text-2)' }}>The fallback, and an option.</p>
        </Surface>
      </Stack>
    </Backdrop>
  ),
};

export const Reactive: Story = {
  render: () => (
    <Backdrop>
      <Surface reactive style={{ width: 360, padding: 24 }} tabIndex={0} aria-label="Reactive surface">
        <strong>Move the pointer across me</strong>
        <p style={{ margin: '6px 0 0', color: 'var(--ns-color-text-2)' }}>The specular highlight follows the pointer. With the keyboard it rests along the top edge.</p>
      </Surface>
    </Backdrop>
  ),
};
