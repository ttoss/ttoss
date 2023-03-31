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
      <HelpText {...args}>HelpText content</HelpText>
      <HelpText {...args} disabled>
        HelpText content Disabled
      </HelpText>
    </Flex>
  );
};

export const Default = Template.bind({});

export const Negative = Template.bind({});

Negative.args = {
  negative: true,
};
