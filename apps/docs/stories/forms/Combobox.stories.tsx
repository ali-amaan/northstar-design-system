import type { Meta, StoryObj } from '@storybook/react-vite';
import { Combobox, Field } from '@northstar-js/react';

const meta = { title: 'Forms/Combobox' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const options = ['Finland', 'Japan', 'Sweden', 'Norway', 'Denmark', 'Estonia', 'United States'].map((l) => ({ value: l.slice(0, 2).toUpperCase(), label: l }));
export const Default: Story = {
  render: () => (
    <Field label="Country" style={{ maxWidth: 280 }}>
      <Combobox options={options} placeholder="Type to filter" />
    </Field>
  ),
};
