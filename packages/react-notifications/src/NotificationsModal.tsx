import * as React from 'react';
import { Modal } from '../../components/dist';
import { NotificationsBox } from './NotificationsBox';
import { Stack } from '@ttoss/ui';
import { useNotifications } from './Provider';

export const NotificationsModal = () => {
  const { notifications, setNotifications } = useNotifications();

  return (
    <Modal isOpen={!!notifications} style={{ content: { minWidth: '30%' } }}>
      <NotificationsBox direction="stack" />
    </Modal>
  );
};
