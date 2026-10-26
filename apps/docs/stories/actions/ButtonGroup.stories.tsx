import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGroup, Button, Stack } from '@northstar-js/react';

const meta = { title: 'Actions/ButtonGroup' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Stack gap={16}>
      <ButtonGroup label="View" attached>
        <Button>List</Button>
        <Button>Board</Button>
        <Button>Map</Button>
      </ButtonGroup>
      <ButtonGroup label="Actions">
        <Button>Cancel</Button>
        <Button variant="primary">Save</Button>
      </ButtonGroup>
    </Stack>
  ),
};
