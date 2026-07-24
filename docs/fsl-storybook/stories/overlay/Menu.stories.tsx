import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Menu, MenuItem, MenuTrigger } from '@ttoss/fsl-ui';

const meta: Meta<typeof Menu> = {
  title: 'Overlay/Menu',
  component: Menu,
  subcomponents: { MenuItem },
};

export default meta;

type Story = StoryObj<typeof Menu>;

export const Default: Story = {
  render: () => {
    return (
      <MenuTrigger>
        <Button evaluation="secondary">Actions</Button>
        <Menu>
          <MenuItem>Rename</MenuItem>
          <MenuItem>Duplicate</MenuItem>
          <MenuItem evaluation="negative">Delete</MenuItem>
        </Menu>
      </MenuTrigger>
    );
  },
};

export const Open: Story = {
  render: () => {
    return (
      <MenuTrigger defaultOpen>
        <Button evaluation="secondary">Actions</Button>
        <Menu>
          <MenuItem>Rename</MenuItem>
          <MenuItem>Duplicate</MenuItem>
          <MenuItem evaluation="negative">Delete</MenuItem>
        </Menu>
      </MenuTrigger>
    );
  },
};
