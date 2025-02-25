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

  test('should applies custom styles from sx prop', () => {
    const customStyle = { backgroundColor: 'red' };
    render(
      <Drawer open={true} direction="right" sx={customStyle}>
        Test content
      </Drawer>
    );

    const boxComponent = screen.getByText('Test content');
    expect(boxComponent).toHaveStyle(customStyle);
  });

  test('should propagates props to DrawerUi component', () => {
    const testMessage = 'Test content';
    render(
      <Drawer direction="right" open={true}>
        <div>{testMessage}</div>
      </Drawer>
    );

    expect(screen.getByText(testMessage)).toBeVisible();
  });
});
