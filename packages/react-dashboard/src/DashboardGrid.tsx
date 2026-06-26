import 'react-grid-layout/css/styles.css';

import { Box, Global, IconButton } from '@ttoss/ui';
import { type Layout, Responsive, WidthProvider } from 'react-grid-layout';

import type { DashboardTemplate } from './Dashboard';
import { DashboardCard, type DashboardCardProps } from './DashboardCard';
import { useDashboard } from './DashboardProvider';
import { DashboardSectionDivider } from './DashboardSectionDivider';

const ResponsiveGridLayout = WidthProvider(Responsive);

/** Only allow card starts at these columns for desktop grid widths. */
const ALLOWED_X_COLUMNS = [0, 3, 6, 9];

const snapXToAllowedColumns = (x: number, w: number, cols: number): number => {
  const maxX = Math.max(0, cols - w);
  const validColumns = ALLOWED_X_COLUMNS.filter((column) => {
    return column >= 0 && column <= maxX;
  });

  if (validColumns.length === 0) return 0;

  return validColumns.reduce((closest, current) => {
    return Math.abs(current - x) < Math.abs(closest - x) ? current : closest;
  });
};

const RemoveCardButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <IconButton
      aria-label="Remove card"
      icon="close"
      onClick={onClick}
      sx={{
        borderRadius: 'full',
        '&:hover': {
          color: 'red',
        },
        position: 'absolute',
        bottom: 1,
        right: 0,
        zIndex: 2,
      }}
    />
  );
};

const DragHandle = () => {
  return (
    <IconButton
      className="dashboard-card-drag-handle"
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 1,
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
      }}
      aria-label="Drag card"
      icon="lucide:grip-vertical"
    />
  );
};

type GridItemWrapperProps = {
  className?: string;
  style?: Record<string, unknown>;
};

type DashboardGridCardItemProps = {
  item: DashboardTemplate['grid'][number];
  isEditMode: boolean;
  loading: boolean;
  currency?: string;
  onRemoveCard: () => void;
} & GridItemWrapperProps;

const DashboardMetricItem = ({
  item,
  isEditMode,
  loading,
  currency,
  onRemoveCard,
  ...wrapperProps
}: DashboardGridCardItemProps) => {
  const card = (
    <DashboardCard
      {...{ currency }}
      {...(item.card as DashboardCardProps)}
      loading={loading}
    />
  );

  if (!isEditMode) {
    return <div {...wrapperProps}>{card}</div>;
  }

  return (
    <div {...wrapperProps}>
      <DragHandle />
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        {card}
        <RemoveCardButton onClick={onRemoveCard} />
      </Box>
    </div>
  );
};

type DashboardGridSectionDividerItemProps = {
  item: DashboardTemplate['grid'][number];
  isEditMode: boolean;
  onRemoveCard: () => void;
  onTitleChange: (title: string) => void;
} & GridItemWrapperProps;

const DashboardSectionDividerItem = ({
  item,
  isEditMode,
  onRemoveCard,
  onTitleChange,
  ...wrapperProps
}: DashboardGridSectionDividerItemProps) => {
  if (item.card.type !== 'sectionDivider') {
    return null;
  }

  if (!isEditMode) {
    return (
      <div {...wrapperProps}>{<DashboardSectionDivider {...item.card} />}</div>
    );
  }

  return (
    <div {...wrapperProps}>
      <DragHandle />
      <Box
        sx={{
          position: 'relative',
          overflow: 'visible',
          width: '100%',
          height: '100%',
          border: 'sm',
          borderStyle: 'dashed',
          borderColor: 'display.border.muted.default',
          borderRadius: 'md',
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <Box sx={{ paddingLeft: '6' }}>
          <DashboardSectionDivider
            {...item.card}
            editable
            onTitleChange={onTitleChange}
          />
        </Box>
        <RemoveCardButton onClick={onRemoveCard} />
      </Box>
    </div>
  );
};

/**
 * Renders the dashboard grid and preserves the selected template layout while cards load their data.
 */
export const DashboardGrid = ({
  loading,
  selectedTemplate,
  isEditMode = false,
  currency,
  ...rest
}: {
  loading: boolean;
  selectedTemplate?: DashboardTemplate;
  isEditMode?: boolean;
  /** ISO 4217 currency code applied to all cards with `numberType="currency"`. Card-level `currency` takes precedence. */
  currency?: string;
  'data-export-target'?: boolean;
}) => {
  const { onLayoutChange, removeCard, updateCard } = useDashboard();

  if (!selectedTemplate) {
    return null;
  }

  const breakpoints = {
    xs: 0,
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  };

  const cols = {
    xs: 2,
    sm: 2,
    md: 12,
    lg: 12,
    xl: 12,
    '2xl': 12,
  };

  const colsNum = 12;

  const baseLayout = selectedTemplate.grid.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { card, ...layout } = item;
    const w = layout.w ?? 1;
    const x = snapXToAllowedColumns(layout.x ?? 0, w, colsNum);
    const snappedLayout = { ...layout, x, w };
    if (isEditMode) {
      return { ...snappedLayout, isDraggable: true };
    }
    return snappedLayout;
  });

  const layouts = {
    xs: baseLayout,
    sm: baseLayout,
    md: baseLayout,
    lg: baseLayout,
    xl: baseLayout,
    '2xl': baseLayout,
  };

  const handleLayoutChange = (currentLayout: Layout[]) => {
    if (isEditMode) {
      const snappedLayout = currentLayout.map((item) => {
        const w = item.w ?? 1;
        const x = snapXToAllowedColumns(item.x, w, colsNum);
        return { ...item, x, w };
      });
      onLayoutChange(snappedLayout);
    }
  };

  const handleDrag = (_layout: Layout[], _oldItem: Layout, newItem: Layout) => {
    if (!isEditMode) return;
    const w = newItem.w ?? 1;
    newItem.x = snapXToAllowedColumns(newItem.x, w, colsNum);
  };

  return (
    <Box
      sx={{ width: '100%', height: 'full' }}
      aria-busy={loading}
      {...(rest['data-export-target'] && { 'data-export-target': '' })}
    >
      <Global
        styles={{
          '.react-grid-item:has([data-tooltip-id]:hover)': {
            zIndex: 1,
          },
        }}
      />
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={32}
        margin={[10, 10]}
        containerPadding={[0, 0]}
        onLayoutChange={handleLayoutChange}
        onDrag={handleDrag}
        onDragStop={handleDrag}
        draggableHandle=".dashboard-card-drag-handle"
      >
        {selectedTemplate.grid.map((item) => {
          if (item.card.type === 'sectionDivider') {
            return (
              <DashboardSectionDividerItem
                key={item.i}
                item={item}
                isEditMode={isEditMode}
                onRemoveCard={() => {
                  return removeCard(item.i);
                }}
                onTitleChange={(title) => {
                  updateCard(item.i, { title });
                }}
              />
            );
          }
          return (
            <DashboardMetricItem
              key={item.i}
              item={item}
              isEditMode={isEditMode}
              loading={loading}
              currency={currency}
              onRemoveCard={() => {
                return removeCard(item.i);
              }}
            />
          );
        })}
      </ResponsiveGridLayout>
    </Box>
  );
};
