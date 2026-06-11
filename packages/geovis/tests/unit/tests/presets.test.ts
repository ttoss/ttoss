import {
  appendBoundaryGroup,
  BRAZIL_MUNICIPALITY_OUTLINES,
  BRAZIL_SP_SUBPREFECTURE_OUTLINES,
  BRAZIL_STATE_OUTLINES,
  toggleBoundaryGroup,
} from 'src/spec/presets';
import type { VisualizationSpec } from 'src/spec/types';

// ---------------------------------------------------------------------------
// Inline mock GeoJSON — fixture files do not exist yet
// ---------------------------------------------------------------------------
const mockFeatureCollection = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      id: 'SP',
      properties: { name: 'São Paulo' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Expected constants derived from the spec
// ---------------------------------------------------------------------------
const PRESET = {
  municipalities: {
    sourceId: 'brazil-municipalities',
    layerId: 'brazil-municipalities-line',
    lineColor: '#d1d5db',
    lineWidth: 0.5,
  },
  states: {
    sourceId: 'brazil-states',
    layerId: 'brazil-states-line',
    lineColor: '#374151',
    lineWidth: 1.5,
  },
  subprefectures: {
    sourceId: 'brazil-sp-subprefectures',
    layerId: 'brazil-sp-subprefectures-line',
    lineColor: '#6b7280',
    lineWidth: 1.0,
  },
} as const;

const DEFAULT_URLS = {
  municipalities:
    'https://cdn.jsdelivr.net/npm/@ttoss/geovis-data@latest/municipios-simplificado.geojson',
  states:
    'https://cdn.jsdelivr.net/npm/@ttoss/geovis-data@latest/estados-simplificado.geojson',
  subprefectures:
    'https://cdn.jsdelivr.net/npm/@ttoss/geovis-data@latest/sp-subprefeituras.geojson',
} as const;

// ---------------------------------------------------------------------------
// Reusable empty spec
// ---------------------------------------------------------------------------
const emptySpec: VisualizationSpec = {
  id: 'test',
  engine: 'maplibre',
  sources: [],
  layers: [],
};

// ===========================================================================
// Tests
// ===========================================================================

describe('BRAZIL_STATE_OUTLINES — happy path', () => {
  const { local } = BRAZIL_STATE_OUTLINES;
  const { states } = PRESET;

  test('local has sources[] and layers[] arrays', () => {
    expect(local).toHaveProperty('sources');
    expect(local).toHaveProperty('layers');
    expect(local.sources).toHaveLength(1);
    expect(local.layers).toHaveLength(1);
  });

  test('source is geojson type with correct id and inline data', () => {
    const source = local.sources[0];
    expect(source.id).toBe(states.sourceId);
    expect(source.type).toBe('geojson');
    expect(source.data).toHaveProperty('type', 'FeatureCollection');
  });

  test('layer has correct ids, geometry, and paint', () => {
    const layer = local.layers[0];
    expect(layer.id).toBe(states.layerId);
    expect(layer.sourceId).toBe(states.sourceId);
    expect(layer.geometry).toBe('line');
    expect(layer.paint).toEqual({
      lineColor: states.lineColor,
      lineWidth: states.lineWidth,
    });
  });
});

describe('BRAZIL_MUNICIPALITY_OUTLINES — layer config', () => {
  test('layer paint uses municipality line color and width', () => {
    const { municipalities } = PRESET;
    const layer = BRAZIL_MUNICIPALITY_OUTLINES.local.layers[0];
    expect(layer.paint).toEqual({
      lineColor: municipalities.lineColor,
      lineWidth: municipalities.lineWidth,
    });
  });
});

describe('BRAZIL_SP_SUBPREFECTURE_OUTLINES — layer config', () => {
  test('layer paint uses subprefecture line color and width', () => {
    const { subprefectures } = PRESET;
    const layer = BRAZIL_SP_SUBPREFECTURE_OUTLINES.local.layers[0];
    expect(layer.paint).toEqual({
      lineColor: subprefectures.lineColor,
      lineWidth: subprefectures.lineWidth,
    });
  });
});

describe('URL variant', () => {
  test('BRAZIL_STATE_OUTLINES.url() uses default URL string', () => {
    const group = BRAZIL_STATE_OUTLINES.url();
    const source = group.sources[0];
    expect(typeof source.data).toBe('string');
    expect(source.data).toBe(DEFAULT_URLS.states);
  });

  test('BRAZIL_STATE_OUTLINES.url(customUrl) overrides default URL', () => {
    const custom = 'https://custom.example/states.geojson';
    const group = BRAZIL_STATE_OUTLINES.url(custom);
    expect(group.sources[0].data).toBe(custom);
  });

  test('url() groups retain correct layer paint', () => {
    const group = BRAZIL_STATE_OUTLINES.url();
    expect(group.layers[0].paint).toEqual({
      lineColor: PRESET.states.lineColor,
      lineWidth: PRESET.states.lineWidth,
    });
  });
});

describe('appendBoundaryGroup', () => {
  test('appends sources and layers to an empty spec', () => {
    const result = appendBoundaryGroup(emptySpec, BRAZIL_STATE_OUTLINES.local);
    expect(result.sources).toHaveLength(1);
    expect(result.layers).toHaveLength(1);
    expect(result.sources[0].id).toBe(PRESET.states.sourceId);
    expect(result.layers[0].id).toBe(PRESET.states.layerId);
  });

  test('does not mutate the original spec (purity)', () => {
    const original: VisualizationSpec = {
      ...emptySpec,
      sources: [
        {
          id: 'existing',
          type: 'geojson' as const,
          data: mockFeatureCollection,
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

    appendBoundaryGroup(original, BRAZIL_STATE_OUTLINES.local);

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
          data: mockFeatureCollection,
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
    const result = appendBoundaryGroup(
      specWithData,
      BRAZIL_STATE_OUTLINES.local
    );

    expect(result.sources).toHaveLength(2);
    expect(result.layers).toHaveLength(2);
    expect(result.sources[0].id).toBe('existing');
    expect(result.layers[0].id).toBe('existing-layer');
    expect(result.sources[1].id).toBe(PRESET.states.sourceId);
    expect(result.layers[1].id).toBe(PRESET.states.layerId);
  });
});

describe('toggleBoundaryGroup', () => {
  const specWithStates: VisualizationSpec = {
    ...emptySpec,
    sources: [...BRAZIL_STATE_OUTLINES.local.sources],
    layers: [...BRAZIL_STATE_OUTLINES.local.layers],
  };

  test('sets visible=true on matching layers', () => {
    const result = toggleBoundaryGroup(
      specWithStates,
      BRAZIL_STATE_OUTLINES.local,
      true
    );
    expect(result.layers[0].visible).toBe(true);
  });

  test('sets visible=false on matching layers', () => {
    const result = toggleBoundaryGroup(
      specWithStates,
      BRAZIL_STATE_OUTLINES.local,
      false
    );
    expect(result.layers[0].visible).toBe(false);
  });

  test('does not mutate the original spec (purity)', () => {
    const spec: VisualizationSpec = {
      ...emptySpec,
      sources: [...BRAZIL_STATE_OUTLINES.local.sources],
      layers: [{ ...BRAZIL_STATE_OUTLINES.local.layers[0] }],
    };

    toggleBoundaryGroup(spec, BRAZIL_STATE_OUTLINES.local, true);

    expect(spec.layers[0].visible).toBeUndefined();
  });

  test('does not affect non-matching layers', () => {
    const spec: VisualizationSpec = {
      ...emptySpec,
      sources: [...BRAZIL_STATE_OUTLINES.local.sources],
      layers: [
        ...BRAZIL_STATE_OUTLINES.local.layers,
        { id: 'other', sourceId: 'other', geometry: 'polygon' as const },
      ],
    };

    const result = toggleBoundaryGroup(
      spec,
      BRAZIL_STATE_OUTLINES.local,
      false
    );

    const otherLayer = result.layers.find((l) => {
      return l.id === 'other';
    });
    expect(otherLayer?.visible).toBeUndefined();
  });
});

describe('chain appendBoundaryGroup + toggleBoundaryGroup', () => {
  test('can append boundary group then toggle it off', () => {
    const appended = appendBoundaryGroup(
      emptySpec,
      BRAZIL_STATE_OUTLINES.local
    );
    const toggled = toggleBoundaryGroup(
      appended,
      BRAZIL_STATE_OUTLINES.local,
      false
    );
    expect(toggled.layers[0].visible).toBe(false);
  });
});
