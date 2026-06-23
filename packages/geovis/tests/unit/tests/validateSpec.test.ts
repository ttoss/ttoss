import { validateSpec } from 'src/spec/validateSpec';

import geojsonUrlMap from '../../../src/fixtures/geojson-url-map.json';
import singleMap from '../../../src/fixtures/single-map.json';

describe('validateSpec', () => {
  test.each([
    ['single-map (geojson source)', singleMap],
    ['geojson-url-map (geojson url source)', geojsonUrlMap],
  ])('fixture "%s" is valid', (_name, fixture) => {
    const result = validateSpec(fixture);

    expect(result.valid).toBe(true);
  });

  test('returns errors for an invalid spec', () => {
    const result = validateSpec({ title: 'missing required fields' });

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});

describe('validateSpec — mapData', () => {
  const baseSpec = {
    engine: 'maplibre' as const,
    view: { center: [0, 0] as [number, number], zoom: 1 },
    sources: [
      {
        id: 'states',
        type: 'geojson' as const,
        data: { type: 'FeatureCollection' as const, features: [] },
      },
    ],
    layers: [
      { id: 'states-fill', sourceId: 'states', geometry: 'polygon' as const },
    ],
  };

  // 1.1
  test('accepts spec with valid inline mapData', () => {
    const result = validateSpec({
      ...baseSpec,
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'states',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ],
      layers: [{ ...baseSpec.layers[0], mapDataId: 'pop' }],
    });
    expect(result.valid).toBe(true);
  });

  // 1.2
  test('accepts V1 spec without mapData (no regression)', () => {
    const result = validateSpec(baseSpec);
    expect(result.valid).toBe(true);
  });

  // 1.3
  test('rejects mapData.mapId pointing to unknown source', () => {
    const result = validateSpec({
      ...baseSpec,
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'does-not-exist',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ],
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join('\n')).toMatch(/does-not-exist/);
    }
  });

  // 1.4
  test('rejects mapData.mapId pointing to a non-geojson source', () => {
    const result = validateSpec({
      ...baseSpec,
      sources: [
        ...baseSpec.sources,
        {
          id: 'tiles',
          type: 'vector-tiles' as const,
          tiles: ['https://example/{z}/{x}/{y}.pbf'],
        },
      ],
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'tiles',
          data: [{ geometryId: 'BR', value: 1 }],
        },
      ],
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join('\n')).toMatch(/geojson/);
    }
  });

  // 1.5
  test('rejects layer.mapDataId referencing unknown mapData entry', () => {
    const result = validateSpec({
      ...baseSpec,
      layers: [{ ...baseSpec.layers[0], mapDataId: 'ghost' }],
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join('\n')).toMatch(/ghost/);
    }
  });

  // 1.6
  test('rejects duplicate mapData.mapDataId', () => {
    const dupEntry = {
      mapDataId: 'pop',
      mapId: 'states',
      data: [{ geometryId: 'BR', value: 10 }],
    };
    const result = validateSpec({
      ...baseSpec,
      mapData: [
        dupEntry,
        { ...dupEntry, data: [{ geometryId: 'AR', value: 5 }] },
      ],
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join('\n')).toMatch(/pop/);
    }
  });

  // 1.7
  test('rejects layer.mapDataId whose mapId does not match layer.sourceId', () => {
    const result = validateSpec({
      ...baseSpec,
      sources: [
        ...baseSpec.sources,
        {
          id: 'other',
          type: 'geojson' as const,
          data: { type: 'FeatureCollection' as const, features: [] },
        },
      ],
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'other',
          data: [{ geometryId: 'BR', value: 1 }],
        },
      ],
      layers: [{ ...baseSpec.layers[0], mapDataId: 'pop' }],
      // layer.sourceId = 'states', mapData.mapId = 'other' → mismatch
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join('\n')).toMatch(/source-scoped/);
    }
  });

  // 1.8
  test('accepts unknown joinKey at schema-validation time (property existence is runtime concern)', () => {
    const result = validateSpec({
      ...baseSpec,
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'states',
          joinKey: 'does-not-exist-in-properties',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ],
      layers: [{ ...baseSpec.layers[0], mapDataId: 'pop' }],
    });

    expect(result.valid).toBe(true);
  });

  test('rejects threshold legends with out-of-order breakpoints', () => {
    const result = validateSpec({
      ...baseSpec,
      legends: [
        {
          id: 'population',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
            thresholds: [100, 50],
            colors: ['#eff6ff', '#93c5fd', '#3b82f6'],
          },
        },
      ],
      layers: [
        {
          ...baseSpec.layers[0],
          activeLegendId: 'population',
        },
      ],
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join('\n')).toMatch(/ascending order/);
    }
  });

  test('rejects threshold legends with non-finite threshold values (NaN)', () => {
    const result = validateSpec({
      ...baseSpec,
      legends: [
        {
          id: 'population',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
            thresholds: [Number.NaN],
            colors: ['#eff6ff', '#93c5fd'],
          },
        },
      ],
      layers: [
        {
          ...baseSpec.layers[0],
          activeLegendId: 'population',
        },
      ],
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join('\n')).toMatch(/non-finite/);
    }
  });

  test('rejects threshold legends with non-finite threshold values (Infinity)', () => {
    const result = validateSpec({
      ...baseSpec,
      legends: [
        {
          id: 'population',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
            thresholds: [Infinity],
            colors: ['#eff6ff', '#93c5fd'],
          },
        },
      ],
      layers: [
        {
          ...baseSpec.layers[0],
          activeLegendId: 'population',
        },
      ],
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join('\n')).toMatch(/non-finite/);
    }
  });

  test('accepts legends with labelFormat and reference fields', () => {
    const result = validateSpec({
      ...baseSpec,
      legends: [
        {
          id: 'pop',
          title: 'Population',
          subtitle: 'Residents per district',
          labelFormat: { type: 'count', abbreviate: true, extended: true },
          normalization: { type: 'raw', numeratorLabel: 'inhabitants' },
          reference: 'SMUL/GEOINFO — Resident population evolution',
          noDataLabel: 'No data',
          position: 'bottom-right',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
            thresholds: [50000, 100000, 150000, 200000],
            colors: ['#f0f9ff', '#bfdbfe', '#60a5fa', '#3b82f6', '#1d4ed8'],
          },
        },
      ],
      layers: [
        {
          ...baseSpec.layers[0],
          activeLegendId: 'pop',
        },
      ],
    });

    expect(result.valid).toBe(true);
  });

  test('rejects legend with additional unknown fields', () => {
    const result = validateSpec({
      ...baseSpec,
      legends: [
        {
          id: 'pop',
          unknownField: 'should-fail',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
          },
        },
      ],
    });

    expect(result.valid).toBe(false);
  });
});

