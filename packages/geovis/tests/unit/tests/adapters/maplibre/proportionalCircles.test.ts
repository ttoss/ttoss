import type maplibregl from 'maplibre-gl';
import { toMaplibreLayer } from 'src/adapters/maplibre/layerTranslation';
import {
  buildProportionalCircleRadiusExpression,
  buildSizeExpression,
} from 'src/adapters/maplibre/legendTranslation';
import { resolveSpecFromMapType } from 'src/spec/mapTypeDefaults';
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
    variable: 'value',
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

const resolveAndTranslate = (
  spec: VisualizationSpec
): maplibregl.LayerSpecification[] => {
  const resolved = resolveSpecFromMapType(spec);
  return resolved.layers.map((layer) => {
    return toMaplibreLayer(
      layer,
      undefined,
      resolved.legends,
      resolved.mapData,
      resolved.scaleMaxValue
    );
  });
};

const findCircleLayer = (
  layers: maplibregl.LayerSpecification[]
): maplibregl.LayerSpecification & {
  paint: Record<string, unknown>;
} => {
  const circle = layers.find((l) => {
    return l.type === 'circle';
  });
  if (!circle) throw new Error('no circle layer produced');
  return circle as maplibregl.LayerSpecification & {
    paint: Record<string, unknown>;
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// buildProportionalCircleRadiusExpression — useGetExpression flag
// ═══════════════════════════════════════════════════════════════════════════

describe('buildProportionalCircleRadiusExpression', () => {
  test('produces case expression with sqrt interpolation', () => {
    const expr = buildProportionalCircleRadiusExpression({
      sizeBy: { range: [4, 36] },
      scaleMaxValue: 500000,
      zeroRadiusPx: 0,
      stateKey: 'population',
      useGetExpression: true,
    });

    expect(Array.isArray(expr)).toBe(true);
    expect(expr[0]).toBe('case');
    const interpolateExpr = expr.find((node) => {
      return Array.isArray(node) && node[0] === 'interpolate';
    }) as unknown[];
    expect(interpolateExpr).toBeDefined();

    const sqrtExpr = interpolateExpr[2];
    expect(Array.isArray(sqrtExpr)).toBe(true);
    expect(sqrtExpr[0]).toBe('sqrt');
    expect(sqrtExpr[1][0]).toBe('min');
  });

  test('uses get expression when useGetExpression is true', () => {
    const expr = buildProportionalCircleRadiusExpression({
      sizeBy: { range: [4, 36] },
      scaleMaxValue: 500000,
      zeroRadiusPx: 0,
      stateKey: 'population',
      useGetExpression: true,
    }) as unknown[];

    const flat = JSON.stringify(expr);
    expect(flat).toContain('"get"');
    expect(flat).toContain('"population"');
    expect(flat).not.toContain('feature-state');
  });

  test('uses feature-state expression when useGetExpression is false', () => {
    const expr = buildProportionalCircleRadiusExpression({
      sizeBy: { range: [4, 36] },
      scaleMaxValue: 500000,
      zeroRadiusPx: 0,
      stateKey: 'pop',
      useGetExpression: false,
    }) as unknown[];

    const flat = JSON.stringify(expr);
    expect(flat).toContain('feature-state');
    expect(flat).toContain('"pop"');
    expect(flat).not.toContain('"get"');
  });

  test('maps values above scaleMaxValue to max radius via min clamp', () => {
    const expr = buildProportionalCircleRadiusExpression({
      sizeBy: { range: [4, 36] },
      scaleMaxValue: 500000,
      zeroRadiusPx: 0,
      stateKey: 'value',
      useGetExpression: false,
    }) as unknown[];

    const flat = JSON.stringify(expr);
    expect(flat).toContain('"min"');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// toMaplibreLayer — propertyName → ['get', ...] path
// ═══════════════════════════════════════════════════════════════════════════

describe('toMaplibreLayer — propertyName without mapData', () => {
  test('circle-radius uses ["get", propertyName] when propertyName is set and no mapDataId', () => {
    const layers = resolveAndTranslate(
      makeSpec({
        scaleMaxValue: 500000,
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            propertyName: 'population',
            sizeBy: { range: [4, 36], transform: 'sqrt' },
          },
        ],
      })
    );

    const circle = findCircleLayer(layers);
    const radiusJson = JSON.stringify(circle.paint['circle-radius']);
    expect(radiusJson).toContain('"get"');
    expect(radiusJson).toContain('"population"');
    expect(radiusJson).not.toContain('feature-state');
  });

  test('null values are coalesced to 0 in the radius expression', () => {
    const layers = resolveAndTranslate(
      makeSpec({
        scaleMaxValue: 500000,
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            propertyName: 'population',
            sizeBy: { range: [4, 36], transform: 'sqrt' },
          },
        ],
      })
    );

    const radius = findCircleLayer(layers).paint['circle-radius'] as unknown[];
    expect(radius[0]).toBe('case');
    expect(JSON.stringify(radius[1])).toContain('"to-number"');
    expect(JSON.stringify(radius[1])).toContain('0');
  });
});

describe('toMaplibreLayer — propertyName with mapDataId', () => {
  test('circle-radius uses feature-state when both propertyName and mapDataId are set', () => {
    const layers = resolveAndTranslate(
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
            sizeBy: { range: [4, 36], transform: 'sqrt' },
          },
        ],
      })
    );

    const circle = findCircleLayer(layers);
    const radiusJson = JSON.stringify(circle.paint['circle-radius']);
    // mapDataId takes precedence → feature-state path
    expect(radiusJson).toContain('feature-state');
    expect(radiusJson).not.toContain('"get"');
  });
});

