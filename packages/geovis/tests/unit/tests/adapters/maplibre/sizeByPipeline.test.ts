import type maplibregl from 'maplibre-gl';
import { toMaplibreLayer } from 'src/adapters/maplibre/layerTranslation';
import {
  applyMapDataToSource,
  scheduleMapDataApply,
} from 'src/adapters/maplibre/mapDataFeatureState';
import type { LegendSpec, MapData, VisualizationLayer } from 'src/spec/types';

/**
 * Full-pipeline integration tests for the SteppedProportionalCircles story.
 *
 * Pipeline (MapLibreAdapter.mountView):
 *   1. map.on('load')
 *   2. syncSourcesAndLayers(map, spec, null)
 *      a. upsertSources → map.addSource('cities', { type: 'geojson', data: CITIES_GEOJSON })
 *      b. upsertLayers → toMaplibreLayer(layer, src, legends, mapData) → map.addLayer(layer)
 *   3. reapplyAllMapData(map, spec)
 *      a. scheduleMapDataApply(map, mapData)
 *      b. map.isSourceLoaded('cities') → true (inline GeoJSON)
 *      c. applyMapDataToSource → map.setFeatureState({ source:'cities', id }, { population: value })
 *   4. MapLibre renders: circle-radius expression evaluates feature-state['population'] → radii
 *
 * Expected bin mapping:
 *   Buenos Aires  3.07M  < 5M     → bin 0 → 6.00px
 *   New York      8.34M  5M–10M   → bin 1 → 13.33px
 *   London        8.98M  5M–10M   → bin 1 → 13.33px
 *   Mexico City   9.21M  5M–10M   → bin 1 → 13.33px
 *   Cairo         9.54M  5M–10M   → bin 1 → 13.33px
 *   Bangkok      10.54M  10M–15M  → bin 2 → 20.67px
 *   Delhi        11.03M  10M–15M  → bin 2 → 20.67px
 *   Sao Paulo    12.33M  10M–15M  → bin 2 → 20.67px
 *   Tokyo        13.96M  10M–15M  → bin 2 → 20.67px
 *   Shanghai     24.87M  > 15M    → bin 3 → 28.00px
 */

// ─── Story fixtures ────────────────────────────────────────────────────────

const CITIES_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [139.6917, 35.6895] },
      properties: { cityId: 'tokyo', name: 'Tokyo', population: 13_960_000 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [77.209, 28.6139] },
      properties: { cityId: 'delhi', name: 'Delhi', population: 11_030_000 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [121.4737, 31.2304] },
      properties: {
        cityId: 'shanghai',
        name: 'Shanghai',
        population: 24_870_000,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-46.6333, -23.5505] },
      properties: {
        cityId: 'sao-paulo',
        name: 'São Paulo',
        population: 12_330_000,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-99.1332, 19.4326] },
      properties: {
        cityId: 'mexico-city',
        name: 'Mexico City',
        population: 9_210_000,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [31.2357, 30.0444] },
      properties: { cityId: 'cairo', name: 'Cairo', population: 9_540_000 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-0.1276, 51.5074] },
      properties: { cityId: 'london', name: 'London', population: 8_982_000 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-74.006, 40.7128] },
      properties: {
        cityId: 'new-york',
        name: 'New York',
        population: 8_336_000,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.5018, 13.7563] },
      properties: {
        cityId: 'bangkok',
        name: 'Bangkok',
        population: 10_540_000,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-58.3816, -34.6037] },
      properties: {
        cityId: 'buenos-aires',
        name: 'Buenos Aires',
        population: 3_070_000,
      },
    },
  ],
};

const storyMapData: MapData[] = [
  {
    mapDataId: 'population',
    mapId: 'cities',
    stateKey: 'population',
    joinKey: 'cityId',
    dimension: 'size',
    data: CITIES_GEOJSON.features.map((f) => {
      return {
        geometryId: (f.properties?.cityId as string) ?? '',
        value: (f.properties?.population as number) ?? 0,
      };
    }),
  },
];

const storyLegends: LegendSpec[] = [
  {
    id: 'pop-legend',
    colorBy: {
      type: 'quantitative',
      property: 'population',
      scale: 'threshold',
      thresholds: [5_000_000, 10_000_000, 15_000_000],
      colors: ['#fee5d9', '#fcae91', '#fb6a4a', '#cb181d'],
      defaultColor: '#9ca3af',
    },
  },
];

