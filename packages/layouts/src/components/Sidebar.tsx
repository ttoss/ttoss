import { Drawer } from '@ttoss/components/Drawer';
import { Icon } from '@ttoss/react-icons';
import { Box, BoxProps, Flex, IconButton } from '@ttoss/ui';
import * as React from 'react';

import { useIsDesktop } from '../useIsDesktop';
import { useLayout } from './LayoutProvider';

export const SIDEBAR_WIDTH = '2xs';

export const Sidebar = ({
  drawerSlot,
  showSidebarButtonInDrawer,
  children,
  ...boxProps
}: BoxProps & {
  showSidebarButtonInDrawer?: boolean;
  drawerSlot?: React.ReactNode;
}) => {
  const { isSidebarOpen, toggleSidebar } = useLayout();
  const { isDesktop } = useIsDesktop();

  const sidebarButtonInDrawer = React.useMemo(() => {
    if (!showSidebarButtonInDrawer) {
      return null;
    }

    return (
      <IconButton
        aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        aria-expanded={isSidebarOpen}
        aria-controls="sidebar"
        sx={{
          cursor: 'pointer',
          fontSize: ['xl', '2xl'],
        }}
        data-testid="sidebar-button"
      >
        <Icon icon={isSidebarOpen ? 'sidebar-close' : 'sidebar-open'} />
      </IconButton>
    );
  }, [isSidebarOpen, showSidebarButtonInDrawer]);

  const memoizedDrawerSlot = React.useMemo(() => {
    if (!drawerSlot) {
      return <>{sidebarButtonInDrawer}</>;
    }

    return (
      <Flex
        sx={{
          width: 'full',
          paddingY: '3',
          borderBottom: 'sm',
          borderColor: 'display.border.muted.default',
          alignItems: 'center',
          gap: '2',
        }}
      >
        {sidebarButtonInDrawer}
        <Flex sx={{ minWidth: SIDEBAR_WIDTH, width: SIDEBAR_WIDTH }}>
          {drawerSlot}
        </Flex>
      </Flex>
    );
  }, [drawerSlot, sidebarButtonInDrawer]);

  return (
    <>
      {isDesktop ? (
        <Box
          role="complementary"
          aria-label="Sidebar"
          aria-hidden={!isSidebarOpen}
          sx={{
            position: 'relative',
            zIndex: 'overlay',
            height: 'full',
            minHeight: isSidebarOpen ? 'full' : '0',
            width: isSidebarOpen ? SIDEBAR_WIDTH : '0',
            minWidth: isSidebarOpen ? SIDEBAR_WIDTH : '0',
            opacity: isSidebarOpen ? 1 : 0,
            transition: 'width 0.5s ease, opacity 0.5s ease',
            borderRight: isSidebarOpen ? 'sm' : 'none',
            borderColor: 'display.border.muted.default',
            backgroundColor: 'navigation.background.muted.default',
            paddingX: isSidebarOpen ? '6' : '0',
            paddingY: isSidebarOpen ? '6' : '0',
            overflowY: 'auto',
            ...boxProps.sx,
          }}
        >
          {isSidebarOpen ? children : null}
        </Box>
      ) : (
        <Box
          role="complementary"
          aria-label="Sidebar"
          aria-hidden={!isSidebarOpen}
          sx={{
            position: 'fixed',
            zIndex: 'overlay',
            border: 'none',
            width: isSidebarOpen ? 'full' : '0',
            height: isSidebarOpen ? 'full' : '0',
            ...boxProps.sx,
          }}
          onClick={() => {
            if (isSidebarOpen) {
              toggleSidebar();
            }
          }}
        >
          <Drawer
            open={isSidebarOpen}
            direction={'left'}
            size={'100%'}
            enableOverlay={false}
          >
            <Flex
              sx={{
                width: 'full',
                height: 'full',
                gap: '6',
                flexDirection: 'column',
              }}
            >
              {memoizedDrawerSlot}
              {isSidebarOpen ? children : null}
            </Flex>
          </Drawer>
        </Box>
      )}
    </>
  );
};

Sidebar.displayName = 'Sidebar';
