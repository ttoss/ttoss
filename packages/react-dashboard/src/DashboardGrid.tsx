import 'react-grid-layout/css/styles.css';

import { Box, Flex, Global, IconButton, Spinner } from '@ttoss/ui';
import { type Layout, Responsive, WidthProvider } from 'react-grid-layout';

import type { DashboardGridItem, DashboardTemplate } from './Dashboard';
import {
  DashboardCard,
  type DashboardCard as DashboardCardProps,
} from './DashboardCard';
import { useDashboard } from './DashboardProvider';
import { DashboardSectionDivider } from './DashboardSectionDivider';

const ResponsiveGridLayout = WidthProvider(Responsive);

/** Only allow card starts at these columns for desktop grid widths. */
const ALLOWED_X_COLUMNS = [0, 3, 6, 9];

const COLS_NUM = 12;

const GRID_BREAKPOINTS = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

const GRID_COLS = {
  xs: 2,
  sm: 2,
  md: 12,
  lg: 12,
  xl: 12,
  '2xl': 12,
};

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

const ClickableCard = ({
  currency,
  card,
  gridItem,
  onCardClick,
}: {
  currency?: string;
  card: DashboardCardProps;
  gridItem: DashboardGridItem;
  onCardClick: (card: DashboardCardProps, gridItem: DashboardGridItem) => void;
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        onCardClick(card, gridItem);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardClick(card, gridItem);
        }
      }}
    >
      <DashboardCard {...{ currency }} {...card} />
    </div>
  );
};

const EditableSectionDividerItem = ({
  item,
  updateCard,
  removeCard,
}: {
  item: DashboardGridItem;
  updateCard: (id: string, patch: Record<string, unknown>) => void;
  removeCard: (id: string) => void;
}) => {
  return (
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
          onTitleChange={(title) => {
            updateCard(item.i, { title });
          }}
        />
      </Box>
      <RemoveCardButton
        onClick={() => {
          return removeCard(item.i);
        }}
      />
    </Box>
  );
};

const EditableCardItem = ({
  item,
  currency,
  removeCard,
}: {
  item: DashboardGridItem;
  currency?: string;
  removeCard: (id: string) => void;
}) => {
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <DashboardCard {...{ currency }} {...(item.card as DashboardCardProps)} />
      <RemoveCardButton
        onClick={() => {
          return removeCard(item.i);
        }}
      />
    </Box>
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
  const { onLayoutChange, removeCard, updateCard, onCardClick } =
    useDashboard();

  if (!selectedTemplate) {
    return null;
  }

  const baseLayout = selectedTemplate.grid.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { card, ...layout } = item;
    const w = layout.w ?? 1;
    const x = snapXToAllowedColumns(layout.x ?? 0, w, COLS_NUM);
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
        const x = snapXToAllowedColumns(item.x, w, COLS_NUM);
        return { ...item, x, w };
      });
      onLayoutChange(snappedLayout);
    }
  };

  const handleDrag = (_layout: Layout[], _oldItem: Layout, newItem: Layout) => {
    if (!isEditMode) return;
    const w = newItem.w ?? 1;
    newItem.x = snapXToAllowedColumns(newItem.x, w, COLS_NUM);
  };

  return (
    <Box
      sx={{ width: '100%', height: 'full' }}
      {...(rest['data-export-target'] && { 'data-export-target': '' })}
    >
      <Global
        styles={{
          '.react-grid-item:has([data-tooltip-id]:hover)': {
            zIndex: 1,
          },
        }}
      />
      {loading ? (
        <Flex
          sx={{
            width: '100%',
            height: 'full',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Spinner />
        </Flex>
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={GRID_BREAKPOINTS}
          cols={GRID_COLS}
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
                <div key={item.i}>
                  {isEditMode ? (
                    <>
                      <DragHandle />
                      <EditableSectionDividerItem
                        item={item}
                        updateCard={updateCard}
                        removeCard={removeCard}
                      />
                    </>
                  ) : (
                    <DashboardSectionDivider {...item.card} />
                  )}
                </div>
              );
            }
            return (
              <div key={item.i}>
                {isEditMode ? (
                  <>
                    <DragHandle />
                    <EditableCardItem
                      item={item}
                      currency={currency}
                      removeCard={removeCard}
                    />
                  </>
                ) : onCardClick ? (
                  <ClickableCard
                    currency={currency}
                    card={item.card as DashboardCardProps}
                    gridItem={item}
                    onCardClick={onCardClick}
                  />
                ) : (
                  <DashboardCard
                    {...{ currency }}
                    {...(item.card as DashboardCardProps)}
                  />
                )}
              </div>
            );
          })}
        </ResponsiveGridLayout>
      )}
    </Box>
  );
};
