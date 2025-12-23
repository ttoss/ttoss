import { MetricCard } from '@ttoss/components/MetricCard';
import { fireEvent, render, screen } from '@ttoss/test-utils/react';

describe('MetricCard', () => {
  test('should not render when isLoading is true', () => {
    render(
      <MetricCard
        isLoading
        metric={{
          type: 'number',
          label: 'Users',
          current: 1,
          max: 10,
        }}
      />
    );

    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  test('should render date metric with remaining days message', () => {
    render(
      <MetricCard
        metric={{
          type: 'date',
          label: 'Renewal date',
          date: '31/12/2025',
          remainingDaysMessage: '10 days remaining',
        }}
      />
    );

    expect(screen.getByText('Renewal date')).toBeInTheDocument();
    expect(screen.getByText('31/12/2025')).toBeInTheDocument();
    expect(screen.getByText('10 days remaining')).toBeInTheDocument();
  });

  test('should render number metric with max and footer text', () => {
    render(
      <MetricCard
        metric={{
          type: 'number',
          label: 'Projects',
          current: 3,
          max: 10,
          footerText: 'Active projects in your workspace',
        }}
      />
    );

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('of 10')).toBeInTheDocument();
    expect(
      screen.getByText('Active projects in your workspace')
    ).toBeInTheDocument();
  });

  test('should render percentage metric with unlimited max and show alert states', () => {
    const onClick = jest.fn();

    const { rerender } = render(
      <MetricCard
        metric={{
          type: 'percentage',
          label: 'Plan usage',
          current: 350,
          max: null,
          onClick,
        }}
      />
    );

    expect(screen.getByText('Plan usage')).toBeInTheDocument();
    expect(screen.getByText('350')).toBeInTheDocument();
    expect(screen.getByText('of ∞')).toBeInTheDocument();
    expect(screen.getByText('Unlimited')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Plan usage'));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <MetricCard
        metric={{
          type: 'percentage',
          label: 'Plan usage',
          current: 80,
          max: 100,
          showAlertThreshold: 80,
        }}
      />
    );

    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('of 100')).toBeInTheDocument();
    expect(screen.getByText('80% used')).toBeInTheDocument();
    expect(screen.getByText('Near limit')).toBeInTheDocument();

    rerender(
      <MetricCard
        metric={{
          type: 'percentage',
          label: 'Plan usage',
          current: 120,
          max: 100,
          showAlertThreshold: 80,
        }}
      />
    );

    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('Reached limit')).toBeInTheDocument();
  });
});