describe('validateSpec — layer interaction fields (hoverPaint, selectedPaint, clickAnchor)', () => {
  const baseSpec = {
    engine: 'maplibre' as const,
    view: { center: [0, 0] as [number, number], zoom: 1 },
    sources: [
      {
        id: 'regions',
        type: 'geojson' as const,
        data: { type: 'FeatureCollection' as const, features: [] },
      },
    ],
    layers: [
      { id: 'regions-fill', sourceId: 'regions', geometry: 'polygon' as const },
    ],
  };

  test('accepts layer with hoverPaint', () => {
    const result = validateSpec({
      ...baseSpec,
      layers: [
        {
          ...baseSpec.layers[0],
          hoverPaint: { lineColor: '#ff0000', lineWidth: 2 },
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  test('accepts layer with selectedPaint', () => {
    const result = validateSpec({
      ...baseSpec,
      layers: [
        {
          ...baseSpec.layers[0],
          selectedPaint: { lineColor: '#0000ff', lineWidth: 3 },
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  test('accepts layer with clickAnchor using iconImage', () => {
    const result = validateSpec({
      ...baseSpec,
      layers: [
        {
          ...baseSpec.layers[0],
          clickAnchor: { iconImage: 'marker-15', iconSize: 1.5 },
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  test('accepts layer with clickAnchor using color and offset', () => {
    const result = validateSpec({
      ...baseSpec,
      layers: [
        {
          ...baseSpec.layers[0],
          clickAnchor: { color: '#3FB1CE', offset: [0, -10] },
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  test('rejects hoverPaint with unknown property', () => {
    const result = validateSpec({
      ...baseSpec,
      layers: [
        {
          ...baseSpec.layers[0],
          hoverPaint: { lineColor: '#ff0000', unknownProp: true },
        },
      ],
    });
    expect(result.valid).toBe(false);
  });

  test('rejects clickAnchor with unknown property', () => {
    const result = validateSpec({
      ...baseSpec,
      layers: [
        {
          ...baseSpec.layers[0],
          clickAnchor: { iconImage: 'pin', unknownProp: 'bad' },
        },
      ],
    });
    expect(result.valid).toBe(false);
  });
});
