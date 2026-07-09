import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  Dashboard,
  type DashboardFilter,
  DashboardFilterType,
  type DashboardTemplate,
} from '@ttoss/react-dashboard';
import { Box } from '@ttoss/ui';

const loadingTemplate: DashboardTemplate = {
  id: 'loading-template',
  name: 'Loading Template',
  grid: [
    {
      i: 'revenue',
      x: 0,
      y: 0,
      w: 4,
      h: 4,
      card: {
        id: 'loading-revenue',
        title: 'Total Revenue',
        description: 'Revenue from all sources',
        numberType: 'currency',
        type: 'bigNumber',
        sourceType: [{ source: 'api' }],
        data: {
          api: {},
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
        id: 'loading-roas',
        title: 'ROAS',
        description: 'Return on ad spend',
        numberType: 'number',
        type: 'bigNumber',
        sourceType: [{ source: 'api' }],
        data: {
          api: {},
        },
        variant: 'light-green',
      },
    },
    {
      i: 'cpc',
      x: 8,
      y: 0,
      w: 4,
      h: 4,
      card: {
        id: 'loading-cpc',
        title: 'CPC',
        description: 'Cost per click',
        numberType: 'currency',
        type: 'bigNumber',
        sourceType: [{ source: 'api' }],
        data: {
          api: {},
        },
        variant: 'dark',
      },
    },
  ],
};

const loadingFilters: DashboardFilter[] = [
  {
    key: 'template',
    type: DashboardFilterType.SELECT,
    label: 'Template',
    value: 'loading-template',
    options: [{ label: 'Loading Template', value: 'loading-template' }],
  },
];

const meta: Meta<typeof Dashboard> = {
  title: 'React Dashboard/DashboardLoadingState',
  component: Dashboard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Visual example of the dashboard metrics loading state. The selected template layout remains visible while metric cards render skeleton placeholders for the pending query.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Dashboard>;

export const MetricsSkeleton: Story = {
  render: () => {
    return (
      <Box sx={{ width: '100%', minHeight: '100vh', padding: '4' }}>
        <Dashboard
          templates={[loadingTemplate]}
          filters={loadingFilters}
          selectedTemplate={loadingTemplate}
          loading={true}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows how the metrics area looks while the monorepo data query is still loading.',
      },
    },
  },
};
