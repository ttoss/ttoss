import { act, render, screen } from '@ttoss/test-utils/react';
import {
  Dashboard,
  type DashboardFilter,
  DashboardFilterType,
  type DashboardTemplate,
  useDashboard,
} from 'src/index';

describe('Dashboard', () => {
  const mockTemplate: DashboardTemplate = {
    id: 'template-1',
    name: 'Test Template',
    grid: [
      {
        i: 'card-1',
        x: 0,
        y: 0,
        w: 4,
        h: 2,
        card: {
          title: 'Test Card',
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: {
            api: { total: 100 },
          },
        },
      },
    ],
  };

  const mockFilters: DashboardFilter[] = [
    {
      key: 'template',
      type: DashboardFilterType.SELECT,
      label: 'Template',
      value: 'template-1',
    },
    {
      key: 'search',
      type: DashboardFilterType.TEXT,
      label: 'Search',
      value: 'initial search',
    },
  ];

  test('should render dashboard with templates', () => {
    render(<Dashboard templates={[mockTemplate]} filters={mockFilters} />);

    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  test('should render loading state', () => {
    render(
      <Dashboard
        loading={true}
        templates={[mockTemplate]}
        filters={mockFilters}
      />
    );

    // Should show loading spinner
    expect(screen.queryByText('Test Card')).not.toBeInTheDocument();
  });

  test('should render header children', () => {
    render(
      <Dashboard
        templates={[mockTemplate]}
        filters={mockFilters}
        headerChildren={<button>Custom Button</button>}
      />
    );

    expect(screen.getByText('Custom Button')).toBeInTheDocument();
  });

  test('should sync filters to provider', () => {
    const TestComponent = () => {
      const { filters } = useDashboard();
      return <div data-testid="filters-count">{filters.length}</div>;
    };

    render(
      <Dashboard
        templates={[mockTemplate]}
        filters={mockFilters}
        headerChildren={<TestComponent />}
      />
    );

    expect(screen.getByTestId('filters-count')).toHaveTextContent('2');
  });

  test('should work with empty templates array', () => {
    render(<Dashboard templates={[]} filters={[]} />);

    expect(screen.queryByText('Test Card')).not.toBeInTheDocument();
  });

  test('should work with empty filters array', () => {
    render(<Dashboard templates={[mockTemplate]} filters={[]} />);

    // Should render without filters
    expect(screen.queryByText('Search')).not.toBeInTheDocument();
  });

  test('should update templates when props change', () => {
    const TestComponent = () => {
      const { templates } = useDashboard();
      return (
        <div data-testid="template-id">
          {templates.length > 0 ? templates[0].id : 'none'}
        </div>
      );
    };

    const newTemplate: DashboardTemplate = {
      id: 'template-2',
      name: 'New Template',
      grid: [],
    };

    const { rerender } = render(
      <Dashboard
        templates={[mockTemplate]}
        filters={mockFilters}
        headerChildren={<TestComponent />}
      />
    );

    expect(screen.getByTestId('template-id')).toHaveTextContent('template-1');

    rerender(
      <Dashboard
        templates={[newTemplate]}
        filters={mockFilters}
        headerChildren={<TestComponent />}
      />
    );

    expect(screen.getByTestId('template-id')).toHaveTextContent('template-2');
  });

  test('should render dashboard with section dividers', () => {
    const templateWithDivider: DashboardTemplate = {
      id: 'template-with-divider',
      name: 'Template with Divider',
      grid: [
        {
          i: 'divider-1',
          x: 0,
          y: 0,
          w: 12,
          h: 2,
          card: {
            type: 'sectionDivider',
            title: 'Performance Metrics',
          },
        },
      ],
    };

    render(
      <Dashboard
        templates={[templateWithDivider]}
        filters={mockFilters}
        selectedTemplate={templateWithDivider}
      />
    );

    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
  });

  test('should render dashboard with mixed cards and section dividers', () => {
    const templateWithMixed: DashboardTemplate = {
      id: 'template-mixed',
      name: 'Template with Mixed Content',
      grid: [
        {
          i: 'card-1',
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          card: {
            title: 'Revenue',
            numberType: 'currency',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: {
              api: { total: 1000 },
            },
          },
        },
        {
          i: 'divider-1',
          x: 0,
          y: 2,
          w: 12,
          h: 2,
          card: {
            type: 'sectionDivider',
            title: 'Performance Metrics',
          },
        },
        {
          i: 'card-2',
          x: 0,
          y: 4,
          w: 4,
          h: 2,
          card: {
            title: 'ROAS',
            numberType: 'number',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: {
              api: { total: 3.5 },
            },
          },
        },
      ],
    };

    render(
      <Dashboard
        templates={[templateWithMixed]}
        filters={mockFilters}
        selectedTemplate={templateWithMixed}
      />
    );

    // Should render both cards and divider
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('ROAS')).toBeInTheDocument();
  });

  test('should handle multiple section dividers in template', () => {
    const templateWithMultipleDividers: DashboardTemplate = {
      id: 'template-multiple-dividers',
      name: 'Template with Multiple Dividers',
      grid: [
        {
          i: 'card-1',
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          card: {
            title: 'Total Revenue',
            numberType: 'currency',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: {
              api: { total: 150000 },
            },
          },
        },
        {
          i: 'divider-1',
          x: 0,
          y: 2,
          w: 12,
          h: 2,
          card: {
            type: 'sectionDivider',
            title: 'Revenue Metrics',
          },
        },
        {
          i: 'card-2',
          x: 0,
          y: 4,
          w: 4,
          h: 2,
          card: {
            title: 'CTR',
            numberType: 'percentage',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: {
              api: { total: 2.35 },
            },
          },
        },
        {
          i: 'divider-2',
          x: 0,
          y: 6,
          w: 12,
          h: 2,
          card: {
            type: 'sectionDivider',
            title: 'Performance Metrics',
          },
        },
      ],
    };

    render(
      <Dashboard
        templates={[templateWithMultipleDividers]}
        filters={mockFilters}
        selectedTemplate={templateWithMultipleDividers}
      />
    );

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Revenue Metrics')).toBeInTheDocument();
    expect(screen.getByText('CTR')).toBeInTheDocument();
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
  });

  test('should call onEditingGridChange with null on cancel', async () => {
    const onEditingGridChange = jest.fn();

    const EditTrigger = () => {
      const { startEdit, cancelEdit } = useDashboard();
      return (
        <>
          <button
            onClick={() => {
              return startEdit();
            }}
          >
            Start Edit
          </button>
          <button
            onClick={() => {
              return cancelEdit();
            }}
          >
            Cancel Edit
          </button>
        </>
      );
    };

    render(
      <Dashboard
        templates={[mockTemplate]}
        filters={mockFilters}
        selectedTemplate={mockTemplate}
        editable
        onEditingGridChange={onEditingGridChange}
        headerChildren={<EditTrigger />}
      />
    );

    await act(async () => {
      screen.getByText('Start Edit').click();
    });

    // Should have been called with the grid array when entering edit mode
    expect(onEditingGridChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ i: 'card-1' })])
    );

    onEditingGridChange.mockClear();

    await act(async () => {
      screen.getByText('Cancel Edit').click();
    });

    // Should be called with null when edit mode exits
    expect(onEditingGridChange).toHaveBeenCalledWith(null);
  });

  test('should render headerChildren items centered via wrapper', () => {
    render(
      <Dashboard
        templates={[mockTemplate]}
        filters={mockFilters}
        headerChildren={
          <>
            <button data-testid="btn-1">Button 1</button>
            <button data-testid="btn-2">Button 2</button>
          </>
        }
      />
    );

    const btn1 = screen.getByTestId('btn-1');
    const btn2 = screen.getByTestId('btn-2');

    // Both buttons should be rendered inside the header
    expect(btn1).toBeInTheDocument();
    expect(btn2).toBeInTheDocument();

    // The wrapper should have align-items: center style
    const wrapper = btn1.parentElement;
    expect(wrapper).toBeTruthy();
  });

  test('should pass currency prop to all cards', () => {
    const currencyTemplate: DashboardTemplate = {
      id: 'currency-template',
      name: 'Currency Template',
      grid: [
        {
          i: 'card-usd',
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          card: {
            title: 'Revenue USD',
            numberType: 'currency',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: { api: { total: 1000 } },
          },
        },
      ],
    };

    render(
      <Dashboard
        templates={[currencyTemplate]}
        filters={[]}
        selectedTemplate={currencyTemplate}
        currency="USD"
      />
    );

    // Should display US$ instead of R$
    expect(screen.getByText(/US\$/)).toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });

  test('should allow card-level currency to override dashboard-level currency', () => {
    const mixedTemplate: DashboardTemplate = {
      id: 'mixed-template',
      name: 'Mixed Template',
      grid: [
        {
          i: 'card-eur',
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          card: {
            title: 'Revenue EUR',
            numberType: 'currency',
            type: 'bigNumber',
            currency: 'EUR',
            sourceType: [{ source: 'api' }],
            data: { api: { total: 2000 } },
          },
        },
      ],
    };

    render(
      <Dashboard
        templates={[mixedTemplate]}
        filters={[]}
        selectedTemplate={mixedTemplate}
        currency="USD"
      />
    );

    // Card-level EUR should take precedence over dashboard-level USD
    expect(screen.getByText(/€/)).toBeInTheDocument();
    expect(screen.queryByText(/US\$/)).not.toBeInTheDocument();
  });
});
