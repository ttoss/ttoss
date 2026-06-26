// Public contract smoke tests — verifies the package index exports the expected symbols.
import type {
  ColorBy,
  LabelFormatSpec,
  LegendSpec,
  NormalizationSpec,
  VisualizationLayer,
  VisualizationSpec,
} from 'src/index';
import * as geovis from 'src/index';

test('package exports expected public symbols', () => {
  expect(typeof geovis.GeoVisProvider).toBe('function');
  expect(typeof geovis.GeoVisCanvas).toBe('function');
  expect(typeof geovis.useGeoVis).toBe('function');
  expect(typeof geovis.useGeoVisHover).toBe('function');
  expect(typeof geovis.useGeoVisClick).toBe('function');
  expect(typeof geovis.validateSpec).toBe('function');
  expect(typeof geovis.useMapData).toBe('function');
  // Boundary group factory and helpers
  expect(typeof geovis.createBoundaryGroup).toBe('function');
  expect(typeof geovis.appendBoundaryGroup).toBe('function');
  expect(typeof geovis.toggleBoundaryGroup).toBe('function');
  expect(typeof geovis.customizeBoundaryGroup).toBe('function');
  expect(typeof geovis.useBoundaryToggle).toBe('function');
  // createRuntime
  expect(typeof geovis.createRuntime).toBe('function');
});

test('spec types expose legend configuration through the public contract', () => {
  const colorBy: ColorBy = {
    type: 'categorical',
    property: 'status',
    colors: ['#0b7285', '#f08c00'],
  };

  const labelFormat: LabelFormatSpec = {
    type: 'count',
    abbreviate: true,
    extended: true,
  };

  const normalization: NormalizationSpec = {
    type: 'raw',
    numeratorLabel: 'inhabitants',
  };

  const legend: LegendSpec = {
    id: 'status-legend',
    title: 'Status',
    colorBy,
    labelFormat,
    normalization,
    reference: 'Data: Census Bureau 2020',
    noDataLabel: 'No data',
    position: 'bottom-right',
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
  expect(spec.legends?.[0].title).toBe('Status');
  expect(spec.legends?.[0].reference).toBe('Data: Census Bureau 2020');
  expect(spec.legends?.[0].noDataLabel).toBe('No data');
  expect(spec.legends?.[0].position).toBe('bottom-right');
  expect(spec.layers[0].activeLegendId).toBe('status-legend');
});

test("LabelFormatSpec 'labels' variant is part of the public contract", () => {
  const labelFormat: LabelFormatSpec = {
    type: 'labels',
    labels: ['Low', 'Medium', 'High'],
    extended: false,
  };

  const legend: LegendSpec = {
    id: 'category-legend',
    colorBy: { type: 'quantitative', property: 'value', scale: 'threshold' },
    labelFormat,
  };

  expect(legend.labelFormat).toEqual({
    type: 'labels',
    labels: ['Low', 'Medium', 'High'],
    extended: false,
  });
});
