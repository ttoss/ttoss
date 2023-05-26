import { ComponentMeta, Story } from '@storybook/react';
import { Flex, HelpText, HelpTextProps } from '@ttoss/ui';

export default {
  title: 'UI/HelpText',
  component: HelpText,
} as ComponentMeta<typeof HelpText>;

const Template: Story<HelpTextProps> = (args) => {
  return (
    <Flex
      sx={{
        gap: 'md',
        flexDirection: 'column',
      }}
    >
      <HelpText {...args}>Help text</HelpText>
      <HelpText {...args} disabled>
        Help text
      </HelpText>
    </Flex>
  );
};

export const Default = Template.bind({});

export const Negative = Template.bind({});

Negative.args = {
  negative: true,
};
