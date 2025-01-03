import * as React from 'react';
import { Badge, BadgeProps, Flex } from '@ttoss/ui';
import { ComponentMeta, Story } from '@storybook/react';

export default {
  title: 'UI/Badge',
  component: Badge,
} as ComponentMeta<typeof Badge>;

const Template: Story<BadgeProps> = (args) => {
  const [chips, setChips] = React.useState([
    'Chip 1',
    'Chip 2',
    'Chip 3',
    'Chip 4',
  ]);

  const handleDelete = (chip: string) => {
    return setChips((prev) => {
      return prev.filter((c) => {
        return c !== chip;
      });
    });
  };

  return (
    <Flex
      sx={{
        gap: '2',
        flexDirection: 'column',
        alignItems: 'start',
      }}
    >
      <Badge {...args}>Label</Badge>
      <Badge {...args} icon="radio-not-selected">
        Label
      </Badge>

      {chips.map((chip) => {
        return (
          <Badge
            {...args}
            key={chip}
            chip
            onDelete={() => {
              return handleDelete(chip);
            }}
          >
            {chip}
          </Badge>
        );
      })}
    </Flex>
  );
};

export const Positive = Template.bind({});

Positive.args = {
  variant: 'positive',
};

export const Negative = Template.bind({});

Negative.args = {
  variant: 'negative',
};

export const Neutral = Template.bind({});

Neutral.args = {
  variant: 'neutral',
};

export const Informative = Template.bind({});

Informative.args = {
  variant: 'informative',
};

export const Muted = Template.bind({});

Muted.args = {
  variant: 'muted',
};
