import * as React from 'react';
import { Box, type BoxProps } from '@ttoss/ui';
import DrawerUi from 'react-modern-drawer';

type DrawerUiProps = React.ComponentProps<typeof DrawerUi>;

import 'react-modern-drawer/dist/index.css';

export type DrawerProps = DrawerUiProps & {
  sx?: BoxProps['sx'];
};

export const Drawer = ({ children, sx, ...props }: DrawerProps) => {
  return (
    <DrawerUi {...props}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          ...sx,
        }}
      >
        {children}
      </Box>
    </DrawerUi>
  );
};
