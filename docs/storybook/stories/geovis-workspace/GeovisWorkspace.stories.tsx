import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type VisualizationSpec } from '@ttoss/geovis';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  getInitialSelection,
} from '@ttoss/geovis-workspace';
import { Box, Flex, Text } from '@ttoss/ui';
import * as React from 'react';

/**
 * Workspace config. The left sidebar exposes two menu groups whose selection
 * drives the choropleth: `variable` picks the metric (and its color scale),
 * `age` picks the cohort whose values are rendered.
 */
const workspaceConfig: GeovisWorkspaceConfig = {
  leftSidebar: {
    menus: [
      {
        id: 'variable',
        title: 'Variável',
        defaultValue: 'cumulative-rate',
        items: [
          { value: 'cumulative-rate', label: 'taxa cumulativa (% do total)' },
          {
            value: 'cumulative-proportion',
            label: 'proporção cumulativa (% da pop 65+)',
          },
          { value: 'range', label: 'faixa (% da pop 65+)' },
        ],
      },
      {
        id: 'age',
        title: 'Faixa etária',
        defaultValue: '65-plus',
        items: [
          { value: '65-plus', label: '65 anos ou mais' },
          { value: '70-plus', label: '70 anos ou mais' },
          { value: '75-plus', label: '75 anos ou mais' },
        ],
      },
    ],
  },
  rightSidebar: { title: 'Detalhes' },
};

/**
 * Variant whose right sidebar carries a full color-legend panel — title,
 * description, the map's own runtime-resolved legend and linked data sources.
 * The legend swatches come from `visualizationSpec.legends`, not from this
 * config, so they stay in sync with the map by construction.
 */
const legendWorkspaceConfig: GeovisWorkspaceConfig = {
  leftSidebar: workspaceConfig.leftSidebar,
  rightSidebar: {
    title: 'POPULAÇÃO 65+ COMO % DA POPULAÇÃO TOTAL',
    legendWithColor: {
      description:
        'Proporção da população total do distrito com 65 anos ou mais.',
      sources: {
        title: 'Fonte dos dados:',
        items: [
          {
            label: 'Projeções populacionais por sexo e idade do SEADE (2025)',
            href: 'https://repositorio.seade.gov.br/dataset/populacao-residente-municipio-de-sao-paulo-evolucao',
          },
          { label: 'Geometria: Distritos Municipais de São Paulo.' },
        ],
      },
    },
  },
};

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
  { max: number; thresholds: number[]; colors: string[] }
> = {
  'cumulative-rate': {
    max: 28,
    thresholds: [5, 10, 15, 20],
    colors: ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'],
  },
  'cumulative-proportion': {
    max: 58,
    thresholds: [10, 20, 30, 45],
    colors: ['#edf8e9', '#bae4b3', '#74c476', '#31a354', '#006d2c'],
  },
  range: {
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
const buildSpec = ({
  variable,
  age,
}: {
  variable: string;
  age: string;
}): VisualizationSpec => {
  const variableConfig = VARIABLES[variable] ?? VARIABLES['cumulative-rate'];
  const ageFactor = AGE_FACTORS[age] ?? 1;

  return {
    id: 'geovis-workspace-choropleth',
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

interface RegionDetailsData {
  name: string;
  description: string;
  population: number;
  status: 'Atualizado' | 'Pendente';
}

/**
 * Simulates an API call: resolves the clicked region's details after a short
 * delay, so the workspace shows its loading state before the data arrives.
 */
const fetchRegionDetails = (
  featureId: string | number
): Promise<RegionDetailsData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const region = REGIONS.find((item) => {
        return item.id === Number(featureId);
      });

      const intensity = region?.intensity ?? 0.5;

      resolve({
        name: region?.name ?? `Região ${featureId}`,
        description: `Recorte sintético usado para demonstrar o carregamento sob demanda dos detalhes de ${
          region?.name ?? 'uma região'
        }.`,
        population: Math.round(intensity * 1_200_000),
        status: Number(featureId) % 2 === 0 ? 'Pendente' : 'Atualizado',
      });
    }, 600);
  });
};

