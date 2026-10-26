import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stale } from '@northstar-js/react';

const meta = { title: 'Data display/Stale' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Stale detail="refreshed [N] days ago" style={{ maxWidth: 320 }}>
      <p style={{ margin: 0 }}>[SHARE] of respondents chose [OPTION].</p>
    </Stale>
  ),
};
