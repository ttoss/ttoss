import * as React from 'react';

import type { DashboardTemplate } from './Dashboard';
import type { DashboardFilter, DashboardFilterValue } from './DashboardFilters';

export const DashboardContext = React.createContext<{
  filters: DashboardFilter[];
  updateFilter: (key: string, value: DashboardFilterValue) => void;
  templates: DashboardTemplate[];
  selectedTemplate: DashboardTemplate | undefined;
}>({
  filters: [],
  updateFilter: () => {},
  templates: [],
  selectedTemplate: undefined,
});

export const DashboardProvider = (props: {
  children: React.ReactNode;
  filters: DashboardFilter[];
  templates: DashboardTemplate[];
  onFiltersChange?: (filters: DashboardFilter[]) => void;
  selectedTemplate?: DashboardTemplate;
}) => {
  const {
    filters: externalFilters,
    templates: externalTemplates,
    onFiltersChange,
    selectedTemplate,
  } = props;

  // Store callbacks in refs to avoid recreating them
  const onFiltersChangeRef = React.useRef(onFiltersChange);
  const filtersRef = React.useRef(externalFilters);

  React.useEffect(() => {
    onFiltersChangeRef.current = onFiltersChange;
  }, [onFiltersChange]);

  React.useEffect(() => {
    filtersRef.current = externalFilters;
  }, [externalFilters]);

  // Update filter value and notify parent
  // Use refs to avoid recreating this function on every filter change
  const updateFilter = React.useCallback(
    (key: string, value: DashboardFilterValue) => {
      const updatedFilters = filtersRef.current.map((filter) => {
        return filter.key === key ? { ...filter, value } : filter;
      });
      onFiltersChangeRef.current?.(updatedFilters);
    },
    [] // Empty deps - we use refs for current values
  );

  return (
    <DashboardContext.Provider
      value={{
        filters: externalFilters,
        updateFilter,
        templates: externalTemplates,
        selectedTemplate,
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
