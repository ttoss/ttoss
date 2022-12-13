import { Button } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';
import { NotificationsProvider, useNotifications } from '@ttoss/notifications';

export default {
  title: 'Notifications/Loading',
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

const Template: Story = () => {
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
