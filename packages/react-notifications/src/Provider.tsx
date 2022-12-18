import * as React from 'react';
import { Flex, InfiniteLinearProgress } from '@ttoss/ui';

type NotifyParams = {
  message: 'string' | React.ReactNode;
  type: 'success' | 'error' | 'warning' | 'info';
};

const NotificationsContext = React.createContext<{
  isLoading: boolean;
  setLoading: (arg: boolean) => void;
  setNotifications: (args: NotifyParams | NotifyParams[]) => void;
  notifications?: NotifyParams | NotifyParams[];
  enableNotificationBox?: boolean;
}>({
  isLoading: false,
  setLoading: () => {
    return undefined;
  },
  setNotifications: () => {
    return undefined;
  },
});

export type NotificationsProviderProps = {
  children: React.ReactNode;
  enableNotificationBox?: boolean;
};

export const NotificationsProvider = ({
  children,
  enableNotificationBox,
}: NotificationsProviderProps) => {
  const [isLoading, setLoading] = React.useState(false);

  const [notifications, setNotifications] = React.useState<
    NotifyParams | NotifyParams[] | undefined
  >();

  return (
    <NotificationsContext.Provider
      value={{
        isLoading,
        setLoading,
        setNotifications,
        notifications,
        enableNotificationBox,
      }}
    >
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
  const { isLoading, setLoading, notifications, setNotifications } =
    React.useContext(NotificationsContext);

  return {
    isLoading,
    setLoading,
    notifications,
    setNotifications,
  };
};
