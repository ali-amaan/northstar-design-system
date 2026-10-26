import type { Meta, StoryObj } from '@storybook/react-vite';
import { Banner, Button, Stack } from '@northstar-js/react';

const meta = { title: 'Overlays/Banner' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Tones: Story = {
  render: () => (
    <Stack gap={8}>
      <Banner title="Cost unavailable">The estimate appears once the backend can price a run.</Banner>
      <Banner tone="signal" title="Population locked" actions={<Button size="sm">Unlock</Button>} onDismiss={() => {}} />
      <Banner urgent title="Run failed">Shape and label carry the status, never red.</Banner>
    </Stack>
  ),
};
