import { ComponentMeta, Story } from '@storybook/react';
import { Flex, Text, TextProps } from '@ttoss/ui';

export default {
  title: 'UI/HelpText',
  component: Text,
} as ComponentMeta<typeof Text>;

const Template: Story<TextProps> = (args) => {
  const variant = args.variant;

  return (
    <Flex
      sx={{
        gap: 'md',
        flexDirection: 'column',
      }}
    >
      <Text {...args}>
        variant:{'['}
        {variant}
        {']'}
      </Text>
      <Text {...args} aria-disabled="true">
        variant:{'['}
        {variant}
        {']'} Disabled
      </Text>
    </Flex>
  );
};

export const Neutral = Template.bind({});

Neutral.args = {
  variant: 'text.help.neutral',
};

export const Negative = Template.bind({});

Negative.args = {
  variant: 'text.help.negative',
};

export const Disabled = Template.bind({});

Disabled.args = {
  variant: 'text.help',
};
