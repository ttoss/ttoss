import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  VisualizationSpec,
} from '@ttoss/geovis';

import { GeoVisFixtureStory } from './GeoVisFixtureStory';
import { computeBbox } from './helpers/map-story-helpers';

/**
 * Demonstrates the **spec-driven hover tooltip**: the tooltip is declared
 * inline on the layer via `hoverTooltip`, so `<GeoVisProvider>` renders a
 * `<GeoVisHoverTooltip>` automatically. Note that `GeoVisFixtureStory` mounts
 * only `<GeoVisProvider>` + `<GeoVisCanvas>` — there is **no** tooltip
 * component in the tree; the floating box comes entirely from the spec.
 */
export default {
  title: 'GeoVis/SpecDrivenHoverTooltip',
  tags: ['autodocs'],
} as Meta;

const districts: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'centro',
      properties: { name: 'Centro' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-46.65, -23.56],
            [-46.61, -23.56],
            [-46.61, -23.52],
            [-46.65, -23.52],
            [-46.65, -23.56],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'zona-sul',
      properties: { name: 'Zona Sul' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-46.61, -23.56],
            [-46.57, -23.56],
            [-46.57, -23.52],
            [-46.61, -23.52],
            [-46.61, -23.56],
          ],
        ],
      },
    },
  ],
};

const districtNames: Record<string, string> = {
  centro: 'Centro',
  'zona-sul': 'Zona Sul',
};

const formatPopulation = (value: number | string): string => {
  return typeof value === 'number'
    ? new Intl.NumberFormat('pt-BR').format(value)
    : String(value);
};

const spec: VisualizationSpec = {
  id: 'spec-driven-hover-tooltip',
  title: 'Spec-driven hover tooltip',
  description:
    'Hover a district: the tooltip is configured entirely through ' +
    '`layer.hoverTooltip` — no <GeoVisHoverTooltip> in the JSX.',
  engine: 'maplibre',
  basemap: { visible: false },
  sources: [
    {
      id: 'districts',
      type: 'geojson',
      data: districts,
    },
  ],
  layers: [
    {
      id: 'districts-fill',
      sourceId: 'districts',
      geometry: 'polygon',
      mapDataId: 'population',
      activeLegendId: 'population',
      hoverPaint: { lineColor: '#1a1a1a', lineWidth: 2 },
      // The whole tooltip lives here — render and offset. No `formatValue`
      // is needed because `render` formats the value itself.
      hoverTooltip: {
        offset: { x: 14, y: 14 },
        render: (info) => {
          return (
            <div>
              <div style={{ fontWeight: 600 }}>
                {districtNames[String(info.featureId)] ??
                  `Feature #${String(info.featureId)}`}
              </div>
              <div>
                {typeof info.value === 'number'
                  ? `${formatPopulation(info.value)} inhabitants`
                  : 'No data'}
              </div>
            </div>
          );
        },
      },
    },
  ],
  legends: [
    {
      id: 'population',
      label: 'Population',
      colorBy: {
        type: 'quantitative',
        property: 'population',
        scale: 'threshold',
        thresholds: [400_000],
        colors: ['#bfdbfe', '#1d4ed8'],
        defaultColor: '#bfdbfe',
      },
    },
  ],
  mapData: [
    {
      mapDataId: 'population',
      mapId: 'districts',
      data: [
        { geometryId: 'centro', value: 380_000 },
        { geometryId: 'zona-sul', value: 620_000 },
      ],
    },
  ],
};

const bbox = computeBbox(districts as GeoJSON.FeatureCollection);

/**
 * Default story — hover either polygon to see the spec-configured tooltip.
 */
export const SpecDrivenHoverTooltip: StoryFn = () => {
  return <GeoVisFixtureStory spec={spec} bbox={bbox} />;
};
