import { render, screen } from '@ttoss/test-utils/react';
import { DashboardCard } from 'src/index';

describe('DashboardCard', () => {
  const mockBigNumberCard = {
    title: 'Total Revenue',
    description: 'Total revenue generated',
    numberType: 'currency' as const,
    type: 'bigNumber' as const,
    sourceType: [{ source: 'api' as const }],
    data: {
      api: {
        total: 1000,
      },
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

    // The description should be available via tooltip
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
});
