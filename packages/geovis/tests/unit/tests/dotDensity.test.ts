import { resolveSpecFromMapType } from 'src/spec/mapTypeDefaults';
import { resolveDotDensity } from 'src/spec/mapTypeDefaults/dotDensity';
import type { VisualizationSpec } from 'src/spec/types';

const makeSpec = (
  overrides: Partial<VisualizationSpec> & {
    mapData: VisualizationSpec['mapData'];
  }
): VisualizationSpec => {
  return {
    id: 'test',
    engine: 'maplibre',
    mapType: 'dotDensity',
    basemap: {
      style: 'https://demotiles.maplibre.org/style.json',
    },
    sources: [
      {
        id: 'points',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [],
    ...overrides,
  };
};

describe('dotDensity happy path — zero-config', () => {
  test('resolves full spec from minimal mapType + mapData', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        mapData: [
          {
            mapDataId: 'events',
            mapId: 'points',
            data: [
              { geometryId: 'a', value: 1 },
              { geometryId: 'b', value: 1 },
              { geometryId: 'c', value: 1 },
            ],
          },
        ],
      })
    );

    expect(resolved.layers.length).toBeGreaterThan(0);
  });

  test('auto-generates point layer with dotDensity paint defaults', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        mapData: [
          {
            mapDataId: 'events',
            mapId: 'points',
            data: [
              { geometryId: 'a', value: 1 },
              { geometryId: 'b', value: 1 },
            ],
          },
        ],
      })
    );

    const pointLayer = resolved.layers.find((l) => {
      return l.geometry === 'point';
    });

    expect(pointLayer).toBeDefined();
    expect(pointLayer!.sourceId).toBe('points');
    expect(pointLayer!.mapDataId).toBe('events');
    expect(pointLayer!.paint).toEqual({
      circleColor: '#E4572E',
      circleRadius: 2.4,
      circleStrokeColor: '#FAF9F7',
      circleStrokeWidth: 0.5,
    });
  });

  test('does not generate legends', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        mapData: [
          {
            mapDataId: 'events',
            mapId: 'points',
            data: [{ geometryId: 'a', value: 1 }],
          },
        ],
      })
    );

    expect(resolved.legends).toHaveLength(0);
  });

  test('aligns sourceId with first mapData mapId when sources out of order', () => {
    const resolved = resolveSpecFromMapType({
      id: 'test',
      engine: 'maplibre',
      mapType: 'dotDensity',
      basemap: {
        style: 'https://demotiles.maplibre.org/style.json',
      },
      sources: [
        {
          id: 'ufs',
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        },
        {
          id: 'pontos',
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        },
      ],
      layers: [],
      mapData: [
        {
          mapDataId: 'events',
          mapId: 'pontos',
          data: [{ geometryId: 'a', value: 1 }],
        },
      ],
    });

    expect(resolved.layers[0].sourceId).toBe('pontos');
    expect(resolved.layers[0].mapDataId).toBe('events');
  });

  test('preserves user-provided layers', () => {
    const userLayers = [
      { id: 'custom-point', sourceId: 'points', geometry: 'point' as const },
    ];
    const resolved = resolveSpecFromMapType(
      makeSpec({
        layers: userLayers,
        mapData: [
          {
            mapDataId: 'events',
            mapId: 'points',
            data: [{ geometryId: 'a', value: 1 }],
          },
        ],
      })
    );

    expect(resolved.layers).toEqual(userLayers);
  });
});

describe('resolveDotDensity', () => {
  test('generates point layer with correct geometry', () => {
    const result = resolveDotDensity(
      {
        id: 'test',
        engine: 'maplibre',
        mapType: 'dotDensity',
        sources: [],
        layers: [],
      },
      'points',
      {
        mapDataId: 'events',
        mapId: 'points',
        data: [{ geometryId: 'a', value: 1 }],
      }
    );

    expect(result.layers).toHaveLength(1);
    expect(result.layers[0].geometry).toBe('point');
    expect(result.layers[0].sourceId).toBe('points');
    expect(result.layers[0].mapDataId).toBe('events');
  });

  test('applies dotDensity paint defaults', () => {
    const result = resolveDotDensity(
      {
        id: 'test',
        engine: 'maplibre',
        mapType: 'dotDensity',
        sources: [],
        layers: [],
      },
      'points',
      {
        mapDataId: 'events',
        mapId: 'points',
        data: [{ geometryId: 'a', value: 1 }],
      }
    );

    expect(result.layers[0].paint).toEqual({
      circleColor: '#E4572E',
      circleRadius: 2.4,
      circleStrokeColor: '#FAF9F7',
      circleStrokeWidth: 0.5,
    });
  });

  test('returns empty legends', () => {
    const result = resolveDotDensity(
      {
        id: 'test',
        engine: 'maplibre',
        mapType: 'dotDensity',
        sources: [],
        layers: [],
      },
      'points',
      {
        mapDataId: 'events',
        mapId: 'points',
        data: [{ geometryId: 'a', value: 1 }],
      }
    );

    expect(result.legends).toHaveLength(0);
  });
});
