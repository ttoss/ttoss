import { Badge, Flex } from '@ttoss/ui';
import { ComponentMeta, Story } from '@storybook/react';

export default {
  title: 'UI/Badge',
  component: Badge,
} as ComponentMeta<typeof Badge>;

const Template: Story = (args) => {
  return (
    <Flex
      sx={{
        gap: 'md',
      }}
    >
      <Badge {...args}>Primary</Badge>
    </Flex>
  );
};

export const Example = Template.bind({});
