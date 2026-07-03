import * as React from 'react';
import type { Layout } from 'react-grid-layout';

import type { DashboardGridItem, DashboardTemplate } from './Dashboard';
import type { DashboardCard } from './DashboardCard';
import type { CardCatalogItem } from './dashboardCardCatalog';
import {
  createGridItemWithPlacement,
  DEFAULT_CARD_CATALOG,
} from './dashboardCardCatalog';
import type { DashboardFilter, DashboardFilterValue } from './DashboardFilters';

const useStableCallback = <
  T extends ((...args: never[]) => unknown) | undefined,
>(
  fn: T
): React.MutableRefObject<T> => {
  const ref = React.useRef(fn);
  React.useEffect(() => {
    ref.current = fn;
  }, [fn]);
  return ref;
};

const useEditState = ({
  cardCatalog,
  onCancelEditRef,
  onSaveAsNewTemplateRef,
  onSaveLayoutRef,
  selectedTemplate,
}: {
  cardCatalog: CardCatalogItem[];
  onCancelEditRef: React.MutableRefObject<(() => void) | undefined>;
  onSaveAsNewTemplateRef: React.MutableRefObject<
    ((t: DashboardTemplate) => void) | undefined
  >;
  onSaveLayoutRef: React.MutableRefObject<
    ((t: DashboardTemplate) => void) | undefined
  >;
  selectedTemplate: DashboardTemplate | undefined;
}) => {
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [editingGrid, setEditingGrid] = React.useState<
    DashboardGridItem[] | null
  >(null);
  const [saveAsNewModalOpen, setSaveAsNewModalOpen] = React.useState(false);

  const startEdit = React.useCallback(() => {
    if (!selectedTemplate) return;
    setEditingGrid(
      selectedTemplate.grid.map((item) => {
        return { ...item };
      })
    );
    setIsEditMode(true);
  }, [selectedTemplate]);

  const cancelEdit = React.useCallback(() => {
    setEditingGrid(null);
    setIsEditMode(false);
    onCancelEditRef.current?.();
  }, [onCancelEditRef]);

  const saveEdit = React.useCallback(() => {
    if (!editingGrid || !selectedTemplate) return;
    onSaveLayoutRef.current?.({ ...selectedTemplate, grid: editingGrid });
    setEditingGrid(null);
    setIsEditMode(false);
  }, [editingGrid, onSaveLayoutRef, selectedTemplate]);

  const saveAsNew = React.useCallback(() => {
    if (!editingGrid || !selectedTemplate) return;
    setSaveAsNewModalOpen(true);
  }, [editingGrid, selectedTemplate]);

  const confirmSaveAsNew = React.useCallback(
    (title: string) => {
      if (!editingGrid || !selectedTemplate) return;
      onSaveAsNewTemplateRef.current?.({
        ...selectedTemplate,
        id: `copy-${Date.now()}`,
        name: title.trim() || `Copy of ${selectedTemplate.name}`,
        grid: editingGrid,
      });
      setSaveAsNewModalOpen(false);
      setEditingGrid(null);
      setIsEditMode(false);
    },
    [editingGrid, onSaveAsNewTemplateRef, selectedTemplate]
  );

  const cancelSaveAsNew = React.useCallback(() => {
    return setSaveAsNewModalOpen(false);
  }, []);

  const addCard = React.useCallback(
    (item: CardCatalogItem) => {
      setEditingGrid((prev) => {
        if (!prev) return prev;
        const catalogItem = cardCatalog.find((c) => {
          return c.card.title === item.card.title;
        });
        if (!catalogItem) return prev;
        const maxY = prev.length
          ? Math.max(
              ...prev.map((i) => {
                return i.y + i.h;
              })
            )
          : 0;
        return [...prev, createGridItemWithPlacement(catalogItem, 0, maxY)];
      });
    },
    [cardCatalog]
  );

  const removeCard = React.useCallback((id: string) => {
    return setEditingGrid((prev) => {
      return prev
        ? prev.filter((item) => {
            return item.i !== id;
          })
        : prev;
    });
  }, []);

  const updateCard = React.useCallback(
    (id: string, cardPatch: Record<string, unknown>) => {
      setEditingGrid((prev) => {
        if (!prev) return prev;
        return prev.map((item) => {
          return item.i === id
            ? { ...item, card: { ...item.card, ...cardPatch } }
            : item;
        });
      });
    },
    []
  );

  const onLayoutChange = React.useCallback((currentLayout: Layout[]) => {
    setEditingGrid((prev) => {
      if (!prev) return prev;
      const byId = new Map(
        currentLayout.map((l) => {
          return [l.i, l];
        })
      );
      let changed = false;
      const next = prev.map((item) => {
        const layout = byId.get(item.i);
        if (!layout) return item;
        if (
          item.x === layout.x &&
          item.y === layout.y &&
          item.w === layout.w &&
          item.h === layout.h
        )
          return item;
        changed = true;
        return { ...item, x: layout.x, y: layout.y, w: layout.w, h: layout.h };
      });
      return changed ? next : prev;
    });
  }, []);

  return {
    addCard,
    cancelEdit,
    cancelSaveAsNew,
    confirmSaveAsNew,
    editingGrid,
    isEditMode,
    onLayoutChange,
    removeCard,
    saveAsNew,
    saveAsNewModalOpen,
    saveEdit,
    startEdit,
    updateCard,
  };
};

