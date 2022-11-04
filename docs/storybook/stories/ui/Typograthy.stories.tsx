import { Flex, Text, TextProps } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';

type TypographyProps = {
  tag: TextProps['as'];
  content: string;
};

const Typography = ({ content, tag }: TypographyProps) => {
  return (
    <Text as={tag} sx={{ gap: 3, alignItems: 'center' }}>
      {content}
    </Text>
  );
};

export default {
  title: 'UI/Typography',
  component: Typography,
} as Meta;

const Template: Story = (args) => {
  const examples = (
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as Array<TextProps['as']>
  ).map((tag) => {
    return {
      tag,
      content: `${args.text} ${tag}`,
    };
  });

  return (
    <Flex sx={{ flexDirection: 'column', gap: 2 }}>
      {examples.map((example) => {
        return (
          <Typography key={`typograthy-tag-${example.tag}`} {...example} />
        );
      })}
    </Flex>
  );
};

export const Example = Template.bind({});

Example.args = {
  text: 'Content built with tag',
};
