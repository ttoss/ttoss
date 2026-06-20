import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisLegend, GeoVisProvider } from '@ttoss/geovis';

export default {
  title: 'GeoVis/Fixtures/SteppedProportionalCircles',
  tags: ['autodocs'],
} as Meta;

const CITIES_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [139.6917, 35.6895] },
      properties: { cityId: 'tokyo', name: 'Tokyo', population: 13_960_000 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [77.209, 28.6139] },
      properties: { cityId: 'delhi', name: 'Delhi', population: 11_030_000 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [121.4737, 31.2304] },
      properties: {
        cityId: 'shanghai',
        name: 'Shanghai',
        population: 24_870_000,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-46.6333, -23.5505] },
      properties: {
        cityId: 'sao-paulo',
        name: 'São Paulo',
        population: 12_330_000,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-99.1332, 19.4326] },
      properties: {
        cityId: 'mexico-city',
        name: 'Mexico City',
        population: 9_210_000,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [31.2357, 30.0444] },
      properties: { cityId: 'cairo', name: 'Cairo', population: 9_540_000 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-0.1276, 51.5074] },
      properties: { cityId: 'london', name: 'London', population: 8_982_000 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-74.006, 40.7128] },
      properties: {
        cityId: 'new-york',
        name: 'New York',
        population: 8_336_000,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.5018, 13.7563] },
      properties: {
        cityId: 'bangkok',
        name: 'Bangkok',
        population: 10_540_000,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-58.3816, -34.6037] },
      properties: {
        cityId: 'buenos-aires',
        name: 'Buenos Aires',
        population: 3_070_000,
      },
    },
  ],
};

const spec: VisualizationSpec = {
  id: 'stepped-proportional-circles',
  title: 'Stepped Proportional Circles',
  description:
    'Cities sized by population using stepped mode. Each bin gets a fixed radius — no interpolation between thresholds.',
  engine: 'maplibre',
  basemap: { styleUrl: 'https://tiles.openfreemap.org/styles/bright' },
  sources: [
    {
      id: 'cities',
      type: 'geojson',
      data: CITIES_GEOJSON,
    },
  ],
  mapData: [
    {
      mapDataId: 'population',
      mapId: 'cities',
      stateKey: 'population',
      joinKey: 'cityId',
      dimension: 'size',
      data: CITIES_GEOJSON.features.map((f) => {
        return {
          geometryId: (f.properties?.cityId as string) ?? '',
          value: (f.properties?.population as number) ?? 0,
        };
      }),
    },
  ],
  legends: [
    {
      id: 'pop-legend',
      title: 'Population',
      labelFormat: {
        type: 'labels',
        labels: ['< 5M', '5M – 10M', '10M – 15M', '> 15M'],
      },
      colorBy: {
        type: 'quantitative',
        property: 'population',
        scale: 'threshold',
        thresholds: [5_000_000, 10_000_000, 15_000_000],
        colors: ['#fee5d9', '#fcae91', '#fb6a4a', '#cb181d'],
        defaultColor: '#9ca3af',
      },
    },
  ],
  layers: [
    {
      id: 'cities-points',
      sourceId: 'cities',
      geometry: 'point',
      activeLegendId: 'pop-legend',
      paint: { circleStrokeColor: '#ffffff', circleStrokeWidth: 1.5 },
      sizeBy: {
        range: [6, 28],
        mode: 'stepped',
        thresholds: [5_000_000, 10_000_000, 15_000_000],
      },
      hoverPaint: { lineColor: '#333333', lineWidth: 2 },
      clickAnchor: { color: '#2171b5' },
    },
  ],
};

export const SteppedProportionalCircles: StoryFn = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <GeoVisProvider spec={spec}>
        <div
          style={{
            position: 'relative',
            height: 520,
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
        <GeoVisLegend legendId="pop-legend" />
      </GeoVisProvider>
      <div style={{ fontSize: 13, color: '#666' }}>
        <strong>Key difference from continuous mode:</strong> Each threshold bin
        receives a fixed radius linearly spaced across [6px, 28px]. There is no
        interpolation — cities with 9M and 5.1M get the same radius since they
        fall in the same bin.
      </div>
    </div>
  );
};
