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

jest.mock('react-grid-layout', () => {
  const React = jest.requireActual('react');

  const Responsive = ({
    children,
    onLayoutChange,
    onDrag,
    onDragStop,
  }: {
    children: React.ReactNode;
    onLayoutChange?: (layout: Array<Record<string, unknown>>) => void;
    onDrag?: (
      layout: Array<Record<string, unknown>>,
      oldItem: Record<string, unknown>,
      newItem: Record<string, unknown>
    ) => void;
    onDragStop?: (
      layout: Array<Record<string, unknown>>,
      oldItem: Record<string, unknown>,
      newItem: Record<string, unknown>
    ) => void;
  }) => {
    React.useEffect(() => {
      const movedItem = { i: 'card-1', x: 5, y: 6, w: 4, h: 2 };
      onLayoutChange?.([movedItem]);
      onDrag?.([], movedItem, { ...movedItem });
      onDragStop?.([], movedItem, { ...movedItem });
    }, [onLayoutChange, onDrag, onDragStop]);

    return <div data-testid="mock-grid">{children}</div>;
  };

  return {
    Responsive,
    WidthProvider: (component: unknown) => {
      return component;
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
          data: { api: { total: 100 } },
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
  });
});
