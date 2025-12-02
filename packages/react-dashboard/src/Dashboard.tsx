import { Divider, Flex } from '@ttoss/ui';
import * as React from 'react';
import ReactGridLayout from 'react-grid-layout';

import { DashboardCard } from './DashboardCard';
import { DashboardFilter } from './DashboardFilters';
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
  headerChildren,
}: {
  loading: boolean;
  headerChildren?: React.ReactNode;
}) => {
  const { selectedTemplate } = useDashboard();

  return (
    <Flex
      sx={{ flexDirection: 'column', gap: '5', padding: '2', width: '100%' }}
    >
      <DashboardHeader>{headerChildren}</DashboardHeader>

      <Divider />

      <DashboardGrid loading={loading} selectedTemplate={selectedTemplate} />
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
    <DashboardProvider
      filters={filters}
      templates={templates}
      onFiltersChange={onFiltersChange}
    >
      <DashboardContent loading={loading} headerChildren={headerChildren} />
    </DashboardProvider>
  );
};
