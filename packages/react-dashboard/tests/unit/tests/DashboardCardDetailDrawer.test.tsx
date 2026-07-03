import { render, screen } from '@ttoss/test-utils/react';
import { DashboardCardDetailDrawer } from 'src/index';

const regularCard = {
  title: 'Investimento Total',
  numberType: 'currency' as const,
  type: 'bigNumber' as const,
  sourceType: [{ source: 'api' as const }],
  data: {
    meta: { total: 1400, daily: [200, 300, 450, 250, 100] },
  },
};

const cardWithApiDaily = {
  title: 'Cliques',
  numberType: 'number' as const,
  type: 'bigNumber' as const,
  sourceType: [{ source: 'api' as const }],
  data: {
    api: { total: 500, daily: [100, 150, 120] },
  },
};

describe('DashboardCardDetailDrawer', () => {
  test('renders card title when open', () => {
    render(
      <DashboardCardDetailDrawer
        open={true}
        onClose={jest.fn()}
        card={regularCard}
      />
    );

    expect(screen.getByText('Investimento Total')).toBeInTheDocument();
  });

  test('renders daily bar chart bars from card.data.meta.daily', () => {
    render(
      <DashboardCardDetailDrawer
        open={true}
        onClose={jest.fn()}
        card={regularCard}
      />
    );

    // Each bar gets a title with the formatted value
    expect(screen.getByTitle('R$200.00')).toBeInTheDocument();
    expect(screen.getByTitle('R$300.00')).toBeInTheDocument();
    expect(screen.getByTitle('R$450.00')).toBeInTheDocument();
  });

  test('falls back to card.data.api.daily when meta.daily is absent', () => {
    render(
      <DashboardCardDetailDrawer
        open={true}
        onClose={jest.fn()}
        card={cardWithApiDaily}
      />
    );

    expect(screen.getByTitle('100.00')).toBeInTheDocument();
    expect(screen.getByTitle('150.00')).toBeInTheDocument();
  });

  test('renders children slot below the chart', () => {
    render(
      <DashboardCardDetailDrawer
        open={true}
        onClose={jest.fn()}
        card={regularCard}
      >
        <div>Campaign breakdown content</div>
      </DashboardCardDetailDrawer>
    );

    expect(screen.getByText('Campaign breakdown content')).toBeInTheDocument();
  });

  test('renders empty drawer without crashing when card is null', () => {
    render(
      <DashboardCardDetailDrawer open={true} onClose={jest.fn()} card={null} />
    );

    expect(screen.queryByText('Investimento Total')).not.toBeInTheDocument();
  });

  test('omits daily chart when card has no daily data', () => {
    const cardWithoutDaily = {
      ...regularCard,
      data: { meta: { total: 1400 } },
    };

    render(
      <DashboardCardDetailDrawer
        open={true}
        onClose={jest.fn()}
        card={cardWithoutDaily}
      />
    );

    expect(screen.getByText('Investimento Total')).toBeInTheDocument();
    // No bar titles — no daily data rendered
    expect(screen.queryByTitle('R$200.00')).not.toBeInTheDocument();
  });

  test('formats percentage values correctly in bar tooltips', () => {
    const percentageCard = {
      title: 'CTR',
      numberType: 'percentage' as const,
      type: 'bigNumber' as const,
      sourceType: [{ source: 'meta' as const }],
      data: {
        meta: { total: 3.5, daily: [2.5, 3.0, 4.1] },
      },
    };

    render(
      <DashboardCardDetailDrawer
        open={true}
        onClose={jest.fn()}
        card={percentageCard}
      />
    );

    expect(screen.getByTitle('2.5%')).toBeInTheDocument();
    expect(screen.getByTitle('3.0%')).toBeInTheDocument();
    expect(screen.getByTitle('4.1%')).toBeInTheDocument();
  });
});
