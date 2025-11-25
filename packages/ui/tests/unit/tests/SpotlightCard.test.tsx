import { render, screen } from '@ttoss/test-utils/react';

import { SpotlightCard } from '../../../src/components/SpotlightCard';

describe('SpotlightCard', () => {
  test('should render SpotlightCard with required props', () => {
    render(
      <SpotlightCard
        title="Main Title"
        description="Detailed description"
        tutorialLabel="Watch Tutorial"
        articleLabel="Read Article"
        iconName="TestIcon"
        iconSymbol="test-symbol"
      />
    );
    expect(screen.getByTestId('spotlight-card')).toBeInTheDocument();
    expect(screen.getByText('Main Title')).toBeInTheDocument();
    expect(screen.getByText('Detailed description')).toBeInTheDocument();
    expect(screen.getByText('Watch Tutorial')).toBeInTheDocument();
    expect(screen.getByText('Read Article')).toBeInTheDocument();
  });
});
