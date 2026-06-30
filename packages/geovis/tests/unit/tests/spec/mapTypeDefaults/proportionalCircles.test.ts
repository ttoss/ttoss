import { resolveSpecFromMapType } from 'src/spec/mapTypeDefaults';
import {
  PROPORTIONAL_CIRCLES_DEFAULTS,
  resolveProportionalCircles,
} from 'src/spec/mapTypeDefaults/proportionalCircles';
import type { VisualizationSpec } from 'src/spec/types';

const makeSpec = (
  overrides: Partial<VisualizationSpec> & {
    mapData?: VisualizationSpec['mapData'];
    layers?: VisualizationSpec['layers'];
  }
): VisualizationSpec => {
  return {
    id: 'test',
    engine: 'maplibre',
    mapType: 'proportionalCircles',
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

describe('resolveProportionalCircles — propertyName without mapData', () => {
  test('resolver preserves propertyName on the generated point layer', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        scaleMaxValue: 500000,
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            propertyName: 'population',
          },
        ],
      })
    );

    const pointLayer = resolved.layers.find((l) => {
      return l.geometry === 'point';
    });
    expect(pointLayer).toBeDefined();
    // propertyName survives mergeResolvedLayers (not overwritten by resolver)
    expect(pointLayer!.propertyName).toBe('population');
  });

  test('resolver injects sizeBy defaults when propertyName is set', () => {
    const resolved = resolveProportionalCircles(
      makeSpec({
        scaleMaxValue: 500000,
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            propertyName: 'population',
          },
        ],
      })
    );

    const pointLayer = resolved.layers.find((l) => {
      return l.geometry === 'point';
    });
    expect(pointLayer!.sizeBy).toBeDefined();
    expect(pointLayer!.sizeBy!.range).toEqual([
      PROPORTIONAL_CIRCLES_DEFAULTS.minRadiusPx,
      PROPORTIONAL_CIRCLES_DEFAULTS.maxRadiusPx,
    ]);
    expect(pointLayer!.sizeBy!.transform).toBe('sqrt');
  });

  test('resolver generates a legend even without mapData when propertyName is present', () => {
    const resolved = resolveProportionalCircles(
      makeSpec({
        scaleMaxValue: 500000,
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            propertyName: 'population',
          },
        ],
      })
    );

    expect(resolved.legends.length).toBeGreaterThan(0);
    expect(resolved.legends[0].colorBy).toBeDefined();
  });

  test('resolver sets activeLegendId on the point layer', () => {
    const resolved = resolveProportionalCircles(
      makeSpec({
        scaleMaxValue: 500000,
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            propertyName: 'population',
          },
        ],
      })
    );

    const pointLayer = resolved.layers.find((l) => {
      return l.geometry === 'point';
    });
    expect(pointLayer!.activeLegendId).toBeDefined();
    expect(typeof pointLayer!.activeLegendId).toBe('string');
  });
});

describe('resolveProportionalCircles — mapData without propertyName', () => {
  test('resolver uses mapDataId and ignores propertyName', () => {
    const resolved = resolveProportionalCircles(
      makeSpec({
        scaleMaxValue: 500000,
        mapData: [
          {
            mapDataId: 'popData',
            mapId: 'points',
            stateKey: 'pop',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 200 },
            ],
          },
        ],
      })
    );

    const pointLayer = resolved.layers.find((l) => {
      return l.geometry === 'point';
    });
    expect(pointLayer).toBeDefined();
    expect(pointLayer!.mapDataId).toBe('popData');
    expect(pointLayer!.propertyName).toBeUndefined();
  });

  test('resolver generates quantitative legend from mapData values', () => {
    const resolved = resolveProportionalCircles(
      makeSpec({
        scaleMaxValue: 500000,
        mapData: [
          {
            mapDataId: 'popData',
            mapId: 'points',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 200 },
              { geometryId: 'c', value: 500000 },
            ],
          },
        ],
      })
    );

    const legend = resolved.legends[0];
    expect(legend.colorBy).toBeDefined();
    expect(legend.colorBy!.type).toBe('quantitative');
  });
});

