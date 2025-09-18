import { Meta, StoryObj } from '@storybook/react-webpack5';
import { NotificationCard } from '@ttoss/components/NotificationCard';
import { Flex } from '@ttoss/ui';

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
    message: (
      <Flex sx={{ gap: '4' }}>
        This is an error message
        <Flex
          sx={{ color: 'blue', cursor: 'pointer' }}
          onClick={() => {
            window.open('http://www.google.com', '_blank');
          }}
        >
          Clique aqui
        </Flex>
      </Flex>
    ),
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

export const WithMetaInfo: StoryObj = {
  args: {
    type: 'info',
    title: 'New notification',
    message: 'You have a new pending notification.',
    caption: '5 min ago',
  },
};

export const WithTag: StoryObj = {
  args: {
    type: 'success',
    title: 'Action completed',
    message: 'Your action has been completed and new features are now working.',
    caption: '2d ago',
    tags: ['New', 'Feature', 'Available'],
  },
};
