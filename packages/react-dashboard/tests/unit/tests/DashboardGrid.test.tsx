import { render, screen } from '@ttoss/test-utils/react';
import {
  type DashboardFilter,
  DashboardFilterType,
  DashboardGrid,
  DashboardProvider,
  type DashboardTemplate,
  useDashboard,
} from 'src/index';

describe('DashboardGrid', () => {
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
          title: 'Card 1',
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: {
            api: { total: 100 },
          },
        },
      },
      {
        i: 'card-2',
        x: 4,
        y: 0,
        w: 4,
        h: 2,
        card: {
          title: 'Card 2',
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: {
            api: { total: 200 },
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
  ];

  test('should render loading spinner when loading is true', () => {
    render(
      <DashboardProvider filters={mockFilters} templates={[mockTemplate]}>
        <DashboardGrid loading={true} />
      </DashboardProvider>
    );

    // Spinner should be rendered
    expect(screen.queryByText('Card 1')).not.toBeInTheDocument();
  });

  test('should render cards when loading is false and template is selected', () => {
    const TestWrapper = ({ loading }: { loading: boolean }) => {
      const { selectedTemplate } = useDashboard();
      return (
        <DashboardGrid loading={loading} selectedTemplate={selectedTemplate} />
      );
    };

    render(
      <DashboardProvider filters={mockFilters} templates={[mockTemplate]}>
        <TestWrapper loading={false} />
      </DashboardProvider>
    );

    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
  });

  test('should return null when no template is selected', () => {
    const { container } = render(
      <DashboardProvider filters={[]} templates={[mockTemplate]}>
        <DashboardGrid loading={false} />
      </DashboardProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  test('should render empty grid when template has no cards', () => {
    const emptyTemplate: DashboardTemplate = {
      id: 'empty-template',
      name: 'Empty Template',
      grid: [],
    };

    const emptyFilters: DashboardFilter[] = [
      {
        key: 'template',
        type: DashboardFilterType.SELECT,
        label: 'Template',
        value: 'empty-template',
      },
    ];

    render(
      <DashboardProvider filters={emptyFilters} templates={[emptyTemplate]}>
        <DashboardGrid loading={false} />
      </DashboardProvider>
    );

    // Grid should render but with no cards
    expect(screen.queryByText('Card 1')).not.toBeInTheDocument();
  });
});
