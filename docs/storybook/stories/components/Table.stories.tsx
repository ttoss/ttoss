import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@ttoss/components/table';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Components/Table',
};

export default meta;

type Person = {
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  status: string;
  progress: number;
};

const defaultData: Person[] = [
  {
    firstName: 'tanner',
    lastName: 'linsley',
    age: 24,
    visits: 100,
    status: 'In Relationship',
    progress: 50,
  },
  {
    firstName: 'tandy',
    lastName: 'miller',
    age: 40,
    visits: 40,
    status: 'Single',
    progress: 80,
  },
  {
    firstName: 'joe',
    lastName: 'dirte',
    age: 45,
    visits: 20,
    status: 'Complicated',
    progress: 10,
  },
];

const columnHelper = createColumnHelper<Person>();

const columns = [
  columnHelper.accessor('firstName', {
    cell: (info) => {
      return info.getValue();
    },
    footer: (info) => {
      return info.column.id;
    },
  }),
  columnHelper.accessor(
    (row) => {
      return row.lastName;
    },
    {
      id: 'lastName',
      cell: (info) => {
        return <i>{info.getValue()}</i>;
      },
      header: () => {
        return <span>Last Name</span>;
      },
      footer: (info) => {
        return info.column.id;
      },
    }
  ),
  columnHelper.accessor('age', {
    header: () => {
      return 'Age';
    },
    cell: (info) => {
      return info.renderValue();
    },
    footer: (info) => {
      return info.column.id;
    },
  }),
  columnHelper.accessor('visits', {
    header: () => {
      return <span>Visits</span>;
    },
    footer: (info) => {
      return info.column.id;
    },
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    footer: (info) => {
      return info.column.id;
    },
  }),
  columnHelper.accessor('progress', {
    header: 'Profile Progress',
    footer: (info) => {
      return info.column.id;
    },
  }),
];

const RenderTable = () => {
  const [data] = React.useState(() => {
    return [...defaultData];
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHead>
        {table.getHeaderGroups().map((headerGroup) => {
          return (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHeader key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHeader>
                );
              })}
            </TableRow>
          );
        })}
      </TableHead>
      <TableBody>
        {table.getRowModel().rows.map((row) => {
          return (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => {
                return (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        {table.getFooterGroups().map((footerGroup) => {
          return (
            <TableRow key={footerGroup.id}>
              {footerGroup.headers.map((header) => {
                return (
                  <TableHeader key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.footer,
                          header.getContext()
                        )}
                  </TableHeader>
                );
              })}
            </TableRow>
          );
        })}
      </TableFooter>
    </Table>
  );
};

export const Example: StoryObj = {
  render: RenderTable,
};
