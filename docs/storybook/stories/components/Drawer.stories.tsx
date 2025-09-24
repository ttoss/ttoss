import { Meta, StoryObj } from '@storybook/react-webpack5';
import { Drawer, DrawerProps } from '@ttoss/components/Drawer';
import { Button, Flex } from '@ttoss/ui';
import * as React from 'react';

type Story = StoryObj<typeof Drawer>;

const Component = (args: DrawerProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const handleClose = () => {
    setIsDrawerOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => {
          setIsDrawerOpen(true);
        }}
      >
        Open Drawer
      </Button>

      <Drawer {...args} open={isDrawerOpen}>
        <Flex
          sx={{
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <Button onClick={handleClose}>Close</Button>
        </Flex>
      </Drawer>
    </>
  );
};

export default {
  title: 'Components/Drawer',
  component: Component,
} as Meta<typeof Drawer>;

export const Default: Story = {
  args: {
    direction: 'right',
    size: '300px',
  },
  argTypes: {
    direction: {
      defaultValue: 'right',
      options: ['right', 'left', 'top', 'bottom'],
      control: { type: 'radio' },
    },
  },
};
