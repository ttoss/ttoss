import { Icon } from '@ttoss/react-icons';
import { Box, BoxProps, Flex, IconButton } from '@ttoss/ui';
import * as React from 'react';

import { useLayout } from './LayoutProvider';
import { SIDEBAR_WIDTH } from './Sidebar';

const paddingSx = {
  paddingX: ['2', '4', '4'],
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
          borderRight: ['none', 'sm', 'sm'],
          borderColor: 'display.border.muted.default',
          alignItems: 'center',
          gap: '2',
          ...paddingSx,
        }}
      >
        {sidebarButton}
        {sidebarSlot}
      </Flex>
    );
  }, [sidebarButton, sidebarSlot]);

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
          width: '100%',
          ...(sidebarSlot ? paddingSx : {}),
        }}
      >
        {children}
      </Box>
    </Flex>
  );
};

Header.displayName = 'Header';
