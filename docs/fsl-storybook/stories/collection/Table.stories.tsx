import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SortDescriptor } from '@ttoss/fsl-ui';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@ttoss/fsl-ui';
import * as React from 'react';

const meta: Meta<typeof Table> = {
  title: 'Collection/Table',
  component: Table,
  subcomponents: { TableHeader, TableColumn, TableBody, TableRow, TableCell },
};

export default meta;

type Story = StoryObj<typeof Table>;

const MEMBERS = [
  { id: 'ada', name: 'Ada Lovelace', role: 'Admin' },
  { id: 'grace', name: 'Grace Hopper', role: 'Editor' },
  { id: 'annie', name: 'Annie Easley', role: 'Viewer' },
];

export const Default: Story = {
  render: () => {
    return (
      <Table aria-label="Team members">
        <TableHeader>
          <TableColumn id="name" isRowHeader>
            Name
          </TableColumn>
          <TableColumn id="role">Role</TableColumn>
        </TableHeader>
        <TableBody>
          {MEMBERS.map((member) => {
            return (
              <TableRow key={member.id} id={member.id}>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.role}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  },
};

const SortableExample = () => {
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });

  const sorted = [...MEMBERS].sort((a, b) => {
    const column = sortDescriptor.column as 'name' | 'role';
    const order = a[column].localeCompare(b[column]);
    return sortDescriptor.direction === 'descending' ? -order : order;
  });

  return (
    <Table
      aria-label="Team members, sortable"
      sortDescriptor={sortDescriptor}
      onSortChange={setSortDescriptor}
    >
      <TableHeader>
        <TableColumn id="name" isRowHeader allowsSorting>
          Name
        </TableColumn>
        <TableColumn id="role" allowsSorting>
          Role
        </TableColumn>
      </TableHeader>
      <TableBody>
        {sorted.map((member) => {
          return (
            <TableRow key={member.id} id={member.id}>
              <TableCell>{member.name}</TableCell>
              <TableCell>{member.role}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export const Sortable: Story = {
  render: () => {
    return <SortableExample />;
  },
};
