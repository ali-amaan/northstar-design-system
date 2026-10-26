import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, Tag, Link } from '@northstar-js/react';

const meta = { title: 'Data display/Table' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const rows = [['Option A', '[SHARE]', 'Level'], ['Option B', '[SHARE]', 'Ranking'], ['Option C', '[SHARE]', 'Direction']];
export const Default: Story = {
  render: () => (
    <Table caption="Shares by option">
      <TableHead>
        <TableRow>
          <TableHeaderCell>Option</TableHeaderCell>
          <TableHeaderCell numeric sort="descending" onSort={() => {}}>Share</TableHeaderCell>
          <TableHeaderCell>Claim</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map(([a, b, c], i) => (
          <TableRow key={a} selected={i === 0}>
            <TableCell>{a}</TableCell>
            <TableCell numeric>{b}</TableCell>
            <TableCell><Tag>{c}</Tag></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

/** Rows lift on hover and when a link inside has keyboard focus. */
export const Interactive: Story = {
  render: () => (
    <Table interactive caption="Studies">
      <TableHead>
        <TableRow>
          <TableHeaderCell>Study</TableHeaderCell>
          <TableHeaderCell numeric>Agents</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {['Weekday lunch', 'Commuting', 'Streaming'].map((name) => (
          <TableRow key={name}>
            <TableCell><Link href="#" tone="neutral">{name}</Link></TableCell>
            <TableCell numeric>[N]</TableCell>
            <TableCell><Tag>Draft</Tag></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
