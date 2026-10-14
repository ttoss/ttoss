import { fireEvent, render, screen, waitFor } from '@ttoss/test-utils/react';
import { DashboardGrid } from 'src/DashboardGrid';
import { useDashboard } from 'src/DashboardProvider';
import type { DashboardTemplate } from 'src/index';

jest.mock('src/DashboardProvider', () => {
  const actual = jest.requireActual('src/DashboardProvider');
  return {
    ...actual,
    useDashboard: jest.fn(),
  };
});

type MockLayoutItem = { i: string; x: number; y: number; w: number; h: number };

type MockConstraint = {
  name: string;
  constrainPosition?: (
    item: MockLayoutItem,
    x: number,
    y: number,
    context: Record<string, unknown>
  ) => { x: number; y: number };
};

const mockGridProps: {
  width?: number;
  constraints?: MockConstraint[];
  dragConfig?: { handle?: string };
} = {};

jest.mock('react-grid-layout', () => {
  const React = jest.requireActual('react');

  const Responsive = ({
    children,
    width,
    constraints,
    dragConfig,
    onLayoutChange,
    onDragStart,
    onDragStop,
  }: {
    children: React.ReactNode;
    width: number;
    constraints?: MockConstraint[];
    dragConfig?: { handle?: string };
    onLayoutChange?: (layout: MockLayoutItem[]) => void;
    onDragStart?: () => void;
    onDragStop?: () => void;
  }) => {
    mockGridProps.width = width;
    mockGridProps.constraints = constraints;
    mockGridProps.dragConfig = dragConfig;

    React.useEffect(() => {
      const movedItem = { i: 'card-1', x: 5, y: 6, w: 4, h: 2 };
      onDragStart?.();
      onLayoutChange?.([movedItem]);
      onDragStop?.();
    }, [onLayoutChange, onDragStart, onDragStop]);

    return <div data-testid="mock-grid">{children}</div>;
  };

  return {
    Responsive,
    useContainerWidth: () => {
      return {
        width: 1024,
        mounted: true,
        containerRef: { current: null },
        measureWidth: () => {},
      };
    },
  };
});

describe('DashboardGrid in edit mode', () => {
  const onLayoutChange = jest.fn();
  const removeCard = jest.fn();
  const updateCard = jest.fn();
  const mockUseDashboard = useDashboard as jest.MockedFunction<
    typeof useDashboard
  >;

  const selectedTemplate: DashboardTemplate = {
    id: 'template-grid',
    name: 'Template Grid',
    grid: [
      {
        i: 'card-1',
        x: 5,
        y: 0,
        w: 4,
        h: 2,
        card: {
          title: 'Card 1',
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: { value: 100 },
        },
      },
      {
        i: 'divider-1',
        x: 0,
        y: 2,
        w: 12,
        h: 1,
        card: {
          type: 'sectionDivider',
          title: 'Group',
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDashboard.mockReturnValue({
      onLayoutChange,
      removeCard,
      updateCard,
    } as never);
  });

  test('should snap layout updates and allow editing actions', async () => {
    render(
      <DashboardGrid
        loading={false}
        selectedTemplate={selectedTemplate}
        isEditMode={true}
      />
    );

    await waitFor(() => {
      expect(onLayoutChange).toHaveBeenCalled();
    });
    expect(onLayoutChange.mock.calls[0][0][0]).toMatchObject({ x: 6, w: 4 });
    expect(mockGridProps.width).toBe(1024);
    expect(mockGridProps.dragConfig).toEqual({
      handle: '.dashboard-card-drag-handle',
    });

    fireEvent.change(screen.getByDisplayValue('Group'), {
      target: { value: 'Updated group' },
    });
    expect(updateCard).toHaveBeenCalledWith('divider-1', {
      title: 'Updated group',
    });

    fireEvent.click(screen.getAllByLabelText('Remove card')[0]);
    expect(removeCard).toHaveBeenCalled();
  });

  test('should ignore layout callbacks when not in edit mode', async () => {
    render(
      <DashboardGrid
        loading={false}
        selectedTemplate={selectedTemplate}
        isEditMode={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-grid')).toBeInTheDocument();
    });

    expect(onLayoutChange).not.toHaveBeenCalled();
    expect(mockGridProps.constraints).toBeUndefined();
  });

  test('should snap dragged cards to allowed columns via a layout constraint', () => {
    render(
      <DashboardGrid
        loading={false}
        selectedTemplate={selectedTemplate}
        isEditMode={true}
      />
    );

    const constraints = mockGridProps.constraints ?? [];
    expect(
      constraints.map((constraint) => {
        return constraint.name;
      })
    ).toEqual(['snapToAllowedColumns', 'gridBounds', 'minMaxSize']);

    const item = { i: 'card-1', x: 0, y: 0, w: 4, h: 2 };
    const snap = (layoutItem: MockLayoutItem, x: number, y: number) => {
      return constraints[0].constrainPosition?.(layoutItem, x, y, {});
    };
    expect(snap(item, 5, 3)).toEqual({ x: 6, y: 3 });
    expect(snap(item, 1, 0)).toEqual({ x: 0, y: 0 });
    // A full-width card can only start at column 0.
    expect(snap({ ...item, w: 12 }, 7, 1)).toEqual({ x: 0, y: 1 });
  });
});
