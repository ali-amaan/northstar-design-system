import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from '@northstar-js/react';

const meta = { title: 'Navigation/Tabs' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const StudyTabs: Story = {
  render: () => (
    <Tabs.Root defaultValue="brief">
      <Tabs.List label="Study">
        <Tabs.Trigger value="brief">Brief</Tabs.Trigger>
        <Tabs.Trigger value="population">Population</Tabs.Trigger>
        <Tabs.Trigger value="research">Research</Tabs.Trigger>
        <Tabs.Trigger value="responses" disabled>Responses</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="brief">Brief content</Tabs.Content>
      <Tabs.Content value="population">Population content</Tabs.Content>
      <Tabs.Content value="research">Research content</Tabs.Content>
      <Tabs.Content value="responses">Responses content</Tabs.Content>
    </Tabs.Root>
  ),
};
export const Vertical: Story = {
  render: () => (
    <Tabs.Root defaultValue="a" orientation="vertical">
      <Tabs.List label="Settings">
        <Tabs.Trigger value="a">General</Tabs.Trigger>
        <Tabs.Trigger value="b">Members</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="a">General settings</Tabs.Content>
      <Tabs.Content value="b">Members</Tabs.Content>
    </Tabs.Root>
  ),
};
