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
        gap: 'lg',
        flexDirection: 'column',
        alignItems: 'start',
      }}
    >
      <Button {...args}>No icons</Button>
      <Button {...args} rightIcon="mdi-light:home">
        Right Icon
      </Button>
      <Button {...args} leftIcon="mdi-light:home">
        Left Icon
      </Button>
      <Button {...args} leftIcon="mdi-light:home" rightIcon="mdi-light:home">
        Right and Left Icons
      </Button>
      <Button {...args} disabled>
        Disabled
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

export const Neutral = Template.bind({});
Neutral.args = {
  variant: 'neutral',
};

export const Danger = Template.bind({});
Danger.args = {
  variant: 'danger',
};
