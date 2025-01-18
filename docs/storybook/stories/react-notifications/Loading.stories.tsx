import { Meta, StoryFn } from '@storybook/react';
import {
  NotificationsProvider,
  useNotifications,
} from '@ttoss/react-notifications';
import { Button } from '@ttoss/ui';

export default {
  title: 'React Notifications/Loading',
  decorators: [
    (Story) => {
      return (
        <NotificationsProvider>
          <Story />
        </NotificationsProvider>
      );
    },
  ],
} as Meta;

const Template: StoryFn = () => {
  const { isLoading, setLoading } = useNotifications();

  return (
    <Button
      onClick={() => {
        setLoading(!isLoading);
      }}
    >
      {isLoading ? 'Cancel loading' : 'Start loading'}
    </Button>
  );
};

export const Example = Template.bind({});
