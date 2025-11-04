import { render, screen, userEvent } from '@ttoss/test-utils/react';

import { CloseButton } from '../../../src';

describe('CloseButton', () => {
  test('should render CloseButton', () => {
    render(<CloseButton data-testid="close-btn" />);
    expect(screen.getByTestId('close-btn')).toBeInTheDocument();
  });

  test('should accept sx prop', () => {
    render(
      <CloseButton data-testid="close-btn" sx={{ backgroundColor: 'red' }} />
    );
    expect(screen.getByTestId('close-btn')).toHaveStyleRule(
      'background-color',
      'red'
    );
  });

  test('should call onClick function', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup({ delay: null });
    render(<CloseButton data-testid="close-btn" onClick={onClick} />);
    await user.click(screen.getByTestId('close-btn'));
    expect(onClick).toHaveBeenCalled();
  });
});
