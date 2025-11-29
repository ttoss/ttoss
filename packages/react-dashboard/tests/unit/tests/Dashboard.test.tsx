import { render, screen } from '@ttoss/test-utils/react';
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
});
