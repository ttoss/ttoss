import { Drawer } from '@ttoss/components/Drawer';
import { Box, BoxProps } from '@ttoss/ui';

import { useIsDesktop } from '../useIsDesktop';
import { useLayout } from './LayoutProvider';

export const SIDEBAR_WIDTH = '2xs';

export const Sidebar = (props: BoxProps) => {
  const { isSidebarOpen, toggleSidebar } = useLayout();
  const { isDesktop } = useIsDesktop();

  return (
    <>
      {isDesktop ? (
        <Box
          role="complementary"
          aria-label="Sidebar"
          aria-hidden={!isSidebarOpen}
          sx={{
            position: 'relative',
            zIndex: 'dropdown',
            height: 'full',
            minHeight: isSidebarOpen ? 'full' : '0',
            width: isSidebarOpen ? SIDEBAR_WIDTH : '0',
            minWidth: isSidebarOpen ? SIDEBAR_WIDTH : '0',
            opacity: isSidebarOpen ? 1 : 0,
            transition: 'width 0.5s ease, opacity 0.5s ease',
            borderRight: isSidebarOpen ? 'sm' : 'none',
            borderColor: 'display.border.muted.default',
            backgroundColor: 'navigation.background.muted.default',
            paddingX: isSidebarOpen ? '3' : '0',
            paddingY: isSidebarOpen ? '10' : '0',

            ...props.sx,
          }}
        >
          {isSidebarOpen ? props.children : null}
        </Box>
      ) : (
        <Box
          role="complementary"
          aria-label="Sidebar"
          aria-hidden={!isSidebarOpen}
          sx={{
            border: 'none',
            position: 'fixed',
            width: 'full',
            ...props.sx,
          }}
          onClick={() => {
            if (isSidebarOpen) {
              toggleSidebar();
            }
          }}
        >
          <Drawer open={isSidebarOpen} direction={'left'} size={'min'}>
            {isSidebarOpen ? props.children : null}
          </Drawer>
        </Box>
      )}
    </>
  );
};

Sidebar.displayName = 'Sidebar';
