import { render, screen } from '@ttoss/test-utils/react';
import { DashboardCard } from 'src/index';

describe('DashboardCard', () => {
  const mockBigNumberCard = {
    id: 'revenue',
    title: 'Total Revenue',
    description: 'Total revenue generated',
    numberType: 'currency' as const,
    type: 'bigNumber' as const,
    locale: 'pt-BR',
    data: {
      value: 1000,
    },
  };

  test('should render BigNumber card when type is bigNumber', () => {
    render(<DashboardCard {...mockBigNumberCard} />);

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*1\.000,00/)).toBeInTheDocument();
  });

  test('should return null for unsupported card types', () => {
    const { container } = render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <DashboardCard {...mockBigNumberCard} type={'pieChart' as any} />
    );

    expect(container.firstChild).toBeNull();
  });

  test('should render card with description', () => {
    render(<DashboardCard {...mockBigNumberCard} />);

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  test('should render card with icon', () => {
    render(<DashboardCard {...mockBigNumberCard} icon="mdi:chart-line" />);

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  test('should render card with variant', () => {
    render(<DashboardCard {...mockBigNumberCard} variant="dark" />);

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  test('should use card-level currency prop for formatting', () => {
    render(
      <DashboardCard {...mockBigNumberCard} currency="USD" locale="en-US" />
    );

    expect(screen.getByText(/\$1,000\.00/)).toBeInTheDocument();
  });

  test('should default to BRL when no currency prop is provided', () => {
    render(<DashboardCard {...mockBigNumberCard} />);

    expect(screen.getByText(/R\$/)).toBeInTheDocument();
  });
});
