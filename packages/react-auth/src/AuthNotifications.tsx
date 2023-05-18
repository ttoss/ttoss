import * as React from 'react';
import { Button, Flex } from '@ttoss/ui';
import {
  type NotifyParams,
  useNotifications,
} from '@ttoss/react-notifications';

export const AuthNotifications = () => {
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
    <Flex
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        marginTop:
          !notifications ||
          (Array.isArray(notifications) && !notifications.length)
            ? 0
            : '2xl',
      }}
    >
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
    </Flex>
  );
};
