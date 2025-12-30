import type { BoxProps } from '@ttoss/ui';
import { Box, Container } from '@ttoss/ui';

export type MainHeaderProps = BoxProps & {
  containerSx?: BoxProps['sx'];
};

export const MainHeader = ({ containerSx, ...props }: MainHeaderProps) => {
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
      <Container
        paddingY="3"
        variant="layout.container"
        data-testid="main-header-container"
        sx={containerSx}
      >
        {props.children}
      </Container>
    </Box>
  );
};

MainHeader.displayName = 'MainHeader';
