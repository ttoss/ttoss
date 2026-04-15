import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@ttoss/test-utils/react';
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

  describe('onEditingGridChange', () => {
    test('should be called with null initially (no edit mode)', () => {
      const onEditingGridChange = jest.fn();

      render(
        <Dashboard
          templates={[mockTemplate]}
          filters={mockFilters}
          selectedTemplate={mockTemplate}
          editable
          onEditingGridChange={onEditingGridChange}
        />
      );

      // The initial editingGrid is null, so callback fires with null
      expect(onEditingGridChange).toHaveBeenCalledWith(null);
    });

    test('should be called with grid array when edit mode starts', async () => {
      const onEditingGridChange = jest.fn();

      render(
        <Dashboard
          templates={[mockTemplate]}
          filters={mockFilters}
          selectedTemplate={mockTemplate}
          editable
          onEditingGridChange={onEditingGridChange}
        />
      );

      onEditingGridChange.mockClear();

      // Click the edit button
      const editButton = screen.getByRole('button', { name: 'Editar' });
      await act(async () => {
        fireEvent.click(editButton);
      });

      // After starting edit mode, editingGrid becomes an array
      await waitFor(() => {
        expect(onEditingGridChange).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ i: 'card-1' })])
        );
      });
    });

    test('should be called with null when edit is cancelled', async () => {
      const onEditingGridChange = jest.fn();

      render(
        <Dashboard
          templates={[mockTemplate]}
          filters={mockFilters}
          selectedTemplate={mockTemplate}
          editable
          onEditingGridChange={onEditingGridChange}
        />
      );

      // Start edit mode
      const editButton = screen.getByRole('button', { name: 'Editar' });
      await act(async () => {
        fireEvent.click(editButton);
      });

      onEditingGridChange.mockClear();

      // Click cancel
      const cancelButton = screen.getByRole('button', {
        name: 'Cancelar',
      });
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      // After cancelling, editingGrid becomes null
      await waitFor(() => {
        expect(onEditingGridChange).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('onExportPdf', () => {
    test('should render Export button when onExportPdf is provided', () => {
      const onExportPdf = jest.fn().mockResolvedValue(undefined);

      render(
        <Dashboard
          templates={[mockTemplate]}
          filters={mockFilters}
          selectedTemplate={mockTemplate}
          onExportPdf={onExportPdf}
        />
      );

      expect(
        screen.getByRole('button', { name: 'Export PDF' })
      ).toBeInTheDocument();
    });

    test('should not render Export button when onExportPdf is not provided', () => {
      render(
        <Dashboard
          templates={[mockTemplate]}
          filters={mockFilters}
          selectedTemplate={mockTemplate}
        />
      );

      expect(
        screen.queryByRole('button', { name: 'Export PDF' })
      ).not.toBeInTheDocument();
    });

    test('should disable Export button while promise is pending', async () => {
      let resolveExport: () => void;
      const onExportPdf = jest.fn().mockReturnValue(
        new Promise<void>((resolve) => {
          resolveExport = resolve;
        })
      );

      render(
        <Dashboard
          templates={[mockTemplate]}
          filters={mockFilters}
          selectedTemplate={mockTemplate}
          onExportPdf={onExportPdf}
        />
      );

      const exportButton = screen.getByRole('button', { name: 'Export PDF' });
      expect(exportButton).not.toBeDisabled();

      await act(async () => {
        fireEvent.click(exportButton);
      });

      expect(exportButton).toBeDisabled();

      await act(async () => {
        resolveExport!();
      });

      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
      });
    });
  });

  describe('headerChildren alignment', () => {
    test('should wrap headerChildren in a centered flex container', () => {
      render(
        <Dashboard
          templates={[mockTemplate]}
          filters={mockFilters}
          headerChildren={
            <>
              <button data-testid="btn-a">A</button>
              <button data-testid="btn-b">B</button>
            </>
          }
        />
      );

      const btnA = screen.getByTestId('btn-a');
      const btnB = screen.getByTestId('btn-b');

      // Both buttons should be present
      expect(btnA).toBeInTheDocument();
      expect(btnB).toBeInTheDocument();

      // Both buttons should share a common parent wrapper (the Flex container)
      expect(btnA.parentElement).toBe(btnB.parentElement);
    });
  });

  test('should render data-export-target on the grid container', () => {
    const { container } = render(
      <Dashboard
        templates={[mockTemplate]}
        filters={mockFilters}
        selectedTemplate={mockTemplate}
      />
    );

    const exportTarget = container.querySelector('[data-export-target]');
    expect(exportTarget).toBeInTheDocument();
  });
});
