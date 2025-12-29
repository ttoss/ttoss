import type { BoxProps } from '@ttoss/ui';
import { Box } from '@ttoss/ui';

export const MainHeader = (props: BoxProps) => {
  return (
    <Box
      variant="layout.main.header"
      {...props}
      as="header"
      sx={{
        borderBottom: 'sm',
        borderColor: 'display.border.muted.default',
        backgroundColor: 'navigation.background.primary.default',
        width: 'full',
        ...props.sx,
      }}
    >
      {props.children}
    </Box>
  );
};

MainHeader.displayName = 'MainHeader';
