import { Box, BoxProps } from '@ttoss/ui';

// eslint-disable-next-line react-refresh/only-export-components
export * from '@tanstack/react-table';

export const Table = (props: BoxProps) => {
  return <Box as="table" {...props} />;
};

export const TableHead = (props: BoxProps) => {
  return <Box as="thead" {...props} />;
};

export const TableBody = (props: BoxProps) => {
  return <Box as="tbody" {...props} />;
};

export const TableRow = (props: BoxProps) => {
  return <Box as="tr" {...props} />;
};

export const TableCell = (props: BoxProps) => {
  return <Box as="td" {...props} />;
};

export const TableHeader = (props: BoxProps) => {
  return <Box as="th" {...props} />;
};

export const TableCaption = (props: BoxProps) => {
  return <Box as="caption" {...props} />;
};

export const TableFooter = (props: BoxProps) => {
  return <Box as="tfoot" {...props} />;
};