export const DashboardContext = React.createContext<{
  filters: DashboardFilter[];
  updateFilter: (key: string, value: DashboardFilterValue) => void;
  templates: DashboardTemplate[];
  selectedTemplate: DashboardTemplate | undefined;
  cardCatalog: CardCatalogItem[];
  // Edit mode
  editable: boolean;
  isEditMode: boolean;
  editingGrid: DashboardGridItem[] | null;
  startEdit: () => void;
  cancelEdit: () => void;
  saveEdit: () => void;
  saveAsNew: () => void;
  saveAsNewModalOpen: boolean;
  confirmSaveAsNew: (title: string) => void;
  cancelSaveAsNew: () => void;
  addCard: (item: CardCatalogItem) => void;
  removeCard: (id: string) => void;
  updateCard: (id: string, cardPatch: Record<string, unknown>) => void;
  onLayoutChange: (currentLayout: Layout[]) => void;
  onCardClick?: (card: DashboardCard, gridItem: DashboardGridItem) => void;
}>({
  filters: [],
  updateFilter: () => {},
  templates: [],
  selectedTemplate: undefined,
  cardCatalog: [],
  editable: false,
  isEditMode: false,
  editingGrid: null,
  startEdit: () => {},
  cancelEdit: () => {},
  saveEdit: () => {},
  saveAsNew: () => {},
  saveAsNewModalOpen: false,
  confirmSaveAsNew: () => {},
  cancelSaveAsNew: () => {},
  addCard: () => {},
  removeCard: () => {},
  updateCard: () => {},
  onLayoutChange: () => {},
  onCardClick: undefined,
});

export const DashboardProvider = (props: {
  children: React.ReactNode;
  filters: DashboardFilter[];
  templates: DashboardTemplate[];
  cardCatalog?: CardCatalogItem[];
  onFiltersChange?: (filters: DashboardFilter[]) => void;
  selectedTemplate?: DashboardTemplate;
  editable?: boolean;
  onSaveLayout?: (template: DashboardTemplate) => void;
  onSaveAsNewTemplate?: (template: DashboardTemplate) => void;
  onCancelEdit?: () => void;
  onEditingGridChange?: (grid: DashboardGridItem[] | null) => void;
  onCardClick?: (card: DashboardCard, gridItem: DashboardGridItem) => void;
}) => {
  const {
    filters: externalFilters,
    templates: externalTemplates,
    cardCatalog = DEFAULT_CARD_CATALOG,
    onFiltersChange,
    selectedTemplate,
    editable = false,
    onSaveLayout,
    onSaveAsNewTemplate,
    onCancelEdit,
    onEditingGridChange,
    onCardClick,
  } = props;

  const onFiltersChangeRef = useStableCallback(onFiltersChange);
  const filtersRef = React.useRef(externalFilters);
  const onSaveLayoutRef = useStableCallback(onSaveLayout);
  const onSaveAsNewTemplateRef = useStableCallback(onSaveAsNewTemplate);
  const onCancelEditRef = useStableCallback(onCancelEdit);
  const onCardClickRef = useStableCallback(onCardClick);
  const onEditingGridChangeRef = useStableCallback(onEditingGridChange);

  React.useEffect(() => {
    filtersRef.current = externalFilters;
  }, [externalFilters]);

  const editState = useEditState({
    cardCatalog,
    onCancelEditRef,
    onSaveAsNewTemplateRef,
    onSaveLayoutRef,
    selectedTemplate,
  });

  React.useEffect(() => {
    onEditingGridChangeRef.current?.(editState.editingGrid);
  }, [editState.editingGrid, onEditingGridChangeRef]);

  const updateFilter = React.useCallback(
    (key: string, value: DashboardFilterValue) => {
      const updatedFilters = filtersRef.current.map((filter) => {
        return filter.key === key ? { ...filter, value } : filter;
      });
      onFiltersChangeRef.current?.(updatedFilters);
    },
    [onFiltersChangeRef]
  );

  const handleCardClick = React.useCallback(
    (card: DashboardCard, gridItem: DashboardGridItem) => {
      onCardClickRef.current?.(card, gridItem);
    },
    [onCardClickRef]
  );

  return (
    <DashboardContext.Provider
      value={{
        filters: externalFilters,
        updateFilter,
        templates: externalTemplates,
        selectedTemplate,
        editable,
        isEditMode: editState.isEditMode,
        editingGrid: editState.editingGrid,
        startEdit: editState.startEdit,
        cancelEdit: editState.cancelEdit,
        saveEdit: editState.saveEdit,
        saveAsNew: editState.saveAsNew,
        saveAsNewModalOpen: editState.saveAsNewModalOpen,
        confirmSaveAsNew: editState.confirmSaveAsNew,
        cancelSaveAsNew: editState.cancelSaveAsNew,
        cardCatalog,
        addCard: editState.addCard,
        removeCard: editState.removeCard,
        updateCard: editState.updateCard,
        onLayoutChange: editState.onLayoutChange,
        onCardClick: handleCardClick,
      }}
    >
      {props.children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = React.useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
