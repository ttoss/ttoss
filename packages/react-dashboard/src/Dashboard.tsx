import { Divider, Flex } from '@ttoss/ui';
import * as React from 'react';
import ReactGridLayout from 'react-grid-layout';

import { DashboardCard } from './DashboardCard';
import { DashboardFilter } from './DashboardFilters';
import { DashboardGrid } from './DashboardGrid';
import { DashboardHeader } from './DashboardHeader';
import { DashboardProvider } from './DashboardProvider';

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
  selectedTemplate,
}: {
  loading: boolean;
  headerChildren?: React.ReactNode;
  selectedTemplate?: DashboardTemplate;
}) => {
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
  selectedTemplate,
  loading = false,
  templates = [],
  filters = [],
  headerChildren,
  onFiltersChange,
}: {
  selectedTemplate?: DashboardTemplate;
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
      selectedTemplate={selectedTemplate}
    >
      <DashboardContent
        loading={loading}
        headerChildren={headerChildren}
        selectedTemplate={selectedTemplate}
      />
    </DashboardProvider>
  );
};
