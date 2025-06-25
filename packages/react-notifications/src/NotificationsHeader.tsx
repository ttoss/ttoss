import { NotificationsBox } from './NotificationsBox';
import { useNotifications } from './Provider';

export const NotificationsHeader = () => {
  const { notifications } = useNotifications();

  const headerNotifications = notifications?.filter((notification) => {
    return notification.viewType === 'header';
  });

  return <NotificationsBox notifications={headerNotifications} />;
};
