import * as React from 'react';
import { Box, Button, Flex, Text } from '@ttoss/ui';
import { Meta, StoryFn } from '@storybook/react';
import { Modal } from '../../../../packages/components/src';
import { action } from '@storybook/addon-actions';

export default {
  title: 'Components/Modal',
  component: Modal,
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

export const LargeWidthModal = Template.bind({});
LargeWidthModal.args = {
  width: large,
  height: small,
};

export const LargeHeightModal = Template.bind({});
LargeHeightModal.args = {
  width: small,
  height: large,
};

export const LargeModal = Template.bind({});
LargeModal.args = {
  width: large,
  height: large,
};
