import { NotificationCard } from '@ttoss/components/NotificationCard';
import { Stack } from '@ttoss/ui';

import { type Notification, useNotifications } from './Provider';

export const NotificationsBox = (props: {
  id?: string | number;
  notifications?: Notification[] | undefined;
}) => {
  const { notifications, removeNotification, defaultViewType } =
    useNotifications();

  const boxNotifications =
    props.notifications ||
    notifications?.filter((notification) => {
      if (notification.viewType !== 'box' && defaultViewType !== 'box') {
        return false;
      }

      if (!props.id && notification.boxId) {
        return false;
      }

      if (!props.id && !notification.boxId) {
        return true;
      }

      return notification.boxId === props.id;
    });

  const hasBoxNotifications = Array.isArray(boxNotifications);

  if (!hasBoxNotifications) {
    return null;
  }

  return (
    <Stack
      sx={{
        width: 'full',
        gap: '1',
      }}
    >
      {boxNotifications.map((notification) => {
        return (
          <NotificationCard
            key={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => {
              if (notification.id) {
                removeNotification(notification.id);
              }
            }}
          />
        );
      })}
    </Stack>
  );
};
