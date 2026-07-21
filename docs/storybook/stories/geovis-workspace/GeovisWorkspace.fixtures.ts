import type { VisualizationSpec } from '@ttoss/geovis';

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
