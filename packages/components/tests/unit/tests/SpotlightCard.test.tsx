import { SpotlightCard } from '@ttoss/components/SpotlightCard';
import { fireEvent, render, screen } from '@ttoss/test-utils/react';

describe('SpotlightCard', () => {
  test('should render SpotlightCard with essential props (no buttons)', () => {
    render(
      <SpotlightCard
        title="Main Title"
        description="Detailed description"
        icon="test-symbol"
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
        icon="test-symbol"
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
        icon="symbol"
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
        icon="symbol"
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
        icon="symbol"
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
        icon="symbol"
      />
    );

    expect(screen.getByText('Accent Card')).toBeInTheDocument();
    expect(screen.getByTestId('spotlight-card')).toBeInTheDocument();
  });

  test('should render correctly with primary variant', () => {
    render(
      <SpotlightCard
        title="Primary Card"
        description="This card uses the primary variant"
        icon="symbol"
        variant="primary"
      />
    );

    expect(screen.getByText('Primary Card')).toBeInTheDocument();
    expect(screen.getByTestId('spotlight-card')).toBeInTheDocument();
  });

  test('should render primitive button prop (string) as button content', () => {
    render(
      <SpotlightCard
        title="Primitive Button"
        description="Button as string"
        icon="symbol"
        firstButton={'Click me'}
      />
    );

    // When a primitive is provided it should be rendered as-is
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('should merge sx from button props and render styled button', () => {
    render(
      <SpotlightCard
        title="Styled Button"
        description="Button with sx"
        icon="symbol"
        firstButton={{ children: 'Styled', sx: { color: 'red' } }}
      />
    );

    const btn = screen.getByText('Styled');
    expect(btn).toBeInTheDocument();
  });

  test('should render accent variant explicitly', () => {
    render(
      <SpotlightCard
        title="Accent Explicit"
        description="Accent variant"
        icon="symbol"
        variant="accent"
      />
    );

    expect(screen.getByText('Accent Explicit')).toBeInTheDocument();
  });
});
