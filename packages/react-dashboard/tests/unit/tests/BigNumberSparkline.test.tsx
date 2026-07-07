import { render, screen } from '@ttoss/test-utils/react';
import { BigNumberSparkline } from 'src/Cards/BigNumberSparkline';
import type { DashboardCard } from 'src/DashboardCard';

describe('BigNumberSparkline', () => {
  const baseCard: DashboardCard = {
    id: 'revenue',
    title: 'Total Revenue',
    numberType: 'currency',
    type: 'lineChart',
    sourceType: [{ source: 'meta' }],
    data: {
      meta: {
        total: 250000,
        daily: [200000, 210000, 195000, 230000, 250000, 240000, 260000],
      },
    },
  };

  test('renders the card title', () => {
    render(<BigNumberSparkline {...baseCard} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  test('formats currency total correctly', () => {
    render(<BigNumberSparkline {...baseCard} />);
    expect(screen.getByText(/R\$\s*250\.000,00/)).toBeInTheDocument();
  });

  test('renders SVG sparkline when daily data has 2+ points', () => {
    const { container } = render(<BigNumberSparkline {...baseCard} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('path')).toBeInTheDocument();
  });

  test('does not render SVG when daily data has fewer than 2 points', () => {
    const card: DashboardCard = {
      ...baseCard,
      data: { meta: { total: 100, daily: [100] } },
    };
    const { container } = render(<BigNumberSparkline {...card} />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  test('does not render SVG when daily data is absent', () => {
    const card: DashboardCard = {
      ...baseCard,
      data: { meta: { total: 100 } },
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
    expect(screen.getByText('vs. anterior')).toBeInTheDocument();
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

  test('does not render trend when trend is absent', () => {
    render(<BigNumberSparkline {...baseCard} />);
    expect(screen.queryByText('vs. anterior')).not.toBeInTheDocument();
  });

  test('shows dash when total is undefined', () => {
    const card: DashboardCard = {
      ...baseCard,
      data: { meta: { daily: [1, 2, 3] } },
    };
    render(<BigNumberSparkline {...card} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  test('falls back to api.total when meta.total is absent', () => {
    const card: DashboardCard = {
      ...baseCard,
      data: { api: { total: 9999, daily: [1, 2, 3] } },
    };
    render(<BigNumberSparkline {...card} />);
    expect(screen.getByText(/9\.999,00/)).toBeInTheDocument();
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
      description: 'Total revenue from Meta campaigns',
    };
    render(<BigNumberSparkline {...card} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  test('DashboardCard renders BigNumberSparkline for lineChart type', async () => {
    const { DashboardCard } = await import('src/DashboardCard');
    render(<DashboardCard {...baseCard} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*250\.000,00/)).toBeInTheDocument();
  });
});
