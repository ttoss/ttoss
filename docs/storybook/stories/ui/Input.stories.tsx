import { Icon, Input, InputProps } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';
import alertIcon from '@iconify-icons/mdi-light/alert';

export default {
  title: 'UI/Input',
  component: Input,
} as Meta;

const Template: Story<InputProps> = (args) => {
  return <Input {...args} />;
};

export const IconsAsString = Template.bind({});
IconsAsString.args = {
  trailingIcon: 'mdi-light:home',
  leadingIcon: 'mdi-light:home',
  placeholder: 'Icon as string',
};

export const IconsAsComponent = Template.bind({});
IconsAsComponent.args = {
  trailingIcon: <Icon icon="mdi-light:home" />,
  leadingIcon: <Icon icon="mdi-light:home" />,
  placeholder: 'Icon as component',
};

export const IconsAsSvgIcon = Template.bind({});
IconsAsSvgIcon.args = {
  trailingIcon: alertIcon,
  leadingIcon: alertIcon,
  placeholder: 'Icon as SvgIcon',
};
