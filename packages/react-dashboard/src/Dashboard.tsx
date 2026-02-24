import { Divider, Flex } from '@ttoss/ui';
import type * as React from 'react';
import type ReactGridLayout from 'react-grid-layout';

import type { DashboardCard } from './DashboardCard';
import type { CardCatalogItem } from './dashboardCardCatalog';
import type { DashboardFilter } from './DashboardFilters';
import { DashboardGrid } from './DashboardGrid';
import { DashboardHeader } from './DashboardHeader';
import { DashboardProvider, useDashboard } from './DashboardProvider';
import type { SectionDivider } from './DashboardSectionDivider';

export type DashboardGridItem = ReactGridLayout.Layout & {
  card: DashboardCard | SectionDivider;
};

export interface DashboardTemplate {
  id: string;
  name: string;
  description?: string;
  grid: DashboardGridItem[];
  editable?: boolean;
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
  const { isEditMode, editingGrid } = useDashboard();
  const grid = isEditMode && editingGrid ? editingGrid : selectedTemplate?.grid;
  const effectiveTemplate =
    grid != null && selectedTemplate
      ? { ...selectedTemplate, grid }
      : selectedTemplate;

  return (
    <Flex
      sx={{ flexDirection: 'column', gap: '5', padding: '2', width: '100%' }}
    >
      <DashboardHeader>{headerChildren}</DashboardHeader>

      <Divider color="display.border.muted.default" />

      <DashboardGrid
        loading={loading}
        selectedTemplate={effectiveTemplate}
        isEditMode={isEditMode}
      />
    </Flex>
  );
};

export const Dashboard = ({
  selectedTemplate,
  loading = false,
  templates = [],
  filters = [],
  cardCatalog,
  headerChildren,
  onFiltersChange,
  editable = false,
  onSaveLayout,
  onSaveAsNewTemplate,
  onCancelEdit,
}: {
  selectedTemplate?: DashboardTemplate;
  loading?: boolean;
  headerChildren?: React.ReactNode;
  templates?: DashboardTemplate[];
  filters?: DashboardFilter[];
  /** Card types available when adding a card (e.g. from API). Omit to use default catalog. */
  cardCatalog?: CardCatalogItem[];
  onFiltersChange?: (filters: DashboardFilter[]) => void;
  editable?: boolean;
  onSaveLayout?: (template: DashboardTemplate) => void;
  onSaveAsNewTemplate?: (template: DashboardTemplate) => void;
  onCancelEdit?: () => void;
}) => {
  return (
    <DashboardProvider
      filters={filters}
      templates={templates}
      cardCatalog={cardCatalog}
      onFiltersChange={onFiltersChange}
      selectedTemplate={selectedTemplate}
      editable={editable}
      onSaveLayout={onSaveLayout}
      onSaveAsNewTemplate={onSaveAsNewTemplate}
      onCancelEdit={onCancelEdit}
    >
      <DashboardContent
        loading={loading}
        headerChildren={headerChildren}
        selectedTemplate={selectedTemplate}
      />
    </DashboardProvider>
  );
};
