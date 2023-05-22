import { Modal } from '@ttoss/components';
import { NotificationsBox } from './NotificationsBox';
import { useNotifications } from './Provider';

export const NotificationsModal = ({
  elementSelector,
}: {
  elementSelector: string;
}) => {
  const { notifications } = useNotifications();

  return (
    <Modal
      isOpen={!!notifications}
      style={{ content: { minWidth: '30%' } }}
      appElement={document.querySelector(elementSelector) as HTMLElement}
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      ariaHideApp={process.env.NODE_ENV !== 'test'}
    >
      <NotificationsBox direction="stack" />
    </Modal>
  );
};
