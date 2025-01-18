import {
  toast,
  ToastContainer,
  type ToastContainerProps,
  type ToastOptions,
} from '@ttoss/components/Toast';
import { Flex, InfiniteLinearProgress } from '@ttoss/ui';
import * as React from 'react';

import { NotificationsModal } from './NotificationsModal';

type ViewType = 'toast' | 'modal' | 'box';

export type Notification = {
  id?: string | number;
  title?: string;
  message: string;
  type: 'warning' | 'error' | 'info' | 'success';
  viewType?: ViewType;
  toast?: ToastOptions;
  boxId?: string | number;
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

  const removeNotification = (id: string | number) => {
    setNotifications((prevNotifications) => {
      return prevNotifications?.filter((notification) => {
        return notification.id !== id;
      });
    });
  };

  const addNotification = (notification: Notification | Notification[]) => {
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
      /**
       * Remove old notifications with same id and keep the new ones.
       */
      const oldNotifications = prevNotifications.filter((prevNotification) => {
        const newNotification = newNotifications.find((newNotification) => {
          return newNotification.id === prevNotification.id;
        });

        if (newNotification) {
          if (newNotification.viewType === 'toast') {
            return false;
          }

          if (!newNotification.viewType && props.defaultViewType === 'toast') {
            return false;
          }
        }

        return true;
      });

      return [...oldNotifications, ...newNotifications];
    });
  };

  const clearNotifications = () => {
    setNotifications(undefined);
  };

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
      {props.children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  return React.useContext(NotificationsContext);
};

export { toast };
