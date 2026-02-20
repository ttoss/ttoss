import * as React from 'react';
import type { Layout } from 'react-grid-layout';

import type { DashboardGridItem, DashboardTemplate } from './Dashboard';
import type { CardCatalogItem } from './dashboardCardCatalog';
import {
  createGridItemWithPlacement,
  DEFAULT_CARD_CATALOG,
} from './dashboardCardCatalog';
import type { DashboardFilter, DashboardFilterValue } from './DashboardFilters';

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
  } = props;

  const [isEditMode, setIsEditMode] = React.useState(false);
  const [editingGrid, setEditingGrid] = React.useState<
    DashboardGridItem[] | null
  >(null);
  const [saveAsNewModalOpen, setSaveAsNewModalOpen] = React.useState(false);

  const onFiltersChangeRef = React.useRef(onFiltersChange);
  const filtersRef = React.useRef(externalFilters);
  const onSaveLayoutRef = React.useRef(onSaveLayout);
  const onSaveAsNewTemplateRef = React.useRef(onSaveAsNewTemplate);
  const onCancelEditRef = React.useRef(onCancelEdit);

  React.useEffect(() => {
    onFiltersChangeRef.current = onFiltersChange;
  }, [onFiltersChange]);
  React.useEffect(() => {
    filtersRef.current = externalFilters;
  }, [externalFilters]);
  React.useEffect(() => {
    onSaveLayoutRef.current = onSaveLayout;
  }, [onSaveLayout]);
  React.useEffect(() => {
    onSaveAsNewTemplateRef.current = onSaveAsNewTemplate;
  }, [onSaveAsNewTemplate]);
  React.useEffect(() => {
    onCancelEditRef.current = onCancelEdit;
  }, [onCancelEdit]);

  const updateFilter = React.useCallback(
    (key: string, value: DashboardFilterValue) => {
      const updatedFilters = filtersRef.current.map((filter) => {
        return filter.key === key ? { ...filter, value } : filter;
      });
      onFiltersChangeRef.current?.(updatedFilters);
    },
    []
  );

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
  }, []);

  const saveEdit = React.useCallback(() => {
    if (!editingGrid || !selectedTemplate) return;
    const template: DashboardTemplate = {
      ...selectedTemplate,
      grid: editingGrid,
    };
    onSaveLayoutRef.current?.(template);
    setEditingGrid(null);
    setIsEditMode(false);
  }, [editingGrid, selectedTemplate]);

  const saveAsNew = React.useCallback(() => {
    if (!editingGrid || !selectedTemplate) return;
    setSaveAsNewModalOpen(true);
  }, [editingGrid, selectedTemplate]);

  const confirmSaveAsNew = React.useCallback(
    (title: string) => {
      if (!editingGrid || !selectedTemplate) return;
      const template: DashboardTemplate = {
        ...selectedTemplate,
        id: `copy-${Date.now()}`,
        name: title.trim() || `Copy of ${selectedTemplate.name}`,
        grid: editingGrid,
      };
      onSaveAsNewTemplateRef.current?.(template);
      setSaveAsNewModalOpen(false);
      setEditingGrid(null);
      setIsEditMode(false);
    },
    [editingGrid, selectedTemplate]
  );

  const cancelSaveAsNew = React.useCallback(() => {
    setSaveAsNewModalOpen(false);
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
              ...prev.map((item) => {
                return item.y + item.h;
              })
            )
          : 0;
        const newItem = createGridItemWithPlacement(catalogItem, 0, maxY);
        return [...prev, newItem];
      });
    },
    [cardCatalog]
  );

  const removeCard = React.useCallback((id: string) => {
    setEditingGrid((prev) => {
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
      return prev.map((item) => {
        const layout = byId.get(item.i);
        if (!layout) return item;
        return { ...item, x: layout.x, y: layout.y, w: layout.w, h: layout.h };
      });
    });
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        filters: externalFilters,
        updateFilter,
        templates: externalTemplates,
        selectedTemplate,
        editable,
        isEditMode,
        editingGrid,
        startEdit,
        cancelEdit,
        saveEdit,
        saveAsNew,
        saveAsNewModalOpen,
        confirmSaveAsNew,
        cancelSaveAsNew,
        cardCatalog,
        addCard,
        removeCard,
        updateCard,
        onLayoutChange,
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
