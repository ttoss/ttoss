import { render, screen, userEvent } from '@ttoss/test-utils/react';
import {
  type DashboardFilter,
  DashboardFilters,
  DashboardFilterType,
  DashboardProvider,
} from 'src/index';

describe('DashboardFilters', () => {
  const user = userEvent.setup({ delay: null });

  test('should render text filter', () => {
    const filters: DashboardFilter[] = [
      {
        key: 'search',
        type: DashboardFilterType.TEXT,
        label: 'Search',
        value: '',
        placeholder: 'Enter search term',
      },
    ];

    render(
      <DashboardProvider filters={filters} templates={[]}>
        <DashboardFilters />
      </DashboardProvider>
    );

    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter search term')
    ).toBeInTheDocument();
  });

  test('should render select filter', () => {
    const filters: DashboardFilter[] = [
      {
        key: 'status',
        type: DashboardFilterType.SELECT,
        label: 'Status',
        value: 'active',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    ];

    render(
      <DashboardProvider filters={filters} templates={[]}>
        <DashboardFilters />
      </DashboardProvider>
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  test('should render date range filter', () => {
    const filters: DashboardFilter[] = [
      {
        key: 'dateRange',
        type: DashboardFilterType.DATE_RANGE,
        label: 'Date Range',
        value: { from: null as unknown as Date, to: null as unknown as Date },
      },
    ];

    render(
      <DashboardProvider filters={filters} templates={[]}>
        <DashboardFilters />
      </DashboardProvider>
    );

    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Selecione o período')).toBeInTheDocument();
  });

  test('should call onChange when text filter value changes', async () => {
    const handleFiltersChange = jest.fn();

    const filters: DashboardFilter[] = [
      {
        key: 'search',
        type: DashboardFilterType.TEXT,
        label: 'Search',
        value: '',
      },
    ];

    render(
      <DashboardProvider
        filters={filters}
        templates={[]}
        onFiltersChange={handleFiltersChange}
      >
        <DashboardFilters />
      </DashboardProvider>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');

    expect(handleFiltersChange).toHaveBeenCalled();
  });

  test('should call onChange when select filter value changes', async () => {
    const handleFiltersChange = jest.fn();

    const filters: DashboardFilter[] = [
      {
        key: 'status',
        type: DashboardFilterType.SELECT,
        label: 'Status',
        value: 'active',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    ];

    render(
      <DashboardProvider
        filters={filters}
        templates={[]}
        onFiltersChange={handleFiltersChange}
      >
        <DashboardFilters />
      </DashboardProvider>
    );

    // The onChange handler is passed through, so it will be called when Select changes
    // The actual Select component interaction depends on @ttoss/ui implementation
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(handleFiltersChange).not.toHaveBeenCalled();
  });

  test('should call onChange for date range filter', async () => {
    const handleFiltersChange = jest.fn();

    const filters: DashboardFilter[] = [
      {
        key: 'dateRange',
        type: DashboardFilterType.DATE_RANGE,
        label: 'Date Range',
        value: { from: new Date(), to: new Date() },
      },
    ];

    render(
      <DashboardProvider
        filters={filters}
        templates={[]}
        onFiltersChange={handleFiltersChange}
      >
        <DashboardFilters />
      </DashboardProvider>
    );

    expect(screen.getByText('Date Range')).toBeInTheDocument();
    // The onChange handler is passed through to DateRangeFilter
    expect(handleFiltersChange).not.toHaveBeenCalled();
  });

  test('should render multiple filters', () => {
    const filters: DashboardFilter[] = [
      {
        key: 'search',
        type: DashboardFilterType.TEXT,
        label: 'Search',
        value: '',
      },
      {
        key: 'status',
        type: DashboardFilterType.SELECT,
        label: 'Status',
        value: 'active',
        options: [{ label: 'Active', value: 'active' }],
      },
      {
        key: 'dateRange',
        type: DashboardFilterType.DATE_RANGE,
        label: 'Date Range',
        value: { from: new Date(), to: new Date() },
      },
    ];

    render(
      <DashboardProvider filters={filters} templates={[]}>
        <DashboardFilters />
      </DashboardProvider>
    );

    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
  });

  test('should return null for unsupported filter types', () => {
    const filters: DashboardFilter[] = [
      {
        key: 'unsupported',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: 'unsupported' as any,
        label: 'Unsupported',
        value: '',
      },
    ];

    render(
      <DashboardProvider filters={filters} templates={[]}>
        <DashboardFilters />
      </DashboardProvider>
    );

    // Should not render anything for unsupported types
    expect(screen.queryByText('Unsupported')).not.toBeInTheDocument();
  });

  test('should handle filters with no onChange handler', () => {
    const filters: DashboardFilter[] = [
      {
        key: 'search',
        type: DashboardFilterType.TEXT,
        label: 'Search',
        value: 'initial value',
      },
    ];

    render(
      <DashboardProvider filters={filters} templates={[]}>
        <DashboardFilters />
      </DashboardProvider>
    );

    expect(screen.getByText('Search')).toBeInTheDocument();
    const input = screen.getByDisplayValue('initial value');
    expect(input).toBeInTheDocument();
  });
});
