import type { BoxProps } from '@ttoss/ui';
import { Box } from '@ttoss/ui';

export const MainFooter = (props: BoxProps) => {
  return (
    <Box
      variant="layout.main.footer"
      {...props}
      sx={{
        borderTop: 'sm',
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

MainFooter.displayName = 'MainFooter';
