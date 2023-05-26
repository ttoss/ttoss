import { Flex, Input, InputProps } from '@ttoss/ui/src';
import { Meta, Story } from '@storybook/react';
import radioButtonIcon from '@iconify/icons-carbon/radio-button';

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
  value: 'Text',
};

export const Disabled = Template.bind({});

Disabled.args = {
  ...Default.args,
  disabled: true,
};

export const WithError = Template.bind({});
WithError.args = {
  ...Default.args,
  trailingIcon: 'warning-alt',
  placeholder: 'Error',
  'aria-invalid': 'true',
};

export const IconsAsString = Template.bind({});
IconsAsString.args = {
  ...Default.args,
  trailingIcon: 'radio-not-selected',
  placeholder: 'Icon as string',
};

export const IconsAsSvgIcon = Template.bind({});
IconsAsSvgIcon.args = {
  ...Default.args,
  trailingIcon: radioButtonIcon,
  placeholder: 'Icon as SvgIcon',
};

export const GreaterFontSize = Template.bind({});
GreaterFontSize.args = {
  ...Default.args,
  trailingIcon: 'radio-not-selected',
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
        trailingIcon="radio-not-selected"
        placeholder="Input with padding and margin inside container with padding"
      />
    </Flex>
  );
};