const storyLayer: VisualizationLayer = {
  id: 'cities-points',
  sourceId: 'cities',
  geometry: 'point',
  activeLegendId: 'pop-legend',
  sizeBy: {
    range: [6, 28],
    mode: 'stepped',
    thresholds: [5_000_000, 10_000_000, 15_000_000],
  },
};

/**
 * Simulates MapLibre's step expression evaluation.
 * ['step', input, default, stop1, out1, stop2, out2, ...]
 *   input < stop1 → default
 *   stop1 ≤ input < stop2 → out1
 *   stop2 ≤ input < stop3 → out2
 *   ...
 */
const evalStep = (stepExpr: unknown[], inputValue: number): number => {
  const default_ = stepExpr[2] as number;
  let result = default_;
  for (let i = 3; i < stepExpr.length; i += 2) {
    const stop = stepExpr[i] as number;
    const output = stepExpr[i + 1] as number;
    if (inputValue >= stop) {
      result = output;
    } else {
      break;
    }
  }
  return result;
};

// ═══════════════════════════════════════════════════════════════════════════
// Stage 1: toMaplibreLayer — builds the layer with circle-radius expression
// ═══════════════════════════════════════════════════════════════════════════

describe('Stage 1 — toMaplibreLayer builds circle-radius expression from story spec', () => {
  const mapLayer = toMaplibreLayer(
    storyLayer,
    undefined,
    storyLegends,
    storyMapData
  );
  const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
  const radius = paint?.['circle-radius'] as unknown[];

  test('expression is a case guard wrapping a step expression', () => {
    expect(radius[0]).toBe('case');
    expect((radius[2] as unknown[])[0]).toBe('step');
  });

  test('guard checks feature-state["population"] against null', () => {
    const guard = radius[1] as unknown[];
    expect(guard).toEqual(['!=', ['feature-state', 'population'], null]);
  });

  test('step input reads feature-state["population"]', () => {
    const step = radius[2] as unknown[];
    const input = step[1] as unknown[];
    expect(input).toEqual(['to-number', ['feature-state', 'population']]);
  });

  test('step has default=6, 3 stops, 4 radii', () => {
    const step = radius[2] as unknown[];
    // ['step', input, 6, 5M, 13.33, 10M, 20.67, 15M, 28]
    expect(step[2]).toBe(6);
    expect(step[3]).toBe(5_000_000);
    expect(step[5]).toBe(10_000_000);
    expect(step[7]).toBe(15_000_000);
    expect(step[8]).toBe(28);
  });

  test('fallbackRadius (case false branch) is 6', () => {
    expect(radius[3]).toBe(6);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Stage 2: circle-color stateKey — color reads "value", not "population"
// ═══════════════════════════════════════════════════════════════════════════

describe('Stage 2 — circle-color uses different stateKey than circle-radius (BUG)', () => {
  const mapLayer = toMaplibreLayer(
    storyLayer,
    undefined,
    storyLegends,
    storyMapData
  );
  const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;

  test('circle-color reads feature-state["population"] (same as circle-radius)', () => {
    const color = paint?.['circle-color'] as unknown[];
    // step → input → to-number → coalesce → [feature-state, "population"]
    const coalesce = (color[1] as unknown[])[1] as unknown[];
    expect(coalesce[0]).toBe('coalesce');
    expect(coalesce[1]).toEqual(['feature-state', 'population']);
  });

  test('circle-radius reads feature-state["population"]', () => {
    const radius = paint?.['circle-radius'] as unknown[];
    const guard = radius[1] as unknown[];
    expect(guard[1]).toEqual(['feature-state', 'population']);
  });

  test('FIXED: color and size read from the SAME feature-state keys', () => {
    const color = paint?.['circle-color'] as unknown[];
    const radius = paint?.['circle-radius'] as unknown[];

    // Extract stateKey from circle-color expression
    // step → input is [to-number, [coalesce, [feature-state, 'X'], fallback]]
    const coalesce = (color[1] as unknown[])[1] as unknown[];
    const colorStateKey = (coalesce[1] as unknown[])[1] as string;

    // Extract stateKey from circle-radius expression
    // case → guard is ['!=', [feature-state, 'X'], null]
    //   guard[1] = [feature-state, 'X']
    //   guard[1][1] = 'X'
    const sizeGuard = radius[1] as unknown[];
    const sizeStateKey = (sizeGuard[1] as unknown[])[1] as string;

    // Both now read "population" (FIXED)
    expect(colorStateKey).toBe('population');
    expect(sizeStateKey).toBe('population');
    expect(colorStateKey).toBe(sizeStateKey);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Stage 3: setFeatureState — writes { population: value } with correct IDs
// ═══════════════════════════════════════════════════════════════════════════

describe('Stage 3 — applyMapDataToSource writes correct state and IDs via joinKey', () => {
  /**
   * Simulates MapLibre's querySourceFeatures returning features with
   * auto-assigned numeric IDs (as geojson-vt does) and cityId property.
   */
  const MOCK_FEATURES = CITIES_GEOJSON.features.map((f, i) => {
    return {
      id: i,
      properties: f.properties,
    };
  });

  const createMockMap = () => {
    return {
      getSource: jest.fn(() => {
        return { type: 'geojson' };
      }),
      setFeatureState: jest.fn(),
      querySourceFeatures: jest.fn(() => {
        return MOCK_FEATURES;
      }),
    } as unknown as maplibregl.Map;
  };

  test('setFeatureState called 10 times (one per city)', () => {
    const map = createMockMap();
    applyMapDataToSource(map, storyMapData[0]!);
    expect(map.setFeatureState).toHaveBeenCalledTimes(10);
  });

  test('each call uses { source: "cities", id } and { population: value }', () => {
    const map = createMockMap();
    applyMapDataToSource(map, storyMapData[0]!);

    const calls = jest.mocked(map.setFeatureState).mock.calls;

    for (const call of calls) {
      const feature = call[0] as { source: string; id: string | number };
      const state = call[1] as Record<string, number>;
      expect(feature.source).toBe('cities');
      expect(state).toHaveProperty('population');
      expect(typeof state.population).toBe('number');
      expect(Number.isFinite(state.population)).toBe(true);
    }
  });

  test('IDs are the join values applied directly (no querySourceFeatures)', () => {
    const map = createMockMap();
    applyMapDataToSource(map, storyMapData[0]!);

    // `joinKey` is promoted to `feature.id`, so the join value is the id —
    // state is applied directly, never resolved through the viewport-bound query.
    expect(map.querySourceFeatures).not.toHaveBeenCalled();

    const calls = jest.mocked(map.setFeatureState).mock.calls;
    const ids = calls.map((c) => {
      return (c[0] as { id: string | number }).id;
    });
    const expectedIds = CITIES_GEOJSON.features.map((f) => {
      return f.properties?.cityId;
    });

    expect(ids).toEqual(expectedIds);
  });

  test('population values match the GeoJSON properties', () => {
    const map = createMockMap();
    applyMapDataToSource(map, storyMapData[0]!);

    const calls = jest.mocked(map.setFeatureState).mock.calls;
    const values = calls.map((c) => {
      return (c[1] as { population: number }).population;
    });
    const expectedValues = CITIES_GEOJSON.features.map((f) => {
      return f.properties?.population as number;
    });

    expect(values).toEqual(expectedValues);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Stage 4: expression + state → different radii per bin
// ═══════════════════════════════════════════════════════════════════════════

describe('Stage 4 — step expression produces correct radii for each bin', () => {
  const mapLayer = toMaplibreLayer(
    storyLayer,
    undefined,
    storyLegends,
    storyMapData
  );
  const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
  const radius = paint?.['circle-radius'] as unknown[];
  const step = radius[2] as unknown[];

  const BIN_0 = 6;
  const BIN_1 = 6 + (28 - 6) * (1 / 3); // ~13.33
  const BIN_2 = 6 + (28 - 6) * (2 / 3); // ~20.67
  const BIN_3 = 28;

  test('Buenos Aires (3.07M < 5M) → BIN_0 = 6px', () => {
    expect(evalStep(step, 3_070_000)).toBe(BIN_0);
  });

  test('New York (8.34M) → BIN_1 ≈ 13.33px', () => {
    expect(evalStep(step, 8_336_000)).toBeCloseTo(BIN_1, 2);
  });

  test('London (8.98M) → BIN_1 ≈ 13.33px', () => {
    expect(evalStep(step, 8_982_000)).toBeCloseTo(BIN_1, 2);
  });

  test('Mexico City (9.21M) → BIN_1 ≈ 13.33px', () => {
    expect(evalStep(step, 9_210_000)).toBeCloseTo(BIN_1, 2);
  });

  test('Cairo (9.54M) → BIN_1 ≈ 13.33px', () => {
    expect(evalStep(step, 9_540_000)).toBeCloseTo(BIN_1, 2);
  });

  test('Bangkok (10.54M) → BIN_2 ≈ 20.67px', () => {
    expect(evalStep(step, 10_540_000)).toBeCloseTo(BIN_2, 2);
  });

  test('Delhi (11.03M) → BIN_2 ≈ 20.67px', () => {
    expect(evalStep(step, 11_030_000)).toBeCloseTo(BIN_2, 2);
  });

  test('São Paulo (12.33M) → BIN_2 ≈ 20.67px', () => {
    expect(evalStep(step, 12_330_000)).toBeCloseTo(BIN_2, 2);
  });

  test('Tokyo (13.96M) → BIN_2 ≈ 20.67px', () => {
    expect(evalStep(step, 13_960_000)).toBeCloseTo(BIN_2, 2);
  });

  test('Shanghai (24.87M > 15M) → BIN_3 = 28px', () => {
    expect(evalStep(step, 24_870_000)).toBe(BIN_3);
  });

  test('10 cities produce exactly 4 distinct radii', () => {
    const radii = CITIES_GEOJSON.features.map((f) => {
      return evalStep(step, f.properties?.population as number);
    });
    const distinct = new Set(
      radii.map((r) => {
        return Math.round(r * 100) / 100;
      })
    );
    expect(distinct.size).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Stage 5: lifecycle — scheduleMapDataApply paths
// ═══════════════════════════════════════════════════════════════════════════

describe('Stage 5 — scheduleMapDataApply lifecycle paths', () => {
  const MOCK_FEATURES = CITIES_GEOJSON.features.map((f, i) => {
    return { id: i, properties: f.properties };
  });

  test('inline GeoJSON: isSourceLoaded=true → immediate setFeatureState', () => {
    const map = {
      getSource: jest.fn(() => {
        return { type: 'geojson' };
      }),
      setFeatureState: jest.fn(),
      querySourceFeatures: jest.fn(() => {
        return MOCK_FEATURES;
      }),
      isSourceLoaded: jest.fn(() => {
        return true;
      }),
      on: jest.fn(),
    } as unknown as maplibregl.Map;

    scheduleMapDataApply(map, storyMapData[0]!);

    expect(map.setFeatureState).toHaveBeenCalledTimes(10);
    const calls = jest.mocked(map.setFeatureState).mock.calls;
    expect(calls[0][1]).toEqual({ population: 13_960_000 }); // tokyo
    expect(calls[9][1]).toEqual({ population: 3_070_000 }); // buenos-aires
  });

  test('URL GeoJSON: isSourceLoaded=false → listener registered', () => {
    let listener: (e: unknown) => void = () => {};
    const map = {
      getSource: jest.fn(() => {
        return { type: 'geojson' };
      }),
      setFeatureState: jest.fn(),
      querySourceFeatures: jest.fn(() => {
        return MOCK_FEATURES;
      }),
      isSourceLoaded: jest.fn(() => {
        return false;
      }),
      on: jest.fn((_e: string, fn: (e: unknown) => void) => {
        listener = fn;
      }),
      off: jest.fn(),
    } as unknown as maplibregl.Map;

    scheduleMapDataApply(map, storyMapData[0]!);
    expect(map.setFeatureState).not.toHaveBeenCalled();

    // Simulate source loaded
    listener({ sourceId: 'cities', isSourceLoaded: true });
    expect(map.setFeatureState).toHaveBeenCalledTimes(10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Stage 6: stateKey alignment — expression reads exactly what state writes
// ═══════════════════════════════════════════════════════════════════════════

describe('Stage 6 — stateKey alignment between expression and setFeatureState', () => {
  test('expression reads "population" and setFeatureState writes "population" → ALIGNED', () => {
    const mapLayer = toMaplibreLayer(
      storyLayer,
      undefined,
      storyLegends,
      storyMapData
    );
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'] as unknown[];

    // Expression stateKey
    const guard = radius[1] as unknown[];
    const exprStateKey = (guard[1] as unknown[])[1] as string;

    // setFeatureState stateKey
    const mapDataStateKey = storyMapData[0]!.stateKey;

    expect(exprStateKey).toBe(mapDataStateKey);
  });

  test('when specMapData is undefined → expression defaults to "value" → MISMATCH', () => {
    const mapLayer = toMaplibreLayer(
      storyLayer,
      undefined,
      storyLegends,
      undefined
    );
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'] as unknown[];

    const guard = radius[1] as unknown[];
    const exprStateKey = (guard[1] as unknown[])[1] as string;

    expect(exprStateKey).toBe('value');
    // But setFeatureState writes { population: value }
    // → feature-state['value'] is null → guard fails → fallbackRadius 6
    expect(exprStateKey).not.toBe(storyMapData[0]!.stateKey);
  });

  test('mapData without dimension falls back to stateKey from same source', () => {
    const mapDataNoDim: MapData[] = [
      {
        mapDataId: 'population',
        mapId: 'cities',
        stateKey: 'population',
        // NO dimension field
        data: [{ geometryId: 'tokyo', value: 13_960_000 }],
      },
    ];

    // layer has no mapDataId either
    const mapLayer = toMaplibreLayer(
      storyLayer,
      undefined,
      storyLegends,
      mapDataNoDim
    );
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'] as unknown[];

    const guard = radius[1] as unknown[];
    const exprStateKey = (guard[1] as unknown[])[1] as string;

    // Without dimension but with mapData for same source → uses "population"
    expect(exprStateKey).toBe('population');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Stage 7: full end-to-end — expression + state → visual radii match expected
// ═══════════════════════════════════════════════════════════════════════════

describe('Stage 7 — end-to-end: expression evaluated with setFeatureState data', () => {
  const mapLayer = toMaplibreLayer(
    storyLayer,
    undefined,
    storyLegends,
    storyMapData
  );
  const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
  const radiusExpr = paint?.['circle-radius'] as unknown[];
  const step = radiusExpr[2] as unknown[];

  const BIN_0 = 6;
  const BIN_1 = 6 + (28 - 6) * (1 / 3);
  const BIN_2 = 6 + (28 - 6) * (2 / 3);
  const BIN_3 = 28;

  test('each city gets the expected radius based on its population', () => {
    const expected: Record<string, number> = {
      tokyo: BIN_2,
      delhi: BIN_2,
      shanghai: BIN_3,
      'sao-paulo': BIN_2,
      'mexico-city': BIN_1,
      cairo: BIN_1,
      london: BIN_1,
      'new-york': BIN_1,
      bangkok: BIN_2,
      'buenos-aires': BIN_0,
    };

    for (const [cityId, expectedRadius] of Object.entries(expected)) {
      const pop = CITIES_GEOJSON.features.find((f) => {
        return f.properties?.cityId === cityId;
      })!.properties?.population as number;
      const actual = evalStep(step, pop);
      expect(actual).toBeCloseTo(expectedRadius, 1);
    }
  });

  test('guard: when feature-state is null → fallbackRadius 6 (same as BIN_0)', () => {
    // This means features WITHOUT setFeatureState look identical to BIN_0
    // This is the root cause of the "all circles in first bin" symptom:
    // if setFeatureState fails silently, ALL features get 6px
    expect(radiusExpr[3]).toBe(BIN_0);
  });

  test('BIN_0 === fallbackRadius: missing state is indistinguishable from smallest bin', () => {
    const fallback = radiusExpr[3] as number;
    expect(fallback).toBe(BIN_0);
    // This means we CANNOT tell the difference between:
    //   a) A feature correctly in BIN_0 (population < 5M)
    //   b) A feature where setFeatureState failed silently
    // The only way to diagnose is to check the actual rendered output
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Stage 8: circle-color expression — same population field drives colors
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Evaluates a MapLibre `step` expression for colors.
 * ['step', input, default, stop1, color1, stop2, color2, ...]
 */
const evalColorStep = (stepExpr: unknown[], inputValue: number): string => {
  const default_ = stepExpr[2] as string;
  let result = default_;
  for (let i = 3; i < stepExpr.length; i += 2) {
    const stop = stepExpr[i] as number;
    const output = stepExpr[i + 1] as string;
    if (inputValue >= stop) {
      result = output;
    } else {
      break;
    }
  }
  return result;
};

describe('Stage 8 — circle-color expression from story spec', () => {
  const mapLayer = toMaplibreLayer(
    storyLayer,
    undefined,
    storyLegends,
    storyMapData
  );
  const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
  const color = paint?.['circle-color'] as unknown[];

  test('circle-color is a step expression', () => {
    expect(color[0]).toBe('step');
  });

  test('step input reads feature-state["population"] via coalesce', () => {
    // step[1] = ['to-number', ['coalesce', ['feature-state', 'population'], 0], 0]
    const toNumber = color[1] as unknown[];
    expect(toNumber[0]).toBe('to-number');
    const coalesce = toNumber[1] as unknown[];
    expect(coalesce[0]).toBe('coalesce');
    expect(coalesce[1]).toEqual(['feature-state', 'population']);
  });

  test('fallback color (below first threshold) is #9ca3af', () => {
    expect(color[2]).toBe('#9ca3af');
  });

  test('step has 3 threshold stops with colors from palette', () => {
    // [step, input, fallback, 5M, color1, 10M, color2, 15M, color3]
    expect(color[3]).toBe(5_000_000);
    expect(color[4]).toBe('#fcae91');
    expect(color[5]).toBe(10_000_000);
    expect(color[6]).toBe('#fb6a4a');
    expect(color[7]).toBe(15_000_000);
    expect(color[8]).toBe('#cb181d');
  });

  test('same 3 thresholds used in circle-radius step', () => {
    const radius = paint?.['circle-radius'] as unknown[];
    const radiusStep = radius[2] as unknown[];
    // radius stops: 5M, 10M, 15M
    expect(radiusStep[3]).toBe(color[3]);
    expect(radiusStep[5]).toBe(color[5]);
    expect(radiusStep[7]).toBe(color[7]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Stage 9: color + size share the SAME feature-state key
// ═══════════════════════════════════════════════════════════════════════════

describe('Stage 9 — circle-color and circle-radius read the same feature-state["population"]', () => {
  const mapLayer = toMaplibreLayer(
    storyLayer,
    undefined,
    storyLegends,
    storyMapData
  );
  const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;

  const extractColorStateKey = (): string => {
    const color = paint?.['circle-color'] as unknown[];
    const toNumber = color[1] as unknown[];
    const coalesce = toNumber[1] as unknown[];
    return (coalesce[1] as unknown[])[1] as string;
  };

  const extractSizeStateKey = (): string => {
    const radius = paint?.['circle-radius'] as unknown[];
    const guard = radius[1] as unknown[];
    return (guard[1] as unknown[])[1] as string;
  };

  test('both extract "population" as the stateKey', () => {
    expect(extractColorStateKey()).toBe('population');
    expect(extractSizeStateKey()).toBe('population');
  });

  test('stateKey matches the mapData entry', () => {
    expect(extractColorStateKey()).toBe(storyMapData[0]!.stateKey);
    expect(extractSizeStateKey()).toBe(storyMapData[0]!.stateKey);
  });

  test('without specMapData both default to "value" (consistent fallback)', () => {
    const noDataLayer = toMaplibreLayer(
      storyLayer,
      undefined,
      storyLegends,
      undefined
    );
    const noDataPaint = (noDataLayer as { paint?: Record<string, unknown> })
      .paint;

    // circle-color step → input is [to-number, [coalesce, [feature-state, 'X'], 0], 0]
    const colorToNumber = (
      noDataPaint?.['circle-color'] as unknown[]
    )[1] as unknown[];
    const colorCoalesce = colorToNumber[1] as unknown[];
    const colorKey = (colorCoalesce[1] as unknown[])[1] as string;

    // circle-radius case → guard is ['!=', [feature-state, 'X'], null]
    const sizeGuard = (
      noDataPaint?.['circle-radius'] as unknown[]
    )[1] as unknown[];
    const sizeKey = (sizeGuard[1] as unknown[])[1] as string;

    expect(colorKey).toBe('value');
    expect(sizeKey).toBe('value');
    expect(colorKey).toBe(sizeKey);
  });

  test('setFeatureState writes { population: X } — same key both expressions read', () => {
    const MOCK_FEATURES = CITIES_GEOJSON.features.map((f, i) => {
      return { id: i, properties: f.properties };
    });

    const map = {
      getSource: jest.fn(() => {
        return { type: 'geojson' };
      }),
      setFeatureState: jest.fn(),
      querySourceFeatures: jest.fn(() => {
        return MOCK_FEATURES;
      }),
    } as unknown as maplibregl.Map;

    applyMapDataToSource(map, storyMapData[0]!);

    const calls = jest.mocked(map.setFeatureState).mock.calls;
    const stateKeys = new Set(
      calls.flatMap((c) => {
        return Object.keys(c[1] as Record<string, unknown>);
      })
    );
    // setFeatureState writes exactly { population: <value> }
    expect(stateKeys).toEqual(new Set(['population']));
    // which matches the stateKey both expressions read
    expect(extractColorStateKey()).toBe('population');
    expect(extractSizeStateKey()).toBe('population');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Stage 10: color step produces correct colors for each city
// ═══════════════════════════════════════════════════════════════════════════

describe('Stage 10 — color step expression maps population to correct colors', () => {
  const mapLayer = toMaplibreLayer(
    storyLayer,
    undefined,
    storyLegends,
    storyMapData
  );
  const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
  const colorStep = paint?.['circle-color'] as unknown[];

  // Bin → color mapping from legend config:
  //   < 5M        → '#9ca3af' (defaultColor / fallback)
  //   5M – 10M    → '#fcae91' (palette[1])
  //   10M – 15M   → '#fb6a4a' (palette[2])
  //   > 15M       → '#cb181d' (palette[3])
  const BELOW_5M = '#9ca3af';
  const FROM_5M_TO_10M = '#fcae91';
  const FROM_10M_TO_15M = '#fb6a4a';
  const ABOVE_15M = '#cb181d';

  test('Buenos Aires (3.07M < 5M) → #9ca3af', () => {
    expect(evalColorStep(colorStep, 3_070_000)).toBe(BELOW_5M);
  });

  test('New York (8.34M) → #fcae91', () => {
    expect(evalColorStep(colorStep, 8_336_000)).toBe(FROM_5M_TO_10M);
  });

  test('London (8.98M) → #fcae91', () => {
    expect(evalColorStep(colorStep, 8_982_000)).toBe(FROM_5M_TO_10M);
  });

  test('Mexico City (9.21M) → #fcae91', () => {
    expect(evalColorStep(colorStep, 9_210_000)).toBe(FROM_5M_TO_10M);
  });

  test('Cairo (9.54M) → #fcae91', () => {
    expect(evalColorStep(colorStep, 9_540_000)).toBe(FROM_5M_TO_10M);
  });

  test('Bangkok (10.54M) → #fb6a4a', () => {
    expect(evalColorStep(colorStep, 10_540_000)).toBe(FROM_10M_TO_15M);
  });

  test('Delhi (11.03M) → #fb6a4a', () => {
    expect(evalColorStep(colorStep, 11_030_000)).toBe(FROM_10M_TO_15M);
  });

  test('São Paulo (12.33M) → #fb6a4a', () => {
    expect(evalColorStep(colorStep, 12_330_000)).toBe(FROM_10M_TO_15M);
  });

  test('Tokyo (13.96M) → #fb6a4a', () => {
    expect(evalColorStep(colorStep, 13_960_000)).toBe(FROM_10M_TO_15M);
  });

  test('Shanghai (24.87M > 15M) → #cb181d', () => {
    expect(evalColorStep(colorStep, 24_870_000)).toBe(ABOVE_15M);
  });

  test('10 cities produce exactly 4 distinct colors', () => {
    const colors = CITIES_GEOJSON.features.map((f) => {
      return evalColorStep(colorStep, f.properties?.population as number);
    });
    const distinct = new Set(colors);
    expect(distinct.size).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Stage 11: color and radius bins use identical thresholds
// ═══════════════════════════════════════════════════════════════════════════

describe('Stage 11 — color and size bins are driven by the same thresholds and population', () => {
  const mapLayer = toMaplibreLayer(
    storyLayer,
    undefined,
    storyLegends,
    storyMapData
  );
  const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
  const colorStep = paint?.['circle-color'] as unknown[];
  const radiusExpr = paint?.['circle-radius'] as unknown[];
  const radiusStep = radiusExpr[2] as unknown[];

  const BIN_0 = 6;
  const BIN_1 = 6 + (28 - 6) * (1 / 3);
  const BIN_2 = 6 + (28 - 6) * (2 / 3);
  const BIN_3 = 28;

  const BELOW_5M = '#9ca3af';
  const FROM_5M_TO_10M = '#fcae91';
  const FROM_10M_TO_15M = '#fb6a4a';
  const ABOVE_15M = '#cb181d';

  const CITY_BIN: Record<
    string,
    { pop: number; color: string; radius: number }
  > = {
    'buenos-aires': { pop: 3_070_000, color: BELOW_5M, radius: BIN_0 },
    'new-york': { pop: 8_336_000, color: FROM_5M_TO_10M, radius: BIN_1 },
    london: { pop: 8_982_000, color: FROM_5M_TO_10M, radius: BIN_1 },
    'mexico-city': { pop: 9_210_000, color: FROM_5M_TO_10M, radius: BIN_1 },
    cairo: { pop: 9_540_000, color: FROM_5M_TO_10M, radius: BIN_1 },
    bangkok: { pop: 10_540_000, color: FROM_10M_TO_15M, radius: BIN_2 },
    delhi: { pop: 11_030_000, color: FROM_10M_TO_15M, radius: BIN_2 },
    'sao-paulo': { pop: 12_330_000, color: FROM_10M_TO_15M, radius: BIN_2 },
    tokyo: { pop: 13_960_000, color: FROM_10M_TO_15M, radius: BIN_2 },
    shanghai: { pop: 24_870_000, color: ABOVE_15M, radius: BIN_3 },
  };

  for (const [cityId, expected] of Object.entries(CITY_BIN)) {
    test(`${cityId} (${(expected.pop / 1e6).toFixed(1)}M) → color=${expected.color}, radius≈${expected.radius.toFixed(1)}px`, () => {
      const actualColor = evalColorStep(colorStep, expected.pop);
      const actualRadius = evalStep(radiusStep, expected.pop);

      expect(actualColor).toBe(expected.color);
      expect(actualRadius).toBeCloseTo(expected.radius, 1);
    });
  }

  test('cities in the same bin share both color and radius', () => {
    const binGroups: Record<string, string[]> = {
      bin0: ['buenos-aires'],
      bin1: ['new-york', 'london', 'mexico-city', 'cairo'],
      bin2: ['bangkok', 'delhi', 'sao-paulo', 'tokyo'],
      bin3: ['shanghai'],
    };

    for (const [, cities] of Object.entries(binGroups)) {
      const colors = cities.map((c) => {
        return evalColorStep(colorStep, CITY_BIN[c]!.pop);
      });
      const radii = cities.map((c) => {
        return evalStep(radiusStep, CITY_BIN[c]!.pop);
      });

      // All cities in the same bin share the same color
      expect(new Set(colors).size).toBe(1);
      // All cities in the same bin share the same radius
      expect(
        new Set(
          radii.map((r) => {
            return Math.round(r * 100) / 100;
          })
        ).size
      ).toBe(1);
    }
  });

  test('no city has color mismatch between color and size bin', () => {
    // Verify that the color bin and size bin boundaries are identical
    // by checking that cities on the same side of a threshold get
    // consistent assignments in both expressions
    const threshold = 10_000_000;

    const belowThreshold = Object.values(CITY_BIN).filter((c) => {
      return c.pop < threshold;
    });
    const between10MAnd15M = Object.values(CITY_BIN).filter((c) => {
      return c.pop >= threshold && c.pop < 15_000_000;
    });
    const above15M = Object.values(CITY_BIN).filter((c) => {
      return c.pop >= 15_000_000;
    });

    // All below-threshold cities get colors below the 10M+ color
    for (const city of belowThreshold) {
      const color = evalColorStep(colorStep, city.pop);
      expect(color).not.toBe(FROM_10M_TO_15M);
      expect(color).not.toBe(ABOVE_15M);
    }
    // All 10M–15M cities get the 10M color
    for (const city of between10MAnd15M) {
      expect(evalColorStep(colorStep, city.pop)).toBe(FROM_10M_TO_15M);
    }
    // All above-15M cities get the 15M+ color
    for (const city of above15M) {
      expect(evalColorStep(colorStep, city.pop)).toBe(ABOVE_15M);
    }
  });
});
