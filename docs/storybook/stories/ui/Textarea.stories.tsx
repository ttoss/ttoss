import { Meta, StoryObj } from '@storybook/react';
import { Textarea } from '@ttoss/ui/src';
import { action } from '@storybook/addon-actions';

type Story = StoryObj<typeof Textarea>;

export default {
  title: 'UI/Textarea',
  component: Textarea,
} as Meta<typeof Textarea>;

export const Default: Story = {
  args: {
    onChange: action('onChange'),
    placeholder: 'Placeholder Text',
    rows: 6,
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};

export const Error: Story = {
  args: {
    ...Default.args,
    'aria-invalid': 'true',
    trailingIcon: 'error',
  },
};
