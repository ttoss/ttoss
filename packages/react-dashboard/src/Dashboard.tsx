import { Button, Divider, Flex } from '@ttoss/ui';
import * as React from 'react';
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

const ExportButton = ({
  onExportPdf,
}: {
  onExportPdf: () => Promise<void>;
}) => {
  const [exporting, setExporting] = React.useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExportPdf();
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      aria-label="Export PDF"
      disabled={exporting}
      loading={exporting}
      onClick={handleExport}
    >
      Export PDF
    </Button>
  );
};

const DashboardContent = ({
  loading = false,
  headerChildren,
  selectedTemplate,
  onExportPdf,
}: {
  loading: boolean;
  headerChildren?: React.ReactNode;
  selectedTemplate?: DashboardTemplate;
  onExportPdf?: () => Promise<void>;
}) => {
  const { isEditMode, editingGrid } = useDashboard();
  const grid = isEditMode && editingGrid ? editingGrid : selectedTemplate?.grid;
  const effectiveTemplate =
    grid != null && selectedTemplate
      ? { ...selectedTemplate, grid }
      : selectedTemplate;

  const combinedHeaderChildren = (
    <>
      {headerChildren}
      {onExportPdf && <ExportButton onExportPdf={onExportPdf} />}
    </>
  );

  return (
    <Flex
      sx={{ flexDirection: 'column', gap: '5', padding: '2', width: '100%' }}
    >
      <DashboardHeader>{combinedHeaderChildren}</DashboardHeader>

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
  onEditingGridChange,
  onExportPdf,
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
  /** Called whenever the internal editing grid changes; receives `null` when edit mode exits. */
  onEditingGridChange?: (grid: DashboardGridItem[] | null) => void;
  /** When provided, renders a built-in Export button. The button is disabled while the promise is pending. */
  onExportPdf?: () => Promise<void>;
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
      onEditingGridChange={onEditingGridChange}
    >
      <DashboardContent
        loading={loading}
        headerChildren={headerChildren}
        selectedTemplate={selectedTemplate}
        onExportPdf={onExportPdf}
      />
    </DashboardProvider>
  );
};
