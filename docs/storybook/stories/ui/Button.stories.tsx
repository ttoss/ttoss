import { Button, ButtonProps, Flex } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as Meta;

const Template: Story<ButtonProps> = (args) => {
  return (
    <Flex
      sx={{
        gap: '4',
        flexDirection: 'column',
        alignItems: 'start',
      }}
    >
      <Button {...args}>Label</Button>
      <Button {...args} rightIcon="radio-not-selected">
        Label
      </Button>
      <Button {...args} leftIcon="radio-not-selected">
        Label
      </Button>
      <Button
        {...args}
        leftIcon="radio-not-selected"
        rightIcon="radio-not-selected"
      >
        Label
      </Button>
      <Button {...args} loading>
        Label
      </Button>
    </Flex>
  );
};

export const Accent = Template.bind({});
Accent.args = {
  variant: 'accent',
};

export const Primary = Template.bind({});
Primary.args = {
  variant: 'primary',
};

export const Secondary = Template.bind({});
Secondary.args = {
  variant: 'secondary',
};

export const Destructive = Template.bind({});
Destructive.args = {
  variant: 'destructive',
};

export const Disabled = Template.bind({});
Disabled.args = {
  disabled: true,
};
