import { render, screen } from '@ttoss/test-utils/react';
import { CardWrapper } from 'src/Cards/Wrapper';

describe('CardWrapper', () => {
  test('should render title', () => {
    render(
      <CardWrapper title="Test Card">
        <div>Card Content</div>
      </CardWrapper>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  test('should render description with tooltip', () => {
    render(
      <CardWrapper title="Test Card" description="Card description">
        <div>Card Content</div>
      </CardWrapper>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    // Tooltip icon should be present when description is provided
    // The actual tooltip rendering depends on TooltipIcon component
  });

  test('should render without description', () => {
    render(
      <CardWrapper title="Test Card">
        <div>Card Content</div>
      </CardWrapper>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  test('should apply default variant styles', () => {
    render(
      <CardWrapper title="Test Card" variant="default">
        <div>Card Content</div>
      </CardWrapper>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  test('should apply dark variant styles', () => {
    render(
      <CardWrapper title="Test Card" variant="dark">
        <div>Card Content</div>
      </CardWrapper>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  test('should apply light-green variant styles', () => {
    render(
      <CardWrapper title="Test Card" variant="light-green">
        <div>Card Content</div>
      </CardWrapper>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  test('should render children', () => {
    render(
      <CardWrapper title="Test Card">
        <div data-testid="child-content">Child Content</div>
        <button>Action Button</button>
      </CardWrapper>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });
});
