import { Button, Flex } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as Meta;

const Template: Story = (args) => {
  return (
    <Flex
      sx={{
        gap: 3,
        flexDirection: 'column',
        alignItems: 'start',
      }}
    >
      <Button {...args}>Click Me!</Button>
      <Button {...args} disabled>
        Click Me! (disabled)
      </Button>
    </Flex>
  );
};

export const Primary = Template.bind({});
Primary.args = {
  variant: 'primary',
};

export const Secondary = Template.bind({});
Secondary.args = {
  variant: 'secondary',
};
