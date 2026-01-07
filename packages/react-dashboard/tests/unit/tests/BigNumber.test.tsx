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

  test('should add x suffix for ROAS-like metrics', () => {
    render(
      <BigNumber
        {...baseCard}
        title="ROAS"
        numberType="number"
        data={{ api: { total: 3.5 } }}
      />
    );

    expect(screen.getByText(/3,50x/)).toBeInTheDocument();
  });

  test('should render trend indicator with positive status', () => {
    render(
      <BigNumber {...baseCard} trend={{ value: 10.5, status: 'positive' }} />
    );

    expect(screen.getByText(/\+10\.5%/)).toBeInTheDocument();
    expect(screen.getByText(/vs\. período anterior/)).toBeInTheDocument();
  });

  test('should render trend indicator with negative status', () => {
    render(
      <BigNumber {...baseCard} trend={{ value: 5.2, status: 'negative' }} />
    );

    expect(screen.getByText(/5\.2%/)).toBeInTheDocument();
    expect(screen.getByText(/vs\. período anterior/)).toBeInTheDocument();
  });

  test('should not render trend indicator with neutral status', () => {
    render(<BigNumber {...baseCard} trend={{ value: 0, status: 'neutral' }} />);

    // Neutral trends should not display the trend text
    expect(screen.queryByText(/0\.0%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/vs\. período anterior/)).not.toBeInTheDocument();
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
});
