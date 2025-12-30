import type { BoxProps } from '@ttoss/ui';
import { Box } from '@ttoss/ui';

import { MainBody } from './MainBody';
import { MainFooter } from './MainFooter';
import { MainHeader } from './MainHeader';

export const Main = (props: BoxProps) => {
  return (
    <Box
      sx={{
        overflowX: 'auto',
        overflowY: 'auto',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {props.children}
    </Box>
  );
};

Main.displayName = 'Main';

Main.Header = MainHeader;
Main.Body = MainBody;
Main.Footer = MainFooter;
