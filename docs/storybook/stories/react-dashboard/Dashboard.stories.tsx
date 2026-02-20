import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  Dashboard,
  type DashboardFilter,
  DashboardFilterType,
  type DashboardTemplate,
  DEFAULT_CARD_CATALOG,
} from '@ttoss/react-dashboard';
import { Box, Heading, Stack, Text } from '@ttoss/ui';
import * as React from 'react';

const meta: Meta = {
  title: 'React Dashboard/Dashboard',
  parameters: {
    docs: {
      description: {
        component:
          'A comprehensive dashboard component with filters, templates, and responsive grid layouts. Supports multiple card types, filter systems, and template management.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

const defaultTemplates: DashboardTemplate[] = [
  {
    id: 'default',
    name: 'Default Dashboard',
    description: 'A default dashboard layout with basic metrics',
    grid: [
      {
        i: 'revenue',
        x: 0,
        y: 0,
        w: 4,
        h: 4,
        card: {
          title: 'Total Revenue',
          description: 'Revenue from all sources',
          numberType: 'currency',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: {
            api: { total: 150000 },
          },
          trend: {
            value: 15.5,
            status: 'positive',
          },
        },
      },
      {
        i: 'roas',
        x: 4,
        y: 0,
        w: 4,
        h: 4,
        card: {
          title: 'ROAS',
          description: 'Return on ad spend',
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: {
            api: { total: 3.5 },
          },
          variant: 'light-green',
        },
      },
      {
        i: 'impressions',
        x: 8,
        y: 0,
        w: 4,
        h: 4,
        card: {
          title: 'Impressions',
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: {
            api: { total: 1250000 },
          },
        },
      },
      {
        i: 'ctr',
        x: 0,
        y: 4,
        w: 3,
        h: 4,
        card: {
          title: 'CTR',
          description: 'Click-through rate',
          numberType: 'percentage',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: {
            api: { total: 2.35 },
          },
          trend: {
            value: 5.2,
            status: 'negative',
          },
        },
      },
      {
        i: 'clicks',
        x: 3,
        y: 4,
        w: 3,
        h: 4,
        card: {
          title: 'Clicks',
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: {
            api: { total: 29375 },
          },
        },
      },
      {
        i: 'cpm',
        x: 6,
        y: 4,
        w: 3,
        h: 4,
        card: {
          title: 'CPM',
          description: 'Cost per mille',
          numberType: 'currency',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: {
            api: { total: 12.5 },
          },
        },
      },
      {
        i: 'cpc',
        x: 9,
        y: 4,
        w: 3,
        h: 4,
        card: {
          title: 'CPC',
          description: 'Cost per click',
          numberType: 'currency',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: {
            api: { total: 0.85 },
          },
          variant: 'dark',
        },
      },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics Dashboard',
    description: 'Focused on analytics metrics',
    grid: [
      {
        i: 'users',
        x: 0,
        y: 0,
        w: 6,
        h: 4,
        card: {
          title: 'Active Users',
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: {
            api: { total: 45230 },
          },
          trend: {
            value: 8.3,
            status: 'positive',
          },
        },
      },
      {
        i: 'sessions',
        x: 6,
        y: 0,
        w: 6,
        h: 4,
        card: {
          title: 'Sessions',
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: {
            api: { total: 67890 },
          },
        },
      },
    ],
  },
];

const defaultFilters: DashboardFilter[] = [
  {
    key: 'template',
    type: DashboardFilterType.SELECT,
    label: 'Template',
    value: 'default',
    options: [
      { label: 'Default Dashboard', value: 'default' },
      { label: 'Analytics Dashboard', value: 'analytics' },
    ],
  },
  {
    key: 'date-range',
    type: DashboardFilterType.DATE_RANGE,
    label: 'Date Range',
    value: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(),
    },
    presets: [
      {
        label: 'Last 7 days',
        getValue: () => {
          return {
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            to: new Date(),
          };
        },
      },
      {
        label: 'Last 30 days',
        getValue: () => {
          return {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to: new Date(),
          };
        },
      },
      {
        label: 'Last 90 days',
        getValue: () => {
          return {
            from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            to: new Date(),
          };
        },
      },
    ],
  },
  {
    key: 'status',
    type: DashboardFilterType.SELECT,
    label: 'Status',
    value: 'all',
    options: [
      { label: 'All', value: 'all' },
      { label: 'Active', value: 'active' },
      { label: 'Paused', value: 'paused' },
    ],
  },
];

const DefaultStory = () => {
  const [filters, setFilters] =
    React.useState<DashboardFilter[]>(defaultFilters);

  const selectedTemplateId =
    (filters.find((f) => {
      return f.key === 'template';
    })?.value as string) || 'default';
  const selectedTemplate =
    defaultTemplates.find((t) => {
      return t.id === selectedTemplateId;
    }) || defaultTemplates[0];

  const handleFiltersChange = (updatedFilters: DashboardFilter[]) => {
    setFilters(updatedFilters);
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', padding: '4' }}>
      <Dashboard
        templates={defaultTemplates}
        filters={filters}
        selectedTemplate={selectedTemplate}
        loading={false}
        onFiltersChange={handleFiltersChange}
      />
    </Box>
  );
};

export const Default: StoryObj = {
  render: () => {
    return <DefaultStory />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default dashboard with multiple templates, filters, and a responsive grid layout. Switch between templates using the template filter.',
      },
    },
  },
};

export const WithLoadingState: StoryObj = {
  render: () => {
    const selectedTemplateId =
      (defaultFilters.find((f) => {
        return f.key === 'template';
      })?.value as string) || 'default';
    const selectedTemplate =
      defaultTemplates.find((t) => {
        return t.id === selectedTemplateId;
      }) || defaultTemplates[0];

    return (
      <Box sx={{ width: '100%', height: '100vh', padding: '4' }}>
        <Dashboard
          templates={defaultTemplates}
          filters={defaultFilters}
          selectedTemplate={selectedTemplate}
          loading={true}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dashboard in loading state. Shows a spinner while data is being fetched.',
      },
    },
  },
};

export const WithCustomHeader: StoryObj = {
  render: () => {
    const selectedTemplateId =
      (defaultFilters.find((f) => {
        return f.key === 'template';
      })?.value as string) || 'default';
    const selectedTemplate =
      defaultTemplates.find((t) => {
        return t.id === selectedTemplateId;
      }) || defaultTemplates[0];

    return (
      <Box sx={{ width: '100%', height: '100vh', padding: '4' }}>
        <Dashboard
          templates={defaultTemplates}
          filters={defaultFilters}
          selectedTemplate={selectedTemplate}
          loading={false}
          headerChildren={
            <Stack
              sx={{
                gap: '2',
                flexDirection: 'row',
                alignItems: 'center',
                marginLeft: 'auto',
              }}
            >
              {/* eslint-disable-next-line formatjs/no-literal-string-in-jsx */}
              <Text sx={{ fontSize: 'sm', color: 'text.secondary' }}>
                Last updated: {new Date().toLocaleString()}
              </Text>
            </Stack>
          }
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dashboard with custom header content. You can add additional buttons, text, or any custom content to the header.',
      },
    },
  },
};

