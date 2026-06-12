import {
  appendBoundaryGroup,
  createBoundaryGroup,
  customizeBoundaryGroup,
  toggleBoundaryGroup,
} from 'src/spec/boundaryGroup';
import type { VisualizationSpec } from 'src/spec/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const STATES_URL = 'https://example.com/estados.geojson';
const DISTRICTS_URL = 'https://example.com/distritos.geojson';

const statesGroup = createBoundaryGroup({
  id: 'brazil-states',
  data: STATES_URL,
  paint: { lineColor: '#374151', lineWidth: 1.5 },
});

const municipalitiesGroup = createBoundaryGroup({
  id: 'brazil-municipalities',
  data: DISTRICTS_URL,
  paint: { lineColor: '#d1d5db', lineWidth: 0.5 },
});

const emptySpec: VisualizationSpec = {
  id: 'test',
  engine: 'maplibre',
  sources: [],
  layers: [],
};

// ===========================================================================
// createBoundaryGroup
// ===========================================================================

describe('createBoundaryGroup', () => {
  test('creates source with correct id, type, and data', () => {
    const group = createBoundaryGroup({ id: 'src', data: STATES_URL });
    expect(group.sources).toHaveLength(1);
    expect(group.sources[0]).toEqual({
      id: 'src',
      type: 'geojson',
      data: STATES_URL,
    });
  });

  test('creates line layer with default paint', () => {
    const group = createBoundaryGroup({ id: 'src', data: STATES_URL });
    expect(group.layers).toHaveLength(1);
    expect(group.layers[0]).toEqual({
      id: 'src-line',
      sourceId: 'src',
      geometry: 'line',
      paint: { lineColor: '#6b7280', lineWidth: 1 },
    });
  });

  test('uses custom layerId when provided', () => {
    const group = createBoundaryGroup({
      id: 'src',
      data: STATES_URL,
      layerId: 'my-layer',
    });
    expect(group.layers[0].id).toBe('my-layer');
  });

  test('applies custom paint overrides', () => {
    const group = createBoundaryGroup({
      id: 'src',
      data: STATES_URL,
      paint: { lineColor: '#ef4444', lineWidth: 3 },
    });
    expect(group.layers[0].paint).toEqual({
      lineColor: '#ef4444',
      lineWidth: 3,
    });
  });

  test('accepts inline GeoJSON data', () => {
    const geojson = {
      type: 'FeatureCollection' as const,
      features: [],
    };
    const group = createBoundaryGroup({ id: 'inline', data: geojson });
    expect(group.sources[0].data).toBe(geojson);
  });
});

// ===========================================================================
// appendBoundaryGroup
// ===========================================================================

describe('appendBoundaryGroup', () => {
  test('appends sources and layers to an empty spec', () => {
    const result = appendBoundaryGroup(emptySpec, statesGroup);
    expect(result.sources).toHaveLength(1);
    expect(result.layers).toHaveLength(1);
    expect(result.sources[0].id).toBe('brazil-states');
    expect(result.layers[0].id).toBe('brazil-states-line');
  });

  test('does not mutate the original spec', () => {
    const original: VisualizationSpec = {
      ...emptySpec,
      sources: [
        {
          id: 'existing',
          type: 'geojson' as const,
          data: 'https://example.com/existing.geojson',
        },
      ],
      layers: [
        {
          id: 'existing-layer',
          sourceId: 'existing',
          geometry: 'line' as const,
        },
      ],
    };
    const snap = {
      sources: original.sources.length,
      layers: original.layers.length,
    };

    appendBoundaryGroup(original, statesGroup);

    expect(original.sources).toHaveLength(snap.sources);
    expect(original.layers).toHaveLength(snap.layers);
  });

  test('preserves existing sources and layers', () => {
    const specWithData: VisualizationSpec = {
      ...emptySpec,
      sources: [
        {
          id: 'existing',
          type: 'geojson' as const,
          data: 'https://example.com/existing.geojson',
        },
      ],
      layers: [
        {
          id: 'existing-layer',
          sourceId: 'existing',
          geometry: 'polygon' as const,
        },
      ],
    };
    const result = appendBoundaryGroup(specWithData, statesGroup);

    expect(result.sources).toHaveLength(2);
    expect(result.layers).toHaveLength(2);
    expect(result.sources[0].id).toBe('existing');
    expect(result.layers[0].id).toBe('existing-layer');
    expect(result.sources[1].id).toBe('brazil-states');
    expect(result.layers[1].id).toBe('brazil-states-line');
  });
});

// ===========================================================================
// toggleBoundaryGroup
// ===========================================================================

