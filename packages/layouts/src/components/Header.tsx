import { Icon } from '@ttoss/react-icons';
import { Box, BoxProps, Flex, IconButton } from '@ttoss/ui';
import * as React from 'react';

import { useIsDesktop } from '../useIsDesktop';
import { useLayout } from './LayoutProvider';
import { SIDEBAR_WIDTH } from './Sidebar';

const paddingSx = {
  paddingX: '4',
  paddingY: '3',
};

export const Header = ({
  showSidebarButton,
  sidebarSlot,
  children,
  ...boxProps
}: BoxProps & {
  showSidebarButton?: boolean;
  sidebarSlot?: React.ReactNode;
}) => {
  const { isSidebarOpen, toggleSidebar } = useLayout();
  const { isDesktop } = useIsDesktop();

  const sidebarButton = React.useMemo(() => {
    if (!showSidebarButton) {
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
        onClick={toggleSidebar}
      >
        <Icon icon={isSidebarOpen ? 'sidebar-close' : 'sidebar-open'} />
      </IconButton>
    );
  }, [isSidebarOpen, showSidebarButton, toggleSidebar]);

  const memoizedSidebarSlot = React.useMemo(() => {
    if (!sidebarSlot) {
      return <>{sidebarButton}</>;
    }

    return (
      <Flex
        sx={{
          minWidth: ['12rem', '3xs', SIDEBAR_WIDTH],
          width: ['12rem', '3xs', SIDEBAR_WIDTH],
          borderRight: isDesktop ? 'sm' : 'none',
          borderColor: 'display.border.muted.default',
          backgroundColor: 'red',
          alignItems: 'center',
          gap: '2',
          ...paddingSx,
        }}
      >
        {sidebarButton}
        {sidebarSlot}
      </Flex>
    );
  }, [isDesktop, sidebarButton, sidebarSlot]);

  return (
    <Flex
      variant="layout.header"
      {...boxProps}
      as="header"
      sx={{
        width: 'full',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottom: 'sm',
        borderColor: 'display.border.muted.default',
        backgroundColor: 'navigation.background.primary.default',
        ...(sidebarSlot ? {} : paddingSx),
        ...boxProps.sx,
      }}
    >
      {memoizedSidebarSlot}
      <Box
        sx={{
          width: 'full',
          display: ['flex', 'unset', 'unset'],
          justifyContent: ['center', 'unset', 'unset'],
          ...(sidebarSlot ? paddingSx : {}),
        }}
      >
        {children}
      </Box>
    </Flex>
  );
};

Header.displayName = 'Header';
