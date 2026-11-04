import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { HeatmapPaint, VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';

/**
 * A density heatmap of fictitious food delivery orders across São Paulo —
 * 2,660 made-up points gathered around a few hubs, only to show how the
 * layer works. Each point carries `itens`, the order's size, from `1` to `10`.
 */
export default {
  title: 'GeoVis/Heatmap',
  tags: ['autodocs'],
} as Meta;

const ORDERS_PATH = '/geovis/fictitious-delivery-orders.geojson';

const REFERENCE = 'Fictitious data';

const RAMP: HeatmapPaint['heatmapColors'] = [
  '#fde68a',
  '#f97316',
  '#dc2626',
  '#7f1d1d',
];

/** Radius and intensity grow with the zoom, so the heat stays readable. */
const BY_ZOOM: HeatmapPaint = {
  heatmapRadius: [
    [10, 6],
    [13, 18],
    [16, 40],
  ],
  heatmapIntensity: [
    [10, 0.6],
    [16, 2],
  ],
};

const buildSpec = ({
  paint,
  extraLayers = [],
  legend = true,
}: {
  paint: HeatmapPaint;
  extraLayers?: VisualizationSpec['layers'];
  legend?: boolean;
}): VisualizationSpec => {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return {
    engine: 'maplibre',
    basemap: { styleUrl: 'https://tiles.openfreemap.org/styles/positron' },
    view: { center: [-46.63, -23.6], zoom: 10 },
    sources: [
      { id: 'orders', type: 'geojson', data: `${origin}${ORDERS_PATH}` },
    ],
    layers: [
      {
        id: 'orders-heat',
        sourceId: 'orders',
        geometry: 'heatmap',
        activeLegendId: legend ? 'orders-density' : undefined,
        paint,
      },
      ...extraLayers,
    ],
    legends: legend
      ? [
          {
            id: 'orders-density',
            title: 'Delivery orders',
            position: 'bottom-right',
            reference: REFERENCE,
            colorBy: {
              type: 'density',
              lowLabel: 'Fewer orders',
              highLabel: 'More orders',
            },
          },
        ]
      : undefined,
  };
};

const HeatmapMap = ({ spec }: { spec: VisualizationSpec }) => {
  return (
    <GeoVisProvider spec={spec}>
      <div
        style={{
          position: 'relative',
          height: 560,
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid #d4d4d8',
        }}
      >
        <GeoVisCanvas
          viewId="primary"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </GeoVisProvider>
  );
};

/**
 * Density only: every order counts the same, in a four-colour ramp whose
 * radius and intensity follow the zoom. The legend reads its gradient from
 * the layer's `heatmapColors`.
 */
export const Density: StoryFn = () => {
  return (
    <HeatmapMap
      spec={buildSpec({ paint: { ...BY_ZOOM, heatmapColors: RAMP } })}
    />
  );
};

/**
 * Weighted by order size: `heatmapWeight` reads each order's `itens`, so an
 * order of `10` items weighs a full point and one of `3` under a third of one
 * — the heat gathers where the large orders go.
 */
export const WeightedByOrderSize: StoryFn = () => {
  return (
    <HeatmapMap
      spec={buildSpec({
        paint: {
          ...BY_ZOOM,
          heatmapColors: RAMP,
          heatmapWeight: { property: 'itens', max: 10 },
        },
      })}
    />
  );
};

/**
 * Heat to points: zoomed in to street level, the heat fades out between zoom
 * 14 and 16 while the orders appear as points — two layers on one source,
 * no API of their own.
 */
export const HeatToPoints: StoryFn = () => {
  return (
    <HeatmapMap
      spec={buildSpec({
        paint: {
          ...BY_ZOOM,
          heatmapColors: RAMP,
          heatmapOpacity: [
            [14, 1],
            [16, 0],
          ],
        },
        extraLayers: [
          {
            id: 'orders-points',
            sourceId: 'orders',
            geometry: 'point',
            minzoom: 14,
            paint: {
              circleColor: '#dc2626',
              circleRadius: 5,
              circleStrokeColor: '#ffffff',
              circleStrokeWidth: 1,
            },
          },
        ],
      })}
    />
  );
};

/** A named sequential palette in place of a list of colours. */
export const NamedPalette: StoryFn = () => {
  return (
    <HeatmapMap
      spec={buildSpec({ paint: { ...BY_ZOOM, heatmapColors: 'blue' } })}
    />
  );
};

/**
 * No `heatmapColors`: MapLibre's own ramp, blue through red — the legend
 * shows the same colours the map draws.
 */
export const MapLibreRamp: StoryFn = () => {
  return <HeatmapMap spec={buildSpec({ paint: BY_ZOOM })} />;
};
