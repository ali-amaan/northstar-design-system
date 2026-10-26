import type { Meta, StoryObj } from '@storybook/react-vite';
import { List, ListItem, Badge, Avatar } from '@northstar-js/react';

const meta = { title: 'Data display/List' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <List style={{ maxWidth: 420 }}>
      <ListItem start={<Avatar name="Ada Lovelace" />} title="Ada Lovelace" description="Owner" end={<Badge>3</Badge>} />
      <ListItem start={<Avatar name="Grace Hopper" />} title="Grace Hopper" description="Editor" />
      <ListItem start={<Avatar name="Alan Turing" />} title="Alan Turing" description="Viewer" />
    </List>
  ),
};
