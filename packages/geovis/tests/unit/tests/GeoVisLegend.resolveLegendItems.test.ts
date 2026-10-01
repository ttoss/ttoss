import { resolveLegend, resolveLegendItems } from 'src';
import type { VisualizationSpec } from 'src/spec/types';

const spec: VisualizationSpec = {
  id: 'legend-items',
  engine: 'maplibre',
  sources: [],
  layers: [
    {
      id: 'fill',
      sourceId: 'regions',
      geometry: 'polygon',
      legends: [
        {
          id: 'kind',
          colorBy: {
            type: 'categorical',
            property: 'kind',
            mapping: { farm: '#0e9e6e', kitchen: '#d97706' },
          },
        },
      ],
    },
  ],
  legends: [
    {
      id: 'rate',
      title: 'Taxa',
      colorBy: {
        type: 'quantitative',
        property: 'value',
        scale: 'threshold',
        thresholds: [10, 5],
        colors: ['#eff3ff', '#6baed6', '#08519c'],
      },
    },
  ],
};

test('resolveLegend finds top-level and per-layer legends', () => {
  expect(resolveLegend(spec, 'rate')?.title).toBe('Taxa');
  expect(resolveLegend(spec, 'kind')?.id).toBe('kind');
  expect(resolveLegend(spec, 'missing')).toBeUndefined();
});

test('quantitative rows come from the sorted thresholds, one per bin', () => {
  const items = resolveLegendItems({ spec, legendId: 'rate' });

  expect(
    items.map((item) => {
      return item.color;
    })
  ).toEqual(['#eff3ff', '#6baed6', '#08519c']);
  expect(items).toHaveLength(3);
});

test('formatValue formats the bin bounds', () => {
  const items = resolveLegendItems({
    spec,
    legendId: 'rate',
    formatValue: (value) => {
      return `<${value}>`;
    },
  });

  expect(
    items.every((item) => {
      return item.label.includes('<');
    })
  ).toBe(true);
});

test('categorical rows follow the mapping', () => {
  expect(resolveLegendItems({ spec, legendId: 'kind' })).toEqual([
    { binIndex: 0, label: 'farm', color: '#0e9e6e' },
    { binIndex: 1, label: 'kitchen', color: '#d97706' },
  ]);
});

test('an unknown legend has no rows', () => {
  expect(resolveLegendItems({ spec, legendId: 'missing' })).toEqual([]);
});
