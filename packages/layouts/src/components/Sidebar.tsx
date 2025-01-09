import { Box, BoxProps } from '@ttoss/ui';

import { useLayout } from './LayoutProvider';

export const SIDEBAR_WIDTH = '2xs';

export const Sidebar = (props: BoxProps) => {
  const { isSidebarOpen } = useLayout();

  return (
    <Box
      role="complementary"
      aria-label="Sidebar"
      aria-hidden={!isSidebarOpen}
      sx={{
        height: 'full',
        minWidth: isSidebarOpen ? SIDEBAR_WIDTH : '0',
        width: isSidebarOpen ? SIDEBAR_WIDTH : '0',
        opacity: isSidebarOpen ? 1 : 0,
        transition: 'min-width 0.5s ease, width 0.5s ease, opacity 0.5s ease',
        borderRight: isSidebarOpen ? 'sm' : 'none',
        borderColor: 'display.border.muted.default',
        backgroundColor: 'navigation.background.muted.default',
        paddingX: isSidebarOpen ? '2' : '0',
        paddingY: '9',
        ...props.sx,
      }}
    >
      {isSidebarOpen ? props.children : null}
    </Box>
  );
};

Sidebar.displayName = 'Sidebar';
