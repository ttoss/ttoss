import { InfiniteLinearProgress } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'UI/InfiniteLinearProgress',
  component: InfiniteLinearProgress,
} as Meta;

const Template: Story = () => {
  return <InfiniteLinearProgress />;
};

export const Example = Template.bind({});
