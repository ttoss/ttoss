import * as React from 'react';

import { DashboardTemplate } from './Dashboard';
import { DashboardFilter } from './DashboardFilters';

export const DashboardContext = React.createContext<{
  filters: DashboardFilter[];
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilter[]>>;
  templates: DashboardTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<DashboardTemplate[]>>;
  selectedTemplate: DashboardTemplate | undefined;
}>({
  filters: [],
  setFilters: () => {},
  templates: [],
  setTemplates: () => {},
  selectedTemplate: undefined,
});

export const DashboardProvider = (props: {
  children: React.ReactNode;
  initialFilters?: DashboardFilter[];
  initialTemplates?: DashboardTemplate[];
}) => {
  const [filters, setFilters] = React.useState<DashboardFilter[]>(
    props.initialFilters ?? []
  );
  const [templates, setTemplates] = React.useState<DashboardTemplate[]>(
    props.initialTemplates ?? []
  );

  // Sync with initial props when they change
  React.useEffect(() => {
    if (props.initialFilters !== undefined) {
      setFilters(props.initialFilters);
    }
  }, [props.initialFilters]);

  React.useEffect(() => {
    if (props.initialTemplates !== undefined) {
      setTemplates(props.initialTemplates);
    }
  }, [props.initialTemplates]);

  const selectedTemplate = React.useMemo(() => {
    const templateId = filters.find((filter) => {
      return filter.key === 'template';
    })?.value;
    return templates.find((template) => {
      return template.id === templateId;
    });
  }, [filters, templates]);

  return (
    <DashboardContext.Provider
      value={{ filters, setFilters, templates, setTemplates, selectedTemplate }}
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
