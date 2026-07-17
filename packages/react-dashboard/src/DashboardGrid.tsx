import 'react-grid-layout/css/styles.css';

import { Box, Flex, Global, Spinner } from '@ttoss/ui';
import * as React from 'react';
import { type Layout, Responsive, WidthProvider } from 'react-grid-layout';

import type { DashboardTemplate } from './Dashboard';
import { type DashboardCard as DashboardCardProps } from './DashboardCard';
import { buildGridItems } from './DashboardGridItems';
import { useDashboard } from './DashboardProvider';

const ResponsiveGridLayout = WidthProvider(Responsive);

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

const SLOT_KEY = '__detail_slot__';
const SLOT_H = 12;

const buildSlotLayout = (
  base: ReturnType<typeof buildLayout>,
  selectedKey: string,
  template: DashboardTemplate
): ReturnType<typeof buildLayout> => {
  const selectedItem = template.grid.find((i) => {
    return i.i === selectedKey;
  });
  if (!selectedItem) return base;
  const slotY = selectedItem.y + selectedItem.h;
  const slotItem: Layout = {
    i: SLOT_KEY,
    x: 0,
    y: slotY,
    w: COLS_NUM,
    h: SLOT_H,
    isDraggable: false,
    isResizable: false,
    static: true,
  };
  const insertAndShift = (items: Layout[]) => {
    const shifted = items.map((item) => {
      if (item.y >= slotY) return { ...item, y: item.y + SLOT_H };
      return item;
    });
    return [...shifted, slotItem];
  };
  return {
    xs: insertAndShift(base.xs),
    sm: insertAndShift(base.sm),
    md: insertAndShift(base.md),
    lg: insertAndShift(base.lg),
    xl: insertAndShift(base.xl),
    '2xl': insertAndShift(base['2xl']),
  };
};

const renderSlotChild = (
  template: DashboardTemplate,
  selectedKey: string | null | undefined,
  renderDetail: DashboardGridProps['renderCardDetail'],
  close: () => void
): React.ReactNode => {
  if (!selectedKey || !renderDetail) return null;
  const item = template.grid.find((i) => {
    return i.i === selectedKey;
  });
  if (!item || item.card.type === 'sectionDivider') return null;
  return (
    <div key={SLOT_KEY}>
      <Box sx={{ width: '100%', height: '100%', padding: 2 }}>
        {renderDetail(item.card as DashboardCardProps, close)}
      </Box>
    </div>
  );
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
  const onDragStart = () => {
    isDraggingRef.current = true;
  };
  return {
    isDraggingRef,
    handleLayoutChange,
    snapDrag,
    handleDragStop,
    onDragStart,
  };
};

const resolveLayouts = (
  selectedTemplate: DashboardTemplate | undefined,
  isEditMode: boolean,
  selectedCardKey: string | null | undefined,
  renderCardDetail: DashboardGridProps['renderCardDetail']
) => {
  if (!selectedTemplate) return undefined;
  const base = buildLayout(selectedTemplate, isEditMode);
  if (selectedCardKey && renderCardDetail) {
    return buildSlotLayout(base, selectedCardKey, selectedTemplate);
  }
  return base;
};

const useCardClickHandler = (
  isEditMode: boolean,
  isDraggingRef: React.MutableRefObject<boolean>,
  renderCardDetail: DashboardGridProps['renderCardDetail'],
  clickableCardFilter: DashboardGridProps['clickableCardFilter'],
  setSelectedCardKey: DashboardGridProps['setSelectedCardKey']
) => {
  const isClickable = (card: DashboardCardProps) => {
    return getCardClickable(card, renderCardDetail, clickableCardFilter);
  };
  const handleCardClick = (key: string, card: DashboardCardProps) => {
    if (isEditMode || isDraggingRef.current || !isClickable(card)) return;
    setSelectedCardKey?.((prev) => {
      return prev === key ? null : key;
    });
  };
  return { isClickable, handleCardClick };
};

type ActiveGridProps = {
  layouts: ReturnType<typeof buildLayout>;
  selectedTemplate: DashboardTemplate;
  currency?: string;
  isEditMode: boolean;
  isCardClickable: (card: DashboardCardProps) => boolean;
  handleCardClick: (key: string, card: DashboardCardProps) => void;
  removeCard: (key: string) => void;
  updateCard: (key: string, data: { title: string }) => void;
  selectedCardKey?: string | null;
  renderCardDetail?: DashboardGridProps['renderCardDetail'];
  close: () => void;
  handleLayoutChange: (l: Layout[]) => void;
  snapDrag: (_l: Layout[], _o: Layout, newItem: Layout) => void;
  onDragStart: () => void;
  handleDragStop: (l: Layout[], o: Layout, newItem: Layout) => void;
};

const ActiveGrid = ({
  layouts,
  selectedTemplate,
  currency,
  isEditMode,
  isCardClickable,
  handleCardClick,
  removeCard,
  updateCard,
  selectedCardKey,
  renderCardDetail,
  close,
  handleLayoutChange,
  snapDrag,
  onDragStart,
  handleDragStop,
}: ActiveGridProps) => {
  return (
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
      onDragStart={onDragStart}
      onDragStop={handleDragStop}
      draggableHandle=".dashboard-card-drag-handle"
    >
      {buildGridItems({
        template: selectedTemplate,
        currency,
        isEditMode,
        isCardClickable,
        handleCardClick,
        onRemove: removeCard,
        onTitleChange: (key, title) => {
          return updateCard(key, { title });
        },
      })}
      {renderSlotChild(
        selectedTemplate,
        selectedCardKey,
        renderCardDetail,
        close
      )}
    </ResponsiveGridLayout>
  );
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
  const {
    isDraggingRef,
    handleLayoutChange,
    snapDrag,
    handleDragStop,
    onDragStart,
  } = useDragHandlers(isEditMode, onLayoutChange);
  const { isClickable: isCardClickable, handleCardClick } = useCardClickHandler(
    isEditMode,
    isDraggingRef,
    renderCardDetail,
    clickableCardFilter,
    setSelectedCardKey
  );

  const close = React.useCallback(() => {
    return setSelectedCardKey?.(null);
  }, [setSelectedCardKey]);

  const layouts = resolveLayouts(
    selectedTemplate,
    isEditMode,
    selectedCardKey,
    renderCardDetail
  );

  if (!selectedTemplate || !layouts) return null;

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
        <ActiveGrid
          layouts={layouts}
          selectedTemplate={selectedTemplate}
          currency={currency}
          isEditMode={isEditMode}
          isCardClickable={isCardClickable}
          handleCardClick={handleCardClick}
          removeCard={removeCard}
          updateCard={updateCard}
          selectedCardKey={selectedCardKey}
          renderCardDetail={renderCardDetail}
          close={close}
          handleLayoutChange={handleLayoutChange}
          snapDrag={snapDrag}
          onDragStart={onDragStart}
          handleDragStop={handleDragStop}
        />
      )}
    </Box>
  );
};
