import { Meta, StoryObj } from '@storybook/react';
import { NotificationCard } from '@ttoss/components/NotificationCard';

export default {
  title: 'Components/NotificationCard',
  component: NotificationCard,
} as Meta;

export const Success: StoryObj = {
  args: {
    type: 'success',
    title: 'Success',
    message: 'This is a success message',
  },
};

export const Error: StoryObj = {
  args: {
    type: 'error',
    title: 'Error',
    message: 'This is an error message',
  },
};

export const Warning: StoryObj = {
  args: {
    type: 'warning',
    title: 'Warning',
    message: 'This is a warning message',
  },
};

export const Info: StoryObj = {
  args: {
    type: 'info',
    title: 'Info',
    message: 'This is an info message',
  },
};

export const NoTitle: StoryObj = {
  args: {
    type: 'info',
    message: 'This is an info message without a title',
  },
};

export const CloseButtonOnTitle: StoryObj = {
  args: {
    type: 'info',
    title: 'Info',
    message: 'This is an info message with a close button on the title',
    onClose: () => {},
  },
};

export const CloseButtonOnBody: StoryObj = {
  args: {
    type: 'info',
    message:
      'This is an info message with a close button on the body. This is an info message with a close button on the body. This is an info message with a close button on the body. This is an info message with a close button on the body',
    onClose: () => {},
  },
};
