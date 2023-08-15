import { Button } from '@ttoss/ui';
import { Icon } from '@ttoss/react-icons';
import { Modal } from '@ttoss/components';
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
      <Button
        placeholder="Close"
        style={{ alignSelf: 'flex-end' }}
        onClick={() => {
          setNotifications(undefined);
        }}
      >
        <Icon icon={'close'}></Icon>
      </Button>
      <NotificationsBox direction="row" />
    </Modal>
  );
};
