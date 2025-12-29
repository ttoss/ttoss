import type { BoxProps } from '@ttoss/ui';
import { Box } from '@ttoss/ui';

export const MainBody = (props: BoxProps) => {
  return (
    <Box
      variant="layout.main.body"
      {...props}
      as="main"
      sx={{
        overflowY: 'auto',
        width: 'full',
        height: 'full',
        ...props.sx,
      }}
    >
      {props.children}
    </Box>
  );
};

MainBody.displayName = 'MainBody';
