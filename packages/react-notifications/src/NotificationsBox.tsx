import * as React from 'react';
import { Button, Flex, Stack } from '@ttoss/ui';
import { type NotifyParams, useNotifications } from './Provider';

const NotificationBoxWrapper = ({
  direction,
  notifications,
  children,
}: React.PropsWithChildren<{
  direction: 'row' | 'column';
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

  return direction === 'row' ? (
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
        return notification.key;
      })
      .map((notification) => {
        return [notification?.key, notification];
      })
  ).values();

  const nonKeyedNotifications = notifications
    .filter((notification) => {
      return !notification.key;
    })
    .map((notification, index) => {
      return {
        ...notification,
        key: index.toString() as string,
      };
    });

  return Array.from(keyedNotifications).concat(nonKeyedNotifications);
};

export const NotificationsBox = ({
  direction = 'row',
}: {
  direction?: 'row' | 'column';
}) => {
  const { setNotifications, notifications } = useNotifications();

  if (!notifications) {
    return null;
  }

  const renderNotifications = resolveNotifications(notifications);

  const ButtonMemoized = React.memo(
    ({
      notification: { key, type, message },
    }: {
      notification: NotifyParams;
    }) => {
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
                  return notification.key !== key;
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
              key={notification.key}
              notification={notification}
            />
          );
        })
      ) : (
        <ButtonMemoized notification={renderNotifications} />
      )}
    </NotificationBoxWrapper>
  );
};
