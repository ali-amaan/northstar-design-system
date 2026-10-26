import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popover } from '@northstar-js/react';
import { Backdrop } from '../interactions/backdrop';

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

export const Glass: Story = {
  render: () => (
    <Backdrop minHeight={280}>
      <Popover.Root defaultOpen>
        <Popover.Trigger className="ns-button ns-button--secondary ns-button--glass ns-size-md">Filters</Popover.Trigger>
        <Popover.Content material="glass">
          <Popover.Title>Filter studies</Popover.Title>
          <Popover.Description>Only drafts and running studies.</Popover.Description>
        </Popover.Content>
      </Popover.Root>
    </Backdrop>
  ),
};
