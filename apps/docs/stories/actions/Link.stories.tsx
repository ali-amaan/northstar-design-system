import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link, Stack } from '@northstar-js/react';

const meta = { title: 'Actions/Link' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Stack gap={8}>
      <p>Read the <Link href="#method">method note</Link> before running.</p>
      <Link href="#neutral" tone="neutral">Neutral link</Link>
      <Link href="https://example.org" external>External link</Link>
    </Stack>
  ),
};

/** The underline draws in from the left on hover and keyboard focus. */
export const Underline: Story = {
  render: () => (
    <p style={{ maxWidth: 520, color: 'var(--ns-color-text-2)' }}>
      Shares are measured against published figures; read the <Link href="#">method note</Link> or the <Link href="#" tone="neutral">reliability bands</Link> before quoting a level.
    </p>
  ),
};
