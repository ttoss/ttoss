import { LinearProgress } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'UI/LinearProgress',
  component: LinearProgress,
} as Meta;

const Template: Story = () => {
  return <LinearProgress max={100} value={50} />;
};

export const Example = Template.bind({});
