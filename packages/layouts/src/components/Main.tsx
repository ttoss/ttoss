import { BoxProps, Stack } from '@ttoss/ui';

import { MainBody } from './MainBody';
import { MainFooter } from './MainFooter';
import { MainHeader } from './MainHeader';

export const Main = (props: BoxProps) => {
  return (
    <Stack
      variant="layout.main"
      sx={{
        flex: 1,
        height: 'full',
        overflow: 'hidden',
      }}
    >
      {props.children}
    </Stack>
  );
};

Main.displayName = 'Main';

Main.Header = MainHeader;
Main.Body = MainBody;
Main.Footer = MainFooter;
