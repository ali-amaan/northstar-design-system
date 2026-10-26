import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch, Stack } from '@northstar-js/react';

const meta = { title: 'Forms/Switch' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Stack gap={8}>
      <Switch>Notify when complete</Switch>
      <Switch defaultChecked>Show bands</Switch>
      <Switch disabled>Disabled</Switch>
    </Stack>
  ),
};

/** The thumb stretches on press and springs across on release. */
export const Spring: Story = {
  render: () => (
    <Stack gap={12}>
      <Switch defaultChecked>Live updates</Switch>
      <Switch>Show raw answers</Switch>
    </Stack>
  ),
};
