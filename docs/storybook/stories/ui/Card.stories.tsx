import { Meta, StoryFn } from '@storybook/react';
import { Card, CardProps, Text } from '@ttoss/ui';

export default {
  title: 'UI/Card',
  component: Card,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as Meta;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Template: StoryFn<CardProps> = (args: any) => {
  return (
    <Card {...args}>
      <Text>Card </Text>
    </Card>
  );
};

export const Default = Template.bind({});
Default.args = {
  variant: 'primary',
};
