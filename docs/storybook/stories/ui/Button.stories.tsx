import { Meta, Story } from '@storybook/react-webpack5';
import { Button, ButtonProps, Flex } from '@ttoss/ui';

export default {
  title: 'UI/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'Primary button component for actions and navigation. Supports different variants, sizes, and states with full theme integration.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'close'],
      description: 'Visual style variant',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button interaction',
    },
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
