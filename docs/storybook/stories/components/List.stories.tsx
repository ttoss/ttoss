import { Meta, StoryFn } from '@storybook/react-webpack5';
import { List, ListItem } from '@ttoss/components/List';

export default {
  title: 'Components/List',
  component: List,
  parameters: {
    docs: {
      description: {
        component:
          'Simple unordered list component that renders ListItem children. Theme-aware and fully customizable with sx prop support.',
      },
    },
  },
  tags: ['autodocs'],
} as Meta;

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
