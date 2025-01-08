import { Box, BoxProps, keyframes } from '@ttoss/ui';

import { useGlobal } from './GlobalProvider';

const fadeIn = keyframes({
  from: { width: 0 },
  to: { width: '2xs' },
});

export const Sidebar = (props: BoxProps) => {
  const { isSidebarOpen } = useGlobal();
  return (
    <>
      <Box
        sx={{
          width: isSidebarOpen ? '2xs' : 0,
          animation: isSidebarOpen && `${fadeIn} 0.5s ease`,

          ...props.sx,
        }}
      >
        Sidebar
      </Box>
    </>
  );
};

Sidebar.displayName = 'Sidebar';
