import { Modal, type ModalProps } from '@ttoss/components';
import { NotificationsBox } from './NotificationsBox';
import { useNotifications } from './Provider';

export const NotificationsModal = ({
  style,
}: {
  style?: ModalProps['style'];
}) => {
  const { notifications } = useNotifications();

  return (
    <Modal
      isOpen={!!notifications}
      style={{
        content: { minWidth: '30%', ...style?.content },
        overlay: style?.overlay,
      }}
    >
      <NotificationsBox direction="stack" />
    </Modal>
  );
};
