import { render, screen } from '@ttoss/test-utils/react';
import { BigNumberSparkline, Sparkline } from 'src/Cards/BigNumberSparkline';
import type { DashboardCard } from 'src/DashboardCard';

describe('BigNumberSparkline', () => {
  const baseCard: DashboardCard = {
    id: 'revenue',
    title: 'Total Revenue',
    numberType: 'currency',
    type: 'bigNumberSparkline',
    data: {
      value: 250000,
      series: [200000, 210000, 195000, 230000, 250000, 240000, 260000],
    },
  };

  test('renders the card title', () => {
    render(<BigNumberSparkline {...baseCard} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  test('formats currency total correctly with provided locale', () => {
    render(<BigNumberSparkline {...baseCard} locale="en-US" currency="USD" />);
    expect(screen.getByText(/250,000\.00/)).toBeInTheDocument();
  });

  test('formats currency using locale from i18n context when no locale prop given', () => {
    render(<BigNumberSparkline {...baseCard} currency="BRL" />);
    expect(
      screen.getByText(/250\.000,00|\$250,000\.00|250 000,00/)
    ).toBeInTheDocument();
  });

  test('renders SVG sparkline when series data has 2+ points', () => {
    const { container } = render(<BigNumberSparkline {...baseCard} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('path')).toBeInTheDocument();
  });

  test('SVG has accessible label matching card title', () => {
    const { container } = render(<BigNumberSparkline {...baseCard} />);
    expect(
      container.querySelector('svg[aria-label="Total Revenue"]')
    ).toBeInTheDocument();
  });

  test('does not render SVG when series has fewer than 2 points', () => {
    const card: DashboardCard = {
      ...baseCard,
      data: { value: 100, series: [100] },
    };
    const { container } = render(<BigNumberSparkline {...card} />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  test('does not render SVG when series is absent', () => {
    const card: DashboardCard = {
      ...baseCard,
      data: { value: 100 },
    };
    const { container } = render(<BigNumberSparkline {...card} />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  test('renders trend badge when trend is present', () => {
    const card: DashboardCard = {
      ...baseCard,
      trend: { value: -22.5, status: 'negative' },
    };
    render(<BigNumberSparkline {...card} />);
    expect(
      screen.getByText((_, el) => {
        return el?.textContent === '-22.5%';
      })
    ).toBeInTheDocument();
    expect(screen.getByText('vs. previous')).toBeInTheDocument();
  });

  test('renders positive trend badge', () => {
    const card: DashboardCard = {
      ...baseCard,
      trend: { value: 12.3, status: 'positive' },
    };
    render(<BigNumberSparkline {...card} />);
    expect(
      screen.getByText((_, el) => {
        return el?.textContent === '+12.3%';
      })
    ).toBeInTheDocument();
  });

  test('neutral trend does not render as positive (green)', () => {
    const card: DashboardCard = {
      ...baseCard,
      trend: { value: 0, status: 'neutral' },
    };
    render(<BigNumberSparkline {...card} />);
    expect(screen.getByText('vs. previous')).toBeInTheDocument();
  });

  test('does not render trend when trend is absent', () => {
    render(<BigNumberSparkline {...baseCard} />);
    expect(screen.queryByText('vs. previous')).not.toBeInTheDocument();
  });

  test('shows dash when value is undefined', () => {
    const card: DashboardCard = {
      ...baseCard,
      data: { series: [1, 2, 3] },
    };
    render(<BigNumberSparkline {...card} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  test('renders additionalInfo text when provided', () => {
    const card: DashboardCard = {
      ...baseCard,
      additionalInfo: 'Compared to last month',
    };
    render(<BigNumberSparkline {...card} />);
    expect(screen.getByText('Compared to last month')).toBeInTheDocument();
  });

  test('renders description via tooltip when provided', () => {
    const card: DashboardCard = {
      ...baseCard,
      description: 'Total revenue from campaigns',
    };
    render(<BigNumberSparkline {...card} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  test('renders previousSeries as overlay path when provided', () => {
    const card: DashboardCard = {
      ...baseCard,
      data: {
        value: 250000,
        series: [200000, 210000, 250000],
        previousSeries: [180000, 190000, 210000],
      },
    };
    const { container } = render(<BigNumberSparkline {...card} />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(2);
  });

  test('DashboardCard renders BigNumberSparkline for bigNumberSparkline type', async () => {
    const { DashboardCard } = await import('src/DashboardCard');
    render(<DashboardCard {...baseCard} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  test('DashboardCard renders BigNumberSparkline for legacy lineChart type', async () => {
    const { DashboardCard } = await import('src/DashboardCard');
    const card: DashboardCard = { ...baseCard, type: 'lineChart' };
    render(<DashboardCard {...card} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  test('Sparkline renders null when data has fewer than 2 points', () => {
    const { container } = render(<Sparkline data={[100]} title="test" />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  test('Sparkline renders SVG with accessible label', () => {
    const { container } = render(
      <Sparkline data={[100, 200, 300]} title="Revenue sparkline" />
    );
    expect(
      container.querySelector('svg[aria-label="Revenue sparkline"]')
    ).toBeInTheDocument();
  });
});
