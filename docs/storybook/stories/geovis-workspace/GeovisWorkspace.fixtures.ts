import type { VisualizationSpec } from '@ttoss/geovis';
import { type GeovisWorkspaceConfig } from '@ttoss/geovis-workspace';

type Position = [number, number];

interface RegionDef {
  id: number;
  name: string;
  /** Relative intensity (0–1) that scales the metric value for this region. */
  intensity: number;
  coordinates: Position[][];
}

/** Synthetic regions laid out in a 3×2 grid of squares over São Paulo. */
const REGIONS: RegionDef[] = [
  { name: 'Centro', intensity: 0.18 },
  { name: 'Norte', intensity: 0.34 },
  { name: 'Sul', intensity: 0.5 },
  { name: 'Leste', intensity: 0.66 },
  { name: 'Oeste', intensity: 0.82 },
  { name: 'Zona Rural', intensity: 0.95 },
].map((meta, index) => {
  const lng0 = -46.73;
  const lat0 = -23.63;
  const cell = 0.05;
  const cols = 3;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const lng = lng0 + col * cell;
  const lat = lat0 + row * cell;
  const side = cell * 0.9;
  const ring: Position[] = [
    [lng, lat],
    [lng + side, lat],
    [lng + side, lat + side],
    [lng, lat + side],
    [lng, lat],
  ];

  return {
    id: index + 1,
    name: meta.name,
    intensity: meta.intensity,
    coordinates: [ring],
  };
});

/**
 * Per-variable configuration: the natural maximum used to scale region
 * intensities into a value, plus the threshold breaks and color ramp that
 * GeoVis uses to bucket and paint each region.
 */
const VARIABLES: Record<
  string,
  { title: string; max: number; thresholds: number[]; colors: string[] }
> = {
  'cumulative-rate': {
    title: 'Taxa cumulativa (% do total)',
    max: 28,
    thresholds: [5, 10, 15, 20],
    colors: ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'],
  },
  'cumulative-proportion': {
    title: 'Proporção cumulativa (% da pop 65+)',
    max: 58,
    thresholds: [10, 20, 30, 45],
    colors: ['#edf8e9', '#bae4b3', '#74c476', '#31a354', '#006d2c'],
  },
  range: {
    title: 'Faixa (% da pop 65+)',
    max: 96,
    thresholds: [20, 40, 60, 80],
    colors: ['#feedde', '#fdbe85', '#fd8d3c', '#e6550d', '#a63603'],
  },
};

/** How much each cohort scales the metric relative to the 65+ baseline. */
const AGE_FACTORS: Record<string, number> = {
  '65-plus': 1,
  '70-plus': 0.7,
  '75-plus': 0.45,
};

/**
 * Derives a GeoVis spec from the current workspace selection. Every region
 * keeps the same geometry; only its joined `value` (in `mapData`) and the
 * layer's `activeLegendId` change, so switching the variable or the age range
 * recolors the map in place. `legends` lives at the spec's top level (not on
 * the layer) so `GeovisWorkspace`'s right sidebar can render the active one
 * straight from `visualizationSpec` — the same registry the layer's
 * `activeLegendId` already resolves colors from.
 */
export const buildSpec = ({
  variable,
  age,
}: {
  variable: string;
  age: string;
}): VisualizationSpec => {
  const variableConfig = VARIABLES[variable] ?? VARIABLES['cumulative-rate'];
  const ageFactor = AGE_FACTORS[age] ?? 1;

  return {
    title: 'Choropleth driven by workspace selection',
    engine: 'maplibre',
    view: { center: [-46.645, -23.57], zoom: 10.5 },
    basemap: { styleUrl: 'https://tiles.openfreemap.org/styles/bright' },
    sources: [
      {
        id: 'regions',
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: REGIONS.map((region) => {
            return {
              type: 'Feature' as const,
              id: region.id,
              properties: { name: region.name },
              geometry: {
                type: 'Polygon' as const,
                coordinates: region.coordinates,
              },
            };
          }),
        },
      },
    ],
    legends: Object.entries(VARIABLES).map(([id, config]) => {
      return {
        id,
        // No legend gets a `position`, so `GeoVisProvider` mounts no on-map
        // legend overlay. The registry stays so the layer's `activeLegendId`
        // still resolves its colors from it; only the corner-box overlay is
        // removed.
        ...(id === variable ? { title: config.title } : {}),
        colorBy: {
          type: 'quantitative' as const,
          property: 'value',
          scale: 'threshold' as const,
          thresholds: config.thresholds,
          colors: config.colors,
        },
      };
    }),
    layers: [
      {
        id: 'regions-fill',
        sourceId: 'regions',
        geometry: 'polygon',
        mapDataId: 'choropleth',
        activeLegendId: variable,
        paint: { fillOpacity: 0.78, lineColor: '#1f2937' },
      },
    ],
    mapData: [
      {
        mapDataId: 'choropleth',
        mapId: 'regions',
        data: REGIONS.map((region) => {
          return {
            geometryId: region.id,
            value: Math.round(
              region.intensity * variableConfig.max * ageFactor
            ),
          };
        }),
      },
    ],
  };
};

