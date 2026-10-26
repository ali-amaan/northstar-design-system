import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dialog, Button } from '@northstar-js/react';
import { Backdrop } from '../interactions/backdrop';

const meta = { title: 'Overlays/Dialog' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger className="ns-button ns-size-md">Lock population</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <div>
            <Dialog.Title>Lock the population?</Dialog.Title>
            <Dialog.Description>The roster is fixed for every run of this study.</Dialog.Description>
          </div>
          <Dialog.Close />
        </Dialog.Header>
        <Dialog.Body>[N] agents, seed [SEED].</Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close className="ns-button ns-size-md">Cancel</Dialog.Close>
          <Button variant="primary">Lock</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  ),
};

export const Glass: Story = {
  render: () => (
    <Backdrop minHeight={420}>
      <Dialog.Root defaultOpen>
        <Dialog.Trigger className="ns-button ns-size-md">Lock population</Dialog.Trigger>
        <Dialog.Content material="glass">
          <Dialog.Header>
            <div>
              <Dialog.Title>Lock the population?</Dialog.Title>
              <Dialog.Description>The roster is fixed for every run of this study.</Dialog.Description>
            </div>
            <Dialog.Close />
          </Dialog.Header>
          <Dialog.Body>[N] agents, seed [SEED].</Dialog.Body>
          <Dialog.Footer>
            <Dialog.Close className="ns-button ns-button--secondary ns-button--glass ns-size-md">Cancel</Dialog.Close>
            <Button variant="primary">Lock</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </Backdrop>
  ),
};
