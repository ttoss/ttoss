import * as React from 'react';
import { Flex, InfiniteLinearProgress } from '@ttoss/ui';

const NotificationsContext = React.createContext<{
  isLoading: boolean;
  setLoading: (arg: boolean) => void;
}>({
  isLoading: false,
  setLoading: () => {
    return undefined;
  },
});

export type NotificationsProviderProps = {
  children: React.ReactNode;
};

export const NotificationsProvider = ({
  children,
}: NotificationsProviderProps) => {
  const [isLoading, setLoading] = React.useState(false);

  return (
    <NotificationsContext.Provider value={{ isLoading, setLoading }}>
      {isLoading && (
        <Flex sx={{ position: 'absolute', width: '100%', top: 0 }}>
          <InfiniteLinearProgress />
        </Flex>
      )}
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  return React.useContext(NotificationsContext);
};
