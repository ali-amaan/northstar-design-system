import type { Meta, StoryObj } from '@storybook/react-vite';
import { NumberInput, Field } from '@northstar-js/react';

const meta = { title: 'Forms/NumberInput' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Field label="Respondents" description="Between 50 and 500." style={{ maxWidth: 200 }}>
      <NumberInput min={50} max={500} step={10} defaultValue={300} />
    </Field>
  ),
};