/** App-owned panel that renders the fetched region details. */
const RegionDetailsPanel = ({
  name,
  description,
  population,
  status,
}: RegionDetailsData) => {
  return (
    <Flex sx={{ flexDirection: 'column', gap: '3' }}>
      <Text sx={{ fontSize: 'md', fontWeight: 'bold', color: '#111827' }}>
        {name}
      </Text>
      <Text sx={{ fontSize: 'sm', color: '#374151', lineHeight: 'base' }}>
        {description}
      </Text>
      <Flex sx={{ alignItems: 'center', gap: '2' }}>
        <Text sx={{ fontSize: 'sm', color: '#6b7280' }}>População:</Text>
        <Text sx={{ fontSize: 'sm', fontWeight: 'semibold', color: '#111827' }}>
          {population.toLocaleString('pt-BR')}
        </Text>
      </Flex>
      <Box
        sx={{
          alignSelf: 'flex-start',
          paddingX: '2',
          paddingY: '1',
          borderRadius: 'full',
          fontSize: 'xs',
          fontWeight: 'semibold',
          color: status === 'Atualizado' ? '#166534' : '#92400e',
          backgroundColor: status === 'Atualizado' ? '#dcfce7' : '#fef3c7',
        }}
      >
        {status}
      </Box>
    </Flex>
  );
};

/**
 * Variant whose right sidebar loads details on demand: clicking a region calls
 * `rightSidebar.onFeatureSelect` (a simulated API request), auto-opens the
 * sidebar, and renders the result via `rightSidebar.renderDetails`. The
 * workspace tracks the loading/error state for the app.
 */
const featureDetailsWorkspaceConfig: GeovisWorkspaceConfig = {
  leftSidebar: workspaceConfig.leftSidebar,
  rightSidebar: {
    title: 'Detalhes da região',
    onFeatureSelect: (info) => {
      return fetchRegionDetails(info.featureId);
    },
    renderDetails: ({ loading, error, data }) => {
      if (loading) {
        return (
          <Text sx={{ fontSize: 'sm', color: '#6b7280' }}>Carregando…</Text>
        );
      }

      if (error) {
        return (
          <Text sx={{ fontSize: 'sm', color: '#b91c1c' }}>
            Não foi possível carregar os detalhes.
          </Text>
        );
      }

      if (!data) {
        return (
          <Text sx={{ fontSize: 'sm', color: '#6b7280' }}>
            Clique numa região no mapa para ver os detalhes.
          </Text>
        );
      }

      return <RegionDetailsPanel {...(data as RegionDetailsData)} />;
    },
  },
};

/**
 * Drives the workspace: holds the selection state, derives the GeoVis spec from
 * it via `buildSpec`, and feeds both back into `GeovisWorkspace`. Picking a
 * menu item updates the selection, rebuilds the spec, and recolors the map.
 */
const WorkspaceStory = ({ config }: { config: GeovisWorkspaceConfig }) => {
  const [selection, setSelection] = React.useState(() => {
    return getInitialSelection({ config });
  });

  const visualizationSpec = React.useMemo(() => {
    return buildSpec({
      variable: selection.variable ?? 'cumulative-rate',
      age: selection.age ?? '65-plus',
    });
  }, [selection]);

  return (
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpec}
      variables={selection}
      onVariableChange={setSelection}
    />
  );
};

const meta: Meta<typeof GeovisWorkspace> = {
  title: 'Geovis Workspace/GeovisWorkspace',
  component: GeovisWorkspace,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Composes a left sidebar (menu groups), a GeoVis map in the main area, and an optional right sidebar — the sidebars driven by `config` and the map driven by `visualizationSpec`. The parent owns the selection state and derives the next `visualizationSpec` from it, so picking a variable or an age range recolors the map live.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof GeovisWorkspace>;

/**
 * End-to-end integration: the workspace selection drives a real GeoVis
 * choropleth. Selecting a variable switches the color scale; selecting an age
 * range rescales the region values. The right sidebar summarizes the selection.
 */
export const Default: Story = {
  render: () => {
    return <WorkspaceStory config={workspaceConfig} />;
  },
};

/**
 * The right sidebar hosts a full color-legend panel: a description and data
 * sources declared in the config (`rightSidebar.legendWithColor`), plus the
 * map's own runtime-resolved legend swatches — no hand-authored duplicate of
 * what the spec already resolves. Switching the variable changes the map's
 * active legend, and the sidebar's swatches follow with no config edit. Open
 * the details panel to see it.
 */
export const WithColorLegend: Story = {
  render: () => {
    return <WorkspaceStory config={legendWorkspaceConfig} />;
  },
};

/**
 * Only the left sidebar is defined — the right sidebar and its button are absent.
 */
export const LeftSidebarOnly: Story = {
  render: () => {
    return (
      <WorkspaceStory config={{ leftSidebar: workspaceConfig.leftSidebar }} />
    );
  },
};

/**
 * Click-to-load details: clicking a region on the map fires
 * `rightSidebar.onFeatureSelect` (a simulated API request), the right sidebar
 * opens automatically, and the fetched data is rendered through
 * `rightSidebar.renderDetails` — showing a loading state first, then the
 * region's details.
 */
export const WithFeatureDetails: Story = {
  render: () => {
    return <WorkspaceStory config={featureDetailsWorkspaceConfig} />;
  },
};
