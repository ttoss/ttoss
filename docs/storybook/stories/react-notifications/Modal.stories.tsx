import { Button } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';
import {
  NotificationsModal,
  NotificationsProvider,
  useNotifications,
} from '@ttoss/react-notifications/src';

export default {
  title: 'React Notifications/Modal',
  decorators: [
    (Story) => {
      return (
        <NotificationsProvider>
          <Story />
          <NotificationsModal />
        </NotificationsProvider>
      );
    },
  ],
} as Meta;

const Template: Story = () => {
  const { setNotifications } = useNotifications();

  return (
    <Button
      onClick={() => {
        setNotifications({ message: 'Hello', type: 'info' });
      }}
    >
      Click me!!
    </Button>
  );
};

const Template2: Story = () => {
  const { setNotifications } = useNotifications();

  return (
    <Button
      onClick={() => {
        setNotifications([
          { message: 'Hello', type: 'info' },
          { message: 'Second Message', type: 'info' },
          { message: 'More one', type: 'info' },
        ]);
      }}
    >
      Click me!!
    </Button>
  );
};

export const SingleNotification = Template.bind({});
export const MultipleNotifications = Template2.bind({});