describe('resolveSpecFromMapType — propertyName end-to-end', () => {
  test('full pipeline: propertyName + scaleMaxValue → layers, legends, scaleMaxValue', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        scaleMaxValue: 500000,
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            propertyName: 'population',
          },
        ],
      })
    );

    expect(resolved.layers.length).toBeGreaterThan(0);
    expect(resolved.legends!.length).toBe(1);
    expect(resolved.scaleMaxValue).toBe(500000);

    const pointLayer = resolved.layers.find((l) => {
      return l.geometry === 'point';
    });
    expect(pointLayer!.propertyName).toBe('population');
    expect(pointLayer!.sizeBy).toBeDefined();
  });

  test('user-provided sizeBy is preserved alongside propertyName', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        scaleMaxValue: 500000,
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            propertyName: 'population',
            sizeBy: {
              range: [10, 50],
              transform: 'linear',
            },
          },
        ],
      })
    );

    const pointLayer = resolved.layers.find((l) => {
      return l.geometry === 'point';
    });
    expect(pointLayer!.sizeBy!.range).toEqual([10, 50]);
    expect(pointLayer!.sizeBy!.transform).toBe('linear');
  });

  test('user-provided propertyName is not overwritten by resolver', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        scaleMaxValue: 500000,
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            propertyName: 'myCustomProp',
          },
        ],
      })
    );

    const pointLayer = resolved.layers.find((l) => {
      return l.geometry === 'point';
    });
    expect(pointLayer!.propertyName).toBe('myCustomProp');
  });

  test('propertyName with mapDataId: mapDataId takes precedence', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        scaleMaxValue: 500000,
        mapData: [
          {
            mapDataId: 'popData',
            mapId: 'points',
            stateKey: 'pop',
            data: [{ geometryId: 'a', value: 100 }],
          },
        ],
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            propertyName: 'population',
          },
        ],
      })
    );

    const pointLayer = resolved.layers.find((l) => {
      return l.geometry === 'point';
    });
    // Both fields present; adapter decides precedence at translation time
    expect(pointLayer!.propertyName).toBe('population');
    expect(pointLayer!.mapDataId).toBe('popData');
  });
});

describe('resolveProportionalCircles — missing / empty data', () => {
  test('no source and no mapData resolves to empty layers/legends', () => {
    const resolved = resolveProportionalCircles(
      makeSpec({
        scaleMaxValue: 500000,
        sources: [],
        layers: [],
      })
    );
    expect(resolved.layers).toEqual([]);
    expect(resolved.legends).toEqual([]);
  });

  test('empty mapData still produces a renderable single-bin color legend', () => {
    const resolved = resolveProportionalCircles(
      makeSpec({
        scaleMaxValue: 500000,
        mapData: [{ mapDataId: 'popData', mapId: 'points', data: [] }],
      })
    );
    const legend = resolved.legends[0];
    expect(legend.colorBy!.type).toBe('quantitative');
    expect((legend.colorBy as { thresholds: number[] }).thresholds).toEqual([]);
  });
});

describe('resolveProportionalCircles — scaleMaxValue', () => {
  test('computes and rounds scaleMaxValue to a nice number when omitted', () => {
    const resolved = resolveProportionalCircles(
      makeSpec({
        mapData: [
          {
            mapDataId: 'popData',
            mapId: 'points',
            dimension: 'size',
            stateKey: 'population',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 487321 },
            ],
          },
        ],
      })
    );
    expect(resolved.scaleMaxValue).toBeGreaterThanOrEqual(487321);
    expect(resolved.scaleMaxValue).toBe(500000);
  });

  test('does not override a user-provided scaleMaxValue', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        scaleMaxValue: 123456,
        mapData: [
          {
            mapDataId: 'popData',
            mapId: 'points',
            dimension: 'size',
            stateKey: 'population',
            data: [{ geometryId: 'a', value: 100 }],
          },
        ],
      })
    );
    expect(resolved.scaleMaxValue).toBe(123456);
  });

  test('propertyName path: computes scaleMaxValue from inline GeoJSON properties', () => {
    const centroidFeatures = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [0, 0] },
          properties: { total: 100 },
          id: 'a',
        },
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [1, 1] },
          properties: { total: 487321 },
          id: 'b',
        },
      ],
    };

    const resolved = resolveSpecFromMapType(
      makeSpec({
        sources: [
          {
            id: 'points',
            type: 'geojson',
            data: centroidFeatures,
          },
        ],
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            propertyName: 'total',
          },
        ],
      })
    );

    expect(resolved.scaleMaxValue).toBeGreaterThanOrEqual(487321);
    expect(resolved.scaleMaxValue).toBe(500000);
  });

  test('propertyName path: does not override user-provided scaleMaxValue', () => {
    const centroidFeatures = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [0, 0] },
          properties: { total: 999999 },
          id: 'a',
        },
      ],
    };

    const resolved = resolveSpecFromMapType(
      makeSpec({
        scaleMaxValue: 50000,
        sources: [
          {
            id: 'points',
            type: 'geojson',
            data: centroidFeatures,
          },
        ],
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            propertyName: 'total',
          },
        ],
      })
    );

    expect(resolved.scaleMaxValue).toBe(50000);
  });

  test('propertyName path: returns undefined when source has no inline data', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        sources: [
          {
            id: 'points',
            type: 'geojson',
            data: 'https://example.com/data.geojson',
          },
        ],
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            propertyName: 'total',
          },
        ],
      })
    );

    // URL source → no inline data → scaleMaxValue not computed
    expect(resolved.scaleMaxValue).toBeUndefined();
  });

  test('propertyName path: skips non-numeric mapData (color) and computes scaleMaxValue from GeoJSON properties', () => {
    const centroidFeatures = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [0, 0] },
          properties: { total: 100 },
          id: 'a',
        },
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [1, 1] },
          properties: { total: 487321 },
          id: 'b',
        },
      ],
    };

    const resolved = resolveSpecFromMapType(
      makeSpec({
        sources: [
          {
            id: 'centroids',
            type: 'geojson',
            data: centroidFeatures,
          },
        ],
        layers: [
          {
            id: 'points-layer',
            sourceId: 'centroids',
            geometry: 'point',
            propertyName: 'total',
          },
        ],
        mapData: [
          {
            mapDataId: 'gender',
            mapId: 'centroids',
            dimension: 'color',
            stateKey: 'gender',
            data: [
              { geometryId: 'a', value: 'women' },
              { geometryId: 'b', value: 'men' },
            ],
          },
        ],
      })
    );

    // Non-numeric color data should be skipped; scaleMaxValue computed from propertyName
    expect(resolved.scaleMaxValue).toBe(500000);
  });
});

