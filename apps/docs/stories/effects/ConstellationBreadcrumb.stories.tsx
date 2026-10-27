import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConstellationBreadcrumb } from '@northstar-js/react/effects';

const meta = { title: 'Effects/ConstellationBreadcrumb', component: ConstellationBreadcrumb } satisfies Meta<typeof ConstellationBreadcrumb>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A path of stars, brightening toward the current page. Hover or focus a crumb to light its star. */
export const Default: Story = {
  args: {
    items: [
      { label: 'Workspace', href: '#' },
      { label: 'Studies', href: '#' },
      { label: 'Autumn pilot', href: '#' },
      { label: 'Results' },
    ],
  },
};
