import { Markdown } from '@ttoss/components/Markdown';
import { Auth, useAuth } from '@ttoss/react-auth-cognito';
import type { DashboardFilter } from '@ttoss/react-dashboard';
import { Dashboard, DashboardFilterType } from '@ttoss/react-dashboard';
import { useFeatureFlag } from '@ttoss/react-feature-flags';
import { Box, Button, Flex, Stack } from '@ttoss/ui';
import * as React from 'react';

import type { DashboardTemplate } from '../../../packages/react-dashboard/src/Dashboard';

// import { FarmCorrectPagination } from './modules/Farm/FarmCorrectPagination';
// import { FarmWrongPagination } from './modules/Farm/FarmWrongPagination';

const markdown = '# ~Hi~, *Pluto*!';

const templates: DashboardTemplate[] = [
  {
    id: 'meta-ad-account',
    name: 'Dashboard de conta de anúncio',
    description: undefined,
    grid: [
      {
        i: '1',
        w: 3,
        h: 3,
        x: 0,
        y: 0,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Cliques',
          description: undefined,
          icon: undefined,
          color: undefined,
          variant: 'dark',
          numberType: 'number',
          numberDecimalPlaces: 0,
          type: 'bigNumber',
          sourceType: [
            {
              source: 'meta',
              level: 'adAccount',
            },
          ],
          labels: undefined,
          data: {
            meta: {
              total: 100,
            },
            api: {
              total: 0,
            },
          },
          trend: {
            value: -0.95,
            status: 'negative',
            type: 'higher',
          },
          additionalInfo: undefined,
          metrics: [],
        },
      },
      {
        i: '2',
        w: 3,
        h: 3,
        x: 3,
        y: 0,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Investimento',
          description: undefined,
          icon: undefined,
          color: undefined,
          variant: 'dark',
          numberType: 'currency',
          type: 'bigNumber',
          sourceType: [
            {
              source: 'meta',
              level: 'adAccount',
            },
          ],
          labels: undefined,
          data: {
            meta: {
              total: 551.2,
            },
            api: {
              total: 0,
            },
          },
          trend: {
            value: -0.12,
            status: 'negative',
            type: 'higher',
          },
          additionalInfo: undefined,
          metrics: [],
        },
      },
      {
        i: '3',
        w: 3,
        h: 3,
        x: 6,
        y: 0,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Impresões',
          description: undefined,
          icon: undefined,
          color: undefined,
          variant: undefined,
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [
            {
              source: 'meta',
              level: 'adAccount',
            },
          ],
          labels: undefined,
          data: {
            meta: {
              total: 2475,
            },
            api: {
              total: 0,
            },
          },
          trend: {
            value: -0.97,
            status: 'negative',
            type: 'higher',
          },
          additionalInfo: undefined,
          metrics: [],
        },
      },
      {
        i: '4',
        w: 3,
        h: 3,
        x: 9,
        y: 0,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'CPM',
          description: undefined,
          icon: undefined,
          color: undefined,
          variant: 'light-green',
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [
            {
              source: 'meta',
              level: 'adAccount',
            },
          ],
          labels: [],
          data: {
            meta: {
              total: 222.707071,
            },
            api: {
              total: 0,
            },
          },
          trend: {
            value: 26.54,
            status: 'positive',
            type: 'higher',
          },
          additionalInfo: undefined,
          metrics: [],
        },
      },
      {
        i: '5',
        w: 3,
        h: 3,
        x: 0,
        y: 3,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'CPA',
          description: 'Total de CPA',
          icon: undefined,
          color: undefined,
          variant: undefined,
          numberType: 'currency',
          type: 'bigNumber',
          sourceType: [
            {
              source: 'meta',
              level: 'adAccount',
            },
          ],
          labels: undefined,
          data: {
            meta: {
              total: 6.263636,
            },
            api: {
              total: 0,
            },
          },
          trend: {
            value: 16.98,
            status: 'negative',
            type: 'lower',
          },
          additionalInfo: undefined,
          metrics: [],
        },
      },
      {
        i: '6',
        w: 3,
        h: 3,
        x: 3,
        y: 3,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'CPC',
          description: undefined,
          icon: undefined,
          color: undefined,
          variant: 'default',
          numberType: 'currency',
          type: 'bigNumber',
          sourceType: [
            {
              source: 'meta',
              level: 'adAccount',
            },
          ],
          labels: undefined,
          data: {
            meta: {
              total: 5.512,
            },
            api: {
              total: 0,
            },
          },
          trend: {
            value: 16.59,
            status: 'negative',
            type: 'lower',
          },
          additionalInfo: undefined,
          metrics: [],
        },
      },
      {
        i: '7',
        w: 3,
        h: 3,
        x: 6,
        y: 3,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'CTR',
          description: undefined,
          icon: undefined,
          color: undefined,
          numberDecimalPlaces: 1,
          variant: 'default',
          numberType: 'percentage',
          type: 'bigNumber',
          sourceType: [
            {
              source: 'meta',
              level: 'adAccount',
            },
          ],
          labels: undefined,
          data: {
            meta: {
              total: 4.040404,
            },
            api: {
              total: 0,
            },
          },
          trend: {
            value: 0.57,
            status: 'positive',
            type: 'higher',
          },
          additionalInfo: undefined,
          metrics: [],
        },
      },
      {
        i: '8',
        w: 3,
        h: 3,
        x: 9,
        y: 3,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Total de Compras',
          description: undefined,
          icon: undefined,
          color: undefined,
          variant: 'default',
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [
            {
              source: 'meta',
              level: 'adAccount',
            },
          ],
          labels: undefined,
          data: {
            meta: {
              total: 0,
            },
            api: {
              total: 0,
            },
          },
          trend: {
            value: 0,
            status: 'neutral',
            type: 'higher',
          },
          additionalInfo: undefined,
          metrics: [],
        },
      },
      {
        i: '9',
        w: 3,
        h: 3,
        x: 0,
        y: 6,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Custo por Compra',
          description: undefined,
          icon: undefined,
          color: undefined,
          variant: 'default',
          numberType: 'currency',
          type: 'bigNumber',
          sourceType: [
            {
              source: 'meta',
              level: 'adAccount',
            },
          ],
          labels: undefined,
          data: {
            meta: {
              total: 0,
            },
            api: {
              total: 0,
            },
          },
          trend: {
            value: 0,
            status: 'neutral',
            type: 'higher',
          },
          additionalInfo: undefined,
          metrics: [],
        },
      },
      {
        i: '10',
        w: 3,
        h: 3,
        x: 3,
        y: 6,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Custo por Inicialização de Checkout',
          description: undefined,
          icon: undefined,
          color: undefined,
          variant: 'default',
          numberType: 'currency',
          type: 'bigNumber',
          sourceType: [
            {
              source: 'meta',
              level: 'adAccount',
            },
          ],
          labels: undefined,
          data: {
            meta: {
              total: 0,
            },
            api: {
              total: 0,
            },
          },
          trend: {
            value: 0,
            status: 'neutral',
            type: 'higher',
          },
          additionalInfo: undefined,
          metrics: [],
        },
      },
      {
        i: '11',
        w: 3,
        h: 3,
        x: 6,
        y: 6,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Total de Inicializações de Checkout',
          description: undefined,
          icon: undefined,
          color: undefined,
          variant: 'default',
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [
            {
              source: 'meta',
              level: 'adAccount',
            },
          ],
          labels: undefined,
          data: {
            meta: {
              total: 0,
            },
            api: {
              total: 0,
            },
          },
          trend: {
            value: 0,
            status: 'neutral',
            type: 'higher',
          },
          additionalInfo: undefined,
          metrics: [],
        },
      },
      {
        i: '12',
        w: 3,
        h: 3,
        x: 9,
        y: 6,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Custo por Lead',
          description: undefined,
          icon: undefined,
          color: undefined,
          variant: 'default',
          numberType: 'currency',
          type: 'bigNumber',
          sourceType: [
            {
              source: 'meta',
              level: 'adAccount',
            },
          ],
          labels: undefined,
          data: {
            meta: {
              total: 0,
            },
            api: {
              total: 0,
            },
          },
          trend: {
            value: 0,
            status: 'neutral',
            type: 'higher',
          },
          additionalInfo: undefined,
          metrics: [],
        },
      },
      {
        i: '13',
        w: 12,
        h: 2,
        x: 0,
        y: 12,
        isResizable: false,
        isDraggable: false,
        card: {
          type: 'sectionDivider',
          title: 'Métricas de performance',
        },
      },
      {
        i: '14',
        w: 3,
        h: 3,
        x: 0,
        y: 12,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Total de Leads',
          description: undefined,
          icon: undefined,
          color: undefined,
          variant: 'default',
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [
            {
              source: 'meta',
              level: 'adAccount',
            },
          ],
          labels: undefined,
          data: {
            meta: {
              total: 0,
            },
            api: {
              total: 0,
            },
          },
          trend: {
            value: 0,
            status: 'neutral',
            type: 'higher',
          },
          additionalInfo: undefined,
          metrics: [],
        },
      },
    ],
  },
  {
    id: 'api-data',
    name: 'OneClickAds',
    grid: [
      {
        i: '1',
        w: 4,
        h: 3,
        x: 0,
        y: 0,
        isResizable: false,
        isDraggable: false,
        card: {
          sourceType: [{ source: 'oneclickads' }],
          title: 'Faturamento Bruto',
          variant: 'dark',
          numberType: 'currency',
          type: 'bigNumber',
          data: {
            api: {
              total: 3820.68,
            },
          },
          trend: {
            value: 12.5,
            status: 'positive',
          },
        },
      },
      {
        i: '2',
        w: 3,
        h: 3,
        x: 4,
        y: 0,
        isResizable: false,
        isDraggable: false,
        card: {
          sourceType: [{ source: 'api' }],
          title: 'Taxas',
          numberType: 'currency',
          type: 'bigNumber',
          labels: [],
          data: {
            api: {
              total: 1000,
            },
          },
        },
      },
      {
        i: '3',
        w: 2,
        h: 3,
        x: 7,
        y: 0,
        isResizable: false,
        isDraggable: false,
        card: {
          sourceType: [{ source: 'api' }],
          title: 'ROAS',
          variant: 'light-green',
          numberType: 'number',
          type: 'bigNumber',
          labels: [],
          data: {
            api: {
              total: 4.46,
            },
          },
          status: {
            text: 'Performance excelente',
            icon: 'mdi:trending-up',
          },
        },
      },
      {
        i: '4',
        w: 6,
        h: 3,
        x: 0,
        y: 3,
        isResizable: false,
        isDraggable: false,
        card: {
          sourceType: [{ source: 'api' }],
          title: 'Faturamento líquido total',
          description: 'Total de faturamento líquido',
          numberType: 'currency',
          type: 'bigNumber',
          labels: [],
          data: {
            api: {
              total: 2789.1,
            },
          },
        },
      },
      {
        i: '5',
        w: 6,
        h: 3,
        x: 6,
        y: 3,
        isResizable: false,
        isDraggable: false,
        card: {
          sourceType: [{ source: 'api' }],
          title: 'Lucro Líquido',
          variant: 'default',
          numberType: 'currency',
          type: 'bigNumber',
          labels: [],
          data: {
            api: {
              total: 1932.76,
            },
          },
          trend: {
            value: 8.3,
            status: 'negative',
          },
        },
      },
      {
        i: '6',
        w: 2,
        h: 3,
        x: 9,
        y: 0,
        isResizable: false,
        isDraggable: false,
        card: {
          sourceType: [{ source: 'api' }],
          title: 'ROI',
          description: 'Total de ROI',
          numberType: 'number',
          type: 'bigNumber',
          labels: [],
          data: {
            api: {
              total: 3.26,
            },
          },
        },
      },
      {
        i: '7',
        w: 12,
        h: 2,
        x: 0,
        y: 3,
        isResizable: false,
        isDraggable: false,
        card: {
          type: 'sectionDivider',
          title: 'Test',
        },
      },
    ],
  },
];

