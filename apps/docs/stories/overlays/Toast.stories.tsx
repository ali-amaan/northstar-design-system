import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toast, Button, Stack, toast } from '@northstar-js/react';
import { Backdrop } from '../interactions/backdrop';

const meta = { title: 'Overlays/Toast' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Static: Story = {
  render: () => (
    <Stack gap={8}>
      <Toast title="Study saved" onDismiss={() => {}} />
      <Toast tone="signal" title="Run queued" description="[N] respondents" action={{ label: 'View', onClick: () => {} }} onDismiss={() => {}} />
    </Stack>
  ),
};
export const Toaster: Story = {
  render: () => <Button onClick={() => toast({ title: 'Study saved', description: 'Draft [NAME]' })}>Show toast</Button>,
};

export const Glass: Story = {
  render: () => (
    <Backdrop minHeight={260}>
      <Stack gap={8}>
        <Toast material="glass" title="Study saved" onDismiss={() => {}} />
        <Toast material="glass" tone="signal" title="Run queued" description="[N] respondents" action={{ label: 'View', onClick: () => {} }} onDismiss={() => {}} />
        <Button material="glass" onClick={() => toast({ title: 'Study saved', description: 'Draft [NAME]', material: 'glass' })}>Show glass toast</Button>
      </Stack>
    </Backdrop>
  ),
};