const WithFiltersChangeStory = () => {
  const [filters, setFilters] =
    React.useState<DashboardFilter[]>(defaultFilters);

  const selectedTemplateId =
    (filters.find((f) => {
      return f.key === 'template';
    })?.value as string) || 'default';
  const selectedTemplate =
    defaultTemplates.find((t) => {
      return t.id === selectedTemplateId;
    }) || defaultTemplates[0];

  const handleFiltersChange = (updatedFilters: DashboardFilter[]) => {
    setFilters(updatedFilters);
    // eslint-disable-next-line no-console
    console.log('Filters changed:', updatedFilters);
  };

  return (
    <Stack sx={{ gap: '4', width: '100%', height: '100vh', padding: '4' }}>
      <Box>
        {/* eslint-disable-next-line formatjs/no-literal-string-in-jsx */}
        <Heading>Dashboard with Filter Change Handling</Heading>
        {/* eslint-disable-next-line formatjs/no-literal-string-in-jsx */}
        <Text sx={{ marginTop: '2' }}>
          Open the browser console to see filter changes logged when you modify
          any filter.
        </Text>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Dashboard
          templates={defaultTemplates}
          filters={filters}
          selectedTemplate={selectedTemplate}
          loading={false}
          onFiltersChange={handleFiltersChange}
        />
      </Box>
    </Stack>
  );
};

