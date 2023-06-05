import { Box, BoxProps } from '@ttoss/ui';

export const Main = (props: BoxProps) => {
  return (
    <Box variant="layout.main" {...props} as="main">
      {props.children}
    </Box>
  );
};

Main.displayName = 'Main';
