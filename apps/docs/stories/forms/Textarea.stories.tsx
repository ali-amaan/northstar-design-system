import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea, Field } from '@northstar-js/react';

const meta = { title: 'Forms/Textarea' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Field label="Brief" description="What should the panel be asked?" style={{ maxWidth: 420 }}>
      <Textarea rows={4} placeholder="Describe the question battery" />
    </Field>
  ),
};
