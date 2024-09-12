import { CloseButton } from '@ttoss/ui';
import { Modal } from '@ttoss/components/Modal';
import { NotificationsBox } from './NotificationsBox';
import { useNotifications } from './Provider';

export const NotificationsModal = () => {
  const { notifications, setNotifications } = useNotifications();

  return (
    <Modal
      isOpen={!!notifications}
      style={{
        content: {
          minWidth: '30%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        },
      }}
    >
      <CloseButton
        sx={{ alignSelf: 'flex-end' }}
        onClick={() => {
          setNotifications(undefined);
        }}
      />
      <NotificationsBox direction="column" />
    </Modal>
  );
};
