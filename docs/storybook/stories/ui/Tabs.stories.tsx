import { Meta, StoryObj } from '@storybook/react';
import { Flex, Tabs } from '@ttoss/ui';

type Story = StoryObj<typeof Tabs>;

export default {
  title: 'UI/Tabs',
  component: Tabs,
} as Meta<typeof Tabs>;

export const Default: Story = {
  args: {
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
      {
        value: 'dataloggers',
        name: 'Dataloggers',
        leftIcon: 'fluent:arrow-trending-lines-20-filled',
        disabled: true,
      },
    ],
    triggerContentList: [
      { value: 'members', content: <Flex>Members content</Flex> },
      { value: 'campaigns', content: <Flex>Campaigns content</Flex> },
      { value: 'dataloggers', content: <Flex>Dataloggers content</Flex> },
    ],
  },
};
