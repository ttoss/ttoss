import { Meta, Story } from '@storybook/react';

import { LinearProgress } from '@ttoss/ui';

export default {
  title: 'UI/LinearProgress',
  component: LinearProgress,
} as Meta;

const Template: Story = () => <LinearProgress max={100} value={50} />;

export const Example = Template.bind({});
