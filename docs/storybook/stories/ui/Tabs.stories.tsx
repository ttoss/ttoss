import { Meta, StoryObj } from '@storybook/react';
import { Flex, Tabs } from '@ttoss/ui';

type Story = StoryObj<typeof Tabs>;

export default {
  title: 'UI/Tabs',
  component: Tabs,
} as Meta<typeof Tabs>;

export const Default: Story = {
  args: {
    rootValue: 'members',
    variant: 'line',
    triggerList: [
      {
        value: 'members',
        name: 'Members',
        leftIcon: 'fluent:person-24-regular',
      },
      {
        value: 'campaigns',
        name: 'Campaigns',
        leftIcon: 'fluent:arrow-trending-lines-20-filled',
      },
    ],
    triggerContentList: [
      { value: 'members', content: <Flex>Members content</Flex> },
      { value: 'campaigns', content: <Flex>Campaigns content</Flex> },
    ],
  },
};
