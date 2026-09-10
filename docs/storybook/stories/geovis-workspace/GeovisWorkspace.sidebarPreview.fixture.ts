import { type GeovisWorkspaceConfig } from '@ttoss/geovis-workspace';

/**
 * A rich left sidebar with three icon tabs. The first is a flat list of icon-led
 * variations (tagged by group) that drive the shared `variable` selection
 * (recoloring the map); the second stacks emoji chips and a município locator;
 * the third holds the timeline on its own.
 *
 * The last two are both `filters` sections — the kind describes the body, not
 * the tab, so a config splits its controls across as many tabs as it wants.
 * Worth keeping split here: the timeline is the one control with a gate
 * (`enabledWhen`) and a compact HUD of its own, and a tab of its own is what
 * lets either be scoped to it without dragging the chips and locator along.
 *
 * Two variations under "Produção Agrícola" carry a `description`, which is what
 * a row shows on hover; the rest are left without one, since a tooltip that only
 * repeated the label would say nothing the row does not already.
 *
 * No section declares a header `title`, so the band is not drawn at all: the tab
 * bar heads the card, carrying the close button. The icons stay — they are what
 * identifies each tab, and it is only the band that goes away.
 */
export const sidebarPreviewConfig: GeovisWorkspaceConfig = {
  leftSidebar: {
    initialState: 'open',
    sections: [
      {
        id: 'variations',
        header: { icon: 'lucide:layout-list' },
        body: {
          kind: 'variations',
          title: 'Variações',
          icon: 'lucide:layout-list',
          menuId: 'variable',
          defaultGroupId: 'production',
          defaultValue: 'farms',
          groups: [
            {
              id: 'infrastructure',
              label: 'Infraestrutura',
              icon: 'lucide:building-2',
              color: '#3b82f6',
              variations: [
                {
                  value: 'kitchens',
                  label: 'Cozinhas Comunitárias',
                  icon: 'lucide:utensils',
                },
                {
                  value: 'routes',
                  label: 'Rotas de Distribuição',
                  icon: 'lucide:route',
                },
                {
                  value: 'warehouses',
                  label: 'Armazéns e Silos',
                  icon: 'lucide:warehouse',
                },
                {
                  value: 'markets',
                  label: 'Feiras e Mercados',
                  icon: 'lucide:shopping-bag',
                },
                {
                  value: 'logistics',
                  label: 'Centros Logísticos',
                  icon: 'lucide:map-pin',
                },
              ],
            },
            {
              id: 'production',
              label: 'Produção Agrícola',
              icon: 'lucide:wheat',
              color: '#0e9e6e',
              variations: [
                {
                  value: 'farms',
                  label: 'Localização das Fazendas',
                  icon: 'lucide:tractor',
                },
                {
                  value: 'volume',
                  label: 'Volume por Cultura',
                  icon: 'lucide:bar-chart-2',
                  description: 'Toneladas colhidas na safra corrente',
                },
                {
                  value: 'harvest',
                  label: 'Calendário de Safra',
                  icon: 'lucide:calendar',
                },
                {
                  value: 'certs',
                  label: 'Certificações Orgânicas',
                  icon: 'lucide:badge-check',
                  description:
                    'Selos válidos por propriedade, auditados em 2025',
                },
                {
                  value: 'irrigation',
                  label: 'Áreas Irrigadas',
                  icon: 'lucide:droplets',
                },
              ],
            },
            {
              id: 'environment',
              label: 'Meio Ambiente',
              icon: 'lucide:tree-pine',
              color: '#16a34a',
              variations: [
                {
                  value: 'preservation',
                  label: 'Áreas de Preservação',
                  icon: 'lucide:tree-pine',
                },
                {
                  value: 'deforestation',
                  label: 'Desmatamento',
                  icon: 'lucide:alert-triangle',
                },
                {
                  value: 'water',
                  label: 'Recursos Hídricos',
                  icon: 'lucide:droplets',
                },
                {
                  value: 'biodiversity',
                  label: 'Biodiversidade',
                  icon: 'lucide:leaf',
                },
              ],
            },
            {
              id: 'social',
              label: 'Social',
              icon: 'lucide:users',
              color: '#8b5cf6',
              variations: [
                {
                  value: 'population',
                  label: 'Densidade Populacional',
                  icon: 'lucide:users',
                },
                {
                  value: 'settlements',
                  label: 'Assentamentos Rurais',
                  icon: 'lucide:home',
                },
                {
                  value: 'beneficiaries',
                  label: 'Beneficiários',
                  icon: 'lucide:heart',
                },
                {
                  value: 'services',
                  label: 'Acesso a Serviços',
                  icon: 'lucide:building-2',
                },
              ],
            },
            {
              id: 'economy',
              label: 'Economia',
              icon: 'lucide:trending-up',
              color: '#d97706',
              variations: [
                {
                  value: 'gdp',
                  label: 'PIB Agropecuário',
                  icon: 'lucide:trending-up',
                },
                {
                  value: 'employment',
                  label: 'Emprego Rural',
                  icon: 'lucide:briefcase',
                },
                {
                  value: 'exports',
                  label: 'Exportações',
                  icon: 'lucide:globe',
                },
                {
                  value: 'prices',
                  label: 'Preço de Commodities',
                  icon: 'lucide:dollar-sign',
                },
              ],
            },
          ],
        },
      },
      {
        id: 'filters',
        header: { icon: 'lucide:filter' },
        body: {
          kind: 'filters',
          blocks: [
            {
              id: 'products',
              title: 'Tipo de Produção',
              icon: 'lucide:filter',
              control: {
                kind: 'chips',
                options: [
                  { id: 'soja', label: 'Soja', emoji: '🌱' },
                  { id: 'milho', label: 'Milho', emoji: '🌽' },
                  { id: 'cafe', label: 'Café', emoji: '☕' },
                  { id: 'cana', label: 'Cana-de-açúcar', emoji: '🎋' },
                  { id: 'laranja', label: 'Laranja', emoji: '🍊' },
                  { id: 'mandioca', label: 'Mandioca', emoji: '🌿' },
                  { id: 'arroz', label: 'Arroz', emoji: '🌾' },
                  { id: 'feijao', label: 'Feijão', emoji: '🫘' },
                ],
              },
            },
            {
              id: 'municipality',
              title: 'Município',
              icon: 'lucide:navigation',
              // The one block that toggles: its list is long, and it is the
              // only one declared to start closed.
              collapsible: true,
              control: {
                kind: 'locator',
                placeholder: 'Buscar município...',
                options: [
                  'Araçatuba',
                  'Araraquara',
                  'Assis',
                  'Barretos',
                  'Bauru',
                  'Botucatu',
                  'Campinas',
                  'Catanduva',
                  'Franca',
                  'Jaú',
                  'Jundiaí',
                  'Lins',
                  'Marília',
                  'Ourinhos',
                  'Piracicaba',
                  'Presidente Prudente',
                  'Ribeirão Preto',
                  'Santos',
                  'São José do Rio Preto',
                  'São José dos Campos',
                  'São Paulo',
                  'Sorocaba',
                  'Tupã',
                  'Votuporanga',
                ].map((name) => {
                  return { id: name, label: name, sublabel: 'SP · Brasil' };
                }),
              },
            },
          ],
        },
      },
      {
        id: 'timeline',
        header: { icon: 'lucide:clock' },
        body: {
          kind: 'filters',
          blocks: [
            {
              id: 'year',
              title: 'Ano',
              icon: 'lucide:clock',
              control: {
                kind: 'timeline',
                min: 2015,
                max: 2024,
                defaultValue: 2022,
                unitLabel: 'registros',
                // Counts in the thousands, so the story exercises the
                // grouping the bars' tooltips and the unit readout apply — a
                // two-digit series would separate the same either way.
                histogram: [
                  { key: 2015, count: 38412 },
                  { key: 2016, count: 44207 },
                  { key: 2017, count: 51930 },
                  { key: 2018, count: 63118 },
                  { key: 2019, count: 70455 },
                  { key: 2020, count: 82309 },
                  { key: 2021, count: 95674 },
                  { key: 2022, count: 108240 },
                  { key: 2023, count: 121836 },
                  { key: 2024, count: 134502 },
                ],
              },
            },
          ],
        },
      },
    ],
  },
};
