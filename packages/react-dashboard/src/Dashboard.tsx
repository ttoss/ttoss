import type { SxProp } from '@ttoss/ui';
import { Divider, Flex } from '@ttoss/ui';
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

const resolveTemplate = (
  selectedTemplate: DashboardTemplate | undefined,
  isEditMode: boolean,
  editingGrid: DashboardGridItem[] | null
): DashboardTemplate | undefined => {
  const grid = isEditMode && editingGrid ? editingGrid : selectedTemplate?.grid;
  return grid != null && selectedTemplate
    ? { ...selectedTemplate, grid }
    : selectedTemplate;
};

const DashboardContent = ({
  loading = false,
  headerChildren,
  selectedTemplate,
  currency,
  showFilters = true,
  sx,
  renderCardDetail,
  clickableCardFilter,
  selectedCardKey: controlledSelectedCardKey,
  onCardSelect,
  detailSlotHeight,
  detailMode = 'single',
}: {
  loading: boolean;
  headerChildren?: React.ReactNode;
  selectedTemplate?: DashboardTemplate;
  /** ISO 4217 currency code applied to all cards with `numberType="currency"`. Card-level `currency` takes precedence. */
  currency?: string;
  showFilters?: boolean;
  sx?: SxProp['sx'];
  renderCardDetail?: (
    card: DashboardCard,
    close: () => void
  ) => React.ReactNode;
  clickableCardFilter?: (card: DashboardCard) => boolean;
  selectedCardKey?: string | string[] | null;
  onCardSelect?: (
    key: string | string[] | null,
    card: DashboardCard | null
  ) => void;
  detailSlotHeight?: number;
  detailMode?: 'single' | 'multi';
}) => {
  const { isEditMode, editingGrid, filters, editable } = useDashboard();
  const effectiveTemplate = resolveTemplate(
    selectedTemplate,
    isEditMode,
    editingGrid
  );
  const hasHeaderContent =
    (showFilters && filters.length > 0) || Boolean(headerChildren) || editable;

  const isControlled = controlledSelectedCardKey !== undefined;
  const [internalSelectedCardKey, setInternalSelectedCardKey] = React.useState<
    string | string[] | null
  >(null);

  const selectedCardKey = isControlled
    ? controlledSelectedCardKey
    : internalSelectedCardKey;

  const setSelectedCardKey: React.Dispatch<
    React.SetStateAction<string | string[] | null>
  > = React.useCallback(
    (action) => {
      const next =
        typeof action === 'function' ? action(selectedCardKey ?? null) : action;
      if (!isControlled) {
        setInternalSelectedCardKey(next);
      }
      if (onCardSelect) {
        const firstKey = Array.isArray(next) ? next[0] : next;
        const card =
          firstKey && effectiveTemplate
            ? ((effectiveTemplate.grid.find((item) => {
                return item.i === firstKey;
              })?.card as DashboardCard | undefined) ?? null)
            : null;
        onCardSelect(next, card);
      }
    },
    [isControlled, onCardSelect, selectedCardKey, effectiveTemplate]
  );

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '5',
        padding: '2',
        width: '100%',
        ...sx,
      }}
    >
      <DashboardHeader showFilters={showFilters}>
        {headerChildren}
      </DashboardHeader>

      {hasHeaderContent && <Divider color="display.border.muted.default" />}

      <DashboardGrid
        loading={loading}
        selectedTemplate={effectiveTemplate}
        isEditMode={isEditMode}
        currency={currency}
        data-export-target
        selectedCardKey={selectedCardKey}
        setSelectedCardKey={setSelectedCardKey}
        renderCardDetail={renderCardDetail}
        clickableCardFilter={clickableCardFilter}
        detailSlotHeight={detailSlotHeight}
        detailMode={detailMode}
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
  currency,
  showFilters = true,
  sx,
  renderCardDetail,
  clickableCardFilter,
  selectedCardKey,
  onCardSelect,
  detailSlotHeight,
  detailMode,
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
  /** Called whenever the internal editing grid changes. Receives `null` when edit mode exits. */
  onEditingGridChange?: (grid: DashboardGridItem[] | null) => void;
  /** ISO 4217 currency code (e.g. `"BRL"`, `"USD"`, `"EUR"`). Applied to all cards with `numberType="currency"`. Card-level `currency` takes precedence. Defaults to `"BRL"`. */
  currency?: string;
  /** When false, the internal filter bar is not rendered. Useful when filters are managed in an external UI. Defaults to true. */
  showFilters?: boolean;
  /** Style overrides applied to the outer container. Use to adjust padding or spacing to fit a surrounding layout. */
  sx?: SxProp['sx'];
  /** Render a detail slot below the clicked card's row. Receives the card and a `close` callback. */
  renderCardDetail?: (
    card: DashboardCard,
    close: () => void
  ) => React.ReactNode;
  /** When provided, only cards for which this returns `true` are clickable. Defaults to all non-sectionDivider cards. */
  clickableCardFilter?: (card: DashboardCard) => boolean;
  /**
   * Controlled selection. When provided, `DashboardContent` uses this value
   * instead of its own `useState`. Supply `onCardSelect` to handle changes.
   * Supports a single key (string) or multiple keys (string[]) when `detailMode='multi'`.
   * Omit entirely for uncontrolled behavior (default).
   */
  selectedCardKey?: string | string[] | null;
  /**
   * Called whenever the selected card key changes (controlled and uncontrolled).
   * `key` is the new selection; `card` is the first selected card or `null` when closed.
   */
  onCardSelect?: (
    key: string | string[] | null,
    card: DashboardCard | null
  ) => void;
  /** Number of grid rows for the detail slot. Defaults to 12 (384 px at rowHeight=32). */
  detailSlotHeight?: number;
  /** 'single' (default): one slot at a time. 'multi': each card gets its own independent slot. */
  detailMode?: 'single' | 'multi';
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
        currency={currency}
        showFilters={showFilters}
        sx={sx}
        renderCardDetail={renderCardDetail}
        clickableCardFilter={clickableCardFilter}
        selectedCardKey={selectedCardKey}
        onCardSelect={onCardSelect}
        detailSlotHeight={detailSlotHeight}
        detailMode={detailMode}
      />
    </DashboardProvider>
  );
};
