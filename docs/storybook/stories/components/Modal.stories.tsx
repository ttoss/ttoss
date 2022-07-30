import * as React from 'react';
import { Box, Button, Flex, Text } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';
import { Modal } from '@ttoss/components';
import { action } from '@storybook/addon-actions';

export default {
  title: 'Components/Modal',
  component: Modal,
} as Meta;

Modal.setAppElement('#root');

const Template: Story<{
  width: number;
  height: number;
}> = (args) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Box>
      <Modal
        isOpen={isOpen}
        onAfterOpen={action('onAfterOpen')}
        onAfterClose={action('onAfterClose')}
        onRequestClose={() => {
          action('onRequestClose')();
          setIsOpen(false);
        }}
      >
        <Flex
          sx={{
            width: args.width,
            height: args.height,
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#f0f0f0',
          }}
        >
          <Text>This is a modal.</Text>
          <Text>Light gray is the content.</Text>
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

export const SmallModal = Template.bind({});
SmallModal.args = {
  width: 200,
  height: 100,
};

export const LargeWidthModal = Template.bind({});
LargeWidthModal.args = {
  width: 500,
  height: 100,
};

export const LargeHeightModal = Template.bind({});
LargeHeightModal.args = {
  width: 200,
  height: 500,
};

export const LargeModal = Template.bind({});
LargeModal.args = {
  width: 500,
  height: 500,
};
