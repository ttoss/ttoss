import { Flex, Input, InputProps } from '@ttoss/ui/src';
import { Meta, Story } from '@storybook/react';
import alertIcon from '@iconify-icons/mdi-light/alert';

export default {
  title: 'UI/Input',
  component: Input,
} as Meta;

const Template: Story<InputProps> = (args) => {
  return <Input {...args} />;
};

export const Default = Template.bind({});

Default.args = {
  placeholder: 'Placeholder text',
};

export const Disabled = Template.bind({});

Disabled.args = {
  disabled: true,
  placeholder: 'Placeholder text',
};

export const IconsAsString = Template.bind({});
IconsAsString.args = {
  trailingIcon: 'mdi-light:home',
  leadingIcon: 'mdi-light:home',
  placeholder: 'Icon as string',
};

export const IconsAsSvgIcon = Template.bind({});
IconsAsSvgIcon.args = {
  trailingIcon: alertIcon,
  leadingIcon: alertIcon,
  placeholder: 'Icon as SvgIcon',
};

export const WithError = Template.bind({});
WithError.args = {
  trailingIcon: 'carbon:error-filled',
  leadingIcon: alertIcon,
  placeholder: 'Error',
  'aria-invalid': 'true',
};

export const GreaterFontSize = Template.bind({});
GreaterFontSize.args = {
  trailingIcon: 'mdi-light:home',
  leadingIcon: 'mdi-light:home',
  placeholder: 'Icon as string',
  sx: {
    fontSize: '2xl',
  },
};

export const InsideFlex = () => {
  return (
    <Flex
      sx={{
        height: '100px',
        width: '100%',
        border: 'default',
        padding: 'lg',
      }}
    >
      <Input
        sx={{ height: '100%', flex: 1 }}
        placeholder="Input inside container with padding"
      />
      <Input
        sx={{
          height: '100%',
          flex: 2,
          margin: '3xl',
          border: 'default',
          padding: 'lg',
        }}
        trailingIcon="carbon:error-filled"
        placeholder="Input with padding and margin inside container with padding"
      />
    </Flex>
  );
};
