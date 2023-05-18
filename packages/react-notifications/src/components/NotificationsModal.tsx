import { Button, Stack, Text } from '@ttoss/ui';
import { Modal } from '../../../components/dist';
import { type NotifyParams } from '../Provider';
import { useI18n } from '@ttoss/react-i18n';
import { useNotifications } from '../Provider';
import { useState } from 'react';

const isNotifyParams = (
  notification: NotifyParams | NotifyParams[]
): notification is NotifyParams => {
  return (notification as NotifyParams).message !== undefined;
};

export const NotificationsModal = () => {
  const { notifications, setNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const {
    intl: { formatMessage },
  } = useI18n();

  if (!notifications) {
    setIsOpen(false);
    return null;
  }

  setIsOpen(true);

  if (isNotifyParams(notifications)) {
    const { message } = notifications;

    return (
      <Modal isOpen={isOpen}>
        <Stack sx={{ gap: '2xl' }}>
          <Text>{message}</Text>
          <Button
            onClick={() => {
              setNotifications(undefined);
            }}
            sx={{ width: '50%' }}
          >
            {formatMessage({
              defaultMessage: 'OK',
              description: 'OK',
            })}
          </Button>
        </Stack>
      </Modal>
    );
  }

  const notification = notifications.shift();

  return (
    <Modal isOpen={isOpen}>
      <Stack sx={{ gap: '2xl' }}>
        <Text>{notification?.message}</Text>
        <Button
          onClick={() => {
            setIsOpen(false);
          }}
          sx={{ width: '50%' }}
        >
          {formatMessage({
            defaultMessage: 'OK',
            description: 'OK',
          })}
        </Button>
      </Stack>
    </Modal>
  );
};
