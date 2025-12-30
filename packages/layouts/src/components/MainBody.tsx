import type { BoxProps } from '@ttoss/ui';
import { Box, Container } from '@ttoss/ui';

export type MainBodyProps = BoxProps & {
  containerSx?: BoxProps['sx'];
};

export const MainBody = ({ containerSx, ...props }: MainBodyProps) => {
  return (
    <Box
      variant="layout.main.body"
      {...props}
      as="main"
      sx={{
        width: 'full',
        flex: 1,
        ...props.sx,
      }}
    >
      <Container
        variant="layout.container"
        data-testid="main-body-container"
        sx={{
          ...containerSx,
        }}
      >
        {props.children}
      </Container>
    </Box>
  );
};

MainBody.displayName = 'MainBody';