describe('toMaplibreLayer — color-only mapData + propertyName size', () => {
  test('size uses ["get", propertyName] when the only mapData is a color dataset', () => {
    // Mirrors the GenderDominancePropertyName story: colour comes from a
    // categorical `mapData` (dimension: 'color'), while circle SIZE comes from
    // a numeric GeoJSON property via `propertyName`. The resolved point layer
    // must NOT inherit the colour dataset's `mapDataId`, otherwise the radius
    // expression falls back to feature-state on the categorical key and every
    // circle collapses to a single size.
    const layers = resolveAndTranslate(
      makeSpec({
        sources: [
          {
            id: 'centroids',
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  id: 'a',
                  geometry: { type: 'Point', coordinates: [0, 0] },
                  properties: { total: 100 },
                },
                {
                  type: 'Feature',
                  id: 'b',
                  geometry: { type: 'Point', coordinates: [1, 1] },
                  properties: { total: 487321 },
                },
              ],
            },
          },
        ],
        layers: [
          {
            id: 'centroids-layer',
            sourceId: 'centroids',
            geometry: 'point',
            propertyName: 'total',
            activeLegendId: 'gender',
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

    const circle = findCircleLayer(layers);
    const radiusJson = JSON.stringify(circle.paint['circle-radius']);
    // Size must read the GeoJSON property directly, never the categorical
    // colour feature-state.
    expect(radiusJson).toContain('"get"');
    expect(radiusJson).toContain('"total"');
    expect(radiusJson).not.toContain('feature-state');
    // A scaleMaxValue must be derived from the inline GeoJSON so the radius
    // uses the clamped sqrt-ceiling expression (not a flat fallback).
    expect(radiusJson).toContain('"min"');
    expect(radiusJson).toContain('"sqrt"');
  });
});

describe('toMaplibreLayer — mapData without propertyName', () => {
  test('circle-radius uses feature-state with the resolved stateKey', () => {
    const layers = resolveAndTranslate(
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
              { geometryId: 'c', value: 500000 },
            ],
          },
        ],
      })
    );

    const circle = findCircleLayer(layers);
    const radiusJson = JSON.stringify(circle.paint['circle-radius']);
    expect(radiusJson).toContain('feature-state');
    expect(radiusJson).toContain('"pop"');
  });

  test('circle-color reads the color stateKey, circle-radius reads the size stateKey', () => {
    const layers = resolveAndTranslate(
      makeSpec({
        scaleMaxValue: 500000,
        mapData: [
          {
            mapDataId: 'colorData',
            mapId: 'points',
            dimension: 'color',
            stateKey: 'gdpClass',
            data: [
              { geometryId: 'a', value: 1 },
              { geometryId: 'b', value: 2 },
            ],
          },
          {
            mapDataId: 'sizeData',
            mapId: 'points',
            dimension: 'size',
            stateKey: 'population',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 500000 },
            ],
          },
        ],
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            activeLegendId: 'colorData-legend',
            sizeBy: { range: [4, 36], transform: 'sqrt' },
          },
        ],
      })
    );

    const circle = findCircleLayer(layers);
    const radiusJson = JSON.stringify(circle.paint['circle-radius']);
    const colorJson = JSON.stringify(circle.paint['circle-color']);

    expect(radiusJson).toContain('population');
    expect(radiusJson).not.toContain('gdpClass');
    expect(colorJson).toContain('gdpClass');
    expect(colorJson).not.toContain('population');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// scaleMaxValue presence
