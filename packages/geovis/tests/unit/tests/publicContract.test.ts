// Public contract smoke tests — verifies the package index exports the expected symbols.
import type {
  ColorBy,
  ContextPacket,
  GeoVisAction,
  GeoVisIssue,
  GeoVisIssueCode,
  GeoVisResult,
  LabelFormatSpec,
  LayerFilter,
  LegendSpec,
  NormalizationSpec,
  RepairOption,
  ViewPreset,
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
  expect(typeof geovis.useDismissGeoVisClick).toBe('function');
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
  // GeoVisResult taxonomy (PRD-001 / ADR-0001)
  expect(typeof geovis.ISSUE_CODE_STATUS).toBe('object');
  expect(typeof geovis.resolveOverallStatus).toBe('function');
  // Action surface and context packet (PRD-002 / ADR-0003 / ADR-0004)
  expect(typeof geovis.CONTEXT_PACKET_SCHEMA_VERSION).toBe('number');
});

test('GeoVisAction and ContextPacket types are part of the public contract', () => {
  const action: GeoVisAction = {
    type: 'toggle-layer',
    layerId: 'lyr-1',
    rationale: 'user hid the layer',
  };
  expect(action.type).toBe('toggle-layer');

  const packet: ContextPacket = {
    schemaVersion: geovis.CONTEXT_PACKET_SCHEMA_VERSION,
    sources: [{ id: 'src-1', type: 'geojson' }],
    layers: [{ id: 'lyr-1', geometry: 'polygon', visible: true }],
    legends: [],
    selection: null,
    allowedActions: ['toggle-layer', 'select-feature'],
    warnings: [],
    lastResult: {
      status: 'resolved',
      spec: { engine: 'maplibre', sources: [], layers: [] },
      warnings: [],
    },
  };
  expect(packet.allowedActions).toEqual(['toggle-layer', 'select-feature']);
});

test('SelectFeatureAction and GeoVisSelection are part of the public contract', () => {
  const selectAction: GeoVisAction = {
    type: 'select-feature',
    layerId: 'lyr-1',
    featureId: 'BR',
  };
  const clearAction: GeoVisAction = {
    type: 'select-feature',
    layerId: 'lyr-1',
    featureId: null,
  };
  expect(selectAction.type).toBe('select-feature');
  expect(clearAction.type).toBe('select-feature');
});

test('SetMapDataAction is part of the public contract', () => {
  const action: GeoVisAction = {
    type: 'set-map-data',
    layerId: 'lyr-1',
    mapDataId: 'pop-2020',
    rationale: 'AI switched to the 2020 census dataset',
  };
  expect(action.type).toBe('set-map-data');
});

test('SetFilterAction and LayerFilter are part of the public contract', () => {
  const filter: LayerFilter = {
    property: 'status',
    operator: 'eq',
    value: 'active',
  };
  const setAction: GeoVisAction = {
    type: 'set-filter',
    layerId: 'lyr-1',
    filter,
  };
  const clearAction: GeoVisAction = {
    type: 'set-filter',
    layerId: 'lyr-1',
    filter: null,
  };
  expect(setAction.type).toBe('set-filter');
  expect(clearAction.type).toBe('set-filter');

  const layer: VisualizationLayer = {
    id: 'regions',
    sourceId: 'regions-source',
    geometry: 'polygon',
    filter,
  };
  expect(layer.filter).toEqual(filter);
});

test('SetViewPresetAction and ViewPreset are part of the public contract', () => {
  const preset: ViewPreset = {
    id: 'overview',
    label: 'Overview',
    view: { center: [0, 0], zoom: 2 },
  };
  const action: GeoVisAction = {
    type: 'set-view-preset',
    presetId: preset.id,
    rationale: 'AI zoomed out to the overview',
  };
  expect(action.type).toBe('set-view-preset');

  const spec: VisualizationSpec = {
    engine: 'maplibre',
    sources: [],
    layers: [],
    viewPresets: [preset],
  };
  expect(spec.viewPresets?.[0].id).toBe('overview');
});

test('GeoVisResult taxonomy types are part of the public contract', () => {
  const repair: RepairOption = {
    kind: 'allowed-values',
    path: 'mapData[pop].mapId',
    values: ['states'],
  };

  const issue: GeoVisIssue = {
    code: 'unknown-source' satisfies GeoVisIssueCode,
    subject: { path: 'mapData[pop].mapId', id: 'pop' },
    message: "mapData 'pop' references unknown source mapId 'does-not-exist'",
    repair: [repair],
  };

  const result: GeoVisResult = { status: 'mismatch', issues: [issue] };

  expect(result.status).toBe('mismatch');
  if (result.status !== 'resolved') {
    expect(result.issues[0].code).toBe('unknown-source');
  }
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
