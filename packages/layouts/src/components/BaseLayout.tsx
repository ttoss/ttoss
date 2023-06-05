import { Box, BoxProps } from '@ttoss/ui';

export const BaseLayout = (props: BoxProps) => {
  return (
    <Box variant="layout.layout" {...props}>
      {props.children}
    </Box>
  );
};
