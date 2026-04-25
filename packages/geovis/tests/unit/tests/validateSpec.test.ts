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
    id: 'with-map-data',
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
});
