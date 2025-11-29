import { Divider, Flex } from '@ttoss/ui';
import * as React from 'react';
import ReactGridLayout from 'react-grid-layout';

import { DashboardCard } from './DashboardCard';
import { DashboardFilter, DashboardFilterValue } from './DashboardFilters';
import { DashboardGrid } from './DashboardGrid';
import { DashboardHeader } from './DashboardHeader';
import { DashboardProvider, useDashboard } from './DashboardProvider';

export type DashboardGridItem = ReactGridLayout.Layout & {
  card: DashboardCard;
};

export interface DashboardTemplate {
  id: string;
  name: string;
  description?: string;
  grid: DashboardGridItem[];
}

const DashboardContent = ({
  loading = false,
  templates,
  filters,
  headerChildren,
  onFiltersChange,
}: {
  loading: boolean;
  templates: DashboardTemplate[];
  filters?: DashboardFilter[];
  headerChildren?: React.ReactNode;
  onFiltersChange?: (filters: DashboardFilter[]) => void;
}) => {
  const { setFilters, setTemplates } = useDashboard();

  React.useEffect(() => {
    setTemplates(templates);
  }, [templates, setTemplates]);

  // Sync external filters to internal state
  React.useEffect(() => {
    if (filters) {
      setFilters(
        filters.map((filter) => {
          return {
            ...filter,
            onChange: (value: DashboardFilterValue) => {
              setFilters((prevFilters: DashboardFilter[]) => {
                const updatedFilters = prevFilters.map(
                  (currentFilter: DashboardFilter) => {
                    return currentFilter.key === filter.key
                      ? { ...currentFilter, value }
                      : currentFilter;
                  }
                );
                // Notify external state of changes
                if (onFiltersChange) {
                  onFiltersChange(updatedFilters);
                }
                return updatedFilters;
              });
            },
          };
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, setFilters]);

  return (
    <Flex
      sx={{ flexDirection: 'column', gap: '5', padding: '2', width: '100%' }}
    >
      <DashboardHeader>{headerChildren}</DashboardHeader>

      <Divider />

      <DashboardGrid loading={loading} />
    </Flex>
  );
};

export const Dashboard = ({
  loading = false,
  templates = [],
  filters = [],
  headerChildren,
  onFiltersChange,
}: {
  loading?: boolean;
  headerChildren?: React.ReactNode;
  templates?: DashboardTemplate[];
  filters?: DashboardFilter[];
  onFiltersChange?: (filters: DashboardFilter[]) => void;
}) => {
  return (
    <DashboardProvider initialFilters={filters} initialTemplates={templates}>
      <DashboardContent
        loading={loading}
        templates={templates}
        filters={filters}
        headerChildren={headerChildren}
        onFiltersChange={onFiltersChange}
      />
    </DashboardProvider>
  );
};
