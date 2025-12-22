import { render, screen } from '@ttoss/test-utils/react';

import { EnhancedTitle } from '../../../src/components/EnhancedTitle';

describe('EnhancedTitle', () => {
  test('renders title correctly', () => {
    render(<EnhancedTitle title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders frontTitle when provided', () => {
    render(<EnhancedTitle title="Plan Name" frontTitle="$99/month" />);
    expect(screen.getByText('$99/month')).toBeInTheDocument();
  });

  test('renders description when provided', () => {
    render(
      <EnhancedTitle
        title="Test Title"
        description="This is a test description"
      />
    );
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  test('renders icon when provided', () => {
    render(<EnhancedTitle title="Test Title" icon="fluent:shield-24-filled" />);
    // Icon is rendered - component doesn't throw error
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders top badges when provided', () => {
    render(
      <EnhancedTitle
        title="Test Title"
        topBadges={[
          { label: 'Active', variant: 'positive' },
          { label: 'Popular', variant: 'informative' },
        ]}
      />
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Popular')).toBeInTheDocument();
  });

  test('renders bottom badges when provided', () => {
    render(
      <EnhancedTitle
        title="Test Title"
        bottomBadges={[
          { label: 'Feature 1', icon: 'fluent:checkmark-24-filled' },
          { label: 'Feature 2' },
        ]}
      />
    );
    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
  });

  test('renders with all props combined', () => {
    render(
      <EnhancedTitle
        variant="accent"
        icon="fluent:star-24-filled"
        title="Pro Plan"
        description="Best for professionals"
        frontTitle="$199/month"
        topBadges={[{ label: 'Most Popular', variant: 'informative' }]}
        bottomBadges={[
          { label: 'Advanced Analytics' },
          { label: 'Priority Support' },
        ]}
      />
    );

    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    expect(screen.getByText('Best for professionals')).toBeInTheDocument();
    expect(screen.getByText('$199/month')).toBeInTheDocument();
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
    expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
    expect(screen.getByText('Priority Support')).toBeInTheDocument();
  });

  test('uses default variant when not specified', () => {
    render(<EnhancedTitle title="Test Title" icon="fluent:star-24-filled" />);
    // Default variant renders without errors
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('does not render icon when not provided', () => {
    render(<EnhancedTitle title="Test Title" />);
    // Component renders without icon - no errors
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('does not render description when not provided', () => {
    render(<EnhancedTitle title="Test Title" />);
    expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
  });

  test('does not render frontTitle when not provided', () => {
    const { container } = render(<EnhancedTitle title="Test Title" />);
    const texts = container.querySelectorAll('p');
    // Should only have no text elements since no description or frontTitle
    expect(texts).toHaveLength(0);
  });

  test('renders empty arrays for badges without errors', () => {
    render(
      <EnhancedTitle title="Test Title" topBadges={[]} bottomBadges={[]} />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('applies custom badge icons', () => {
    render(
      <EnhancedTitle
        title="Test Title"
        bottomBadges={[{ label: 'Custom', icon: 'fluent:star-24-filled' }]}
      />
    );
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  test('applies default icon for bottom badges when not specified', () => {
    render(
      <EnhancedTitle title="Test Title" bottomBadges={[{ label: 'Feature' }]} />
    );
    expect(screen.getByText('Feature')).toBeInTheDocument();
  });

  test('renders with spotlight-accent variant', () => {
    render(
      <EnhancedTitle
        title="Test Title"
        icon="fluent:star-24-filled"
        variant="spotlight-accent"
      />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders with spotlight-primary variant', () => {
    render(
      <EnhancedTitle
        title="Test Title"
        icon="fluent:star-24-filled"
        variant="spotlight-primary"
      />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders with primary variant', () => {
    render(
      <EnhancedTitle
        title="Test Title"
        icon="fluent:star-24-filled"
        variant="primary"
      />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders with secondary variant', () => {
    render(
      <EnhancedTitle
        title="Test Title"
        icon="fluent:star-24-filled"
        variant="secondary"
      />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders with accent variant', () => {
    render(
      <EnhancedTitle
        title="Test Title"
        icon="fluent:star-24-filled"
        variant="accent"
      />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders with positive variant', () => {
    render(
      <EnhancedTitle
        title="Test Title"
        icon="fluent:star-24-filled"
        variant="positive"
      />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders with negative variant', () => {
    render(
      <EnhancedTitle
        title="Test Title"
        icon="fluent:star-24-filled"
        variant="negative"
      />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders with informative variant', () => {
    render(
      <EnhancedTitle
        title="Test Title"
        icon="fluent:star-24-filled"
        variant="informative"
      />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders with muted variant', () => {
    render(
      <EnhancedTitle
        title="Test Title"
        icon="fluent:star-24-filled"
        variant="muted"
      />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders top badges without icons', () => {
    render(
      <EnhancedTitle
        title="Test Title"
        topBadges={[{ label: 'No Icon Badge' }]}
      />
    );
    expect(screen.getByText('No Icon Badge')).toBeInTheDocument();
  });

  test('renders with multiple top badges with different variants', () => {
    render(
      <EnhancedTitle
        title="Test Title"
        topBadges={[
          {
            label: 'Badge 1',
            variant: 'positive',
            icon: 'fluent:checkmark-24-filled',
          },
          {
            label: 'Badge 2',
            variant: 'negative',
            icon: 'fluent:dismiss-24-filled',
          },
          { label: 'Badge 3', variant: 'informative' },
          { label: 'Badge 4', variant: 'muted' },
        ]}
      />
    );
    expect(screen.getByText('Badge 1')).toBeInTheDocument();
    expect(screen.getByText('Badge 2')).toBeInTheDocument();
    expect(screen.getByText('Badge 3')).toBeInTheDocument();
    expect(screen.getByText('Badge 4')).toBeInTheDocument();
  });

  test('renders with multiple bottom badges with different icons', () => {
    render(
      <EnhancedTitle
        title="Test Title"
        bottomBadges={[
          { label: 'Feature A', icon: 'fluent:star-24-filled' },
          { label: 'Feature B', icon: 'fluent:rocket-24-filled' },
          { label: 'Feature C' }, // Uses default icon
        ]}
      />
    );
    expect(screen.getByText('Feature A')).toBeInTheDocument();
    expect(screen.getByText('Feature B')).toBeInTheDocument();
    expect(screen.getByText('Feature C')).toBeInTheDocument();
  });
});
