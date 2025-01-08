import { Box, BoxProps } from '@ttoss/ui';

import { useLayout } from './LayoutProvider';

export const SIDEBAR_WIDTH = '2xs';

export const Sidebar = (props: BoxProps) => {
  const { isSidebarOpen } = useLayout();
  return (
    <Box
      sx={{
        height: 'full',
        width: isSidebarOpen ? SIDEBAR_WIDTH : '0',
        opacity: isSidebarOpen ? 1 : 0,
        transition: 'width 0.5s ease, opacity 0.5s ease',
        borderRight: 'sm',
        borderColor: 'display.border.muted.default',
        backgroundColor: 'navigation.background.muted.default',
        paddingX: '2',
        paddingY: '9',
        ...props.sx,
      }}
    >
      {props.children}
    </Box>
  );
};

Sidebar.displayName = 'Sidebar';
