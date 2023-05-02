import { Badge, BadgeProps, Flex } from '@ttoss/ui';
import { ComponentMeta, Story } from '@storybook/react';

export default {
  title: 'UI/Badge',
  component: Badge,
} as ComponentMeta<typeof Badge>;

const Template: Story<BadgeProps> = (args) => {
  return (
    <Flex
      sx={{
        gap: 'md',
        flexDirection: 'column',
        alignItems: 'start',
      }}
    >
      <Badge {...args} />
      <Badge {...args} icon="mdi-light:home" />
    </Flex>
  );
};

export const Positive = Template.bind({});

Positive.args = {
  variant: 'positive',
  children: <>{'positive'}</>,
};

export const Negative = Template.bind({});

Negative.args = {
  variant: 'negative',
  children: <>{'negative'}</>,
};

export const Neutral = Template.bind({});

Neutral.args = {
  variant: 'neutral',
  children: <>{'neutral'}</>,
};

export const Informative = Template.bind({});

Informative.args = {
  variant: 'informative',
  children: <>{'informative'}</>,
};

export const Muted = Template.bind({});

Muted.args = {
  variant: 'muted',
  children: <>{'muted'}</>,
};