const startOfDay = (date: Date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const endOfDay = (date: Date) => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

const subDays = (date: Date, days: number) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() - days);
  return newDate;
};

const subWeeks = (date: Date, weeks: number) => {
  return subDays(date, weeks * 7);
};

const subMonths = (date: Date, months: number) => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() - months);
  return newDate;
};

const subQuarters = (date: Date, quarters: number) => {
  return subMonths(date, quarters * 3);
};

const filters: DashboardFilter[] = [
  {
    key: 'template',
    type: DashboardFilterType.SELECT,
    label: 'Template',
    value: templates[0]?.id,
    options: templates.map((template) => {
      return { label: template.name, value: template.id };
    }),
  },
  {
    key: 'adAccount',
    type: DashboardFilterType.SELECT,
    label: 'Conta de anúncio',
    value: '',
    options: [
      { label: 'Conta 1', value: 'account1' },
      { label: 'Conta 2', value: 'account2' },
      { label: 'Conta 3', value: 'account3' },
    ],
  },
  {
    key: 'period',
    type: DashboardFilterType.DATE_RANGE,
    label: 'Período de visualização',
    value: {
      from: new Date(),
      to: new Date(),
    },
    presets: [
      {
        label: 'Hoje',
        getValue: () => {
          return {
            from: startOfDay(new Date()),
            to: endOfDay(new Date()),
          };
        },
      },
      {
        label: 'Ontem',
        getValue: () => {
          return {
            from: startOfDay(subDays(new Date(), 1)),
            to: endOfDay(subDays(new Date(), 1)),
          };
        },
      },
      {
        label: 'Última semana',
        getValue: () => {
          return {
            from: startOfDay(subWeeks(new Date(), 1)),
            to: endOfDay(new Date()),
          };
        },
      },
      {
        label: 'Último mês',
        getValue: () => {
          return {
            from: startOfDay(subMonths(new Date(), 1)),
            to: endOfDay(new Date()),
          };
        },
      },
      {
        label: 'Último trimestre',
        getValue: () => {
          return {
            from: startOfDay(subQuarters(new Date(), 1)),
            to: endOfDay(new Date()),
          };
        },
      },
    ],
  },
];

