import {
  toast,
  ToastContainer,
  type ToastContainerProps,
  type ToastOptions,
} from '@ttoss/components/Toast';
import { Flex, InfiniteLinearProgress } from '@ttoss/ui';
import * as React from 'react';

import { NotificationsHeader } from './NotificationsHeader';
import { NotificationsModal } from './NotificationsModal';

type ViewType = 'toast' | 'modal' | 'box' | 'header';

export type Notification = {
  id?: string | number;
  title?: string;
  message: string;
  type: 'warning' | 'error' | 'info' | 'success';
  viewType?: ViewType;
  toast?: ToastOptions;
  boxId?: string | number;
  persist?: boolean;
};

const NotificationsContext = React.createContext<{
  isLoading: boolean;
  setLoading: (arg: boolean) => void;
  defaultViewType: ViewType;
  notifications?: Notification[];
  addNotification(notification: Notification | Notification[]): void;
  removeNotification(id: string | number): void;
  clearNotifications(): void;
}>({
  isLoading: false,
  setLoading: () => {
    return undefined;
  },
  defaultViewType: 'box',
  addNotification: () => {
    return undefined;
  },
  removeNotification: () => {
    return undefined;
  },
  clearNotifications: () => {
    return undefined;
  },
});

export type NotificationsProviderProps = {
  children: React.ReactNode;
  defaultViewType?: ViewType;
  toast?: ToastContainerProps;
};

export const NotificationsProvider = (props: NotificationsProviderProps) => {
  const [isLoading, setLoading] = React.useState(false);

  const [notifications, setNotifications] = React.useState<
    Notification[] | undefined
  >();

  const prefix = React.useId();

  const removeNotification = React.useCallback((id: string | number) => {
    setNotifications((prevNotifications) => {
      return prevNotifications?.filter((notification) => {
        return notification.id !== id;
      });
    });
  }, []);

  const addNotification = React.useCallback(
    (notification: Notification | Notification[]) => {
      const newNotifications = (
        Array.isArray(notification) ? notification : [notification]
      )
        .map((notification) => {
          const id = notification.id || `${prefix}-${Math.random()}`;
          return {
            ...notification,
            id,
          };
        })
        /**
         * Remove notifications with same id
         */
        .filter((notification, index, notifications) => {
          return (
            notifications.findIndex((n) => {
              return n.id === notification.id;
            }) === index
          );
        });

      const toastNotifications = newNotifications.filter((notification) => {
        if (notification.viewType === 'toast') {
          return true;
        }

        if (!notification.viewType && props.defaultViewType === 'toast') {
          return true;
        }

        return false;
      });

      // eslint-disable-next-line unicorn/no-array-for-each
      toastNotifications.forEach((notification) => {
        toast(notification.message, {
          ...notification.toast,
          type: notification.type,
          onClose: () => {
            removeNotification(notification.id);
            notification.toast?.onClose?.();
          },
        });
      });

      setNotifications((prevNotifications = []) => {
        const nonToastNewNotifications = newNotifications.filter(
          (notification) => {
            if (notification.viewType === 'toast') {
              return false;
            }
            if (!notification.viewType && props.defaultViewType === 'toast') {
              return false;
            }
            return true;
          }
        );

        const oldNotifications = prevNotifications.filter(
          (prevNotification) => {
            return !nonToastNewNotifications.some((newNotification) => {
              return newNotification.id === prevNotification.id;
            });
          }
        );

        return [...oldNotifications, ...nonToastNewNotifications];
      });
    },
    [prefix, props.defaultViewType, removeNotification]
  );

  const clearNotifications = React.useCallback(() => {
    setNotifications((prevNotifications) => {
      return prevNotifications?.filter((notification) => {
        return notification.persist === true;
      });
    });
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        isLoading,
        setLoading,
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
        defaultViewType: props.defaultViewType || 'box',
      }}
    >
      <ToastContainer {...props.toast} />
      <NotificationsModal />
      {isLoading && (
        <Flex sx={{ position: 'absolute', width: '100%', top: 0 }}>
          <InfiniteLinearProgress />
        </Flex>
      )}
      <NotificationsHeader />
      {props.children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  return React.useContext(NotificationsContext);
};

export { toast };