export const WithFiltersChange: StoryObj = {
  render: () => {
    return <WithFiltersChangeStory />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dashboard with filter change handling. The `onFiltersChange` callback is called whenever filters are updated, allowing you to refetch data or update your application state.',
      },
    },
  },
};

export const SingleCardDashboard: StoryObj = {
  render: () => {
    const singleCardTemplate: DashboardTemplate[] = [
      {
        id: 'simple',
        name: 'Simple Dashboard',
        grid: [
          {
            i: 'revenue',
            x: 0,
            y: 0,
            w: 12,
            h: 6,
            card: {
              title: 'Total Revenue',
              description: 'Revenue from all sources this month',
              numberType: 'currency',
              type: 'bigNumber',
              sourceType: [{ source: 'api' }],
              data: {
                api: { total: 250000 },
              },
              trend: {
                value: 22.5,
                status: 'positive',
              },
              additionalInfo: 'Compared to last month',
            },
          },
        ],
      },
    ];

    const simpleFilters: DashboardFilter[] = [
      {
        key: 'template',
        type: DashboardFilterType.SELECT,
        label: 'Template',
        value: 'simple',
        options: [{ label: 'Simple Dashboard', value: 'simple' }],
      },
    ];

    const selectedTemplate = singleCardTemplate[0];

    return (
      <Box sx={{ width: '100%', height: '100vh', padding: '4' }}>
        <Dashboard
          templates={singleCardTemplate}
          filters={simpleFilters}
          selectedTemplate={selectedTemplate}
          loading={false}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Simple dashboard with a single large card. Useful for highlighting a key metric.',
      },
    },
  },
};

export const WithTextFilter: StoryObj = {
  render: () => {
    const filtersWithText: DashboardFilter[] = [
      {
        key: 'template',
        type: DashboardFilterType.SELECT,
        label: 'Template',
        value: 'default',
        options: [
          { label: 'Default Dashboard', value: 'default' },
          { label: 'Analytics Dashboard', value: 'analytics' },
        ],
      },
      {
        key: 'search',
        type: DashboardFilterType.TEXT,
        label: 'Search',
        placeholder: 'Enter search term...',
        value: '',
      },
      {
        key: 'date-range',
        type: DashboardFilterType.DATE_RANGE,
        label: 'Date Range',
        value: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: new Date(),
        },
      },
    ];

    const selectedTemplateId =
      (filtersWithText.find((f) => {
        return f.key === 'template';
      })?.value as string) || 'default';
    const selectedTemplate =
      defaultTemplates.find((t) => {
        return t.id === selectedTemplateId;
      }) || defaultTemplates[0];

    return (
      <Box sx={{ width: '100%', height: '100vh', padding: '4' }}>
        <Dashboard
          templates={defaultTemplates}
          filters={filtersWithText}
          selectedTemplate={selectedTemplate}
          loading={false}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dashboard with a text filter added. Text filters are useful for searching or filtering by name, ID, or other text fields.',
      },
    },
  },
};

