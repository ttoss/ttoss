import { Label } from '@ttoss/ui/src';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';

type Story = StoryObj<typeof Label>;

export default {
  title: 'UI/Label',
  component: Label,
} as Meta<typeof Label>;

export const Default: Story = {
  args: {
    onChange: action('onChange'),
    children: 'Label Text',
  },
};

export const WithTooltip: Story = {
  args: {
    ...Default.args,
    tooltip: true,
  },
};

export const Disabled: Story = {
  args: {
    ...WithTooltip.args,
    'aria-disabled': 'true',
  },
};
