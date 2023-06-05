import { Box, BoxProps } from '@ttoss/ui';

export const Header = (props: BoxProps) => {
  return (
    <Box variant="layout.header" {...props} as="header">
      {props.children}
    </Box>
  );
};

Header.displayName = 'Header';
