import { Box, BoxProps } from '@ttoss/ui';

export const Main = (props: BoxProps) => {
  return (
    <Box
      variant="layout.main"
      {...props}
      as="main"
      sx={{
        paddingX: '8',
        paddingY: '4',
        ...props.sx,
      }}
    >
      {props.children}
    </Box>
  );
};

Main.displayName = 'Main';