/**
 * A layer whose `mapDataId` matches no `mapData` entry — `@ttoss/geovis`'s
 * own validation rejects this with a real `unknown-map-data-id` failure
 * (mismatch), carrying an `allowed-values` repair listing the real id.
 */
export const buildBrokenSpec = (): VisualizationSpec => {
  const spec = buildSpec({ variable: 'cumulative-rate', age: '65-plus' });

  return {
    ...spec,
    layers: spec.layers.map((layer) => {
      return { ...layer, mapDataId: 'does-not-exist' };
    }),
  };
};

/**
 * A spec whose `metadata` flags a cartography policy violation (a raw-count
 * metric shown instead of a population-normalized rate) — `GeoVisProvider`
 * surfaces this as a `policy-violation` warning on an otherwise-resolved
 * result, with a `set-value` repair to the normalized alternative.
 */
export const buildPolicyViolationSpec = (): VisualizationSpec => {
  const spec = buildSpec({ variable: 'cumulative-rate', age: '65-plus' });

  return {
    ...spec,
    metadata: {
      isPolicyInvalid: true,
      invalidReason: 'raw-count-metric',
      metricField: 'population',
      normalizedField: 'populationPer1000',
      normalizedLabel: 'per 1,000 residents',
    },
  };
};

export { sidebarPreviewConfig } from './GeovisWorkspace.sidebarPreview.fixture';

/**
 * Grouped/carousel variant: a single menu whose 20+ variations are split across
 * six groups. The left sidebar shows a row of group tabs at the top and only
 * the open group's items below, so the list never needs to scroll. The
 * selection stays a single value shared across every group; `defaultValue`
 * ('renda-media') seeds it, and the carousel opens on the group that contains
 * it (Renda). Switching tabs only changes which items are visible.
 */
export const groupedWorkspaceConfig: GeovisWorkspaceConfig = {
  controls: {
    menus: [
      {
        id: 'variable',
        title: 'Variações do mapa',
        defaultValue: 'renda-media',
        groups: [
          {
            id: 'demografia',
            label: 'Demografia',
            items: [
              { value: 'pop-total', label: 'População total' },
              { value: 'densidade', label: 'Densidade demográfica' },
              { value: 'faixa-etaria', label: 'Faixa etária' },
              { value: 'crescimento', label: 'Crescimento populacional' },
              { value: 'urbano-rural', label: 'Distribuição urbano/rural' },
            ],
          },
          {
            id: 'renda',
            label: 'Renda',
            items: [
              { value: 'renda-media', label: 'Renda média' },
              { value: 'renda-mediana', label: 'Renda mediana' },
              { value: 'gini', label: 'Índice de Gini' },
              { value: 'pobreza', label: 'Taxa de pobreza' },
              { value: 'informalidade', label: 'Informalidade' },
            ],
          },
          {
            id: 'saude',
            label: 'Saúde',
            items: [
              { value: 'leitos', label: 'Leitos por mil hab.' },
              { value: 'mortalidade-infantil', label: 'Mortalidade infantil' },
              { value: 'cobertura-aps', label: 'Cobertura de atenção básica' },
              { value: 'vacinacao', label: 'Cobertura vacinal' },
              { value: 'expectativa', label: 'Expectativa de vida' },
            ],
          },
          {
            id: 'educacao',
            label: 'Educação',
            items: [
              { value: 'alfabetizacao', label: 'Taxa de alfabetização' },
              { value: 'ideb', label: 'IDEB' },
              { value: 'evasao', label: 'Evasão escolar' },
              { value: 'ensino-superior', label: 'Acesso ao ensino superior' },
              { value: 'matriculas', label: 'Matrículas por mil hab.' },
            ],
          },
          {
            id: 'trabalho',
            label: 'Trabalho e emprego',
            items: [
              { value: 'desemprego', label: 'Taxa de desemprego' },
              { value: 'ocupacao', label: 'Nível de ocupação' },
              { value: 'carteira', label: 'Emprego com carteira' },
              { value: 'rendimento', label: 'Rendimento do trabalho' },
              { value: 'jornada', label: 'Jornada média' },
            ],
          },
          {
            id: 'habitacao',
            label: 'Habitação',
            items: [
              { value: 'deficit', label: 'Déficit habitacional' },
              { value: 'saneamento', label: 'Acesso a saneamento' },
              { value: 'agua', label: 'Abastecimento de água' },
              { value: 'energia', label: 'Acesso à energia' },
              { value: 'adensamento', label: 'Adensamento excessivo' },
            ],
          },
        ],
      },
    ],
  },
  leftSidebar: { initialState: 'open' },
  rightSidebar: { title: 'Detalhes' },
};
