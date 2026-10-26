import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sheet, Field, Input, Button } from '@northstar-js/react';

const meta = { title: 'Overlays/Sheet' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Right: Story = {
  render: () => (
    <Sheet.Root>
      <Sheet.Trigger className="ns-button ns-size-md">Filters</Sheet.Trigger>
      <Sheet.Content side="right">
        <Sheet.Header><Sheet.Title>Filters</Sheet.Title><Sheet.Close /></Sheet.Header>
        <Sheet.Body><Field label="Name"><Input /></Field></Sheet.Body>
        <Sheet.Footer><Button variant="primary">Apply</Button></Sheet.Footer>
      </Sheet.Content>
    </Sheet.Root>
  ),
};
