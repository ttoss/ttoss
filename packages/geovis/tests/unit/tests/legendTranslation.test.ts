import { buildFillColorExpression } from 'src/adapters/maplibre/legendTranslation';
import type { LegendSpec } from 'src/spec/types';

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
        scale: 'quantile',
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
      ['coalesce', ['feature-state', 'value'], 0],
      '#1e3a8a',
      100,
      '#bfdbfe',
      300,
      '#60a5fa',
    ]);
  });
});
