import { Modal } from '@ttoss/components';
import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { CloseButton } from '@ttoss/ui';

import { NotificationsBox } from './NotificationsBox';
import { useNotifications } from './Provider';

const messages = defineMessages({
  close: {
    defaultMessage: 'Close',
    description:
      'Accessible label of the button that dismisses the notifications modal.',
  },
});

export const NotificationsModal = () => {
  const { intl } = useI18n();
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
        aria-label={intl.formatMessage(messages.close)}
        sx={{ alignSelf: 'flex-end' }}
        onClick={() => {
          clearNotifications();
        }}
      />
      <NotificationsBox notifications={modalNotifications} />
    </Modal>
  );
};
