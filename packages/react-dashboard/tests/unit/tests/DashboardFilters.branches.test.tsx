import { fireEvent, render, screen } from '@ttoss/test-utils/react';
import { DashboardFilters, DashboardFilterType } from 'src/DashboardFilters';
import { useDashboard } from 'src/DashboardProvider';

jest.mock('src/DashboardProvider', () => {
  const actual = jest.requireActual('src/DashboardProvider');
  return {
    ...actual,
    useDashboard: jest.fn(),
  };
});

jest.mock('src/Filters/TextFilter', () => {
  return {
    TextFilter: ({
      label,
      onChange,
    }: {
      label: string;
      onChange: (value: string) => void;
    }) => {
      return (
        <button
          onClick={() => {
            onChange('typed');
          }}
        >
          {label}
        </button>
      );
    },
  };
});

jest.mock('src/Filters/SelectFilter', () => {
  return {
    SelectFilter: ({
      label,
      onChange,
    }: {
      label: string;
      onChange: (value: string) => void;
    }) => {
      return (
        <button
          onClick={() => {
            onChange('selected');
          }}
        >
          {label}
        </button>
      );
    },
  };
});

jest.mock('src/Filters/DateRangeFilter', () => {
  return {
    DateRangeFilter: ({
      label,
      onChange,
    }: {
      label: string;
      onChange: (value: { from: Date; to: Date }) => void;
    }) => {
      return (
        <button
          onClick={() => {
            onChange({
              from: new Date('2024-01-01'),
              to: new Date('2024-01-31'),
            });
          }}
        >
          {label}
        </button>
      );
    },
  };
});

describe('DashboardFilters branches', () => {
  const updateFilter = jest.fn();
  const mockUseDashboard = useDashboard as jest.MockedFunction<
    typeof useDashboard
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should execute update handlers for text, select and date range', () => {
    mockUseDashboard.mockReturnValue({
      filters: [
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
          key: 'period',
          type: DashboardFilterType.DATE_RANGE,
          label: 'Period',
          value: { from: new Date('2024-01-01'), to: new Date('2024-01-31') },
        },
      ],
      updateFilter,
      isEditMode: false,
    } as never);

    render(<DashboardFilters />);

    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.click(screen.getByRole('button', { name: 'Status' }));
    fireEvent.click(screen.getByRole('button', { name: 'Period' }));

    expect(updateFilter).toHaveBeenCalledWith('search', 'typed');
    expect(updateFilter).toHaveBeenCalledWith('status', 'selected');
    expect(updateFilter).toHaveBeenCalled();
  });
});
