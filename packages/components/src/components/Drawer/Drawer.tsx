import * as React from 'react';
import { Box, type BoxProps } from '@ttoss/ui';
import { css as createClassName } from '@emotion/css';
import DrawerUi from 'react-modern-drawer';

type DrawerUiProps = React.ComponentProps<typeof DrawerUi>;

export type DrawerProps = DrawerUiProps & {
  sx?: BoxProps['sx'];
};

/**
 * https://github.com/Farzin-Firoozi/react-modern-drawer/blob/master/src/styles.css
 */
const reactModernDrawerClassName = createClassName(`
.EZDrawer .EZDrawer__checkbox {
    display: none;
}
.EZDrawer .EZDrawer__checkbox:checked ~ .EZDrawer__overlay {
    display: block;
    opacity: 1;
}
.EZDrawer .EZDrawer__checkbox:checked ~ .EZDrawer__container {
    visibility: visible;
    transform: translate3d(0, 0, 0) !important;
}
.EZDrawer .EZDrawer__overlay {
    display: none;
    height: 100vh;
    left: 0;
    position: fixed;
    top: 0;
    width: 100%;
}
.EZDrawer .EZDrawer__container {
    position: fixed;
    visibility: hidden;
    background: white;
    transition: all;
    box-shadow: 0 0 10px 5px rgba(0, 0, 0, 0.1);
}`);

export const Drawer = ({ children, sx, ...props }: DrawerProps) => {
  return (
    <DrawerUi {...props} className={reactModernDrawerClassName}>
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
