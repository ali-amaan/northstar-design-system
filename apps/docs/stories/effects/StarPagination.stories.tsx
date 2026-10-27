import type { Meta, StoryObj } from '@storybook/react-vite';
import { StarPagination } from '@northstar-js/react/effects';

const meta = { title: 'Effects/StarPagination', component: StarPagination } satisfies Meta<typeof StarPagination>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The current page is a star; dots at the edge of a long run thin out like a field toward the horizon. */
export const Default: Story = {
  args: { count: 24, defaultPage: 6 },
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <StarPagination {...args} />
      <StarPagination count={5} defaultPage={2} label="Short pagination" />
    </div>
  ),
};
