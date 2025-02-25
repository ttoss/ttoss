import { Box, type BoxProps } from '@ttoss/ui';
import * as React from 'react';
import DrawerUi from 'react-modern-drawer';

type DrawerUiProps = React.ComponentProps<typeof DrawerUi>;

export type DrawerProps = DrawerUiProps & {
  sx?: BoxProps['sx'];
};

export const Drawer = ({ children, sx, ...props }: DrawerProps) => {
  return (
    <Box
      //className={reactModernDrawerClassName}
      sx={() => {
        /**
         * https://github.com/Farzin-Firoozi/react-modern-drawer/blob/master/src/styles.css
         */
        return {
          zIndex: 'dropdown',
          width: '100%',
          height: '100%',
          '.EZDrawer__checkbox': {
            display: 'none',
          },
          '.EZDrawer__checkbox:checked ~ .EZDrawer__overlay': {
            display: 'block',
            opacity: 1,
          },
          '.EZDrawer__checkbox:checked ~ .EZDrawer__container': {
            visibility: 'visible',
            transform: 'translate3d(0, 0, 0) !important',
          },
          '.EZDrawer__overlay ': {
            display: 'none',
            height: '100vh',
            left: '0',
            position: 'absolute',
            top: '0',
            width: '100%',
          },
          '.EZDrawer__container': {
            position: 'absolute',
            visibility: 'hidden',
            backgroundColor: 'navigation.background.muted.default',
            transition: 'all',
            boxShadow: '0 0 10px 5px rgba(0, 0, 0, 0.1)',
          },
        };
      }}
    >
      <DrawerUi {...props}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            paddingX: '6',
            paddingY: '6',
            ...sx,
          }}
        >
          {children}
        </Box>
      </DrawerUi>
    </Box>
  );
};
