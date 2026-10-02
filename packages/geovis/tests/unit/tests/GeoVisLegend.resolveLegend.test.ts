import { resolveLegend } from 'src';
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
