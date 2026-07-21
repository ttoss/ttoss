import { resolveSpecFromMapType } from 'src/spec/mapTypeDefaults';
import {
  PROPORTIONAL_CIRCLES_DEFAULTS,
  resolveProportionalCircles,
} from 'src/spec/mapTypeDefaults/proportionalCircles';
import type { MapData, VisualizationSpec } from 'src/spec/types';

const makeSpec = (
  overrides: Partial<VisualizationSpec> & {
    mapData?: VisualizationSpec['mapData'];
    layers?: VisualizationSpec['layers'];
  }
): VisualizationSpec => {
  return {
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

  test('user legend with a categorical colorBy does not strip the size legend of its own independent colorBy', () => {
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
    expect(sizeLegend!.colorBy).toBeDefined();
    expect(sizeLegend!.colorBy!.type).toBe('quantitative');
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

describe('resolveProportionalCircles — legendEnabled', () => {
  const spec = makeSpec({
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
  });

  test('legendEnabled: false suppresses the auto-generated legend', () => {
    const resolved = resolveProportionalCircles({
      ...spec,
      legendEnabled: false,
    });
    expect(resolved.legends).toEqual([]);
  });

  test('legendEnabled omitted still generates the legend (no regression)', () => {
    const resolved = resolveProportionalCircles(spec);
    expect(resolved.legends.length).toBeGreaterThan(0);
  });

  test('legendEnabled: true still generates the legend', () => {
    const resolved = resolveProportionalCircles({
      ...spec,
      legendEnabled: true,
    });
    expect(resolved.legends.length).toBeGreaterThan(0);
  });

  test('legendEnabled: false via resolveSpecFromMapType returns no legends', () => {
    const resolved = resolveSpecFromMapType({ ...spec, legendEnabled: false });
    expect(resolved.legends).toEqual([]);
  });

  test('legendEnabled: false preserves custom legends untouched', () => {
    const resolved = resolveSpecFromMapType({
      ...spec,
      legendEnabled: false,
      legends: [{ id: 'custom-legend', title: 'My custom legend' }],
    });
    expect(resolved.legends).toEqual([
      { id: 'custom-legend', title: 'My custom legend' },
    ]);
  });

  test('legendEnabled: true appends the auto-generated legend alongside an unrelated custom legend, without merging into it', () => {
    const resolved = resolveSpecFromMapType({
      ...spec,
      legendEnabled: true,
      legends: [{ id: 'custom-legend', title: 'My custom legend' }],
    });
    expect(resolved.legends).toEqual([
      { id: 'custom-legend', title: 'My custom legend' },
      expect.objectContaining({
        id: 'popData-legend',
        title: 'Circle size = value',
      }),
    ]);
  });

  test('legendEnabled: true merges a user legend that shares the resolved legend id, keeping the user title', () => {
    const resolved = resolveSpecFromMapType({
      ...spec,
      legendEnabled: true,
      legends: [{ id: 'popData-legend', title: 'My own size legend' }],
    });
    expect(resolved.legends).toEqual([
      expect.objectContaining({
        id: 'popData-legend',
        title: 'My own size legend',
        colorBy: expect.objectContaining({ type: 'quantitative' }),
      }),
    ]);
  });

  test('legendEnabled: true merges quantitative colorBy overrides when the user legend shares the resolved id', () => {
    const resolved = resolveSpecFromMapType({
      ...spec,
      legendEnabled: true,
      legends: [
        {
          id: 'popData-legend',
          title: 'My own size legend',
          colorBy: {
            type: 'quantitative',
            property: 'value',
            scale: 'threshold',
            thresholds: [],
            colors: ['#000000'],
            defaultColor: '#000000',
          },
        },
      ],
    });
    const legend = resolved.legends![0];
    expect(legend.colorBy).toMatchObject({ colors: ['#000000'] });
  });

  test('legendEnabled: false still attaches the colorBy legend to the point layer so color-by-value rendering keeps working', () => {
    const resolved = resolveSpecFromMapType({ ...spec, legendEnabled: false });
    const pointLayer = resolved.layers.find((l) => {
      return l.geometry === 'point';
    });
    expect(pointLayer!.activeLegendId).toBeDefined();
    const attachedLegend = pointLayer!.legends?.find((l) => {
      return l.id === pointLayer!.activeLegendId;
    });
    expect(attachedLegend?.colorBy).toBeDefined();
  });

  test('legendEnabled: false does not mutate the user-provided layer object, so a later legendEnabled: true resolution starts clean', () => {
    const userLayer = {
      id: 'points-layer',
      sourceId: 'points',
      geometry: 'point' as const,
      activeLegendId: 'custom',
    };
    const specWithLayer = {
      ...spec,
      legends: [{ id: 'custom', title: 'Custom' }],
      layers: [userLayer],
    };

    resolveSpecFromMapType({ ...specWithLayer, legendEnabled: false });
    expect(userLayer).toEqual({
      id: 'points-layer',
      sourceId: 'points',
      geometry: 'point',
      activeLegendId: 'custom',
    });

    const resolvedAgain = resolveSpecFromMapType({
      ...specWithLayer,
      legendEnabled: true,
    });
    const pointLayer = resolvedAgain.layers.find((l) => {
      return l.geometry === 'point';
    });
    expect(pointLayer!.legends).toBeUndefined();
  });
});

describe('resolveProportionalCircles — user-provided paint override', () => {
  test('a spec.layers entry matching sourceId + geometry overrides circle paint', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        scaleMaxValue: 500000,
        mapData: [
          {
            mapDataId: 'popData',
            mapId: 'points',
            dimension: 'size',
            data: [{ geometryId: 'a', value: 100 }],
          },
        ],
        layers: [
          {
            id: 'my-custom-circles',
            sourceId: 'points',
            geometry: 'point',
            paint: { circleColor: '#2563eb', circleOpacity: 0.5 },
          },
        ],
      })
    );

    const pointLayer = resolved.layers.find((l) => {
      return l.geometry === 'point';
    });
    expect(pointLayer!.paint!.circleColor).toBe('#2563eb');
    expect(pointLayer!.paint!.circleOpacity).toBe(0.5);
    // Non-overridden defaults are preserved by the merge
    expect(pointLayer!.paint!.circleStrokeWidth).toBe(
      PROPORTIONAL_CIRCLES_DEFAULTS.strokeWidth
    );
  });
});

