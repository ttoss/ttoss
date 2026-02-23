import { render } from '@ttoss/test-utils/react';
import { Dashboard, type DashboardTemplate } from 'src/Dashboard';

const mockDashboardGrid = jest.fn();
const mockDashboardHeader = jest.fn();
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

jest.mock('src/DashboardHeader', () => {
  return {
    DashboardHeader: ({ children }: { children?: React.ReactNode }) => {
      mockDashboardHeader({ hasChildren: !!children });
      return <div>{children}</div>;
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

  beforeEach(() => {
    mockDashboardGrid.mockReset();
    mockDashboardHeader.mockReset();
    mockDashboardProviderProps.mockReset();
    mockUseDashboard.mockReset();
  });

  test('should pass props through provider and use selected template by default', () => {
    mockUseDashboard.mockReturnValue({
      isEditMode: false,
      editingGrid: null,
    });

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

  test('should use editing grid while in edit mode and forward loading/header', () => {
    const editingGrid = [
      {
        ...selectedTemplate.grid[0],
        x: 3,
      },
    ];

    mockUseDashboard.mockReturnValue({
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

    expect(mockDashboardHeader).toHaveBeenCalledWith(
      expect.objectContaining({ hasChildren: true })
    );
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
});
