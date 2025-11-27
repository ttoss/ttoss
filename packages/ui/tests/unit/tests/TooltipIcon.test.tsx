import { render, screen } from '@ttoss/test-utils/react';

import { TooltipIcon } from '../../../src';

describe('TooltipIcon', () => {
  test('should render icon without tooltip', () => {
    render(<TooltipIcon icon="info-circle" data-testid="tooltip-icon" />);
    expect(screen.getByTestId('tooltip-icon')).toBeInTheDocument();
  });

  test('should render icon with tooltip', () => {
    render(
      <TooltipIcon
        icon="info-circle"
        tooltip={{ children: 'Test tooltip' }}
        data-testid="tooltip-icon"
      />
    );
    expect(screen.getByTestId('tooltip-icon')).toBeInTheDocument();
  });

  test('should apply variant to icon wrapper', () => {
    render(
      <TooltipIcon
        icon="warning-alt"
        variant="warning"
        data-testid="tooltip-icon"
      />
    );
    expect(screen.getByTestId('tooltip-icon')).toBeInTheDocument();
  });

  test('should handle click events', () => {
    const handleClick = jest.fn();
    render(
      <TooltipIcon
        icon="info-circle"
        onClick={handleClick}
        data-testid="tooltip-icon"
      />
    );

    screen.getByTestId('tooltip-icon').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('should apply custom styles', () => {
    render(
      <TooltipIcon
        icon="info-circle"
        sx={{ color: 'red' }}
        data-testid="tooltip-icon"
      />
    );
    expect(screen.getByTestId('tooltip-icon')).toBeInTheDocument();
  });

  test('should render tooltip with additional props', () => {
    render(
      <TooltipIcon
        icon="info-circle"
        tooltip={{
          children: 'Test tooltip',
          place: 'top',
          openOnClick: true,
        }}
        data-testid="tooltip-icon"
      />
    );
    expect(screen.getByTestId('tooltip-icon')).toBeInTheDocument();
  });

  test('should show pointer cursor when onClick is provided', () => {
    render(
      <TooltipIcon
        icon="info-circle"
        onClick={() => {}}
        data-testid="tooltip-icon"
      />
    );
    const iconElement = screen.getByTestId('tooltip-icon');
    expect(iconElement).toHaveStyle({ cursor: 'pointer' });
  });

  test('should show default cursor when onClick is not provided', () => {
    render(<TooltipIcon icon="info-circle" data-testid="tooltip-icon" />);
    const iconElement = screen.getByTestId('tooltip-icon');
    expect(iconElement).toHaveStyle({ cursor: 'default' });
  });
});
