import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select, Field } from '@northstar-js/react';

const meta = { title: 'Forms/Select' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Field label="Market" style={{ maxWidth: 240 }}>
      <Select placeholder="Choose a market" options={[{ value: 'FI', label: 'Finland' }, { value: 'JP', label: 'Japan' }, { value: 'US', label: 'United States', disabled: true }]} />
    </Field>
  ),
};
