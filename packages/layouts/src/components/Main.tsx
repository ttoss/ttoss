import { Box, BoxProps } from '@ttoss/ui';

export const Main = (props: BoxProps) => {
  return (
    <Box
      variant="layout.main"
      {...props}
      as="main"
      sx={{
        ...props.sx,
      }}
    >
      {props.children}
    </Box>
  );
};

Main.displayName = 'Main';
