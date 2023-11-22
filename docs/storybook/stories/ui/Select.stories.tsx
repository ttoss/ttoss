import { Meta, StoryObj } from '@storybook/react';
import { Select } from '@ttoss/ui/src';
import { action } from '@storybook/addon-actions';

type Story = StoryObj<typeof Select>;

const OPTIONS = ['orange', 'grape', 'apple'];

const options = OPTIONS.map((option) => {
  return {
    label: option.toUpperCase(),
    value: option,
  };
});

export default {
  title: 'UI/Select',
  component: Select,
} as Meta<typeof Select>;

export const Default: Story = {
  args: {
    onChange: action('onChange'),
    defaultValue: options[0],
    options,
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};

export const WithIcons: Story = {
  args: {
    ...Default.args,
    leadingIcon: 'language',
    trailingIcon: 'email',
  },
};

export const Error: Story = {
  args: {
    ...Default.args,
    'aria-invalid': 'true',
  },
};

export const WithSxProps: Story = {
  args: {
    ...Default.args,
    sx: {
      width: '300px',
      margin: 'xl',
    },
  },
};
