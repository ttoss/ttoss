import type { BoxProps } from '@ttoss/ui';
import { Box, Container } from '@ttoss/ui';

export type MainFooterProps = BoxProps & {
  containerSx?: BoxProps['sx'];
};

export const MainFooter = ({ containerSx, ...props }: MainFooterProps) => {
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
      <Container data-testid="main-footer-container" sx={containerSx}>
        {props.children}
      </Container>
    </Box>
  );
};

MainFooter.displayName = 'MainFooter';