// ═══════════════════════════════════════════════════════════════════════════

describe('toMaplibreLayer — scaleMaxValue presence', () => {
  test('with scaleMaxValue and propertyName, radius uses the clamped sqrt-ceiling expression', () => {
    const layers = resolveAndTranslate(
      makeSpec({
        scaleMaxValue: 500000,
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            propertyName: 'population',
            sizeBy: { range: [4, 36], transform: 'sqrt' },
          },
        ],
      })
    );
    const radius = JSON.stringify(
      findCircleLayer(layers).paint['circle-radius']
    );
    expect(radius).toContain('"min"');
    expect(radius).toContain('"sqrt"');
  });

  test('without scaleMaxValue, radius falls back to buildSizeExpression (legend-driven)', () => {
    const layers = resolveAndTranslate(
      makeSpec({
        mapData: [
          {
            mapDataId: 'popData',
            mapId: 'points',
            stateKey: 'population',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 500000 },
            ],
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
    const radius = JSON.stringify(
      findCircleLayer(layers).paint['circle-radius']
    );
    expect(radius).toContain('"interpolate"');
    expect(radius).toContain('"feature-state"');
  });

  test('propertyName without scaleMaxValue falls back to buildSizeExpression with get expression', () => {
    const layers = resolveAndTranslate(
      makeSpec({
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            propertyName: 'population',
            sizeBy: { range: [4, 36], transform: 'sqrt' },
          },
        ],
      })
    );
    const radius = JSON.stringify(
      findCircleLayer(layers).paint['circle-radius']
    );
    // Should use ['get', ...] not ['feature-state', ...]
    expect(radius).toContain('"get"');
    expect(radius).not.toContain('"feature-state"');
    expect(radius).toContain('"interpolate"');
  });

  test('propertyName without scaleMaxValue — stepped mode uses get expression', () => {
    const layers = resolveAndTranslate(
      makeSpec({
        layers: [
          {
            id: 'points-layer',
            sourceId: 'points',
            geometry: 'point',
            propertyName: 'population',
            sizeBy: { range: [4, 36], mode: 'stepped', thresholds: [100, 500] },
          },
        ],
      })
    );
    const radius = JSON.stringify(
      findCircleLayer(layers).paint['circle-radius']
    );
    expect(radius).toContain('"get"');
    expect(radius).not.toContain('"feature-state"');
    expect(radius).toContain('"step"');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// buildSizeExpression — invalid ranges
// ═══════════════════════════════════════════════════════════════════════════

describe('buildSizeExpression — invalid sizeBy.range throws', () => {
  test('min >= max throws', () => {
    expect(() => {
      return buildSizeExpression({ range: [10, 10] }, 6, undefined, 'value');
    }).toThrow(/min < max/);
  });

  test('min <= 0 throws', () => {
    expect(() => {
      return buildSizeExpression({ range: [0, 36] }, 6, undefined, 'value');
    }).toThrow(/both > 0/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Radius clamp boundaries
// ═══════════════════════════════════════════════════════════════════════════

describe('buildProportionalCircleRadiusExpression — radius clamp boundaries', () => {
  test('values <= 0 map to zeroRadiusPx', () => {
    const expr = buildProportionalCircleRadiusExpression({
      sizeBy: { range: [4, 36] },
      scaleMaxValue: 500000,
      zeroRadiusPx: 0,
      stateKey: 'value',
      useGetExpression: true,
    });
    expect(expr[0]).toBe('case');
    expect(expr[1]).toEqual(['<=', ['to-number', ['get', 'value'], 0], 0]);
    expect(expr[2]).toBe(0);
  });

  test('values above scaleMaxValue clamp to maxRadius via min + sqrt ceiling', () => {
    const expr = buildProportionalCircleRadiusExpression({
      sizeBy: { range: [4, 36] },
      scaleMaxValue: 500000,
      zeroRadiusPx: 0,
      stateKey: 'value',
      useGetExpression: true,
    });
    const interpolate = expr[3] as unknown[];
    expect(interpolate[0]).toBe('interpolate');
    expect(interpolate[interpolate.length - 1]).toBe(36);
    expect(JSON.stringify(interpolate[2])).toContain('"min"');
  });
});
