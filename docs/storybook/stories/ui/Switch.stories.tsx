import { Meta, StoryFn } from '@storybook/react-webpack5';
import { type CheckboxProps, Switch } from '@ttoss/ui';

export default {
  title: 'UI/Switch',
  component: Switch,
} as Meta;

const Template: StoryFn<CheckboxProps> = (args) => {
  return <Switch {...args} />;
};

export const Example = Template.bind({});
