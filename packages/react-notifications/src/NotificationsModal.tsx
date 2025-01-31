import { Modal } from '@ttoss/components/Modal';
import { CloseButton } from '@ttoss/ui';

import { NotificationsBox } from './NotificationsBox';
import { useNotifications } from './Provider';

export const NotificationsModal = () => {
  const { notifications, clearNotifications, defaultViewType } =
    useNotifications();

  const modalNotifications = notifications?.filter((notification) => {
    if (defaultViewType === 'modal' && !notification.viewType) {
      return true;
    }

    return notification.viewType === 'modal';
  });

  const isOpen = !!modalNotifications && modalNotifications.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      style={{
        content: {
          minWidth: '30%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4',
        },
      }}
    >
      <CloseButton
        aria-label="Close"
        sx={{ alignSelf: 'flex-end' }}
        onClick={() => {
          clearNotifications();
        }}
      />
      <NotificationsBox notifications={modalNotifications} />
    </Modal>
  );
};
