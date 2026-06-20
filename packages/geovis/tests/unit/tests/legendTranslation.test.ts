import {
  buildFillColorExpression,
  buildSizeExpression,
} from 'src/adapters/maplibre/legendTranslation';
import type { LegendSpec, SizeBy } from 'src/spec/types';

describe('buildFillColorExpression', () => {
  test('builds match expression for categorical legends', () => {
    const legend: LegendSpec = {
      id: 'status-legend',
      colorBy: {
        type: 'categorical',
        property: 'status',
        mapping: {
          open: '#16a34a',
          closed: '#dc2626',
        },
        defaultColor: '#6b7280',
      },
    };

    const expression = buildFillColorExpression({ legend });

    expect(expression).toEqual([
      'match',
      ['to-string', ['coalesce', ['feature-state', 'value'], '__missing__']],
      'open',
      '#16a34a',
      'closed',
      '#dc2626',
      '#6b7280',
    ]);
  });

  test('builds step expression for quantitative legends', () => {
    const legend: LegendSpec = {
      id: 'population-legend',
      colorBy: {
        type: 'quantitative',
        property: 'population',
        scale: 'threshold',
        colors: ['#eff6ff', '#bfdbfe', '#60a5fa'],
        defaultColor: '#1e3a8a',
      },
    };

    const expression = buildFillColorExpression({
      legend,
      breaks: [100, 300],
    });

    expect(expression).toEqual([
      'step',
      ['to-number', ['coalesce', ['feature-state', 'value'], 0], 0],
      '#1e3a8a',
      100,
      '#bfdbfe',
      300,
      '#60a5fa',
    ]);
  });
});

describe('buildSizeExpression', () => {
  test('builds interpolate expression for continuous mode with legend thresholds', () => {
    const sizeBy = {
      property: 'population',
      range: [4, 20] as [number, number],
    };

    const expression = buildSizeExpression(sizeBy, 6, [100, 500, 1000]);

    expect(expression).toEqual([
      'case',
      ['!=', ['feature-state', 'value'], null],
      [
        'interpolate',
        ['linear'],
        ['to-number', ['feature-state', 'value']],
        100,
        4,
        1000,
        20,
      ],
      6,
    ]);
  });

  test('builds step expression for stepped mode with explicit thresholds', () => {
    const sizeBy = {
      property: 'population',
      range: [4, 20] as [number, number],
      mode: 'stepped' as const,
      thresholds: [100, 500],
    };

    const expression = buildSizeExpression(sizeBy, 6);

    expect(expression).toEqual([
      'case',
      ['!=', ['feature-state', 'value'], null],
      ['step', ['to-number', ['feature-state', 'value']], 4, 100, 12, 500, 20],
      6,
    ]);
  });

  test('builds step expression for stepped mode inheriting legend thresholds', () => {
    const sizeBy = {
      property: 'population',
      range: [4, 20] as [number, number],
      mode: 'stepped' as const,
    };

    const expression = buildSizeExpression(sizeBy, 6, [200, 800]);

    expect(expression).toEqual([
      'case',
      ['!=', ['feature-state', 'value'], null],
      ['step', ['to-number', ['feature-state', 'value']], 4, 200, 12, 800, 20],
      6,
    ]);
  });

  test('falls back to continuous expression when stepped has no thresholds and no legend', () => {
    const sizeBy = {
      property: 'population',
      range: [4, 20] as [number, number],
      mode: 'stepped' as const,
    };

    const expression = buildSizeExpression(sizeBy, 6);

    // Without data bounds, continuous fallback produces a case expression
    // that returns fallbackRadius when feature-state is missing.
    expect(expression).toEqual([
      'case',
      ['!=', ['feature-state', 'value'], null],
      [
        'interpolate',
        ['linear'],
        ['to-number', ['feature-state', 'value']],
        4,
        4,
        20,
        20,
      ],
      6,
    ]);
  });

  test('throws for invalid range where min >= max', () => {
    const sizeBy = {
      property: 'population',
      range: [20, 4] as [number, number],
    };

    expect(() => {
      return buildSizeExpression(sizeBy, 6);
    }).toThrow();
  });
});

describe('buildFillColorExpression — stateKey support', () => {
  test('builds categorical expression with custom stateKey', () => {
    const legend: LegendSpec = {
      id: 'status-legend',
      colorBy: {
        type: 'categorical',
        property: 'status',
        mapping: {
          open: '#16a34a',
          closed: '#dc2626',
        },
        defaultColor: '#6b7280',
      },
    };

    const expression = buildFillColorExpression({
      legend,
      stateKey: 'pop',
    });

    expect(expression).toEqual([
      'match',
      ['to-string', ['coalesce', ['feature-state', 'pop'], '__missing__']],
      'open',
      '#16a34a',
      'closed',
      '#dc2626',
      '#6b7280',
    ]);
  });

  test('builds quantitative expression with custom stateKey', () => {
    const legend: LegendSpec = {
      id: 'population-legend',
      colorBy: {
        type: 'quantitative',
        property: 'population',
        scale: 'threshold',
        colors: ['#eff6ff', '#bfdbfe', '#60a5fa'],
        defaultColor: '#1e3a8a',
      },
    };

    const expression = buildFillColorExpression({
      legend,
      breaks: [100, 300],
      stateKey: 'pop',
    });

    expect(expression).toEqual([
      'step',
      ['to-number', ['coalesce', ['feature-state', 'pop'], 0], 0],
      '#1e3a8a',
      100,
      '#bfdbfe',
      300,
      '#60a5fa',
    ]);
  });

  test('uses "value" as default stateKey when not provided', () => {
    const legend: LegendSpec = {
      id: 'status-legend',
      colorBy: {
        type: 'categorical',
        property: 'status',
        mapping: { active: '#16a34a' },
        defaultColor: '#6b7280',
      },
    };

    const expression = buildFillColorExpression({ legend });

    // Should use 'value' as the default stateKey
    expect(expression).toEqual([
      'match',
      ['to-string', ['coalesce', ['feature-state', 'value'], '__missing__']],
      'active',
      '#16a34a',
      '#6b7280',
    ]);
  });
});

