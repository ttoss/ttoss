import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  type RepairOption,
  useGeoVis,
  type VisualizationSpec,
} from '@ttoss/geovis';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  getInitialSelection,
} from '@ttoss/geovis-workspace';
import { Box, Button, Flex, Text } from '@ttoss/ui';
import * as React from 'react';

/**
 * Workspace config. The left sidebar exposes two menu groups whose selection
 * drives the choropleth: `variable` picks the metric (and its color scale),
 * `age` picks the cohort whose values are rendered.
 */
const workspaceConfig: GeovisWorkspaceConfig = {
  controls: {
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
  controls: workspaceConfig.controls,
  rightSidebar: { title: 'POPULAÇÃO 65+ COMO % DA POPULAÇÃO TOTAL' },
  legend: {
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
};

/**
 * Custom `controls` slot panel that replaces the default menu list. Reads the
 * live spec through `useGeoVis()` — the same runtime access the default panel
 * gets — to show it is not limited to config-driven content.
 */
const CustomControlsPanel = () => {
  const { spec } = useGeoVis();

  return (
    <Box sx={{ paddingX: '2' }}>
      <Text sx={{ fontSize: 'sm', color: 'display.text.primary.default' }}>
        This map has {spec.layers.length} layer(s).
      </Text>
    </Box>
  );
};

/**
 * Variant whose `controls` slot is overridden with a custom component instead
 * of the config-driven menu list, demonstrating slot override (ADR-0002).
 */
const customControlsConfig: GeovisWorkspaceConfig = {
  slots: { controls: { component: CustomControlsPanel } },
  rightSidebar: workspaceConfig.rightSidebar,
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

/**
 * A layer whose `mapDataId` matches no `mapData` entry — `@ttoss/geovis`'s
 * own validation rejects this with a real `unknown-map-data-id` failure
 * (mismatch), carrying an `allowed-values` repair listing the real id.
 */
const buildBrokenSpec = (): VisualizationSpec => {
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
const buildPolicyViolationSpec = (): VisualizationSpec => {
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
 * sources declared in the config (`legend`), plus the map's own runtime-
 * resolved legend swatches — no hand-authored duplicate of what the spec
 * already resolves. Switching the variable changes the map's active legend,
 * and the sidebar's swatches follow with no config edit. Open
 * the details panel to see it.
 */
export const WithColorLegend: Story = {
  render: () => {
    return <WorkspaceStory config={legendWorkspaceConfig} />;
  },
};

/**
 * Only the `controls` slot has content — the right sidebar and its button are
 * absent, since none of its slots (legend/warnings/inspector/metadata) do.
 */
export const LeftSidebarOnly: Story = {
  render: () => {
    return <WorkspaceStory config={{ controls: workspaceConfig.controls }} />;
  },
};

/**
 * The `controls` slot renders a custom component instead of the default menu
 * list (`config.slots.controls.component`), while still reading the live
 * GeoVis spec through `useGeoVis()` — the same runtime access the default
 * panel it replaces gets.
 */
export const CustomControlsOverride: Story = {
  render: () => {
    return <WorkspaceStory config={customControlsConfig} />;
  },
};

const BROKEN_MAP_DATA_PATH = 'layers[regions-fill].mapDataId';

/**
 * Toggles between a working spec and `buildBrokenSpec()`'s failing one, so
 * the story demonstrates a real failure *after* a successful resolve: the
 * map keeps showing the last good spec while the warnings panel lists the
 * new issue. `onRepair` applies the chosen `set-value` back onto the layer,
 * the same delegation shape `onVariableChange` already uses.
 */
const BlockingFailureAfterResolveStory = () => {
  const [mapDataId, setMapDataId] = React.useState('choropleth');

  const visualizationSpec = React.useMemo(() => {
    const spec = buildSpec({ variable: 'cumulative-rate', age: '65-plus' });
    return {
      ...spec,
      layers: spec.layers.map((layer) => {
        return { ...layer, mapDataId };
      }),
    };
  }, [mapDataId]);

  const handleRepair = (repair: RepairOption) => {
    if (repair.kind === 'set-value' && repair.path === BROKEN_MAP_DATA_PATH) {
      setMapDataId(String(repair.value));
    }
  };

  return (
    <Flex sx={{ flexDirection: 'column', gap: '3' }}>
      <Button
        type="button"
        onClick={() => {
          setMapDataId((current) => {
            return current === 'choropleth' ? 'does-not-exist' : 'choropleth';
          });
        }}
      >
        {mapDataId === 'choropleth'
          ? 'Break the map data reference'
          : 'Fix the map data reference'}
      </Button>

      <GeovisWorkspace
        config={workspaceConfig}
        visualizationSpec={visualizationSpec}
        onRepair={handleRepair}
      />
    </Flex>
  );
};

/**
 * A failure after a successful mount: the map keeps the last good spec
 * visible while the warnings panel lists the `unknown-map-data-id` issue,
 * with an `allowed-values` repair. Click "Break the map data reference" to
 * trigger it, then use the repair button to fix it via `onRepair`.
 */
export const BlockingFailureAfterResolve: Story = {
  render: () => {
    return <BlockingFailureAfterResolveStory />;
  },
};

/**
 * A failure on first mount, before anything has ever resolved: the `map`
 * slot shows a repair-affordance empty state instead of an uninitialized
 * canvas, since there is no "last good spec" yet to fall back to.
 */
export const ColdStartFailure: Story = {
  render: () => {
    return (
      <GeovisWorkspace
        config={workspaceConfig}
        visualizationSpec={buildBrokenSpec()}
      />
    );
  },
};

/**
 * A resolved result that still carries a non-blocking warning: the spec's
 * `metadata` flags a cartography policy violation, surfaced by the
 * `warnings` slot as a `'warning'`-severity issue with a `set-value` repair
 * to the normalized alternative — the map renders normally throughout.
 */
export const ResolvedWithWarnings: Story = {
  render: () => {
    return (
      <GeovisWorkspace
        config={workspaceConfig}
        visualizationSpec={buildPolicyViolationSpec()}
      />
    );
  },
};

/**
 * Click any region on the map to select it — the `inspector` slot's default
 * panel (right sidebar) shows the layer, its bound value, and the feature
 * id. Dismiss the selection via the panel's own close button, pressing
 * Escape, or clicking empty space on the map: all three clear the same
 * `useGeoVisClick()` selection (and its highlight on the map) at once.
 */
export const InspectFeature: Story = {
  render: () => {
    return <WorkspaceStory config={workspaceConfig} />;
  },
};
