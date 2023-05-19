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
  const {
    intl: { formatMessage },
  } = useI18n();

  return (
    <Modal isOpen={!!notifications} style={{ content: { minWidth: '30%' } }}>
      <Stack sx={{ gap: '2xl' }}>
        <Text>
          {notifications &&
            isNotifyParams(notifications) &&
            notifications.message}
        </Text>
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
};
