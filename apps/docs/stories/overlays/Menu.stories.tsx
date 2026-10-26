import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menu } from '@northstar-js/react';
import { Backdrop } from '../interactions/backdrop';

const meta = { title: 'Overlays/Menu' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger className="ns-button ns-size-md">Actions</Menu.Trigger>
      <Menu.Content>
        <Menu.Label>Study</Menu.Label>
        <Menu.Item shortcut="R">Rename</Menu.Item>
        <Menu.Item shortcut="D">Duplicate</Menu.Item>
        <Menu.Item disabled>Export (running)</Menu.Item>
        <Menu.Separator />
        <Menu.Item>Archive</Menu.Item>
      </Menu.Content>
    </Menu.Root>
  ),
};

export const Glass: Story = {
  render: () => (
    <Backdrop minHeight={300}>
      <Menu.Root defaultOpen>
        <Menu.Trigger className="ns-button ns-button--secondary ns-button--glass ns-size-md">Actions</Menu.Trigger>
        <Menu.Content material="glass">
          <Menu.Label>Study</Menu.Label>
          <Menu.Item shortcut="R">Rename</Menu.Item>
          <Menu.Item shortcut="D">Duplicate</Menu.Item>
          <Menu.Separator />
          <Menu.Item>Archive</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    </Backdrop>
  ),
};
