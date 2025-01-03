import * as React from 'react';
import { Box, Flex, Heading } from '@ttoss/ui';
import { Label, Select, useTheme } from '@ttoss/ui';
import { Meta, StoryFn } from '@storybook/react';

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

const Template: StoryFn = (args) => {
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

const TemplateLineHeights: StoryFn = (args) => {
  const { theme } = useTheme();
  const lineHeights = Object.keys(
    theme.lineHeights as unknown as { [key: string]: string }
  );

  const [selectedLineHeight, setSelectedLineHeight] =
    React.useState<string>('base');

  return (
    <Flex sx={{ flexDirection: 'column', gap: '6' }}>
      <Box>
        <Label>Line Height</Label>

        <Select
          value={selectedLineHeight}
          onChange={(e) => {
            return setSelectedLineHeight(e.target.value);
          }}
        >
          {lineHeights.map((lineHeight) => {
            return (
              <option key={lineHeight} value={lineHeight}>
                {lineHeight}
              </option>
            );
          })}
        </Select>
      </Box>
      <Flex sx={{ flexDirection: 'column', gap: '4' }}>
        {as.map((tag) => {
          return (
            <Heading
              sx={{ lineHeight: selectedLineHeight, backgroundColor: 'muted' }}
              as={tag}
              variant={tag}
              key={tag}
            >
              {args.text} {tag}
            </Heading>
          );
        })}
      </Flex>
    </Flex>
  );
};

export const ExampleWithDifferentLineHeights = TemplateLineHeights.bind({});

export const Example = Template.bind({});
