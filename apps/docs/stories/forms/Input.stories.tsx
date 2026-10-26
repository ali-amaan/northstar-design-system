import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input, Field, Stack } from '@northstar-js/react';

const meta = { title: 'Forms/Input' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Sizes: Story = {
  render: () => (
    <Stack gap={12} style={{ maxWidth: 320 }}>
      <Field label="Small"><Input size="sm" placeholder="28px" /></Field>
      <Field label="Medium (follows density)"><Input placeholder="32px" /></Field>
      <Field label="Large"><Input size="lg" placeholder="36px" /></Field>
      <Field label="With unit"><Input end={<span>%</span>} defaultValue="42" /></Field>
    </Stack>
  ),
};

/** Focus brings a glacier glow; it is the same for pointer and keyboard. */
export const FocusGlow: Story = {
  render: () => (
    <Stack gap={12} style={{ maxWidth: 320 }}>
      <Field label="Study name">
        <Input defaultValue="Weekday lunch" autoFocus />
      </Field>
      <Field label="Seed" description="Fixes the roster">
        <Input placeholder="[SEED]" />
      </Field>
    </Stack>
  ),
};
