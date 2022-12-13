import { Flex, Heading } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'UI/Heading',
  component: Heading,
  argTypes: {
    text: {
      control: 'text',
      defaultValue: 'Text for Heading ',
    },
  },
} as Meta;

const as = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

const Template: Story = (args) => {
  return (
    <Flex sx={{ flexDirection: 'column', gap: 2 }}>
      {as.map((tag) => {
        return (
          <Heading as={tag} variant={tag} key={tag}>
            {args.text} {tag}
          </Heading>
        );
      })}
    </Flex>
  );
};

export const Example = Template.bind({});