describe('buildSizeExpression — stateKey support', () => {
  test('builds continuous expression with custom stateKey', () => {
    const sizeBy = {
      property: 'density',
      range: [4, 20] as [number, number],
    };

    const expression = buildSizeExpression(
      sizeBy,
      6,
      [100, 500, 1000],
      'density'
    );

    expect(expression).toEqual([
      'case',
      ['!=', ['feature-state', 'density'], null],
      [
        'interpolate',
        ['linear'],
        ['to-number', ['feature-state', 'density']],
        100,
        4,
        1000,
        20,
      ],
      6,
    ]);
  });

  test('builds stepped expression with custom stateKey', () => {
    const sizeBy = {
      property: 'density',
      range: [4, 20] as [number, number],
      mode: 'stepped' as const,
      thresholds: [100, 500],
    };

    const expression = buildSizeExpression(sizeBy, 6, undefined, 'density');

    expect(expression).toEqual([
      'case',
      ['!=', ['feature-state', 'density'], null],
      [
        'step',
        ['to-number', ['feature-state', 'density']],
        4,
        100,
        12,
        500,
        20,
      ],
      6,
    ]);
  });

  test('uses "value" as default stateKey when not provided', () => {
    const sizeBy = {
      property: 'population',
      range: [4, 20] as [number, number],
    };

    const expression = buildSizeExpression(sizeBy, 6, [100, 500]);

    // Should use 'value' as the default stateKey
    expect(expression).toEqual([
      'case',
      ['!=', ['feature-state', 'value'], null],
      [
        'interpolate',
        ['linear'],
        ['to-number', ['feature-state', 'value']],
        100,
        4,
        500,
        20,
      ],
      6,
    ]);
  });

  test('uses sizeBy.thresholds when legendThresholds is empty (categorical legend)', () => {
    const sizeBy = {
      property: 'population',
      range: [4, 24] as [number, number],
      mode: 'continuous' as const,
      thresholds: [50_000, 100_000, 150_000, 200_000, 250_000],
    };

    const expression = buildSizeExpression(sizeBy, 6, []);

    expect(expression).toEqual([
      'case',
      ['!=', ['feature-state', 'value'], null],
      [
        'interpolate',
        ['linear'],
        ['to-number', ['feature-state', 'value']],
        50_000,
        4,
        250_000,
        24,
      ],
      6,
    ]);
  });

  test('prefers legendThresholds over sizeBy.thresholds when both provided', () => {
    const sizeBy = {
      property: 'population',
      range: [4, 24] as [number, number],
      mode: 'continuous' as const,
      thresholds: [50_000, 250_000],
    };

    const expression = buildSizeExpression(sizeBy, 6, [100, 1000]);

    // legendThresholds [100, 1000] should take priority
    expect(expression).toEqual([
      'case',
      ['!=', ['feature-state', 'value'], null],
      [
        'interpolate',
        ['linear'],
        ['to-number', ['feature-state', 'value']],
        100,
        4,
        1000,
        24,
      ],
      6,
    ]);
  });
});

describe('sizeBy with sqrt', () => {
  test('continuous sizeBy with sqrt applies sqrt to the input value before interpolation', () => {
    const sizeBy: SizeBy = {
      range: [4, 30],
      mode: 'continuous',
      transform: 'sqrt',
    };
    const expression = buildSizeExpression(sizeBy, 6, [100, 1000], 'pop');
    // sqrt is applied to the input value, not wrapping the output
    expect(expression).toEqual([
      'case',
      ['!=', ['feature-state', 'pop'], null],
      [
        'interpolate',
        ['linear'],
        ['sqrt', ['to-number', ['feature-state', 'pop']]],
        100,
        4,
        1000,
        30,
      ],
      6,
    ]);
  });

  test('stepped sizeBy does NOT apply sqrt to input (transform ignored)', () => {
    const sizeBy: SizeBy = {
      range: [4, 30],
      mode: 'stepped',
      thresholds: [100, 500],
    };
    const expression = buildSizeExpression(sizeBy, 6, [], 'pop');
    expect(expression[0]).toBe('case');
    const stepExpr = (expression as unknown[])[2] as unknown[];
    expect(stepExpr[0]).toBe('step');
    expect(stepExpr[1]).toEqual(['to-number', ['feature-state', 'pop']]);
  });
});
