import { ToastContainer } from '@ttoss/components';
import { render } from '@ttoss/test-utils/react';

describe('ToastContainer', () => {
  test('renders without crashing', () => {
    render(<ToastContainer />);
  });

  test('renders with custom props', () => {
    const { container } = render(
      <ToastContainer position="top-right" autoClose={3000} />
    );
    expect(container.firstChild).not.toBeNull();
  });
});
