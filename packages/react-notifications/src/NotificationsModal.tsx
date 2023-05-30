import { Modal } from '@ttoss/components';
import { NotificationsBox } from './NotificationsBox';
import { useNotifications } from './Provider';

export const NotificationsModal = ({ zIndex }: { zIndex?: number }) => {
  const { notifications } = useNotifications();

  return (
    <Modal
      isOpen={!!notifications}
      style={{ content: { minWidth: '30%' }, overlay: { zIndex } }}
    >
      <NotificationsBox direction="stack" />
    </Modal>
  );
};
