import type { Meta, StoryObj } from '@storybook/react-vite';
import { NorthstarProvider, useNorthstar, Stack, Badge } from '@northstar-js/react';

const meta = { title: 'Foundations/NorthstarProvider' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Probe() {
  const ns = useNorthstar();
  return (
    <Stack direction="row" gap={8}>
      <Badge>theme: {ns.resolvedTheme}</Badge>
      <Badge>density: {ns.density}</Badge>
      <Badge>close: {ns.messages.close}</Badge>
    </Stack>
  );
}
export const Default: Story = { render: () => <Probe /> };
export const NestedDay: Story = {
  name: 'Nested Day surface',
  render: () => (
    <NorthstarProvider theme="day" style={{ padding: 16, borderRadius: 8 }} messages={{ close: 'Sulje' }}>
      <Probe />
    </NorthstarProvider>
  ),
};
