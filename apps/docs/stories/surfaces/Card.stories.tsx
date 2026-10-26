import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Card, Grid, Link, Tag } from '@northstar-js/react';
import { Backdrop } from '../interactions/backdrop';

const meta = { title: 'Surfaces/Card' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <Backdrop>
      <Grid columns={{ min: 240 }} gap={20}>
        <Card title="Solid" description="The default. Opaque, quiet." actions={<Tag>Draft</Tag>} footer={<Button size="sm">Open</Button>}>
          [N] questions, [M] agents.
        </Card>
        <Card variant="glass" title="Glass" description="Translucent material over the page." footer={<Button size="sm" material="glass">Open</Button>}>
          [N] questions, [M] agents.
        </Card>
        <Card variant="spotlight" title="Spotlight" description="A glacier light follows the pointer." footer={<Button size="sm" variant="primary">Run</Button>}>
          [N] questions, [M] agents.
        </Card>
      </Grid>
    </Backdrop>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Backdrop>
      <Grid columns={{ min: 240 }} gap={20}>
        {['Weekday lunch', 'Commuting', 'Streaming'].map((name) => (
          <Card key={name} variant="spotlight" interactive title={<Link href="#" tone="neutral">{name}</Link>} description="Lifts on hover and on keyboard focus.">
            Status: draft
          </Card>
        ))}
      </Grid>
    </Backdrop>
  ),
};

export const Orbit: Story = {
  render: () => (
    <Backdrop>
      <Card variant="glass" orbit title="Run in progress" description="A short arc travels the border. It holds still under reduced motion." style={{ maxWidth: 380 }}>
        <Button variant="primary" loading>Running</Button>
      </Card>
    </Backdrop>
  ),
};
