import type { BoxProps } from '@ttoss/ui';
import { Box } from '@ttoss/ui';

export const Footer = (props: BoxProps) => {
  return (
    <Box variant="layout.footer" {...props} as="footer">
      {props.children}
    </Box>
  );
};

Footer.displayName = 'Footer';
