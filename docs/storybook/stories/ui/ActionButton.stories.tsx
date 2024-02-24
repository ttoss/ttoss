import { ActionButton } from '@ttoss/ui';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';

type Story = StoryObj<typeof ActionButton>;

export default {
  title: 'UI/ActionButton',
  component: ActionButton,
} as Meta<typeof ActionButton>;

export const Default: Story = {
  args: {
    onClick: action('onClick'),
    children: 'Text',
    icon: 'radio-not-selected',
    disabled: false,
  },
};

export const DefaultSelected: Story = {
  args: {
    ...Default.args,
    autoFocus: true,
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};

export const Accent: Story = {
  args: {
    ...Default.args,
    variant: 'accent',
    autoFocus: true,
  },
};

export const Quiet: Story = {
  args: {
    ...Default.args,
    variant: 'quiet',
  },
};
