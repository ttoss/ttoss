import { Icon } from '@ttoss/react-icons';
import { BoxProps, Flex } from '@ttoss/ui';
import * as React from 'react';

import { useLayout } from './LayoutProvider';
import { SIDEBAR_WIDTH } from './Sidebar';

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
      <Flex
        sx={{
          cursor: 'pointer',
          backgroundColor: 'navigation.background.muted.default',
          color: isSidebarOpen
            ? 'navigation.text.primary.default'
            : 'navigation.text.muted.default',
          width: 'min',
          borderRadius: 'full',
          paddingX: '1',
          paddingY: '1',
          marginRight: '5',
          fontSize: ['xl', '2xl'],
        }}
        onClick={toggleSidebar}
      >
        <Icon icon={isSidebarOpen ? 'menu-left-arrow' : 'menu-right-arrow'} />
      </Flex>
    );
  }, [isSidebarOpen, showSidebarButton, toggleSidebar]);

  const memoizedSidebarSlot = React.useMemo(() => {
    if (!sidebarSlot) {
      return <>{sidebarButton}</>;
    }

    return (
      <Flex
        sx={{
          width: SIDEBAR_WIDTH,
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
        flexDirection: 'row',
        alignItems: 'center',
        borderBottom: 'sm',
        borderColor: 'display.border.muted.default',
        paddingX: '5',
        paddingY: '3',
        ...boxProps.sx,
      }}
    >
      {memoizedSidebarSlot}
      {children}
    </Flex>
  );
};

Header.displayName = 'Header';
