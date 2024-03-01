import * as React from 'react';
import { Button, Flex } from '@ttoss/ui';
import { Drawer, DrawerProps } from '@ttoss/components';
import { Meta, StoryObj } from '@storybook/react';

type Story = StoryObj<typeof Drawer>;

const Component = (args: DrawerProps) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleClose = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => {
          setIsMenuOpen(true);
        }}
      >
        Open Menu
      </Button>

      <Drawer {...args} open={isMenuOpen}>
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
