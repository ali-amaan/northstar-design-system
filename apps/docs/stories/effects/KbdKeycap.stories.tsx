import type { Meta, StoryObj } from '@storybook/react-vite';
import { KbdKeycap } from '@northstar-js/react/effects';

const meta = { title: 'Effects/KbdKeycap', component: KbdKeycap } satisfies Meta<typeof KbdKeycap>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Keycaps sit on a ledge. With `listen`, a cap sinks while you hold that key: try K, Shift or Enter. */
export const Default: Story = {
  render: () => (
    <p style={{ color: 'var(--ns-color-text-2)', display: 'flex', gap: 6, alignItems: 'center' }}>
      Open the command bar with <KbdKeycap listen="Control">Ctrl</KbdKeycap> <KbdKeycap listen="k">K</KbdKeycap>, run with{' '}
      <KbdKeycap listen="Shift">Shift</KbdKeycap> <KbdKeycap listen="Enter">Enter</KbdKeycap>
    </p>
  ),
};

export const Pressed: Story = { args: { pressed: true, children: 'Esc' } };
