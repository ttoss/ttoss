import { render, screen } from '@ttoss/test-utils/react';
import { BigNumber } from 'src/Cards/BigNumber';
import type { DashboardCard } from 'src/DashboardCard';

describe('BigNumber', () => {
  const baseCard: DashboardCard = {
    id: 'revenue',
    title: 'Total Revenue',
    description: 'Total revenue generated',
    numberType: 'number',
    type: 'bigNumber',
    data: {
      value: 1234.56,
    },
  };

  test('should render title', () => {
    render(<BigNumber {...baseCard} />);

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  test('should format number correctly with provided locale', () => {
    render(<BigNumber {...baseCard} locale="pt-BR" />);

    expect(screen.getByText(/1\.234,56/)).toBeInTheDocument();
  });

  test('should format currency correctly', () => {
    render(
      <BigNumber
        {...baseCard}
        numberType="currency"
        locale="pt-BR"
        data={{ value: 1234.56 }}
      />
    );

    expect(screen.getByText(/R\$\s*1\.234,56/)).toBeInTheDocument();
  });

  test('should format currency with USD when currency prop is provided', () => {
    render(
      <BigNumber
        {...baseCard}
        numberType="currency"
        currency="USD"
        locale="en-US"
        data={{ value: 1234.56 }}
      />
    );

    expect(screen.getByText(/\$1,234\.56/)).toBeInTheDocument();
  });

  test('should default to BRL when currency prop is absent', () => {
    render(
      <BigNumber
        {...baseCard}
        numberType="currency"
        locale="pt-BR"
        data={{ value: 500 }}
      />
    );

    expect(screen.getByText(/R\$/)).toBeInTheDocument();
  });

  test('should not affect number type when currency prop is provided', () => {
    render(
      <BigNumber
        {...baseCard}
        numberType="number"
        currency="USD"
        locale="pt-BR"
        data={{ value: 100 }}
      />
    );

    expect(screen.queryByText(/US\$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
    expect(screen.getByText(/100,00/)).toBeInTheDocument();
  });

  test('should format percentage correctly', () => {
    render(
      <BigNumber
        {...baseCard}
        numberType="percentage"
        data={{ value: 45.67 }}
      />
    );

    expect(screen.getByText('45.67%')).toBeInTheDocument();
  });

  test('should display dash when value is undefined', () => {
    render(<BigNumber {...baseCard} data={{ value: undefined }} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  test('should display dash when value is null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<BigNumber {...baseCard} data={{ value: null as any }} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  test('should render trend indicator with positive status', () => {
    render(
      <BigNumber
        {...baseCard}
        trend={{ value: 10.5, status: 'positive', type: 'higher' }}
      />
    );

    expect(screen.getByText(/10\.5%/)).toBeInTheDocument();
    expect(screen.getByText(/vs\. previous/)).toBeInTheDocument();
  });

  test('should render trend indicator with negative status', () => {
    render(
      <BigNumber
        {...baseCard}
        trend={{ value: 5.2, status: 'negative', type: 'higher' }}
      />
    );

    expect(screen.getByText(/5\.2%/)).toBeInTheDocument();
    expect(screen.getByText(/vs\. previous/)).toBeInTheDocument();
  });

  test('should render trend indicator with neutral status', () => {
    render(
      <BigNumber
        {...baseCard}
        trend={{ value: 0, status: 'neutral', type: 'higher' }}
      />
    );

    expect(screen.getByText(/0\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/vs\. previous/)).toBeInTheDocument();
  });

  test('should render additional info', () => {
    render(<BigNumber {...baseCard} additionalInfo="Additional information" />);

    expect(screen.getByText('Additional information')).toBeInTheDocument();
  });

  test('should render status indicator', () => {
    render(
      <BigNumber
        {...baseCard}
        status={{ text: 'Active', icon: 'mdi:check-circle' }}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('should render status indicator without icon', () => {
    render(<BigNumber {...baseCard} status={{ text: 'Inactive' }} />);

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  test('should apply dark variant styles', () => {
    render(<BigNumber {...baseCard} variant="dark" />);

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  test('should apply light-green variant styles', () => {
    render(<BigNumber {...baseCard} variant="light-green" />);

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  test('should apply custom color', () => {
    render(<BigNumber {...baseCard} color="green" />);

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  test('should use default color when color is undefined', () => {
    render(<BigNumber {...baseCard} color={undefined} />);

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  describe('suffix prop', () => {
    test('should append suffix to formatted number', () => {
      render(<BigNumber {...baseCard} locale="pt-BR" suffix="kg" />);

      expect(screen.getByText(/1\.234,56 kg/)).toBeInTheDocument();
    });

    test('should append suffix to formatted currency', () => {
      render(
        <BigNumber
          {...baseCard}
          numberType="currency"
          locale="pt-BR"
          data={{ value: 500 }}
          suffix="un"
        />
      );

      expect(screen.getByText(/R\$\s*500,00 un/)).toBeInTheDocument();
    });

    test('should append suffix to formatted percentage', () => {
      render(
        <BigNumber
          {...baseCard}
          numberType="percentage"
          data={{ value: 12.5 }}
          suffix="p.p."
        />
      );

      expect(screen.getByText(/12\.50% p\.p\./)).toBeInTheDocument();
    });

    test('should not append suffix when value is undefined (dash)', () => {
      render(
        <BigNumber {...baseCard} data={{ value: undefined }} suffix="kg" />
      );

      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });
});
