import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { DrawerProps } from '@ttoss/components/Drawer';
import { Drawer } from '@ttoss/components/Drawer';
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
  parameters: {
    docs: {
      description: {
        component:
          'Slide-out drawer component that can appear from any screen edge. Built on react-modern-drawer with theme integration and customizable size/direction.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: { type: 'select' },
      options: ['left', 'right', 'top', 'bottom'],
      description: 'Direction from which the drawer slides in',
    },
    size: {
      control: { type: 'text' },
      description:
        'Size of the drawer (width for left/right, height for top/bottom)',
    },
  },
} as Meta<typeof Drawer>;

export const Default: Story = {
  args: {
    direction: 'right',
    size: '300px',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic drawer sliding from the right side. Try different directions and sizes using the controls.',
      },
    },
  },
};

export const LeftDrawer: Story = {
  args: {
    direction: 'left',
    size: '250px',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Drawer sliding from the left - commonly used for navigation menus.',
      },
    },
  },
};

export const TopDrawer: Story = {
  args: {
    direction: 'top',
    size: '200px',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Drawer sliding from the top - useful for notifications or quick actions.',
      },
    },
  },
};

export const BottomDrawer: Story = {
  args: {
    direction: 'bottom',
    size: '40%',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Drawer sliding from the bottom - great for mobile-friendly actions or forms.',
      },
    },
  },
};
