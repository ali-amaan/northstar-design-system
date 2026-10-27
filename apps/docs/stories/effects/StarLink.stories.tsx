import type { Meta, StoryObj } from '@storybook/react-vite';
import { StarLink } from '@northstar-js/react/effects';

const meta = { title: 'Effects/StarLink', component: StarLink } satisfies Meta<typeof StarLink>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Hover or tab to a link: the underline is traced from the left like a meridian and a north star twinkles in beside it. */
export const Default: Story = {
  args: { href: '#method', children: 'method note' },
  render: (args) => (
    <p style={{ maxWidth: 520, color: 'var(--ns-color-text-2)' }}>
      Shares are raked to published margins; read the <StarLink {...args} /> or the <StarLink href="#bands" tone="neutral">reliability bands</StarLink> before quoting a level.
    </p>
  ),
};

export const External: Story = { args: { href: 'https://example.org', external: true, children: 'Statistics Finland tables' } };
