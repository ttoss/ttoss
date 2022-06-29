import { Button } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as Meta;

const Template: Story = (args) => <Button {...args}>Click Me!</Button>;

export const Primary = Template.bind({});
Primary.args = {
  variant: 'primary',
};

export const Secondary = Template.bind({});
Secondary.args = {
  variant: 'secondary',
};
