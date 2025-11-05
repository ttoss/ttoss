import { render } from '@ttoss/test-utils/react';

import { List, ListItem } from '../../../src/components/List';

describe('List component', () => {
  test('renders a list with items', () => {
    const { getByText } = render(
      <List>
        <ListItem>Item 1</ListItem>
        <ListItem>Item 2</ListItem>
        <ListItem>Item 3</ListItem>
      </List>
    );

    expect(getByText('Item 1')).toBeInTheDocument();
    expect(getByText('Item 2')).toBeInTheDocument();
    expect(getByText('Item 3')).toBeInTheDocument();
  });
});

describe('ListItem component', () => {
  test('renders a list item with text', () => {
    const { getByText } = render(<ListItem>Item</ListItem>);
    expect(getByText('Item')).toBeInTheDocument();
  });
});