describe('resolveProportionalCircles — scale ceiling edge cases', () => {
  test('scaleMaxValue is left undefined when the size dataset is all zero', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        mapData: [
          {
            mapDataId: 'popData',
            mapId: 'points',
            dimension: 'size',
            data: [
              { geometryId: 'a', value: 0 },
              { geometryId: 'b', value: 0 },
            ],
          },
        ],
      })
    );
    expect(resolved.scaleMaxValue).toBeUndefined();
  });

  test('scaleMaxValue is left undefined when the size dataset is entirely negative', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        mapData: [
          {
            mapDataId: 'popData',
            mapId: 'points',
            dimension: 'size',
            data: [
              { geometryId: 'a', value: -10 },
              { geometryId: 'b', value: -5 },
            ],
          },
        ],
      })
    );
    expect(resolved.scaleMaxValue).toBeUndefined();
  });

  test('mapData entry with no `data` array (e.g. malformed external JSON) is treated as having no size values', () => {
    const malformedMapData = [
      { mapDataId: 'popData', mapId: 'points', dimension: 'size' },
    ] as unknown as MapData[];
    const resolved = resolveSpecFromMapType(
      makeSpec({ mapData: malformedMapData })
    );
    expect(resolved.scaleMaxValue).toBeUndefined();
  });

  test('a dimension-less mapData entry with no `data` array is not mistaken for a numeric size dataset', () => {
    const malformedMapData = [
      { mapDataId: 'popData', mapId: 'points' },
    ] as unknown as MapData[];
    const resolved = resolveSpecFromMapType(
      makeSpec({ mapData: malformedMapData })
    );
    expect(resolved.scaleMaxValue).toBeUndefined();
  });
});

describe('resolveProportionalCircles — propertyName with a missing feature property', () => {
  test('falls back to 0 for features missing the propertyName key, still computing scaleMaxValue', () => {
    const centroidFeatures = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [0, 0] },
          properties: {},
          id: 'a',
        },
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [1, 1] },
          properties: { total: 250000 },
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

    expect(resolved.scaleMaxValue).toBe(250000);
  });
});
