import { Meta, StoryFn } from '@storybook/react-webpack5';
import { Modal } from '@ttoss/components/Modal';
import { Box, Button, Flex, Text } from '@ttoss/ui';
import * as React from 'react';
import { action } from 'storybook/actions';

export default {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    docs: {
      description: {
        component:
          'Accessible modal component with theme integration. Built on react-modal with accessibility features like focus management and keyboard navigation. Supports custom styling with theme tokens.',
      },
    },
  },
  tags: ['autodocs'],
} as Meta;

const Template: StoryFn<{
  width: number;
  height: number;
}> = (args) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Box id="modal-root">
      <Modal
        isOpen={isOpen}
        onAfterOpen={action('onAfterOpen')}
        onAfterClose={action('onAfterClose')}
        onRequestClose={() => {
          action('onRequestClose')();
          setIsOpen(false);
        }}
        appElement={document.getElementById('modal-root') as HTMLElement}
      >
        <Flex
          sx={{
            width: args.width,
            height: args.height,
            minWidth: args.width,
            minHeight: args.height,
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'md',
            backgroundColor: 'muted',
          }}
        >
          <Text>This is a modal.</Text>
          <Text>Here is the content.</Text>
          <Button
            onClick={() => {
              setIsOpen(false);
            }}
          >
            Close Modal
          </Button>
        </Flex>
      </Modal>
      <Button
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Open Modal
      </Button>
    </Box>
  );
};

const small = 200;

const large = 2000;

export const SmallModal = Template.bind({});
SmallModal.args = {
  width: small,
  height: small,
};
SmallModal.parameters = {
  docs: {
    description: {
      story:
        'Small modal (200x200px) for compact content like confirmations or quick forms.',
    },
  },
};

export const LargeWidthModal = Template.bind({});
LargeWidthModal.args = {
  width: large,
  height: small,
};
LargeWidthModal.parameters = {
  docs: {
    description: {
      story:
        'Wide modal for content that needs horizontal space like tables or forms.',
    },
  },
};

export const LargeHeightModal = Template.bind({});
LargeHeightModal.args = {
  width: small,
  height: large,
};
LargeHeightModal.parameters = {
  docs: {
    description: {
      story: 'Tall modal for content lists or detailed information display.',
    },
  },
};

export const LargeModal = Template.bind({});
LargeModal.args = {
  width: large,
  height: large,
};
LargeModal.parameters = {
  docs: {
    description: {
      story:
        'Full-size modal for complex content like detailed forms or dashboards.',
    },
  },
};
