import { render, screen } from '@ttoss/test-utils/react';
import { Dashboard, type DashboardTemplate } from 'src/Dashboard';
import { DashboardFilterType } from 'src/DashboardFilters';

const mockDashboardGrid = jest.fn();
const mockDashboardProviderProps = jest.fn();
const mockUseDashboard = jest.fn();

jest.mock('src/DashboardGrid', () => {
  return {
    DashboardGrid: (props: Record<string, unknown>) => {
      mockDashboardGrid(props);
      return <div data-testid="dashboard-grid" />;
    },
  };
});

jest.mock('src/DashboardProvider', () => {
  return {
    DashboardProvider: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => {
      mockDashboardProviderProps(props);
      return <>{children}</>;
    },
    useDashboard: () => {
      return mockUseDashboard();
    },
  };
});

describe('Dashboard branches', () => {
  const selectedTemplate: DashboardTemplate = {
    id: 'template-1',
    name: 'Template 1',
    grid: [
      {
        i: 'card-1',
        x: 0,
        y: 0,
        w: 4,
        h: 2,
        card: {
          title: 'Card',
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: {},
        },
      },
    ],
  };

  const defaultContextValue = {
    isEditMode: false,
    editingGrid: null,
    filters: [],
    editable: false,
    updateFilter: jest.fn(),
    templates: [],
    selectedTemplate: undefined,
    cardCatalog: [],
    startEdit: jest.fn(),
    cancelEdit: jest.fn(),
    saveEdit: jest.fn(),
    saveAsNew: jest.fn(),
    saveAsNewModalOpen: false,
    confirmSaveAsNew: jest.fn(),
    cancelSaveAsNew: jest.fn(),
    addCard: jest.fn(),
    removeCard: jest.fn(),
    updateCard: jest.fn(),
    onLayoutChange: jest.fn(),
  };

  beforeEach(() => {
    mockDashboardGrid.mockReset();
    mockDashboardProviderProps.mockReset();
    mockUseDashboard.mockReset();
  });

  test('should pass props through provider and use selected template by default', () => {
    mockUseDashboard.mockReturnValue(defaultContextValue);

    render(
      <Dashboard
        selectedTemplate={selectedTemplate}
        templates={[selectedTemplate]}
        filters={[]}
        editable
      />
    );

    expect(mockDashboardProviderProps).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedTemplate,
        editable: true,
        templates: [selectedTemplate],
        filters: [],
      })
    );
    expect(mockDashboardGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedTemplate,
        isEditMode: false,
        loading: false,
      })
    );
  });

  test('should use editing grid while in edit mode and render header children', () => {
    const editingGrid = [
      {
        ...selectedTemplate.grid[0],
        x: 3,
      },
    ];

    mockUseDashboard.mockReturnValue({
      ...defaultContextValue,
      isEditMode: true,
      editingGrid,
    });

    render(
      <Dashboard
        selectedTemplate={selectedTemplate}
        loading
        headerChildren={<button>Action</button>}
      />
    );

    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(mockDashboardGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        loading: true,
        isEditMode: true,
        selectedTemplate: expect.objectContaining({
          id: selectedTemplate.id,
          grid: editingGrid,
        }),
      })
    );
  });

  test('should not render filters when showFilters is false', () => {
    mockUseDashboard.mockReturnValue({
      ...defaultContextValue,
      filters: [
        {
          key: 'search',
          type: DashboardFilterType.TEXT,
          label: 'Hidden Filter',
          value: '',
        },
      ],
    });

    render(
      <Dashboard selectedTemplate={selectedTemplate} showFilters={false} />
    );

    expect(screen.queryByText('Hidden Filter')).not.toBeInTheDocument();
  });
});
