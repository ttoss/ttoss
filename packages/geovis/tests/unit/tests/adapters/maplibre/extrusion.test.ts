/**
 * The `fill-extrusion-height` expression of an extruded polygon layer: one
 * step per legend class in `'class'` mode, a linear ramp to the largest value
 * in `'continuous'` mode, and flat for features without a value either way.
 */

import {
  buildExtrusionHeightExpression,
  DEFAULT_EXTRUSION_MAX_HEIGHT,
  resolveClassHeights,
} from 'src/adapters/maplibre/extrusion';
import type { MapData } from 'src/spec/types';

const VALUE = ['to-number', ['feature-state', 'value'], 0];
const HAS_VALUE = ['!=', ['feature-state', 'value'], null];

const mapDataWith = (values: MapData['data'][number]['value'][]): MapData => {
  return {
    mapDataId: 'rates',
    mapId: 'districts',
    data: values.map((value, index) => {
      return { geometryId: index + 1, value };
    }),
  };
};

describe('resolveClassHeights', () => {
  test('steps maxHeight evenly, the lowest class one step tall', () => {
    expect(
      resolveClassHeights({ extrusion: { maxHeight: 3000 }, count: 3 })
    ).toEqual([1000, 2000, 3000]);
  });

  test('defaults maxHeight', () => {
    expect(resolveClassHeights({ extrusion: {}, count: 1 })).toEqual([
      DEFAULT_EXTRUSION_MAX_HEIGHT,
    ]);
  });

  test('uses explicit heights, repeating the last for the remaining classes', () => {
    expect(
      resolveClassHeights({
        extrusion: { maxHeight: 9999, heights: [100, 400] },
        count: 4,
      })
    ).toEqual([100, 400, 400, 400]);
  });

  test('ignores non-finite heights, falling back to maxHeight when none is left', () => {
    expect(
      resolveClassHeights({
        extrusion: { maxHeight: 200, heights: [Number.NaN] },
        count: 2,
      })
    ).toEqual([100, 200]);
  });
});

describe('buildExtrusionHeightExpression', () => {
  test('class mode steps over the breaks, flat without a value', () => {
    expect(
      buildExtrusionHeightExpression({
        extrusion: { maxHeight: 3000 },
        breaks: [10, 20],
        stateKey: 'value',
      })
    ).toEqual([
      'case',
      HAS_VALUE,
      ['step', VALUE, 1000, 10, 2000, 20, 3000],
      0,
    ]);
  });

  test('reads the given state key', () => {
    const expression = buildExtrusionHeightExpression({
      extrusion: { mode: 'class', maxHeight: 200 },
      breaks: [5],
      stateKey: 'rate',
    }) as unknown[];

    expect(expression[1]).toEqual(['!=', ['feature-state', 'rate'], null]);
  });

  test('continuous mode interpolates from 0 to the largest value', () => {
    expect(
      buildExtrusionHeightExpression({
        extrusion: { mode: 'continuous', maxHeight: 500 },
        breaks: [10, 20],
        stateKey: 'value',
        mapData: mapDataWith([4, 25, null, 'n/a', Number.POSITIVE_INFINITY]),
      })
    ).toEqual([
      'case',
      HAS_VALUE,
      ['interpolate', ['linear'], VALUE, 0, 0, 25, 500],
      0,
    ]);
  });

  test('class mode without breaks falls back to continuous, at the default height', () => {
    expect(
      buildExtrusionHeightExpression({
        extrusion: {},
        breaks: [],
        stateKey: 'value',
        mapData: mapDataWith([8]),
      })
    ).toEqual([
      'case',
      HAS_VALUE,
      ['interpolate', ['linear'], VALUE, 0, 0, 8, DEFAULT_EXTRUSION_MAX_HEIGHT],
      0,
    ]);
  });

  test('stays flat when no value is positive', () => {
    expect(
      buildExtrusionHeightExpression({
        extrusion: { mode: 'continuous' },
        breaks: [],
        stateKey: 'value',
        mapData: mapDataWith([0, -3]),
      })
    ).toBe(0);
    expect(
      buildExtrusionHeightExpression({
        extrusion: { mode: 'continuous' },
        breaks: [],
        stateKey: 'value',
      })
    ).toBe(0);
  });
});
