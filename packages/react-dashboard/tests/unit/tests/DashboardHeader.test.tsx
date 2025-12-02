import { render, screen } from '@ttoss/test-utils/react';
import {
  type DashboardFilter,
  DashboardFilterType,
  DashboardHeader,
  DashboardProvider,
} from 'src/index';

describe('DashboardHeader', () => {
  const mockFilters: DashboardFilter[] = [
    {
      key: 'search',
      type: DashboardFilterType.TEXT,
      label: 'Search',
      value: '',
    },
  ];

  test('should render DashboardFilters', () => {
    render(
      <DashboardProvider filters={mockFilters} templates={[]}>
        <DashboardHeader />
      </DashboardProvider>
    );

    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  test('should render children', () => {
    render(
      <DashboardProvider filters={mockFilters} templates={[]}>
        <DashboardHeader>
          <div data-testid="custom-content">Custom Content</div>
        </DashboardHeader>
      </DashboardProvider>
    );

    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  test('should render both filters and children', () => {
    render(
      <DashboardProvider filters={mockFilters} templates={[]}>
        <DashboardHeader>
          <button>Action Button</button>
        </DashboardHeader>
      </DashboardProvider>
    );

    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });
});
