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
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const { isDesktop } = useIsDesktop();

  React.useEffect(() => {
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  }, [isDesktop]);

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
