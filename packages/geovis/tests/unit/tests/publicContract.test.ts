// Public contract smoke tests — verifies the package index exports the expected symbols.
import type {
  ColorBy,
  LegendSpec,
  VisualizationLayer,
  VisualizationSpec,
} from 'src/index';
import * as geovis from 'src/index';

test('package exports expected public symbols', () => {
  expect(typeof geovis.GeoVisProvider).toBe('function');
  expect(typeof geovis.GeoVisCanvas).toBe('function');
  expect(typeof geovis.useGeoVis).toBe('function');
  expect(typeof geovis.validateSpec).toBe('function');
  // 5.1: useMapData is part of the public contract
  expect(typeof geovis.useMapData).toBe('function');
});

test('spec types expose legend configuration through the public contract', () => {
  const colorBy: ColorBy = {
    type: 'categorical',
    property: 'status',
    colors: ['#0b7285', '#f08c00'],
  };

  const legend: LegendSpec = {
    id: 'status-legend',
    label: 'Status',
    colorBy,
  };

  const layer: VisualizationLayer = {
    id: 'regions',
    sourceId: 'regions-source',
    geometry: 'polygon',
    colorBy,
    legends: [legend],
    activeLegendId: legend.id,
  };

  const spec: VisualizationSpec = {
    id: 'legend-spec',
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    sources: [],
    layers: [layer],
    legends: [legend],
  };

  expect(spec.legends?.[0].id).toBe('status-legend');
  expect(spec.layers[0].activeLegendId).toBe('status-legend');
});
