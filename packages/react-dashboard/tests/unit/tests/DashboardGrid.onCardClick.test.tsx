import { fireEvent, render, screen } from '@ttoss/test-utils/react';
import {
  type DashboardFilter,
  DashboardFilterType,
  DashboardGrid,
  DashboardProvider,
  type DashboardTemplate,
} from 'src/index';

const mockFilters: DashboardFilter[] = [
  {
    key: 'template',
    type: DashboardFilterType.SELECT,
    label: 'Template',
    value: 'template-1',
  },
];

const regularCard = {
  title: 'Investimento Total',
  numberType: 'currency' as const,
  type: 'bigNumber' as const,
  sourceType: [{ source: 'api' as const }],
  data: { api: { total: 1400 } },
};

const sectionDividerCard = {
  type: 'sectionDivider' as const,
  title: 'Gerenciador de Anúncios',
};

const mockTemplate: DashboardTemplate = {
  id: 'template-1',
  name: 'Test Template',
  grid: [
    { i: 'card-1', x: 0, y: 0, w: 4, h: 2, card: regularCard },
    { i: 'divider-1', x: 0, y: 2, w: 12, h: 1, card: sectionDividerCard },
  ],
};

describe('DashboardGrid — onCardClick', () => {
  test('invokes onCardClick with correct card and gridItem when a regular card is clicked', () => {
    const onCardClick = jest.fn();

    render(
      <DashboardProvider
        filters={mockFilters}
        templates={[mockTemplate]}
        selectedTemplate={mockTemplate}
        onCardClick={onCardClick}
      >
        <DashboardGrid loading={false} selectedTemplate={mockTemplate} />
      </DashboardProvider>
    );

    fireEvent.click(screen.getByText('Investimento Total'));

    expect(onCardClick).toHaveBeenCalledTimes(1);
    expect(onCardClick).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Investimento Total' }),
      expect.objectContaining({ i: 'card-1' })
    );
  });

  test('does NOT invoke onCardClick when a sectionDivider card is clicked', () => {
    const onCardClick = jest.fn();

    render(
      <DashboardProvider
        filters={mockFilters}
        templates={[mockTemplate]}
        selectedTemplate={mockTemplate}
        onCardClick={onCardClick}
      >
        <DashboardGrid loading={false} selectedTemplate={mockTemplate} />
      </DashboardProvider>
    );

    fireEvent.click(screen.getByText('Gerenciador de Anúncios'));

    expect(onCardClick).not.toHaveBeenCalled();
  });

  test('does NOT invoke onCardClick when no callback is provided', () => {
    // Should render without errors when onCardClick is omitted
    render(
      <DashboardProvider
        filters={mockFilters}
        templates={[mockTemplate]}
        selectedTemplate={mockTemplate}
      >
        <DashboardGrid loading={false} selectedTemplate={mockTemplate} />
      </DashboardProvider>
    );

    expect(() => {
      fireEvent.click(screen.getByText('Investimento Total'));
    }).not.toThrow();
  });
});
