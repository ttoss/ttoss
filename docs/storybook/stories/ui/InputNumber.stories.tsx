import * as React from 'react';
import { InputNumber, InputNumberProps } from '@ttoss/ui';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';

type Story = StoryObj<typeof InputNumber>;

const Component = (args: InputNumberProps) => {
  const [value, setValue] = React.useState(0);

  return (
    <InputNumber
      {...args}
      value={value}
      onChange={(newValue) => {
        setValue(newValue);
        action('onChange')();
      }}
    />
  );
};

export default {
  title: 'UI/InputNumber',
  component: Component,
} as Meta<typeof InputNumber>;

export const Default: Story = {
  args: {},
};

export const Focus: Story = {
  args: {
    ...Default.args,
    autoFocus: true,
  },
};

export const Error: Story = {
  args: {
    ...Default.args,
    infoIcon: true,
    'aria-invalid': 'true',
    onClickInfoIcon: action('onClickInfoIcon'),
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};
