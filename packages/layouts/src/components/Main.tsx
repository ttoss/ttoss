import type { BoxProps } from '@ttoss/ui';
import { Box, Container } from '@ttoss/ui';

import { MainBody } from './MainBody';
import { MainFooter } from './MainFooter';
import { MainHeader } from './MainHeader';

export const Main = (props: BoxProps) => {
  return (
    <Box
      variant="layout.main"
      sx={{
        overflowX: 'auto',
        flex: 1,
      }}
    >
      <Container
        variant="layout.container"
        sx={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {props.children}
      </Container>
    </Box>
  );
};

Main.displayName = 'Main';

Main.Header = MainHeader;
Main.Body = MainBody;
Main.Footer = MainFooter;