export const App = () => {
  const { isAuthenticated, user, signOut } = useAuth();

  const isNiceHiEnabled = useFeatureFlag('nice-hi');

  // Manage filters state outside Dashboard
  const [dashboardFilters, setDashboardFilters] =
    React.useState<DashboardFilter[]>(filters);

  // Find initial selected template based on template filter value
  const getSelectedTemplate = React.useCallback(
    (filters: DashboardFilter[]) => {
      const templateFilter = filters.find((f) => {
        return f.key === 'template';
      });
      if (!templateFilter?.value) {
        return undefined;
      }
      return templates.find((t) => {
        return t.id === templateFilter.value;
      });
    },
    []
  );

  // Manage selectedTemplate state based on template filter
  const [selectedTemplate, setSelectedTemplate] = React.useState<
    DashboardTemplate | undefined
  >(() => {
    return getSelectedTemplate(dashboardFilters);
  });

  // Update selectedTemplate when template filter changes
  React.useEffect(() => {
    const newSelectedTemplate = getSelectedTemplate(dashboardFilters);
    setSelectedTemplate(newSelectedTemplate);
  }, [dashboardFilters, getSelectedTemplate]);

  const [loading, setLoading] = React.useState(true);

  const hi = isNiceHiEnabled ? 'Hi' : 'Hello';
  setTimeout(() => {
    setLoading(false);
  }, 2000);
  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <Stack>
      <h1>{hi}</h1>
      <p>{JSON.stringify(user, null, 2)}</p>
      <Button
        onClick={() => {
          signOut();
        }}
      >
        Logout
      </Button>
      <Markdown>{markdown}</Markdown>
      <Dashboard
        selectedTemplate={selectedTemplate}
        filters={dashboardFilters}
        templates={templates}
        onFiltersChange={setDashboardFilters}
        loading={loading}
      />

      <Flex sx={{ paddingX: 'xl' }}>
        <Box sx={{ flex: 1 }}>{/* <FarmWrongPagination /> */}</Box>
        <Box sx={{ flex: 1 }}>{/* <FarmCorrectPagination /> */}</Box>
      </Flex>
    </Stack>
  );
};
