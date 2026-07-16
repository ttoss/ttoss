import 'react-grid-layout/css/styles.css';

import { Box, Flex, Global, IconButton, Spinner } from '@ttoss/ui';
import * as React from 'react';
import { type Layout, Responsive, WidthProvider } from 'react-grid-layout';

import type { DashboardTemplate } from './Dashboard';
import {
  DashboardCard,
  type DashboardCard as DashboardCardProps,
} from './DashboardCard';
import { useDashboard } from './DashboardProvider';
import { DashboardSectionDivider } from './DashboardSectionDivider';

const ResponsiveGridLayout = WidthProvider(Responsive);

const ALLOWED_X_COLUMNS = [0, 3, 6, 9];
const DETAIL_EXTRA_ROWS = 10;

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
        '&:hover': { color: 'red' },
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

type GridCardProps = {
  itemKey: string;
  card: DashboardCardProps;
  currency?: string;
  clickable: boolean;
  isEditMode: boolean;
  expanded: boolean;
  detailContent?: React.ReactNode;
  onCardClick: (key: string, card: DashboardCardProps) => void;
  onRemove: (key: string) => void;
};

const GridCard = ({
  itemKey,
  card,
  currency,
  clickable,
  isEditMode,
  expanded,
  detailContent,
  onCardClick,
  onRemove,
}: GridCardProps) => {
  const handleClick = clickable
    ? () => {
        return onCardClick(itemKey, card);
      }
    : undefined;
  const handleKeyDown = clickable
    ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') onCardClick(itemKey, card);
      }
    : undefined;
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        ...(clickable ? { cursor: 'pointer' } : undefined),
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {isEditMode ? (
        <>
          <DragHandle />
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <DashboardCard {...{ currency }} {...card} />
            <RemoveCardButton
              onClick={() => {
                return onRemove(itemKey);
              }}
            />
          </Box>
        </>
      ) : (
        <>
          <DashboardCard {...{ currency }} {...card} />
          {expanded && detailContent && (
            <Box sx={{ flex: 1, overflow: 'auto', mt: 2 }}>{detailContent}</Box>
          )}
        </>
      )}
    </div>
  );
};

type GridSectionDividerProps = {
  itemKey: string;
  card: React.ComponentProps<typeof DashboardSectionDivider>;
  isEditMode: boolean;
  onTitleChange: (key: string, title: string) => void;
  onRemove: (key: string) => void;
};

const GridSectionDivider = ({
  itemKey,
  card,
  isEditMode,
  onTitleChange,
  onRemove,
}: GridSectionDividerProps) => {
  if (!isEditMode) return <DashboardSectionDivider {...card} />;
  return (
    <>
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
            {...card}
            editable
            onTitleChange={(title) => {
              return onTitleChange(itemKey, title);
            }}
          />
        </Box>
        <RemoveCardButton
          onClick={() => {
            return onRemove(itemKey);
          }}
        />
      </Box>
    </>
  );
};

export type DashboardGridProps = {
  loading: boolean;
  selectedTemplate?: DashboardTemplate;
  isEditMode?: boolean;
  /** ISO 4217 currency code applied to all cards with `numberType="currency"`. Card-level `currency` takes precedence. */
  currency?: string;
  'data-export-target'?: boolean;
  selectedCardKey?: string | null;
  setSelectedCardKey?: React.Dispatch<React.SetStateAction<string | null>>;
  renderCardDetail?: (
    card: DashboardCardProps,
    close: () => void
  ) => React.ReactNode;
  clickableCardFilter?: (card: DashboardCardProps) => boolean;
};

const COLS_NUM = 12;
const BREAKPOINTS = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};
const COLS = { xs: 2, sm: 2, md: 12, lg: 12, xl: 12, '2xl': 12 };

const buildLayout = (template: DashboardTemplate, isEditMode: boolean) => {
  const base = template.grid.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { card, ...layout } = item;
    const w = layout.w ?? 1;
    const x = snapXToAllowedColumns(layout.x ?? 0, w, COLS_NUM);
    const snapped = { ...layout, x, w };
    return isEditMode ? { ...snapped, isDraggable: true } : snapped;
  });
  return { xs: base, sm: base, md: base, lg: base, xl: base, '2xl': base };
};

const buildExpandedLayouts = (
  base: ReturnType<typeof buildLayout>,
  selectedKey: string | null | undefined
): ReturnType<typeof buildLayout> => {
  if (!selectedKey) return base;
  const expand = (items: Layout[]) => {
    return items.map((item) => {
      return item.i === selectedKey
        ? { ...item, h: item.h + DETAIL_EXTRA_ROWS }
        : item;
    });
  };
  return {
    xs: expand(base.xs),
    sm: expand(base.sm),
    md: expand(base.md),
    lg: expand(base.lg),
    xl: expand(base.xl),
    '2xl': expand(base['2xl']),
  };
};

