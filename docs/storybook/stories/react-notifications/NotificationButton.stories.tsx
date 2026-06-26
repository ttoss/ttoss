import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { NotificationButton } from '@ttoss/react-notifications';
import { Stack } from '@ttoss/ui';

export default {
  title: 'React Notifications/NotificationButton',
  component: NotificationButton,
  tags: ['autodocs'],
} as Meta;

export const AllTypes: StoryObj = {
  render: () => {
    return (
      <Stack sx={{ gap: '3', flexDirection: 'row', flexWrap: 'wrap' }}>
        {(['success', 'error', 'warning', 'info', 'neutral'] as const).map(
          (type) => {
            return (
              <NotificationButton
                key={type}
                type={type}
                onClick={() => {
                  return alert(`${type} clicked`);
                }}
              >
                {type}
              </NotificationButton>
            );
          }
        )}
      </Stack>
    );
  },
};

export const Success: StoryObj = {
  args: {
    type: 'success',
    children: 'Confirm',
    onClick: () => {
      return alert('clicked');
    },
  },
};

export const Error: StoryObj = {
  args: {
    type: 'error',
    children: 'Delete',
    onClick: () => {
      return alert('clicked');
    },
  },
};

export const Warning: StoryObj = {
  args: {
    type: 'warning',
    children: 'Proceed anyway',
    onClick: () => {
      return alert('clicked');
    },
  },
};

export const Info: StoryObj = {
  args: {
    type: 'info',
    children: 'Learn more',
    onClick: () => {
      return alert('clicked');
    },
  },
};
