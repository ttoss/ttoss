/**
 * A heatmap layer's paint as MapLibre receives it: zoom stops, a weight read
 * from a property and a colour ramp all become expressions, on mount and when
 * a patch changes one of them.
 */

import type * as maplibregl from 'maplibre-gl';
import {
  buildHeatmapPaint,
  toHeatmapColor,
  toHeatmapWeight,
  toZoomExpression,
} from 'src/adapters/maplibre/heatmap';
import { toMaplibreLayer } from 'src/adapters/maplibre/layerTranslation';
import { setPaintWhenReady } from 'src/adapters/maplibre/legendFillPaint';
import { applyLayerPatch } from 'src/adapters/maplibre/patchDispatch';
import { reapplyLayerPaint } from 'src/adapters/maplibre/syncSourcesAndLayers';
import { SEQUENTIAL_PALETTES } from 'src/spec/mapTypeDefaults/palettes';
import type { VisualizationLayer, VisualizationSpec } from 'src/spec/types';

jest.mock('src/adapters/maplibre/legendFillPaint', () => {
  return {
    ...jest.requireActual('src/adapters/maplibre/legendFillPaint'),
    cancelPendingStyleListenersForLayer: jest.fn(),
    setPaintWhenReady: jest.fn(),
  };
});

const heatLayer = (paint?: VisualizationLayer['paint']): VisualizationLayer => {
  return { id: 'heat', sourceId: 'crashes', geometry: 'heatmap', paint };
};

const paintOf = (layer: VisualizationLayer) => {
  return (toMaplibreLayer(layer) as { paint: Record<string, unknown> }).paint;
};

describe('toZoomExpression', () => {
  test('keeps a number as is', () => {
    expect(toZoomExpression(12)).toBe(12);
  });

  test('interpolates [zoom, value] stops linearly over the zoom', () => {
    expect(
      toZoomExpression([
        [10, 6],
        [16, 40],
      ])
    ).toEqual(['interpolate', ['linear'], ['zoom'], 10, 6, 16, 40]);
  });
});

describe('toHeatmapWeight', () => {
  test('defaults to a full point each', () => {
    expect(toHeatmapWeight(undefined)).toBe(1);
  });

  test('keeps a number as is', () => {
    expect(toHeatmapWeight(0.5)).toBe(0.5);
  });

  test('reads a property from 0 (nothing) to max (a full point)', () => {
    expect(toHeatmapWeight({ property: 'peso', max: 10 })).toEqual([
      'interpolate',
      ['linear'],
      ['to-number', ['get', 'peso'], 0],
      0,
      0,
      10,
      1,
    ]);
  });
});

describe('toHeatmapColor', () => {
  test('leaves MapLibre its own ramp when no colours are declared', () => {
    expect(toHeatmapColor(undefined)).toBeUndefined();
  });

  test('spreads listed colours evenly above a transparent zero density', () => {
    expect(
      toHeatmapColor(['#fde68a', '#f97316', '#dc2626', '#7f1d1d'])
    ).toEqual([
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0,
      'rgba(0,0,0,0)',
      0.25,
      '#fde68a',
      0.5,
      '#f97316',
      0.75,
      '#dc2626',
      1,
      '#7f1d1d',
    ]);
  });

  test('draws a named palette in its colours, hottest at full density', () => {
    const expression = toHeatmapColor('red') as unknown[];
    expect(expression.slice(0, 5)).toEqual([
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0,
      'rgba(0,0,0,0)',
    ]);
    expect(expression.slice(-2)).toEqual([1, SEQUENTIAL_PALETTES.red.at(-1)]);
  });

  test('leaves MapLibre its own ramp for an unknown palette name', () => {
    expect(toHeatmapColor('rainbow' as unknown as 'red')).toBeUndefined();
  });
});

