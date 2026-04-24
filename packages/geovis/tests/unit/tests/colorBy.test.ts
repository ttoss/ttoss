import {
  buildColorByAccessor,
  computeQuantileBreaks,
  evaluateColorByExpression,
  resolveCategoricalColorBy,
  resolveColorBy,
  resolveColorByPalette,
  resolveQuantitativeColorBy,
} from 'src/spec/colorBy';
import type {
  CategoricalColorBy,
  GeoJSONFeature,
  QuantitativeColorBy,
} from 'src/spec/types';

const buildFeatures = (
  rows: Array<Record<string, unknown>>
): GeoJSONFeature[] => {
  return rows.map((properties) => {
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties,
    } as GeoJSONFeature;
  });
};

describe('resolveColorByPalette', () => {
  test('prefers explicit colors when provided', () => {
    const colorBy: QuantitativeColorBy = {
      type: 'quantitative',
      property: 'pop',
      scale: 'quantile',
      colors: ['#000', '#111', '#222'],
    };
    expect(resolveColorByPalette(colorBy)).toEqual(['#000', '#111', '#222']);
  });

  test('uses named palette when no colors are set', () => {
    const colorBy: QuantitativeColorBy = {
      type: 'quantitative',
      property: 'pop',
      scale: 'quantile',
      palette: 'Blues',
    };
    expect(resolveColorByPalette(colorBy)).toHaveLength(5);
  });

  test('falls back to the default 5-class Blues ramp', () => {
    const colorBy: QuantitativeColorBy = {
      type: 'quantitative',
      property: 'pop',
      scale: 'quantile',
    };
    expect(resolveColorByPalette(colorBy)).toHaveLength(5);
  });
});