describe('toggleBoundaryGroup', () => {
  const specWithStates: VisualizationSpec = {
    ...emptySpec,
    sources: [...statesGroup.sources],
    layers: [...statesGroup.layers],
  };

  test('sets visible=true on matching layers', () => {
    const result = toggleBoundaryGroup(specWithStates, statesGroup, true);
    expect(result.layers[0].visible).toBeUndefined();
  });

  test('sets visible=false on matching layers', () => {
    const result = toggleBoundaryGroup(specWithStates, statesGroup, false);
    expect(result.layers[0].visible).toBe(false);
  });

  test('does not mutate the original spec', () => {
    const spec: VisualizationSpec = {
      ...emptySpec,
      sources: [...statesGroup.sources],
      layers: [{ ...statesGroup.layers[0] }],
    };

    toggleBoundaryGroup(spec, statesGroup, true);

    expect(spec.layers[0].visible).toBeUndefined();
  });

  test('does not affect non-matching layers', () => {
    const spec: VisualizationSpec = {
      ...emptySpec,
      sources: [...statesGroup.sources],
      layers: [
        ...statesGroup.layers,
        { id: 'other', sourceId: 'other', geometry: 'polygon' as const },
      ],
    };

    const result = toggleBoundaryGroup(spec, statesGroup, false);

    const otherLayer = result.layers.find((l) => {
      return l.id === 'other';
    });
    expect(otherLayer?.visible).toBeUndefined();
  });
});

// ===========================================================================
// chain appendBoundaryGroup + toggleBoundaryGroup
// ===========================================================================

describe('chain appendBoundaryGroup + toggleBoundaryGroup', () => {
  test('can append boundary group then toggle it off', () => {
    const appended = appendBoundaryGroup(emptySpec, statesGroup);
    const toggled = toggleBoundaryGroup(appended, statesGroup, false);
    expect(toggled.layers[0].visible).toBe(false);
  });
});

// ===========================================================================
// customizeBoundaryGroup
// ===========================================================================

describe('customizeBoundaryGroup', () => {
  test('overrides lineColor on all layers', () => {
    const customized = customizeBoundaryGroup(statesGroup, {
      lineColor: '#ff0000',
    });
    expect(customized.layers[0].paint).toMatchObject({
      lineColor: '#ff0000',
    });
  });

  test('overrides lineWidth on all layers', () => {
    const customized = customizeBoundaryGroup(statesGroup, {
      lineWidth: 5,
    });
    expect(customized.layers[0].paint).toMatchObject({
      lineWidth: 5,
    });
  });

  test('overrides both color and width simultaneously', () => {
    const customized = customizeBoundaryGroup(statesGroup, {
      lineColor: '#00ff00',
      lineWidth: 3,
    });
    expect(customized.layers[0].paint).toEqual({
      lineColor: '#00ff00',
      lineWidth: 3,
    });
  });

  test('preserves unoverridden paint properties', () => {
    const customized = customizeBoundaryGroup(statesGroup, {
      lineColor: '#0000ff',
    });
    expect(customized.layers[0].paint).toMatchObject({
      lineColor: '#0000ff',
      lineWidth: 1.5,
    });
  });

  test('does not mutate the original group', () => {
    const original = statesGroup;
    const originalPaint = { ...original.layers[0].paint };

    customizeBoundaryGroup(original, { lineColor: '#ff0000', lineWidth: 10 });

    expect(original.layers[0].paint).toEqual(originalPaint);
  });

  test('returns a new group object (immutable)', () => {
    const customized = customizeBoundaryGroup(statesGroup, {
      lineColor: '#ff0000',
    });
    expect(customized).not.toBe(statesGroup);
    expect(customized.layers[0]).not.toBe(statesGroup.layers[0]);
  });
});

// ===========================================================================
// Multiple groups
// ===========================================================================

describe('multiple groups', () => {
  test('can append and toggle multiple groups independently', () => {
    let spec = appendBoundaryGroup(emptySpec, statesGroup);
    spec = appendBoundaryGroup(spec, municipalitiesGroup);

    expect(spec.sources).toHaveLength(2);
    expect(spec.layers).toHaveLength(2);

    // Toggle only states off
    spec = toggleBoundaryGroup(spec, statesGroup, false);
    expect(
      spec.layers.find((l) => {
        return l.id === 'brazil-states-line';
      })?.visible
    ).toBe(false);
    expect(
      spec.layers.find((l) => {
        return l.id === 'brazil-municipalities-line';
      })?.visible
    ).toBeUndefined();
  });
});
