import { Meta, Story } from '@storybook/react-webpack5';
import { LinearProgress } from '@ttoss/ui';

export default {
  title: 'UI/LinearProgress',
  component: LinearProgress,
} as Meta;

const Template: Story = () => {
  return <LinearProgress max={100} value={50} />;
};

export const Example = Template.bind({});
