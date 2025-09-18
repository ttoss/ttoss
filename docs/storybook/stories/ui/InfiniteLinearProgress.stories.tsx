import { Meta, Story } from '@storybook/react-webpack5';
import { InfiniteLinearProgress } from '@ttoss/ui';

export default {
  title: 'UI/InfiniteLinearProgress',
  component: InfiniteLinearProgress,
} as Meta;

const Template: Story = () => {
  return <InfiniteLinearProgress />;
};

export const Example = Template.bind({});