describe('resolveProportionalCircles — legend titles', () => {
  test('auto-generated legend title states the size dimension', () => {
    const resolved = resolveProportionalCircles(
      makeSpec({
        mapData: [
          {
            mapDataId: 'popData',
            mapId: 'points',
            title: 'Total population',
            dimension: 'size',
            stateKey: 'population',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 200 },
            ],
          },
        ],
      })
    );
    const legend = resolved.legends[0];
    expect(legend.title).toMatch(/circle size/i);
    expect(legend.title).toContain('Total population');
  });

  test('auto-generated legend title falls back to "value" without a dataset title', () => {
    const resolved = resolveProportionalCircles(
      makeSpec({
        mapData: [
          {
            mapDataId: 'popData',
            mapId: 'points',
            dimension: 'size',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 200 },
            ],
          },
        ],
      })
    );
    expect(resolved.legends[0].title).toBe('Circle size = value');
  });

  test('does not overwrite a user-provided legend title', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        mapData: [
          {
            mapDataId: 'popData',
            mapId: 'points',
            title: 'Total population',
            dimension: 'size',
            data: [{ geometryId: 'a', value: 100 }],
          },
        ],
        legends: [
          {
            id: 'popData-legend',
            title: 'My custom title',
          },
        ],
      })
    );
    const legend = resolved.legends!.find((l) => {
      return l.id === 'popData-legend';
    });
    expect(legend!.title).toBe('My custom title');
  });

  test('user legend with a categorical colorBy keeps its own title intact', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        scaleMaxValue: 500000,
        mapData: [
          {
            mapDataId: 'population',
            mapId: 'points',
            title: 'total population',
            dimension: 'size',
            stateKey: 'total',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 200 },
            ],
          },
          {
            mapDataId: 'gender',
            mapId: 'points',
            dimension: 'color',
            stateKey: 'gender',
            data: [
              { geometryId: 'a', value: 'men' },
              { geometryId: 'b', value: 'women' },
            ],
          },
        ],
        legends: [
          {
            id: 'gender',
            title: 'Gender dominance',
            colorBy: {
              type: 'categorical',
              property: 'gender',
              mapping: { men: '#3b82f6', women: '#ec4899' },
              defaultColor: '#9ca3af',
            },
          },
        ],
        layers: [
          {
            id: 'district-centroids',
            sourceId: 'points',
            geometry: 'point',
            activeLegendId: 'gender',
          },
        ],
      })
    );
    const legend = resolved.legends!.find((l) => {
      return l.id === 'gender';
    });
    expect(legend!.title).toBe('Gender dominance');
    expect(legend!.colorBy!.type).toBe('categorical');

    const sizeLegend = resolved.legends!.find((l) => {
      return l.id === 'population-legend';
    });
    expect(sizeLegend!.title).toBe('Circle size = total population');
    expect(sizeLegend!.colorBy).toBeUndefined();
  });
});

describe('resolveProportionalCircles — two datasets, separate dimensions', () => {
  test('resolver keeps a single point layer and both datasets coexist', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        scaleMaxValue: 500000,
        mapData: [
          {
            mapDataId: 'colorData',
            mapId: 'points',
            dimension: 'color',
            stateKey: 'gdpClass',
            data: [{ geometryId: 'a', value: 1 }],
          },
          {
            mapDataId: 'sizeData',
            mapId: 'points',
            dimension: 'size',
            stateKey: 'population',
            data: [{ geometryId: 'a', value: 100 }],
          },
        ],
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            sizeBy: { range: [4, 36], transform: 'sqrt' },
          },
        ],
      })
    );
    const circleLayers = resolved.layers.filter((l) => {
      return l.geometry === 'point';
    });
    expect(circleLayers).toHaveLength(1);
    expect(resolved.mapData).toHaveLength(2);
  });
});
