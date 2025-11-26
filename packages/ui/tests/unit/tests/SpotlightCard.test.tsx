import { fireEvent, render, screen } from '@ttoss/test-utils/react';

import { SpotlightCard } from '../../../src/components/SpotlightCard';

describe('SpotlightCard', () => {
  test('should render SpotlightCard with essential props (no buttons)', () => {
    render(
      <SpotlightCard
        title="Main Title"
        description="Detailed description"
        iconSymbol="test-symbol"
      />
    );

    expect(screen.getByTestId('spotlight-card')).toBeInTheDocument();
    expect(screen.getByText('Main Title')).toBeInTheDocument();
    expect(screen.getByText('Detailed description')).toBeInTheDocument();

    // Ensure buttons are NOT rendered
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  test('should render buttons when props are provided', () => {
    render(
      <SpotlightCard
        title="Main Title"
        description="Desc"
        iconSymbol="test-symbol"
        firstButton={{ children: 'Watch Tutorial' }}
        secondButton={{ children: 'Read Article' }}
      />
    );

    expect(screen.getByText('Watch Tutorial')).toBeInTheDocument();
    expect(screen.getByText('Read Article')).toBeInTheDocument();
  });

  test('should render subtitle when provided', () => {
    render(
      <SpotlightCard
        title="Main Title"
        subtitle="Optional Subtitle"
        description="Desc"
        iconSymbol="symbol"
      />
    );
    expect(screen.getByText('Optional Subtitle')).toBeInTheDocument();
  });

  test('should call click handlers when buttons are clicked', () => {
    const onFirstMock = jest.fn();
    const onSecondMock = jest.fn();

    render(
      <SpotlightCard
        title="Title"
        description="Desc"
        iconSymbol="symbol"
        firstButton={{
          children: 'Primary Button',
          onClick: onFirstMock,
        }}
        secondButton={{
          children: 'Secondary Button',
          onClick: onSecondMock,
        }}
      />
    );

    fireEvent.click(screen.getByText('Primary Button'));
    expect(onFirstMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Secondary Button'));
    expect(onSecondMock).toHaveBeenCalledTimes(1);
  });

  test('should render custom ReactNode as a button', () => {
    render(
      <SpotlightCard
        title="Title"
        description="Desc"
        iconSymbol="symbol"
        firstButton={<div data-testid="custom-element">Custom Element</div>}
      />
    );

    expect(screen.getByTestId('custom-element')).toBeInTheDocument();
    expect(screen.getByText('Custom Element')).toBeInTheDocument();
  });

  test('should render correctly with default variant (accent)', () => {
    render(
      <SpotlightCard
        title="Accent Card"
        description="This card uses the default accent variant"
        iconSymbol="symbol"
        // variant prop is optional, defaults to 'accent'
      />
    );

    expect(screen.getByText('Accent Card')).toBeInTheDocument();
    // Podemos verificar se o data-testid está presente, garantindo que não houve crash
    expect(screen.getByTestId('spotlight-card')).toBeInTheDocument();
  });

  test('should render correctly with dark variant', () => {
    render(
      <SpotlightCard
        title="Dark Card"
        description="This card uses the dark variant"
        iconSymbol="symbol"
        variant="dark"
      />
    );

    expect(screen.getByText('Dark Card')).toBeInTheDocument();
    expect(screen.getByTestId('spotlight-card')).toBeInTheDocument();
  });
});
