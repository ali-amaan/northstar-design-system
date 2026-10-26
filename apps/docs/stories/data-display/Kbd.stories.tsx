import type { Meta, StoryObj } from '@storybook/react-vite';
import { Kbd } from '@northstar-js/react';

const meta = { title: 'Data display/Kbd' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <p>Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search.</p> };
