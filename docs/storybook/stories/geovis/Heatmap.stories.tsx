import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { HeatmapPaint, VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';

/**
 * A density heatmap of the traffic crashes with severe or fatal victims in
 * the city of São Paulo in 2024 — 2,893 points from INFOSIGA-SP (DETRAN-SP,
 * CC BY 4.0). Each point carries `peso`: `10` for a crash with a death, `3`
 * for one with severely injured victims only.
 */
export default {
  title: 'GeoVis/Heatmap',
  tags: ['autodocs'],
} as Meta;

const CRASHES_PATH = '/geovis/infosiga-sp-2024-severe-crashes.geojson';

const REFERENCE =
  'Source: {link:INFOSIGA-SP / DETRAN-SP|https://infosiga.detran.sp.gov.br}, 2024 (CC BY 4.0)';

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
      { id: 'crashes', type: 'geojson', data: `${origin}${CRASHES_PATH}` },
    ],
    layers: [
      {
        id: 'crashes-heat',
        sourceId: 'crashes',
        geometry: 'heatmap',
        activeLegendId: legend ? 'crashes-density' : undefined,
        paint,
      },
      ...extraLayers,
    ],
    legends: legend
      ? [
          {
            id: 'crashes-density',
            title: 'Severe traffic crashes',
            position: 'bottom-right',
            reference: REFERENCE,
            colorBy: {
              type: 'density',
              lowLabel: 'Fewer crashes',
              highLabel: 'More crashes',
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
 * Density only: every crash counts the same, in a four-colour ramp whose
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
 * Weighted by severity: `heatmapWeight` reads each crash's `peso`, so a fatal
 * crash (`10`) weighs a full point and a severe one (`3`) under a third of
 * one — the heat gathers where people die.
 */
export const WeightedBySeverity: StoryFn = () => {
  return (
    <HeatmapMap
      spec={buildSpec({
        paint: {
          ...BY_ZOOM,
          heatmapColors: RAMP,
          heatmapWeight: { property: 'peso', max: 10 },
        },
      })}
    />
  );
};

/**
 * Heat to points: zoomed in to street level, the heat fades out between zoom
 * 14 and 16 while the crashes appear as points — two layers on one source,
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
            id: 'crashes-points',
            sourceId: 'crashes',
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
