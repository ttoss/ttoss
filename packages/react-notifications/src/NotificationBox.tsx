import { Box } from '@ttoss/ui';
import { useNotifications } from './Provider';

export const NotificationBox = () => {
  const { notifications } = useNotifications();

  if (!notifications) {
    return null;
  }

  return <Box>{JSON.stringify(notifications, null, 2)}</Box>;
};
