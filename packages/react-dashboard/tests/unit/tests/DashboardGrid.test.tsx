import { render, screen } from '@ttoss/test-utils/react';
import {
  type DashboardFilter,
  DashboardFilterType,
  DashboardGrid,
  DashboardProvider,
  type DashboardTemplate,
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
      <DashboardProvider
        filters={mockFilters}
        templates={[mockTemplate]}
        selectedTemplate={mockTemplate}
      >
        <DashboardGrid loading={true} selectedTemplate={mockTemplate} />
      </DashboardProvider>
    );

    // Spinner should be rendered
    expect(screen.queryByText('Card 1')).not.toBeInTheDocument();
  });

  test('should render cards when loading is false and template is selected', () => {
    render(
      <DashboardProvider
        filters={mockFilters}
        templates={[mockTemplate]}
        selectedTemplate={mockTemplate}
      >
        <DashboardGrid loading={false} selectedTemplate={mockTemplate} />
      </DashboardProvider>
    );

    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
  });

  test('should return null when no template is selected', () => {
    const { container } = render(
      <DashboardProvider
        filters={[]}
        templates={[mockTemplate]}
        selectedTemplate={undefined}
      >
        <DashboardGrid loading={false} selectedTemplate={undefined} />
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
      <DashboardProvider
        filters={emptyFilters}
        templates={[emptyTemplate]}
        selectedTemplate={emptyTemplate}
      >
        <DashboardGrid loading={false} selectedTemplate={emptyTemplate} />
      </DashboardProvider>
    );

    // Grid should render but with no cards
    expect(screen.queryByText('Card 1')).not.toBeInTheDocument();
  });

  test('should render section divider when card type is sectionDivider', () => {
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

    const emptyFilters: DashboardFilter[] = [
      {
        key: 'template',
        type: DashboardFilterType.SELECT,
        label: 'Template',
        value: 'template-with-divider',
      },
    ];

    render(
      <DashboardProvider
        filters={emptyFilters}
        templates={[templateWithDivider]}
        selectedTemplate={templateWithDivider}
      >
        <DashboardGrid loading={false} selectedTemplate={templateWithDivider} />
      </DashboardProvider>
    );

    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
  });

  test('should render both cards and section dividers in the same grid', () => {
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

    const emptyFilters: DashboardFilter[] = [
      {
        key: 'template',
        type: DashboardFilterType.SELECT,
        label: 'Template',
        value: 'template-mixed',
      },
    ];

    render(
      <DashboardProvider
        filters={emptyFilters}
        templates={[templateWithMixed]}
        selectedTemplate={templateWithMixed}
      >
        <DashboardGrid loading={false} selectedTemplate={templateWithMixed} />
      </DashboardProvider>
    );

    // Should render both cards and divider
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('ROAS')).toBeInTheDocument();
  });

  test('should render multiple section dividers', () => {
    const templateWithDividers: DashboardTemplate = {
      id: 'template-multiple-dividers',
      name: 'Template with Multiple Dividers',
      grid: [
        {
          i: 'divider-1',
          x: 0,
          y: 0,
          w: 12,
          h: 2,
          card: {
            type: 'sectionDivider',
            title: 'Revenue Metrics',
          },
        },
        {
          i: 'divider-2',
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
          i: 'divider-3',
          x: 0,
          y: 4,
          w: 12,
          h: 2,
          card: {
            type: 'sectionDivider',
            title: 'Engagement Metrics',
          },
        },
      ],
    };

    const emptyFilters: DashboardFilter[] = [
      {
        key: 'template',
        type: DashboardFilterType.SELECT,
        label: 'Template',
        value: 'template-multiple-dividers',
      },
    ];

    render(
      <DashboardProvider
        filters={emptyFilters}
        templates={[templateWithDividers]}
        selectedTemplate={templateWithDividers}
      >
        <DashboardGrid
          loading={false}
          selectedTemplate={templateWithDividers}
        />
      </DashboardProvider>
    );

    expect(screen.getByText('Revenue Metrics')).toBeInTheDocument();
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Engagement Metrics')).toBeInTheDocument();
  });
});
