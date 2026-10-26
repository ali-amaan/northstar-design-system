import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState, Button } from '@northstar-js/react';

const meta = { title: 'Data display/EmptyState' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <EmptyState title="No studies yet" description="Create a study to brief the panel." action={<Button variant="primary">New study</Button>} />,
};
