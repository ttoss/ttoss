import * as React from 'react';
import { Button, Flex, Stack } from '@ttoss/ui';
import { type NotifyParams, useNotifications } from './Provider';

const NotificationBoxWrapper = ({
  direction,
  notifications,
  children,
}: React.PropsWithChildren<{
  direction: 'flex' | 'stack';
  notifications: NotifyParams | NotifyParams[] | undefined;
}>) => {
  const sx = {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'md',
    marginTop:
      !notifications || (Array.isArray(notifications) && !notifications.length)
        ? 0
        : '2xl',
  };

  return direction === 'flex' ? (
    <Flex sx={sx}>{children}</Flex>
  ) : (
    <Stack sx={sx}>{children}</Stack>
  );
};

const resolveNotifications = (notifications: NotifyParams | NotifyParams[]) => {
  if (!Array.isArray(notifications)) return notifications;

  // keyed notifications should be unique
  const keyedNotifications = new Map<string | undefined, NotifyParams>(
    notifications
      .filter((notification) => {
        return notification.notificationKey;
      })
      .map((notification) => {
        return [notification?.notificationKey, notification];
      })
  ).values();

  const nonKeyedNotifications = notifications
    .filter((notification) => {
      return !notification.notificationKey;
    })
    .map((notification, index) => {
      return {
        ...notification,
        notificationKey: index.toString() as string,
      };
    });

  return Array.from(keyedNotifications).concat(nonKeyedNotifications);
};

export const NotificationsBox = ({
  direction = 'flex',
}: {
  direction?: 'flex' | 'stack';
}) => {
  const { setNotifications, notifications } = useNotifications();

  if (!notifications) {
    return null;
  }

  const renderNotifications = resolveNotifications(notifications);

  const ButtonMemoized = React.memo(
    ({ message, type, notificationKey }: NotifyParams) => {
      return (
        <Button
          sx={{
            backgroundColor: type === 'error' ? 'danger' : 'positive',
          }}
          onClick={() => {
            if (
              Array.isArray(renderNotifications) &&
              renderNotifications.length > 1
            ) {
              return setNotifications(
                renderNotifications.filter((notification) => {
                  return notification.notificationKey !== notificationKey;
                })
              );
            }
            return setNotifications(undefined);
          }}
          rightIcon="close"
          leftIcon={type === 'error' ? 'warning' : undefined}
        >
          {message}
        </Button>
      );
    }
  );

  ButtonMemoized.displayName = 'ButtonMemoized';

  return (
    <NotificationBoxWrapper {...{ notifications, direction }}>
      {Array.isArray(renderNotifications) ? (
        renderNotifications.map((notification) => {
          return (
            <ButtonMemoized
              key={notification.notificationKey}
              {...notification}
            />
          );
        })
      ) : (
        <ButtonMemoized {...renderNotifications} />
      )}
    </NotificationBoxWrapper>
  );
};
