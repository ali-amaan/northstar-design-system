import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip, Button } from '@northstar-js/react';

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
