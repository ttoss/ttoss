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
    id: 'default',
    name: 'Padrão',
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
          title: 'Investimento total',
          description: 'Valor total investido em anúncios na plataforma Meta',
          variant: 'default',
          numberType: 'currency',
          type: 'bigNumber',
          sourceType: [
            {
              source: 'meta',
              level: 'adAccount',
            },
          ],
          data: {
            meta: {
              total: 10784.99,
            },
          },
          trend: {
            value: 46.82,
            status: 'positive',
            type: 'higher',
          },
          status: {
            text: '',
            icon: '',
          },
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
          title: 'Faturamento Total Rastreado',
          description:
            'Valor total de vendas rastreadas através dos eventos de compra',
          variant: 'default',
          numberType: 'currency',
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
              total: 3883.83,
            },
          },
          trend: {
            value: 32.36,
            status: 'negative',
            type: 'higher',
          },
          status: {
            text: '',
            icon: '',
          },
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
          title: 'ROAS',
          description:
            'Return on Ad Spend - Retorno sobre investimento em publicidade. Representa quantas vezes o valor investido foi recuperado em vendas',
          numberType: 'number',
          numberDecimalPlaces: 2,
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
              total: 0.36,
            },
          },
          trend: {
            value: 53.85,
            status: 'negative',
            type: 'higher',
          },
          status: {
            text: '',
            icon: '',
          },
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
          title: 'Número de compras',
          description:
            'Quantidade total de compras realizadas e rastreadas através dos anúncios',
          variant: 'default',
          numberType: 'number',
          numberDecimalPlaces: 0,
          type: 'bigNumber',
          sourceType: [
            {
              source: 'meta',
              level: 'adAccount',
            },
          ],
          data: {
            meta: {
              total: 10,
            },
          },
          trend: {
            value: 9.09,
            status: 'negative',
            type: 'higher',
          },
          status: {
            text: '',
            icon: '',
          },
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
          title: 'Impressões',
          description:
            'Número total de vezes que os anúncios foram exibidos aos usuários',
          numberType: 'number',
          numberDecimalPlaces: 0,
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
              total: 181135,
            },
          },
          trend: {
            value: 46.11,
            status: 'positive',
            type: 'higher',
          },
          status: {
            text: '',
            icon: '',
          },
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
          title: 'Alcance',
          description:
            'Número de pessoas únicas que viram pelo menos uma vez os anúncios',
          variant: 'default',
          numberType: 'number',
          numberDecimalPlaces: 0,
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
              total: 55543,
            },
          },
          trend: {
            value: 33.58,
            status: 'positive',
            type: 'higher',
          },
          status: {
            text: '',
            icon: '',
          },
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
          title: 'Frequência',
          description: 'Número médio de vezes que cada pessoa viu os anúncios',
          variant: 'default',
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
              total: 3.26,
            },
          },
          trend: {
            value: 9.4,
            status: 'positive',
            type: 'higher',
          },
          status: {
            text: '',
            icon: '',
          },
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
          title: 'CPM',
          description:
            'Custo por Mil Impressões - Valor gasto para exibir o anúncio mil vezes',
          variant: 'default',
          numberType: 'number',
          numberDecimalPlaces: 2,
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
              total: 59.54,
            },
          },
          trend: {
            value: 0,
            status: 'neutral',
            type: 'lower',
          },
          status: {
            text: '',
            icon: '',
          },
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
          title: 'Cliques',
          description: 'Número total de cliques nos anúncios',
          variant: 'default',
          numberType: 'number',
          numberDecimalPlaces: 0,
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
              total: 3902,
            },
          },
          trend: {
            value: 70.32,
            status: 'positive',
            type: 'higher',
          },
          status: {
            text: '',
            icon: '',
          },
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
          title: 'CTR',
          description:
            'Click-Through Rate - Taxa de cliques. Percentual de pessoas que clicaram no anúncio em relação ao total de impressões',
          variant: 'default',
          numberType: 'percentage',
          numberDecimalPlaces: 2,
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
              total: 2.15,
            },
          },
          trend: {
            value: 16.22,
            status: 'positive',
            type: 'higher',
          },
          status: {
            text: '',
            icon: '',
          },
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
          title: 'CPC',
          description: 'Custo por Clique',
          variant: 'default',
          numberType: 'currency',
          numberDecimalPlaces: 2,
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
              total: 2.76,
            },
          },
          trend: {
            value: 14.02,
            status: 'positive',
            type: 'lower',
          },
          status: {
            text: '',
            icon: '',
          },
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
          title: 'Hook Rate Anúncios',
          description:
            'Taxa de engajamento de vídeo. Calculado como: Visualizações de vídeo ÷ Impressões. Mede a porcentagem de pessoas que assistiram ao vídeo em relação ao total de impressões',
          variant: 'default',
          numberType: 'percentage',
          numberDecimalPlaces: 1,
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
              total: 19.3,
            },
          },
          trend: {
            value: 8.1,
            status: 'negative',
            type: 'higher',
          },
          status: {
            text: '',
            icon: '',
          },
          metrics: [],
        },
      },
      {
        i: '13',
        w: 3,
        h: 3,
        x: 0,
        y: 9,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Checkouts',
          description: 'Número total de checkouts iniciados pelos usuários',
          variant: 'default',
          numberType: 'number',
          numberDecimalPlaces: 0,
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
              total: 31,
            },
          },
          trend: {
            value: 55,
            status: 'positive',
            type: 'higher',
          },
          status: {
            text: '',
            icon: '',
          },
          metrics: [],
        },
      },
      {
        i: '14',
        w: 3,
        h: 3,
        x: 3,
        y: 9,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Taxa de conversão do checkout',
          description:
            'Percentual de checkouts que resultaram em compras. Calculado como: Compras ÷ Checkouts iniciados',
          variant: 'default',
          numberType: 'percentage',
          numberDecimalPlaces: 1,
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
              total: 32.3,
            },
          },
          trend: {
            value: 41.27,
            status: 'negative',
            type: 'higher',
          },
          status: {
            text: '',
            icon: '',
          },
          metrics: [],
        },
      },
      {
        i: '15',
        w: 3,
        h: 3,
        x: 6,
        y: 9,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Taxa de perda do site',
          description:
            'Percentual de cliques que não resultaram em visualização da página de destino. Calculado como: Visualizações de landing page ÷ Cliques únicos. Valores menores indicam menor perda de tráfego',
          variant: 'default',
          numberType: 'percentage',
          numberDecimalPlaces: 0,
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
              total: 85,
            },
          },
          trend: {
            value: 7.61,
            status: 'positive',
            type: 'lower',
          },
          status: {
            text: '',
            icon: '',
          },
          metrics: [],
        },
      },
      {
        i: '16',
        w: 3,
        h: 3,
        x: 9,
        y: 9,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Número de leads',
          description: 'Quantidade total de leads gerados através dos anúncios',
          variant: 'default',
          numberType: 'number',
          numberDecimalPlaces: 0,
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
              total: 56,
            },
          },
          trend: {
            value: 24.44,
            status: 'positive',
            type: 'higher',
          },
          status: {
            text: '',
            icon: '',
          },
          metrics: [],
        },
      },
      {
        i: '17',
        w: 3,
        h: 3,
        x: 0,
        y: 12,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Taxa de conversão do site - Leads',
          description:
            'Percentual de visitantes da landing page que se converteram em leads. Calculado como: Leads ÷ Visualizações de landing page',
          variant: 'default',
          numberType: 'percentage',
          numberDecimalPlaces: 1,
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
              total: 3.5,
            },
          },
          trend: {
            value: 20.45,
            status: 'negative',
            type: 'higher',
          },
          status: {
            text: '',
            icon: '',
          },
          metrics: [],
        },
      },
      {
        i: '18',
        w: 3,
        h: 3,
        x: 3,
        y: 12,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Custo por Lead',
          description:
            'Valor médio gasto para gerar cada lead através dos anúncios',
          variant: 'default',
          numberType: 'currency',
          numberDecimalPlaces: 2,
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
              total: 192.59,
            },
          },
          trend: {
            value: 17.98,
            status: 'negative',
            type: 'lower',
          },
          status: {
            text: '',
            icon: '',
          },
          metrics: [],
        },
      },
      {
        i: '19',
        w: 3,
        h: 3,
        x: 6,
        y: 12,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Custo por checkout',
          description: 'Valor médio gasto para gerar cada checkout iniciado',
          variant: 'default',
          numberType: 'currency',
          numberDecimalPlaces: 2,
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
              total: 347.9,
            },
          },
          trend: {
            value: 5.28,
            status: 'positive',
            type: 'lower',
          },
          status: {
            text: '',
            icon: '',
          },
          metrics: [],
        },
      },
      {
        i: '20',
        w: 3,
        h: 3,
        x: 9,
        y: 12,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Custo por compra',
          description:
            'Valor médio gasto para gerar cada compra através dos anúncios',
          variant: 'default',
          numberType: 'currency',
          numberDecimalPlaces: 2,
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
              total: 1078.5,
            },
          },
          trend: {
            value: 61.5,
            status: 'negative',
            type: 'lower',
          },
          status: {
            text: '',
            icon: '',
          },
          metrics: [],
        },
      },
      {
        i: '21',
        w: 3,
        h: 3,
        x: 0,
        y: 13,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Taxa de conversão do site - Compras',
          description:
            'Percentual de visitantes da landing page que realizaram uma compra. Calculado como: Compras ÷ Visualizações de landing page',
          variant: 'default',
          numberType: 'percentage',
          numberDecimalPlaces: 1,
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
              total: 0.6,
            },
          },
          trend: {
            value: 45.45,
            status: 'negative',
            type: 'higher',
          },
          status: {
            text: '',
            icon: '',
          },
          metrics: [],
        },
      },
      {
        i: '22',
        w: 12,
        h: 2,
        x: 0,
        y: 16,
        isResizable: false,
        isDraggable: false,
        card: {
          type: 'sectionDivider',
          title: 'Test',
        },
      },
      {
        i: '23',
        w: 3,
        h: 3,
        x: 0,
        y: 18,
        isResizable: false,
        isDraggable: false,
        card: {
          title: 'Taxa de conversão do site - Compras',
          description:
            'Percentual de visitantes da landing page que realizaram uma compra. Calculado como: Compras ÷ Visualizações de landing page',
          variant: 'default',
          numberType: 'percentage',
          numberDecimalPlaces: 1,
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
              total: 0.6,
            },
          },
          trend: {
            value: 45.45,
            status: 'negative',
            type: 'higher',
          },
          status: {
            text: '',
            icon: '',
          },
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
      <Flex
        sx={{
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Flex sx={{ width: '60%', height: '100%' }}>
          <Dashboard
            selectedTemplate={selectedTemplate}
            filters={dashboardFilters}
            templates={templates}
            onFiltersChange={setDashboardFilters}
            loading={loading}
          />
        </Flex>
      </Flex>

      <Flex sx={{ paddingX: 'xl' }}>
        <Box sx={{ flex: 1 }}>{/* <FarmWrongPagination /> */}</Box>
        <Box sx={{ flex: 1 }}>{/* <FarmCorrectPagination /> */}</Box>
      </Flex>
    </Stack>
  );
};
