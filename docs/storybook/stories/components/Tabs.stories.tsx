import { Meta, StoryObj } from '@storybook/react-webpack5';
import { Tabs } from '@ttoss/components/Tabs';
import { Icon } from '@ttoss/react-icons';
import { Flex } from '@ttoss/ui';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  parameters: {
    docs: {
      description: {
        component:
          'Tab navigation component with content panels. Supports icons, disabled states, and customizable styling. Built with accessibility in mind.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

const RenderTable = () => {
  const args = {
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
  };

  return (
    <Tabs>
      <Tabs.TabList>
        {args.triggerList.map((trigger) => {
          return (
            <Tabs.Tab key={trigger.value} disabled={trigger.disabled}>
              <Flex sx={{ gap: '2' }}>
                {trigger.leftIcon && <Icon icon={trigger.leftIcon} />}
                {trigger.name}
              </Flex>
            </Tabs.Tab>
          );
        })}
      </Tabs.TabList>
      {args.triggerContentList.map((content) => {
        return (
          <Tabs.TabPanel key={content.value}>{content.content}</Tabs.TabPanel>
        );
      })}
    </Tabs>
  );
};

export const Example: StoryObj = {
  render: RenderTable,
};
