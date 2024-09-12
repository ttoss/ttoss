import { List, ListItem } from '@ttoss/components/List';
import { Meta, StoryFn } from '@storybook/react';

export default {
  title: 'Components/List',
  component: List,
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

export const componentsListDefault = Template.bind({});
