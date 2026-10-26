import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, Tag } from '@northstar-js/react';

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
