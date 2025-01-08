import { Box, BoxProps, keyframes } from '@ttoss/ui';

import { useGlobal } from './GlobalProvider';

const openSidebar = keyframes({
  from: { width: 0 },
  to: { width: '2xs' },
});

export const Sidebar = (props: BoxProps) => {
  const { isSidebarOpen } = useGlobal();

  return (
    <Box
      sx={{
        width: isSidebarOpen ? '2xs' : 0,
        animation: isSidebarOpen && `${openSidebar} 1s ease`,
        ...props.sx,
      }}
    >
      {props.children}
    </Box>
  );
};

Sidebar.displayName = 'Sidebar';