const getCardClickable = (
  card: DashboardCardProps,
  renderCardDetail: DashboardGridProps['renderCardDetail'],
  clickableCardFilter: DashboardGridProps['clickableCardFilter']
): boolean => {
  if (!renderCardDetail) return false;
  return clickableCardFilter ? clickableCardFilter(card) : true;
};

const snapLayout = (current: Layout[]): Layout[] => {
  return current.map((item) => {
    const w = item.w ?? 1;
    return { ...item, x: snapXToAllowedColumns(item.x, w, COLS_NUM), w };
  });
};

const useDragHandlers = (
  isEditMode: boolean,
  onLayoutChange: (l: Layout[]) => void
) => {
  const isDraggingRef = React.useRef(false);
  const handleLayoutChange = (current: Layout[]) => {
    if (isEditMode) onLayoutChange(snapLayout(current));
  };
  const snapDrag = (_l: Layout[], _o: Layout, newItem: Layout) => {
    if (isEditMode)
      newItem.x = snapXToAllowedColumns(newItem.x, newItem.w ?? 1, COLS_NUM);
  };
  const handleDragStop = (l: Layout[], o: Layout, newItem: Layout) => {
    snapDrag(l, o, newItem);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 0);
  };
  return { isDraggingRef, handleLayoutChange, snapDrag, handleDragStop };
};

export const DashboardGrid = ({
  loading,
  selectedTemplate,
  isEditMode = false,
  currency,
  selectedCardKey,
  setSelectedCardKey,
  renderCardDetail,
  clickableCardFilter,
  ...rest
}: DashboardGridProps) => {
  const { onLayoutChange, removeCard, updateCard } = useDashboard();
  const { isDraggingRef, handleLayoutChange, snapDrag, handleDragStop } =
    useDragHandlers(isEditMode, onLayoutChange);

  const close = React.useCallback(() => {
    return setSelectedCardKey?.(null);
  }, [setSelectedCardKey]);

  const baseLayouts = selectedTemplate
    ? buildLayout(selectedTemplate, isEditMode)
    : undefined;

  const layouts =
    baseLayouts && renderCardDetail
      ? buildExpandedLayouts(baseLayouts, selectedCardKey)
      : baseLayouts;

  if (!selectedTemplate || !layouts) return null;

  const isCardClickable = (card: DashboardCardProps) => {
    return getCardClickable(card, renderCardDetail, clickableCardFilter);
  };

  const handleCardClick = (key: string, card: DashboardCardProps) => {
    if (isEditMode || isDraggingRef.current || !isCardClickable(card)) return;
    setSelectedCardKey?.((prev) => {
      return prev === key ? null : key;
    });
  };

  return (
    <Box
      sx={{ width: '100%', height: 'full' }}
      {...(rest['data-export-target'] && { 'data-export-target': '' })}
    >
      <Global
        styles={{
          '.react-grid-item:has([data-tooltip-id]:hover)': { zIndex: 1 },
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
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={32}
          margin={[10, 10]}
          containerPadding={[0, 0]}
          onLayoutChange={handleLayoutChange}
          onDrag={snapDrag}
          onDragStart={() => {
            isDraggingRef.current = true;
          }}
          onDragStop={handleDragStop}
          draggableHandle=".dashboard-card-drag-handle"
        >
          {selectedTemplate.grid.map((item) => {
            if (item.card.type === 'sectionDivider') {
              return (
                <div key={item.i}>
                  <GridSectionDivider
                    itemKey={item.i}
                    card={item.card}
                    isEditMode={isEditMode}
                    onTitleChange={(key, title) => {
                      return updateCard(key, { title });
                    }}
                    onRemove={removeCard}
                  />
                </div>
              );
            }
            const card = item.card as DashboardCardProps;
            const isExpanded = selectedCardKey === item.i;
            const detailContent =
              isExpanded && renderCardDetail
                ? renderCardDetail(card, close)
                : undefined;
            return (
              <div key={item.i}>
                <GridCard
                  itemKey={item.i}
                  card={card}
                  currency={currency}
                  clickable={isCardClickable(card)}
                  isEditMode={isEditMode}
                  expanded={isExpanded}
                  detailContent={detailContent}
                  onCardClick={handleCardClick}
                  onRemove={removeCard}
                />
              </div>
            );
          })}
        </ResponsiveGridLayout>
      )}
    </Box>
  );
};