export const WithSectionDividers: StoryObj = {
  render: () => {
    const templateWithDividers: DashboardTemplate[] = [
      {
        id: 'with-dividers',
        name: 'Dashboard with Section Dividers',
        description: 'Dashboard organized with section dividers',
        grid: [
          {
            i: 'revenue',
            x: 0,
            y: 0,
            w: 4,
            h: 4,
            card: {
              title: 'Total Revenue',
              description: 'Revenue from all sources',
              numberType: 'currency',
              type: 'bigNumber',
              sourceType: [{ source: 'api' }],
              data: {
                api: { total: 150000 },
              },
              trend: {
                value: 15.5,
                status: 'positive',
              },
            },
          },
          {
            i: 'roas',
            x: 4,
            y: 0,
            w: 4,
            h: 4,
            card: {
              title: 'ROAS',
              description: 'Return on ad spend',
              numberType: 'number',
              type: 'bigNumber',
              sourceType: [{ source: 'api' }],
              data: {
                api: { total: 3.5 },
              },
              variant: 'light-green',
            },
          },
          {
            i: 'impressions',
            x: 8,
            y: 0,
            w: 4,
            h: 4,
            card: {
              title: 'Impressions',
              numberType: 'number',
              type: 'bigNumber',
              sourceType: [{ source: 'api' }],
              data: {
                api: { total: 1250000 },
              },
            },
          },
          {
            i: 'divider-1',
            x: 0,
            y: 4,
            w: 12,
            h: 2,
            card: {
              type: 'sectionDivider',
              title: 'Performance Metrics',
            },
          },
          {
            i: 'ctr',
            x: 0,
            y: 6,
            w: 3,
            h: 4,
            card: {
              title: 'CTR',
              description: 'Click-through rate',
              numberType: 'percentage',
              type: 'bigNumber',
              sourceType: [{ source: 'api' }],
              data: {
                api: { total: 2.35 },
              },
              trend: {
                value: 5.2,
                status: 'negative',
              },
            },
          },
          {
            i: 'clicks',
            x: 3,
            y: 6,
            w: 3,
            h: 4,
            card: {
              title: 'Clicks',
              numberType: 'number',
              type: 'bigNumber',
              sourceType: [{ source: 'api' }],
              data: {
                api: { total: 29375 },
              },
            },
          },
          {
            i: 'cpm',
            x: 6,
            y: 6,
            w: 3,
            h: 4,
            card: {
              title: 'CPM',
              description: 'Cost per mille',
              numberType: 'currency',
              type: 'bigNumber',
              sourceType: [{ source: 'api' }],
              data: {
                api: { total: 12.5 },
              },
            },
          },
          {
            i: 'cpc',
            x: 9,
            y: 6,
            w: 3,
            h: 4,
            card: {
              title: 'CPC',
              description: 'Cost per click',
              numberType: 'currency',
              type: 'bigNumber',
              sourceType: [{ source: 'api' }],
              data: {
                api: { total: 0.85 },
              },
              variant: 'dark',
            },
          },
          {
            i: 'divider-2',
            x: 0,
            y: 10,
            w: 12,
            h: 2,
            card: {
              type: 'sectionDivider',
              title: 'Engagement Metrics',
            },
          },
          {
            i: 'conversions',
            x: 0,
            y: 12,
            w: 6,
            h: 4,
            card: {
              title: 'Conversions',
              numberType: 'number',
              type: 'bigNumber',
              sourceType: [{ source: 'api' }],
              data: {
                api: { total: 1250 },
              },
              trend: {
                value: 8.3,
                status: 'positive',
              },
            },
          },
          {
            i: 'conversion-rate',
            x: 6,
            y: 12,
            w: 6,
            h: 4,
            card: {
              title: 'Conversion Rate',
              numberType: 'percentage',
              type: 'bigNumber',
              sourceType: [{ source: 'api' }],
              data: {
                api: { total: 4.25 },
              },
            },
          },
        ],
      },
    ];

    const filters: DashboardFilter[] = [
      {
        key: 'template',
        type: DashboardFilterType.SELECT,
        label: 'Template',
        value: 'with-dividers',
        options: [
          { label: 'Dashboard with Section Dividers', value: 'with-dividers' },
        ],
      },
    ];

    const selectedTemplate = templateWithDividers[0];

    return (
      <Box sx={{ width: '100%', height: '100vh', padding: '4' }}>
        <Dashboard
          templates={templateWithDividers}
          filters={filters}
          selectedTemplate={selectedTemplate}
          loading={false}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dashboard organized with section dividers. Section dividers help organize dashboard content into logical sections, making it easier to scan and understand different groups of metrics. They can be added to the grid layout just like regular cards, using `type: "sectionDivider"` and a `title` property.',
      },
    },
  },
};

