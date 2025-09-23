import { ComponentMeta, Story } from '@storybook/react-webpack5';
import { Flex, HelpText, HelpTextProps } from '@ttoss/ui';

export default {
  title: 'UI/HelpText',
  component: HelpText,
} as ComponentMeta<typeof HelpText>;

const Template: Story<HelpTextProps> = (args) => {
  return (
    <Flex
      sx={{
        gap: '2',
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
