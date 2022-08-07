import { Meta, Story } from '@storybook/react';
import { Spinner } from '@ttoss/ui';

export default {
  title: 'UI/Spinner',
  component: Spinner,
} as Meta;

const Template: Story = (args) => <Spinner sx={{ color: args.color }} />;

export const Primary = Template.bind({});
Primary.args = {
  color: 'primary',
};

export const Secondary = Template.bind({});
Secondary.args = {
  color: 'secondary',
};
