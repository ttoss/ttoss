import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type VisualizationSpec } from '@ttoss/geovis';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  getInitialSelection,
} from '@ttoss/geovis-workspace';
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
 * description, a swatch-per-class legend and linked data sources — entirely
 * declared in the config via `rightSidebar.legendWithColor`.
 */
const legendWorkspaceConfig: GeovisWorkspaceConfig = {
  leftSidebar: workspaceConfig.leftSidebar,
  rightSidebar: {
    title: 'POPULAÇÃO 65+ COMO % DA POPULAÇÃO TOTAL',
    legendWithColor: {
      description:
        'Proporção da população total do distrito com 65 anos ou mais.',
      legend: {
        title: 'Classes',
        items: [
          { color: '#eff3ff', label: '0% - 5%' },
          { color: '#bdd7e7', label: '5% - 10%' },
          { color: '#6baed6', label: '10% - 15%' },
          { color: '#3182bd', label: '15% - 20%' },
          { color: '#08519c', label: '20% - 100%' },
        ],
      },
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
 * recolors the map in place.
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
    layers: [
      {
        id: 'regions-fill',
        sourceId: 'regions',
        geometry: 'polygon',
        mapDataId: 'choropleth',
        activeLegendId: variable,
        paint: { fillOpacity: 0.78, lineColor: '#1f2937' },
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
 * The right sidebar hosts a full color-legend panel declared in the config
 * (`rightSidebar.legendWithColor`): description, class swatches and linked data
 * sources. Open the details panel to see it.
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
