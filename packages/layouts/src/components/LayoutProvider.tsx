import * as React from 'react';

import { useIsDesktop } from '../useIsDesktop';

interface LayoutContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const LayoutContext = React.createContext<LayoutContextType>({
  isSidebarOpen: true,
  toggleSidebar: () => {},
});

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const { isDesktop } = useIsDesktop();

  /**
   * The sidebar starts open on desktop and closed otherwise, and follows every
   * screen-size change. `isDesktop` starts as false until the screen size is
   * recognized, so it flips to true on desktop right after mount.
   */
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(isDesktop);

  /**
   * Adjust state while rendering when `isDesktop` changes, instead of in an
   * effect: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
   */
  const [prevIsDesktop, setPrevIsDesktop] = React.useState(isDesktop);

  if (isDesktop !== prevIsDesktop) {
    setPrevIsDesktop(isDesktop);
    setIsSidebarOpen(isDesktop);
  }

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      return !prev;
    });
  };

  return (
    <LayoutContext.Provider value={{ isSidebarOpen, toggleSidebar }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = React.useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
