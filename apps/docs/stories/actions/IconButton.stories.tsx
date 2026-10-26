import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton, Stack } from '@northstar-js/react';

const meta = { title: 'Actions/IconButton' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const Gear = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="8" cy="8" r="2.5" /><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2" /></svg>;
export const Default: Story = {
  render: () => (
    <Stack direction="row" gap={8}>
      <IconButton label="Settings" icon={<Gear />} size="sm" />
      <IconButton label="Settings" icon={<Gear />} />
      <IconButton label="Settings" icon={<Gear />} variant="ghost" />
      <IconButton label="Settings" icon={<Gear />} disabled />
    </Stack>
  ),
};
