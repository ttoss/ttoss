import * as React from 'react';
import { Button, Stack } from '@ttoss/ui';
import { Modal } from '../../components/dist';
import { NotificationBox } from './NotificationBox';
import { useI18n } from '@ttoss/react-i18n';
import { useNotifications } from '../Provider';
import { useState } from 'react';

export const NotificationsModal = () => {
  const { notifications, setNotifications } = useNotifications();
  const {
    intl: { formatMessage },
  } = useI18n();

  return (
    <Modal isOpen={!!notifications} style={{ content: { minWidth: '30%' } }}>
      <Stack sx={{ gap: '2xl' }}>
        <NotificationBox />
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
