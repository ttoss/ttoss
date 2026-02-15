import type { Meta, StoryFn } from '@storybook/react-webpack5';
import { List, ListItem } from '@ttoss/components/List';
import { Icon } from '@ttoss/react-icons';
import { Badge, Flex, Text } from '@ttoss/ui';

export default {
  title: 'Components/List',
  component: List,
  parameters: {
    docs: {
      description: {
        component:
          'Simple unordered list component that renders ListItem children. Theme-aware and fully customizable with sx prop support. Accepts any React content within ListItem.',
      },
    },
  },
  tags: ['autodocs'],
} as Meta;

/**
 * Basic list with simple text items.
 */
const Template: StoryFn = (args) => {
  return (
    <List {...args}>
      <ListItem>Item 1</ListItem>
      <ListItem>Item 2</ListItem>
      <ListItem>Item 3</ListItem>
    </List>
  );
};

export const Default = Template.bind({});
Default.parameters = {
  docs: {
    description: {
      story:
        'Basic list with three items. Each ListItem can contain any React content.',
    },
  },
};

/**
 * List with rich content including icons and badges.
 */
export const WithRichContent: StoryFn = () => {
  return (
    <List>
      <ListItem>
        <Flex sx={{ alignItems: 'center', gap: 2 }}>
          <Icon icon="fluent:checkmark-circle-20-filled" color="green" />
          <Text>Completed task with icon</Text>
          <Badge variant="positive">Done</Badge>
        </Flex>
      </ListItem>
      <ListItem>
        <Flex sx={{ alignItems: 'center', gap: 2 }}>
          <Icon icon="fluent:arrow-sync-circle-20-filled" color="orange" />
          <Text>In progress task</Text>
          <Badge variant="informative">Active</Badge>
        </Flex>
      </ListItem>
      <ListItem>
        <Flex sx={{ alignItems: 'center', gap: 2 }}>
          <Icon icon="fluent:clock-20-filled" color="gray" />
          <Text>Pending task</Text>
        </Flex>
      </ListItem>
    </List>
  );
};
WithRichContent.parameters = {
  docs: {
    description: {
      story:
        'List items can contain complex content like icons, text, and badges arranged with Flex layouts.',
    },
  },
};
