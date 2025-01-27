import { Meta, StoryObj } from '@storybook/react';
import { Tabs } from '@ttoss/components/Tabs';
import { Flex } from '@ttoss/ui';

type Story = StoryObj<typeof Tabs>;

export default {
  title: 'Components/Tabs',
  component: Tabs,
} as Meta<typeof Tabs>;

export const Default: Story = {
  args: {
    props: {
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
  },
};
