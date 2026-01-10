import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  Dashboard,
  type DashboardFilter,
  DashboardFilterType,
  type DashboardTemplate,
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