const EditableCustomizeStory = () => {
  const initialTemplate: DashboardTemplate = {
    id: 'editable-dashboard',
    name: 'Editable Dashboard',
    description: 'Dashboard configured for layout customization',
    editable: true,
    grid: [
      {
        i: 'revenue',
        x: 0,
        y: 0,
        w: 4,
        h: 4,
        card: {
          title: 'Total Revenue',
          numberType: 'currency',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: {
            api: { total: 180000 },
          },
          trend: {
            value: 12.4,
            status: 'positive',
          },
        },
      },
      {
        i: 'divider-1',
        x: 0,
        y: 4,
        w: 12,
        h: 2,
        card: {
          type: 'sectionDivider',
          title: 'Efficiency',
        },
      },
      {
        i: 'roas',
        x: 0,
        y: 6,
        w: 4,
        h: 4,
        card: {
          title: 'ROAS',
          numberType: 'number',
          numberDecimalPlaces: 2,
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: {
            api: { total: 3.72 },
          },
          variant: 'light-green',
        },
      },
    ],
  };

  const [templates, setTemplates] = React.useState<DashboardTemplate[]>([
    initialTemplate,
  ]);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState(
    initialTemplate.id
  );
  const [filters, setFilters] = React.useState<DashboardFilter[]>([
    {
      key: 'template',
      type: DashboardFilterType.SELECT,
      label: 'Template',
      value: initialTemplate.id,
      options: [
        {
          label: initialTemplate.name,
          value: initialTemplate.id,
        },
      ],
    },
  ]);

  const selectedTemplate =
    templates.find((template) => {
      return template.id === selectedTemplateId;
    }) || templates[0];

  const handleFiltersChange = (updatedFilters: DashboardFilter[]) => {
    setFilters(updatedFilters);
    const templateFilter = updatedFilters.find((filter) => {
      return filter.key === 'template';
    });
    if (templateFilter?.value && typeof templateFilter.value === 'string') {
      setSelectedTemplateId(templateFilter.value);
    }
  };

  const updateTemplateFilterOptions = React.useCallback(
    (nextTemplates: DashboardTemplate[], activeTemplateId: string) => {
      setFilters((prev) => {
        return prev.map((filter) => {
          if (filter.key !== 'template') return filter;
          return {
            ...filter,
            value: activeTemplateId,
            options: nextTemplates.map((template) => {
              return {
                label: template.name,
                value: template.id,
              };
            }),
          };
        });
      });
    },
    []
  );

  const handleSaveLayout = (updatedTemplate: DashboardTemplate) => {
    const normalizedTemplate = { ...updatedTemplate, editable: true };
    setTemplates((prev) => {
      const nextTemplates = prev.map((template) => {
        return template.id === normalizedTemplate.id
          ? normalizedTemplate
          : template;
      });
      updateTemplateFilterOptions(nextTemplates, normalizedTemplate.id);
      return nextTemplates;
    });
  };

  const handleSaveAsNewTemplate = (newTemplate: DashboardTemplate) => {
    const normalizedTemplate = { ...newTemplate, editable: true };
    setTemplates((prev) => {
      const nextTemplates = [...prev, normalizedTemplate];
      updateTemplateFilterOptions(nextTemplates, normalizedTemplate.id);
      return nextTemplates;
    });
    setSelectedTemplateId(normalizedTemplate.id);
  };

  const handleCancelEdit = () => {
    // eslint-disable-next-line no-console
    console.log('Edit mode canceled');
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', padding: '4' }}>
      <Dashboard
        templates={templates}
        filters={filters}
        selectedTemplate={selectedTemplate}
        loading={false}
        editable
        cardCatalog={DEFAULT_CARD_CATALOG}
        onFiltersChange={handleFiltersChange}
        onSaveLayout={handleSaveLayout}
        onSaveAsNewTemplate={handleSaveAsNewTemplate}
        onCancelEdit={handleCancelEdit}
      />
    </Box>
  );
};

export const EditableCustomizeMode: StoryObj = {
  render: () => {
    return <EditableCustomizeStory />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dashboard with edit mode enabled. Use the toolbar to edit layout, add/remove cards from catalog, save the current template, or save as a new template.',
      },
    },
  },
};
