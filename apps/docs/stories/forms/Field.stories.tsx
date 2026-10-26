import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field, Input, Stack } from '@northstar-js/react';

const meta = { title: 'Forms/Field' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const States: Story = {
  render: () => (
    <Stack gap={16} style={{ maxWidth: 320 }}>
      <Field label="Study name" description="Shown to your workspace."><Input placeholder="[NAME]" /></Field>
      <Field label="Seed" required error="Enter a whole number."><Input defaultValue="abc" /></Field>
      <Field label="Locked" disabled><Input defaultValue="FI" /></Field>
    </Stack>
  ),
};
