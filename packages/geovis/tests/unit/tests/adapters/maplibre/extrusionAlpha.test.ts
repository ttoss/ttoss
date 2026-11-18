/**
 * An extruded layer ignores its colours' alpha, and MapLibre keeps colours
 * premultiplied by it — so a translucent class colour reached the prisms
 * darker instead of fainter. The alpha now goes to `fill-extrusion-opacity`.
 */

import {
  extrusionColorAndOpacity,
  splitColorAlpha,
} from 'src/adapters/maplibre/extrusionAlpha';
import { toMaplibreLayer } from 'src/adapters/maplibre/layerTranslation';
import type { VisualizationLayer } from 'src/spec/types';
import type { LegendSpec } from 'src/spec/types.legend';

const translucentLegend: LegendSpec = {
  id: 'rates',
  colorBy: {
    type: 'quantitative',
    property: 'value',
    scale: 'threshold',
    thresholds: [10],
    colors: ['rgba(199, 233, 192, 0.3)', 'rgba(33, 113, 181, 0.3)'],
  },
};

const extruded: VisualizationLayer = {
  id: 'districts-fill',
  sourceId: 'districts',
  geometry: 'polygon',
  mapDataId: 'rates',
  activeLegendId: 'rates',
  extrusion: { maxHeight: 2000 },
};

const flatten = (value: unknown): unknown[] => {
  return Array.isArray(value) ? value.flatMap(flatten) : [value];
};

describe('a translucent legend on an extruded layer', () => {
  test('reaches the prisms as opaque colours at the legend opacity', () => {
    const layer = toMaplibreLayer(extruded, undefined, [translucentLegend]) as {
      paint: Record<string, unknown>;
    };
    const colors = flatten(layer.paint['fill-extrusion-color']).filter(
      (entry) => {
        return typeof entry === 'string' && /^(rgb|hsl|#)/.test(entry);
      }
    );

    expect(colors).toContain('rgb(33, 113, 181)');
    expect(colors.join(' ')).not.toContain('rgba');
    expect(layer.paint['fill-extrusion-opacity']).toBeCloseTo(0.3);
  });

  test('multiplies the alpha with the layer fillOpacity', () => {
    const layer = toMaplibreLayer(
      { ...extruded, paint: { fillOpacity: 0.5 } },
      undefined,
      [translucentLegend]
    ) as { paint: Record<string, unknown> };

    expect(layer.paint['fill-extrusion-opacity']).toBeCloseTo(0.15);
  });

  test('leaves a flat layer its translucent colours', () => {
    const { extrusion: _extrusion, ...flat } = extruded;
    const layer = toMaplibreLayer(flat, undefined, [translucentLegend]) as {
      paint: Record<string, unknown>;
    };

    expect(JSON.stringify(layer.paint['fill-color'])).toContain(
      'rgba(33, 113, 181, 0.3)'
    );
    expect(layer.paint['fill-opacity']).toBe(1);
  });
});

describe('splitColorAlpha', () => {
  test.each([
    ['rgba(33, 113, 181, 0.3)', 'rgb(33, 113, 181)', 0.3],
    ['rgb(33 113 181 / 40%)', 'rgb(33, 113, 181)', 0.4],
    ['hsla(210, 50%, 40%, 0.5)', 'hsl(210, 50%, 40%)', 0.5],
    ['#2171b580', '#2171b5', 128 / 255],
    ['#21f8', '#21f', 136 / 255],
  ])('%s → %s at %f', (color, opaque, alpha) => {
    const split = splitColorAlpha(color);
    expect(split?.opaque).toBe(opaque);
    expect(split?.alpha).toBeCloseTo(alpha);
  });

  test.each([
    '#2171b5',
    'rgb(33, 113, 181)',
    'red',
    'value',
    'rgba(1, 2, 3, x)',
  ])('%s carries no alpha', (color) => {
    expect(splitColorAlpha(color)).toBeUndefined();
  });
});

describe('extrusionColorAndOpacity', () => {
  test('an opaque no-data colour does not cancel the classes alpha', () => {
    const { color, opacity } = extrusionColorAndOpacity({
      color: ['case', ['==', 1, 1], '#cccccc', 'rgba(0, 0, 255, 0.4)'],
    });
    expect(color).toEqual(['case', ['==', 1, 1], '#cccccc', 'rgb(0, 0, 255)']);
    expect(opacity).toBeCloseTo(0.4);
  });

  test('a fully transparent colour does not lower the opacity', () => {
    const { opacity } = extrusionColorAndOpacity({
      color: ['case', true, 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 255, 0.6)'],
    });
    expect(opacity).toBeCloseTo(0.6);
  });

  test('disagreeing alphas take the most opaque', () => {
    const { opacity } = extrusionColorAndOpacity({
      color: ['case', true, 'rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 255, 0.7)'],
      fillOpacity: 1,
    });
    expect(opacity).toBeCloseTo(0.7);
  });

  test('opaque colours keep the layer fillOpacity', () => {
    expect(
      extrusionColorAndOpacity({ color: '#f00', fillOpacity: 0.7 })
    ).toEqual({ color: '#f00', opacity: 0.7 });
  });
});
