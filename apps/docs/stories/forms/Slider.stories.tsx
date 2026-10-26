import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider, Field } from '@northstar-js/react';

const meta = { title: 'Forms/Slider' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Field label="Sample size" style={{ maxWidth: 320 }}>
      <Slider min={50} max={500} step={50} defaultValue={300} />
    </Field>
  ),
};
