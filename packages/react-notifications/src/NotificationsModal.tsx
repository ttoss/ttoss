import { Modal } from '@ttoss/components';
import { NotificationsBox } from './NotificationsBox';
import { useNotifications } from './Provider';

export const NotificationsModal = () => {
  const { notifications } = useNotifications();

  return (
    <Modal isOpen={!!notifications} style={{ content: { minWidth: '30%' } }}>
      <NotificationsBox direction="stack" />
    </Modal>
  );
};
