import { render, screen } from '@ttoss/test-utils/react';
import { BigNumber } from 'src/Cards/BigNumber';
import type { DashboardCard } from 'src/DashboardCard';

describe('BigNumber', () => {
  const baseCard: DashboardCard = {
    title: 'Total Revenue',
    description: 'Total revenue generated',
    numberType: 'number',
    type: 'bigNumber',
    sourceType: [{ source: 'meta' }],
    data: {
      meta: { total: 1234.56 },
    },
  };

  test('should render title', () => {
    render(<BigNumber {...baseCard} />);

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  test('should format number correctly', () => {
    render(<BigNumber {...baseCard} />);

    expect(screen.getByText(/1\.234,56/)).toBeInTheDocument();
  });

  test('should format currency correctly', () => {
    render(
      <BigNumber
        {...baseCard}
        numberType="currency"
        data={{ api: { total: 1234.56 } }}
      />
    );

    expect(screen.getByText(/R\$\s*1\.234,56/)).toBeInTheDocument();
  });

  test('should format percentage correctly', () => {
    render(
      <BigNumber
        {...baseCard}
        numberType="percentage"
        data={{ api: { total: 45.67 } }}
      />
    );

    expect(screen.getByText('45.67%')).toBeInTheDocument();
  });

  test('should display dash when value is undefined', () => {
    render(<BigNumber {...baseCard} data={{ api: { total: undefined } }} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  test('should display dash when value is null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<BigNumber {...baseCard} data={{ api: { total: null as any } }} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  test('should use meta data when api data is not available', () => {
    render(
      <BigNumber
        {...baseCard}
        data={{
          meta: { total: 999 },
        }}
      />
    );

    expect(screen.getByText(/999,00/)).toBeInTheDocument();
  });

  test('should prioritize meta data over api data', () => {
    render(
      <BigNumber
        {...baseCard}
        data={{
          api: { total: 100 },
          meta: { total: 200 },
        }}
      />
    );

    expect(screen.getByText(/200,00/)).toBeInTheDocument();
    expect(screen.queryByText(/100,00/)).not.toBeInTheDocument();
  });

  test('should render trend indicator with positive status', () => {
    render(
      <BigNumber
        {...baseCard}
        trend={{ value: 10.5, status: 'positive', type: 'higher' }}
      />
    );

    expect(screen.getByText(/10\.5%/)).toBeInTheDocument();
    expect(screen.getByText(/vs\. anterior/)).toBeInTheDocument();
  });

  test('should render trend indicator with negative status', () => {
    render(
      <BigNumber
        {...baseCard}
        trend={{ value: 5.2, status: 'negative', type: 'higher' }}
      />
    );

    expect(screen.getByText(/5\.2%/)).toBeInTheDocument();
    expect(screen.getByText(/vs\. anterior/)).toBeInTheDocument();
  });

  test('should render trend indicator with neutral status', () => {
    render(
      <BigNumber
        {...baseCard}
        trend={{ value: 0, status: 'neutral', type: 'higher' }}
      />
    );

    // Neutral trends still display the trend text
    expect(screen.getByText(/0\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/vs\. anterior/)).toBeInTheDocument();
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

    expect(screen.getByText(/1\.234,56/)).toBeInTheDocument();
  });

  test('should use default color when color is not provided and not green/accent/positive', () => {
    render(<BigNumber {...baseCard} color="blue" />);

    expect(screen.getByText(/1\.234,56/)).toBeInTheDocument();
  });

  test('should use default color when color is undefined', () => {
    render(<BigNumber {...baseCard} color={undefined} />);

    expect(screen.getByText(/1\.234,56/)).toBeInTheDocument();
  });

  describe('suffix prop', () => {
    test('should append suffix to formatted number', () => {
      render(<BigNumber {...baseCard} suffix="kg" />);

      expect(screen.getByText(/1\.234,56 kg/)).toBeInTheDocument();
    });

    test('should append suffix to formatted currency', () => {
      render(
        <BigNumber
          {...baseCard}
          numberType="currency"
          data={{ api: { total: 500 } }}
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
          data={{ api: { total: 12.5 } }}
          suffix="p.p."
        />
      );

      expect(screen.getByText(/12\.50% p\.p\./)).toBeInTheDocument();
    });

    test('should not append anything when suffix is not provided', () => {
      render(<BigNumber {...baseCard} />);

      const valueEl = screen.getByText(/1\.234,56/);
      expect(valueEl).toBeInTheDocument();
      expect(valueEl.textContent).toBe('1.234,56');
    });

    test('should not append suffix when value is undefined (dash)', () => {
      render(
        <BigNumber
          {...baseCard}
          data={{ api: { total: undefined } }}
          suffix="kg"
        />
      );

      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });
});
