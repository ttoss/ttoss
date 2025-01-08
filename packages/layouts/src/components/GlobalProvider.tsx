import * as React from 'react';

interface GlobalContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const GlobalContext = React.createContext<GlobalContextType | undefined>(
  undefined
);

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      return !prev;
    });
  };

  return (
    <GlobalContext.Provider value={{ isSidebarOpen, toggleSidebar }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = React.useContext(GlobalContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
