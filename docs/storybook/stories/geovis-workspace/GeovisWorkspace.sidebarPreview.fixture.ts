import { type GeovisWorkspaceConfig } from '@ttoss/geovis-workspace';

/**
 * A rich left sidebar with three icon tabs whose header mirrors the active tab.
 * The "Variações" tab is a flat list of icon-led variations (tagged by group)
 * that drive the shared `variable` selection (recoloring the map); "Filtros"
 * stacks emoji chips and a município locator; "Linha do Tempo" holds the
 * timeline on its own.
 *
 * The last two are both `filters` sections — the kind describes the body, not
 * the tab, so a config splits its controls across as many tabs as it wants.
 * Worth keeping split here: the timeline is the one control with a gate
 * (`enabledWhen`) and a compact HUD of its own, and a tab of its own is what
 * lets either be scoped to it without dragging the chips and locator along.
 */
export const sidebarPreviewConfig: GeovisWorkspaceConfig = {
  leftSidebar: {
    initialState: 'open',
    sections: [
      {
        id: 'variations',
        header: {
          title: 'Variações',
          icon: 'lucide:layout-list',
        },
        body: {
          kind: 'variations',
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
        header: {
          title: 'Filtros',
          icon: 'lucide:filter',
        },
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
        header: {
          title: 'Linha do Tempo',
          icon: 'lucide:clock',
        },
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
                histogram: [
                  { key: 2015, count: 38 },
                  { key: 2016, count: 44 },
                  { key: 2017, count: 51 },
                  { key: 2018, count: 63 },
                  { key: 2019, count: 70 },
                  { key: 2020, count: 82 },
                  { key: 2021, count: 95 },
                  { key: 2022, count: 108 },
                  { key: 2023, count: 121 },
                  { key: 2024, count: 134 },
                ],
              },
            },
          ],
        },
      },
    ],
  },
};
