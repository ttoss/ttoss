/**
 * Table — semantic data table (Collection container + Selection rows).
 *
 * Verifies grid/columnheader/row/rowheader roles, controlled sorting
 * (aria-sort + direction indicator), row-click selection, keyboard
 * navigation between rows, and disabled rows.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import type { SortDescriptor } from 'react-aria-components';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from 'src/index';

const PEOPLE = [
  { id: 'ada', name: 'Ada Lovelace', role: 'Admin' },
  { id: 'grace', name: 'Grace Hopper', role: 'Editor' },
  { id: 'alan', name: 'Alan Turing', role: 'Viewer' },
];

const StaticTable = (props: React.ComponentProps<typeof Table>) => {
  return (
    <Table aria-label="Team" {...props}>
      <TableHeader>
        <TableColumn id="name" isRowHeader>
          Name
        </TableColumn>
        <TableColumn id="role">Role</TableColumn>
      </TableHeader>
      <TableBody>
        {PEOPLE.map((person) => {
          return (
            <TableRow key={person.id} id={person.id}>
              <TableCell>{person.name}</TableCell>
              <TableCell>{person.role}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

const SortableTable = () => {
  const [sort, setSort] = React.useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });

  const sorted = [...PEOPLE].sort((a, b) => {
    const order = a.name.localeCompare(b.name);
    return sort.direction === 'descending' ? -order : order;
  });

  return (
    <Table aria-label="Team" sortDescriptor={sort} onSortChange={setSort}>
      <TableHeader>
        <TableColumn id="name" isRowHeader allowsSorting>
          Name
        </TableColumn>
        <TableColumn id="role">Role</TableColumn>
      </TableHeader>
      <TableBody>
        {sorted.map((person) => {
          return (
            <TableRow key={person.id} id={person.id}>
              <TableCell>{person.name}</TableCell>
              <TableCell>{person.role}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

describe('Table', () => {
  test('exposes grid / columnheader / row / rowheader roles', () => {
    render(<StaticTable />);
    expect(screen.getByRole('grid', { name: 'Team' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    // 1 header row + 3 data rows.
    expect(screen.getAllByRole('row')).toHaveLength(4);
    expect(
      screen.getByRole('rowheader', { name: 'Ada Lovelace' })
    ).toBeInTheDocument();
  });

  test('sorting: clicking a sortable header flips aria-sort and reorders', async () => {
    const user = userEvent.setup();
    render(<SortableTable />);

    const nameHeader = screen.getByRole('columnheader', { name: /Name/ });
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    const firstRowBefore = screen.getAllByRole('rowheader')[0];
    expect(firstRowBefore).toHaveTextContent('Ada Lovelace');

    await user.click(nameHeader);

    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getAllByRole('rowheader')[0]).toHaveTextContent(
      'Grace Hopper'
    );
  });

  test('a non-sortable header exposes no sort semantics', () => {
    render(<SortableTable />);
    expect(
      screen.getByRole('columnheader', { name: 'Role' })
    ).not.toHaveAttribute('aria-sort');
  });

  test('row-click selection surfaces the selected State', async () => {
    const user = userEvent.setup();
    render(<StaticTable selectionMode="single" />);

    const adaRow = screen.getByRole('row', { name: /Ada Lovelace/ });
    await user.click(adaRow);
    expect(adaRow).toHaveAttribute('aria-selected', 'true');

    const graceRow = screen.getByRole('row', { name: /Grace Hopper/ });
    await user.click(graceRow);
    expect(graceRow).toHaveAttribute('aria-selected', 'true');
    expect(adaRow).toHaveAttribute('aria-selected', 'false');
  });

  test('keyboard: arrow keys move focus between rows', async () => {
    const user = userEvent.setup();
    render(<StaticTable selectionMode="single" />);

    await user.tab(); // focus lands in the grid
    await user.keyboard('[ArrowDown]');

    const rows = screen.getAllByRole('row');
    // rows[0] is the header row; ArrowDown from the first data row lands on
    // the second.
    expect(rows[2]).toHaveFocus();
  });

  test('a disabled row is not selectable', async () => {
    const user = userEvent.setup();
    render(
      <Table aria-label="Team" selectionMode="single" disabledKeys={['ada']}>
        <TableHeader>
          <TableColumn id="name" isRowHeader>
            Name
          </TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow id="ada">
            <TableCell>Ada Lovelace</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const row = screen.getByRole('row', { name: 'Ada Lovelace' });
    await user.click(row);
    expect(row).not.toHaveAttribute('aria-selected', 'true');
  });
});