describe('heatmap layer translation', () => {
  test('keeps the fixed defaults when paint is empty, with no heatmap-color', () => {
    expect(buildHeatmapPaint({})).toEqual({
      'heatmap-radius': 15,
      'heatmap-opacity': 1,
      'heatmap-intensity': 1,
      'heatmap-weight': 1,
      'heatmap-color': undefined,
    });
  });

  test('translates zoom stops, a property weight and a ramp together', () => {
    const paint = paintOf(
      heatLayer({
        heatmapColors: ['#fde68a', '#dc2626'],
        heatmapRadius: [
          [10, 6],
          [16, 40],
        ],
        heatmapIntensity: [
          [10, 0.6],
          [16, 2],
        ],
        heatmapOpacity: [
          [14, 1],
          [16, 0],
        ],
        heatmapWeight: { property: 'peso', max: 10 },
      })
    );

    expect(paint['heatmap-radius']).toEqual([
      'interpolate',
      ['linear'],
      ['zoom'],
      10,
      6,
      16,
      40,
    ]);
    expect(paint['heatmap-intensity']).toEqual([
      'interpolate',
      ['linear'],
      ['zoom'],
      10,
      0.6,
      16,
      2,
    ]);
    expect(paint['heatmap-opacity']).toEqual([
      'interpolate',
      ['linear'],
      ['zoom'],
      14,
      1,
      16,
      0,
    ]);
    expect(paint['heatmap-weight']).toEqual(
      toHeatmapWeight({ property: 'peso', max: 10 })
    );
    expect(paint['heatmap-color']).toEqual(
      toHeatmapColor(['#fde68a', '#dc2626'])
    );
  });
});

const makeMap = (mountedType = 'heatmap') => {
  return {
    getLayer: jest.fn(() => {
      return { type: mountedType };
    }),
    setPaintProperty: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  } as unknown as jest.Mocked<maplibregl.Map>;
};

const specWith = (layer: VisualizationLayer): VisualizationSpec => {
  return {
    engine: 'maplibre',
    sources: [
      {
        id: 'crashes',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [layer],
  };
};

describe('heatmap paint patches', () => {
  beforeEach(() => {
    jest.mocked(setPaintWhenReady).mockClear();
  });

  test('writes zoom stops as a zoom expression, not the raw pairs', () => {
    const map = makeMap();
    const viewState = { spec: specWith(heatLayer()) };

    applyLayerPatch(map, viewState, {
      target: 'layer',
      op: 'replace',
      path: 'layer.heat.paint.heatmapRadius',
      value: [
        [10, 6],
        [16, 40],
      ],
    });

    expect(setPaintWhenReady).toHaveBeenCalledWith(
      map,
      'heat',
      'heatmap-radius',
      ['interpolate', ['linear'], ['zoom'], 10, 6, 16, 40]
    );
    expect(
      (viewState.spec.layers[0].paint as { heatmapRadius: unknown })
        .heatmapRadius
    ).toEqual([
      [10, 6],
      [16, 40],
    ]);
  });

  test('writes a palette name as its density ramp', () => {
    const map = makeMap();
    const viewState = { spec: specWith(heatLayer()) };

    applyLayerPatch(map, viewState, {
      target: 'layer',
      op: 'replace',
      path: 'layer.heat.paint.heatmapColors',
      value: 'green',
    });

    expect(setPaintWhenReady).toHaveBeenCalledWith(
      map,
      'heat',
      'heatmap-color',
      toHeatmapColor('green')
    );
  });

  test('resets the ramp to MapLibre’s own for a palette it does not know', () => {
    const map = makeMap();
    const viewState = {
      spec: specWith(heatLayer({ heatmapColors: 'red' })),
    };

    applyLayerPatch(map, viewState, {
      target: 'layer',
      op: 'replace',
      path: 'layer.heat.paint.heatmapColors',
      value: 'rainbow',
    });

    expect(setPaintWhenReady).toHaveBeenCalledWith(
      map,
      'heat',
      'heatmap-color',
      null
    );
  });

  test('writes other geometries’ values as given', () => {
    const map = makeMap('circle');
    const layer: VisualizationLayer = {
      id: 'pts',
      sourceId: 'crashes',
      geometry: 'point',
    };
    const viewState = { spec: specWith(layer) };

    applyLayerPatch(map, viewState, {
      target: 'layer',
      op: 'replace',
      path: 'layer.pts.paint.circleRadius',
      value: 7,
    });

    expect(setPaintWhenReady).toHaveBeenCalledWith(
      map,
      'pts',
      'circle-radius',
      7
    );
  });
});

describe('reapplyLayerPaint on a heatmap', () => {
  test('resets heatmap-color to MapLibre’s ramp when the layer declares none', () => {
    const map = makeMap();
    const layer = heatLayer();

    reapplyLayerPaint(map, specWith(layer), layer);

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'heat',
      'heatmap-color',
      null
    );
  });

  test('writes the declared ramp', () => {
    const map = makeMap();
    const layer = heatLayer({ heatmapColors: 'blue' });

    reapplyLayerPaint(map, specWith(layer), layer);

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'heat',
      'heatmap-color',
      toHeatmapColor('blue')
    );
    expect(map.setPaintProperty).not.toHaveBeenCalledWith(
      'heat',
      'heatmap-color',
      null
    );
  });
});
