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
          <MenuItem consequence="destructive">Delete</MenuItem>
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
          <MenuItem consequence="destructive">Delete</MenuItem>
        </Menu>
      </MenuTrigger>
    );
  },
};

/**
 * A destructive row is a **peer** of its siblings — "Delete" sits beside
 * "Duplicate" with the same emphasis, and what differs is the effect of
 * activating it. That is what `consequence` names, so that is what marks the
 * row: the ink turns, the fill does not (CONTRACT §3.3).
 *
 * The second menu shows the alternative and why it is not the default answer.
 * `evaluation="negative"` is the **filled destructive command**, right when the
 * destructive action should be the loudest thing on the surface — in a row of
 * peers it reads as a banner rather than as one option among three.
 */
export const DestructiveRow: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <div style={{ display: 'flex', gap: '14rem' }}>
        <MenuTrigger defaultOpen>
          <Button evaluation="secondary">Peer (consequence)</Button>
          <Menu>
            <MenuItem>Rename</MenuItem>
            <MenuItem>Duplicate</MenuItem>
            <MenuItem consequence="destructive">Delete</MenuItem>
          </Menu>
        </MenuTrigger>
        <MenuTrigger defaultOpen>
          <Button evaluation="secondary">Loud (evaluation)</Button>
          <Menu>
            <MenuItem>Rename</MenuItem>
            <MenuItem>Duplicate</MenuItem>
            <MenuItem evaluation="negative" consequence="destructive">
              Delete
            </MenuItem>
          </Menu>
        </MenuTrigger>
      </div>
    );
  },
};
