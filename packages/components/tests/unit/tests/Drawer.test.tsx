import { render, screen } from '@ttoss/test-utils';

import { Drawer } from '../../../src/components/Drawer';

describe('Drawer', () => {
  test('should renders children content', () => {
    const testMessage = 'Test content';
    render(
      <Drawer direction="right" open={true}>
        <div>{testMessage}</div>
      </Drawer>
    );

    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });

  test('should apply custom styles from sx prop', () => {
    const customStyle = { backgroundColor: 'red' };
    render(
      <Drawer open={true} direction="right" sx={customStyle}>
        Test content
      </Drawer>
    );

    const drawerComponent = screen.getByTestId('drawer-container');
    expect(drawerComponent).toHaveStyleRule('background-color', 'red');
  });

  test('should propagates props to DrawerUi component', () => {
    const testMessage = 'Test content';
    render(
      <Drawer direction="top" open={true} enableOverlay={false}>
        <div>{testMessage}</div>
      </Drawer>
    );

    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });
});
