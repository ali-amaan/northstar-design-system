import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip, Button } from '@northstar-js/react';
import { Backdrop } from '../interactions/backdrop';

const meta = { title: 'Overlays/Tooltip' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip content="Measured against published figures">
      <Button>Hover or focus</Button>
    </Tooltip>
  ),
};

export const Glass: Story = {
  render: () => (
    <Backdrop minHeight={180}>
      <div style={{ paddingTop: 48 }}>
        <Tooltip content="Runs cost money; you will see an estimate first." material="glass" delay={0}>
          <Button material="glass">Hover or focus me</Button>
        </Tooltip>
      </div>
    </Backdrop>
  ),
};
