import { useBreakpointIndex } from '@ttoss/ui';

export const useIsDesktop = () => {
  const breakpointIndex = useBreakpointIndex();

  const isDesktop = breakpointIndex >= 1;

  return { isDesktop };
};
