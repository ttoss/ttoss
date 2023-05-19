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

export const NotificationsBox = ({
  direction = 'flex',
}: {
  direction?: 'flex' | 'stack';
}) => {
  const { setNotifications, notifications } = useNotifications();

  if (!notifications) {
    return null;
  }

  const ButtonMemoized = React.memo(({ message, type }: NotifyParams) => {
    return (
      <Button
        sx={{
          backgroundColor: type === 'error' ? 'danger' : 'positive',
        }}
        onClick={() => {
          if (Array.isArray(notifications) && notifications.length > 1) {
            return setNotifications(
              notifications.filter((notification) => {
                return notification.message !== message;
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
  });

  ButtonMemoized.displayName = 'ButtonMemoized';

  return (
    <NotificationBoxWrapper {...{ notifications, direction }}>
      {Array.isArray(notifications) ? (
        notifications.map((notification) => {
          return (
            <ButtonMemoized
              key={JSON.stringify(notification)}
              {...notification}
            />
          );
        })
      ) : (
        <ButtonMemoized {...notifications} />
      )}
    </NotificationBoxWrapper>
  );
};
