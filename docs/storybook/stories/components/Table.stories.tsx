import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  Table,
  useReactTable,
} from '@ttoss/components/Table';
import * as React from 'react';

const meta: Meta = {
  title: 'Components/Table',
  parameters: {
    docs: {
      description: {
        component:
          'Flexible table component built on TanStack Table with support for sorting, filtering, pagination, and custom rendering. Fully theme-integrated with responsive design.',
      },
    },
  },
  tags: ['autodocs'],
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
      <Table.Head>
        {table.getHeaderGroups().map((headerGroup) => {
          return (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <Table.Header key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </Table.Header>
                );
              })}
            </Table.Row>
          );
        })}
      </Table.Head>
      <Table.Body>
        {table.getRowModel().rows.map((row) => {
          return (
            <Table.Row key={row.id}>
              {row.getVisibleCells().map((cell) => {
                return (
                  <Table.Cell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                );
              })}
            </Table.Row>
          );
        })}
      </Table.Body>
      <Table.Footer>
        {table.getFooterGroups().map((footerGroup) => {
          return (
            <Table.Row key={footerGroup.id}>
              {footerGroup.headers.map((header) => {
                return (
                  <Table.Header key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.footer,
                          header.getContext()
                        )}
                  </Table.Header>
                );
              })}
            </Table.Row>
          );
        })}
      </Table.Footer>
    </Table>
  );
};

export const Example: StoryObj = {
  render: RenderTable,
  parameters: {
    docs: {
      description: {
        story:
          'Basic table example with TanStack Table integration. Shows header, body, and footer sections with custom column definitions and data rendering.',
      },
    },
  },
};
