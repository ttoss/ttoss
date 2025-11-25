import { fireEvent, render, screen } from '@ttoss/test-utils/react';

import { SpotlightCard } from '../../../src/components/SpotlightCard';

describe('SpotlightCard', () => {
  test('should render SpotlightCard with essential props (no buttons)', () => {
    render(
      <SpotlightCard
        title="Main Title"
        description="Detailed description"
        iconName="TestIcon"
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

  test('should render buttons when labels are provided', () => {
    render(
      <SpotlightCard
        title="Main Title"
        description="Desc"
        primaryLabel="Watch Tutorial"
        secondaryLabel="Read Article"
        iconName="TestIcon"
        iconSymbol="test-symbol"
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
        iconName="Icon"
        iconSymbol="symbol"
      />
    );
    expect(screen.getByText('Optional Subtitle')).toBeInTheDocument();
  });

  test('should call click handlers when buttons are clicked', () => {
    const onPrimaryMock = jest.fn();
    const onSecondaryMock = jest.fn();

    render(
      <SpotlightCard
        title="Title"
        description="Desc"
        primaryLabel="Primary Button"
        secondaryLabel="Secondary Button"
        iconName="Icon"
        iconSymbol="symbol"
        onPrimaryClick={onPrimaryMock}
        onSecondaryClick={onSecondaryMock}
      />
    );

    fireEvent.click(screen.getByText('Primary Button'));
    expect(onPrimaryMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Secondary Button'));
    expect(onSecondaryMock).toHaveBeenCalledTimes(1);
  });
});
