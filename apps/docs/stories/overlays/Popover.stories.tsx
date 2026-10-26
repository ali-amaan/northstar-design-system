import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popover } from '@northstar-js/react';

const meta = { title: 'Overlays/Popover' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover.Root>
      <Popover.Trigger className="ns-button ns-size-md">Band details</Popover.Trigger>
      <Popover.Content>
        <Popover.Title>Measured band</Popover.Title>
        <Popover.Description>[SHARE] ± [BAND] for this question type.</Popover.Description>
      </Popover.Content>
    </Popover.Root>
  ),
};