describe('computeQuantileBreaks', () => {
  test('returns bins-1 break-points for a sorted distribution', () => {
    const breaks = computeQuantileBreaks([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5);
    expect(breaks).toHaveLength(4);
    expect(breaks[0]).toBeLessThan(breaks[breaks.length - 1]);
  });

  test('returns an empty array for empty input or bins <= 1', () => {
    expect(computeQuantileBreaks([], 5)).toEqual([]);
    expect(computeQuantileBreaks([1, 2, 3], 1)).toEqual([]);
  });

  test('deduplicates breaks when many features share the same value', () => {
    // Skewed data: most features have value 0, causing duplicate quantile boundaries.
    const values = [0, 0, 0, 0, 0, 0, 0, 0, 100, 200];
    const breaks = computeQuantileBreaks(values, 5);
    // All returned breaks must be strictly ascending (no duplicates).
    for (let i = 1; i < breaks.length; i++) {
      expect(breaks[i]).toBeGreaterThan(breaks[i - 1]);
    }
  });
});

describe('resolveQuantitativeColorBy', () => {
  test('computes quantile thresholds from feature data', () => {
    const features = buildFeatures([
      { pop: 100 },
      { pop: 200 },
      { pop: 300 },
      { pop: 400 },
      { pop: 500 },
    ]);
    const resolved = resolveQuantitativeColorBy(
      { type: 'quantitative', property: 'pop', scale: 'quantile', bins: 3 },
      features
    );
    expect(resolved).not.toBeNull();
    expect(resolved!.thresholds).toHaveLength(2);
    expect(resolved!.palette.length).toBeGreaterThan(0);
    expect(resolved!.defaultColor).toBe(resolved!.palette[0]);
  });

  test('honors explicit thresholds when scale is "threshold"', () => {
    const features = buildFeatures([{ pop: 1 }, { pop: 2 }]);
    const resolved = resolveQuantitativeColorBy(
      {
        type: 'quantitative',
        property: 'pop',
        scale: 'threshold',
        thresholds: [50, 100, 150],
      },
      features
    );
    expect(resolved!.thresholds).toEqual([50, 100, 150]);
  });

  test('computes evenly spaced linear thresholds', () => {
    const features = buildFeatures([{ pop: 0 }, { pop: 10 }, { pop: 20 }]);
    const resolved = resolveQuantitativeColorBy(
      { type: 'quantitative', property: 'pop', scale: 'linear', bins: 4 },
      features
    );
    expect(resolved!.thresholds).toHaveLength(3);
  });

  test('returns null when no numeric values can be extracted', () => {
    const features = buildFeatures([{ pop: 'n/a' }, { pop: undefined }]);
    const resolved = resolveQuantitativeColorBy(
      { type: 'quantitative', property: 'pop', scale: 'quantile' },
      features
    );
    expect(resolved).toBeNull();
  });
});

describe('resolveCategoricalColorBy', () => {
  test('cycles palette across distinct values and keeps explicit mapping', () => {
    const features = buildFeatures([
      { tier: 'a' },
      { tier: 'b' },
      { tier: 'c' },
      { tier: 'a' },
    ]);
    const colorBy: CategoricalColorBy = {
      type: 'categorical',
      property: 'tier',
      mapping: { a: '#ff0000' },
      colors: ['#aaa', '#bbb', '#ccc'],
    };
    const resolved = resolveCategoricalColorBy(colorBy, features);
    expect(resolved.mapping.a).toBe('#ff0000');
    expect(Object.keys(resolved.mapping)).toEqual(
      expect.arrayContaining(['a', 'b', 'c'])
    );
  });
});

describe('resolveColorBy dispatcher', () => {
  test('dispatches to quantitative resolver', () => {
    const features = buildFeatures([{ pop: 1 }, { pop: 2 }]);
    const resolved = resolveColorBy(
      { type: 'quantitative', property: 'pop', scale: 'quantile' },
      features
    );
    expect(resolved?.type).toBe('quantitative');
  });

  test('dispatches to categorical resolver', () => {
    const features = buildFeatures([{ tier: 'a' }]);
    const resolved = resolveColorBy(
      { type: 'categorical', property: 'tier' },
      features
    );
    expect(resolved?.type).toBe('categorical');
  });
});
describe('evaluateColorByExpression', () => {
  const props = { population: 1000, area: 50 };

  test('reads numeric property via get', () => {
    expect(evaluateColorByExpression(['get', 'population'], props)).toBe(1000);
  });

  test('coerces with to-number', () => {
    expect(
      evaluateColorByExpression(['to-number', ['get', 'population']], props)
    ).toBe(1000);
  });

  test('evaluates division', () => {
    expect(
      evaluateColorByExpression(
        ['/', ['get', 'population'], ['get', 'area']],
        props
      )
    ).toBe(20);
  });

  test('evaluates nested arithmetic', () => {
    expect(
      evaluateColorByExpression(
        ['*', ['/', ['get', 'population'], ['get', 'area']], 100],
        props
      )
    ).toBe(2000);
  });

  test('returns null for divide by zero', () => {
    expect(evaluateColorByExpression(['/', 1, 0], {})).toBeNull();
  });

  test('returns null when property is missing', () => {
    expect(evaluateColorByExpression(['get', 'missing'], {})).toBeNull();
  });
});

describe('buildColorByAccessor', () => {
  test('wraps property in to-number for quantitative', () => {
    expect(
      buildColorByAccessor({
        type: 'quantitative',
        property: 'pop',
        scale: 'quantile',
      })
    ).toEqual(['to-number', ['get', 'pop']]);
  });

  test('wraps property in to-string for categorical', () => {
    expect(
      buildColorByAccessor({ type: 'categorical', property: 'tier' })
    ).toEqual(['to-string', ['get', 'tier']]);
  });

  test('returns the expression verbatim when present', () => {
    const expr = ['/', ['get', 'a'], ['get', 'b']] as const;
    expect(
      buildColorByAccessor({
        type: 'quantitative',
        expression: expr,
        scale: 'quantile',
      })
    ).toBe(expr);
  });
});

describe('resolveQuantitativeColorBy with expression', () => {
  test('computes thresholds from a derived metric (density)', () => {
    const features = buildFeatures([
      { population: 100, area: 10 }, // density 10
      { population: 800, area: 4 }, //  density 200
      { population: 500, area: 5 }, //  density 100
    ]);
    const resolved = resolveQuantitativeColorBy(
      {
        type: 'quantitative',
        expression: ['/', ['get', 'population'], ['get', 'area']],
        scale: 'quantile',
        bins: 3,
      },
      features
    );
    expect(resolved).not.toBeNull();
    expect(resolved!.thresholds.length).toBeGreaterThan(0);
    // Thresholds must reflect the derived density distribution (10, 100, 200),
    // not the raw population distribution (100, 500, 800).
    expect(Math.max(...resolved!.thresholds)).toBeLessThan(800);
  });

  test('returns null when neither property nor expression is set', () => {
    const features = buildFeatures([{ pop: 1 }]);
    const resolved = resolveQuantitativeColorBy(
      { type: 'quantitative', scale: 'quantile' } as QuantitativeColorBy,
      features
    );
    expect(resolved).toBeNull();
  });
});
