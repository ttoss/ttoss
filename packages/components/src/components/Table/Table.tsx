import { Box, BoxProps } from '@ttoss/ui';

export {
  createCell,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

export const Table = (props: BoxProps) => {
  return <Box as="table" {...props} />;
};

const TableHead = (props: BoxProps) => {
  return <Box as="thead" {...props} />;
};

const TableBody = (props: BoxProps) => {
  return <Box as="tbody" {...props} />;
};

const TableRow = (props: BoxProps) => {
  return <Box as="tr" {...props} />;
};

const TableCell = (props: BoxProps) => {
  return <Box as="td" {...props} />;
};

const TableHeader = (props: BoxProps) => {
  return <Box as="th" {...props} />;
};

const TableCaption = (props: BoxProps) => {
  return <Box as="caption" {...props} />;
};

const TableFooter = (props: BoxProps) => {
  return <Box as="tfoot" {...props} />;
};

Table.Head = TableHead;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Cell = TableCell;
Table.Header = TableHeader;
Table.Caption = TableCaption;
Table.Footer = TableFooter;
