import { Drawer } from '../../../src/components/Drawer';
import { render, screen } from '@ttoss/test-utils';

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
        <div>Test content</div>
      </Drawer>
    );

    const boxComponent = screen.getByRole('navigation').firstChild;
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
