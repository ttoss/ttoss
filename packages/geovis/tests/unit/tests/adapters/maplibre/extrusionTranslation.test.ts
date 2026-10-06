/**
 * How an extruded polygon layer reaches MapLibre: a `fill-extrusion` layer
 * whose colour is the flat layer's and whose height reads the same value, the
 * paint keys a patch targets, and the camera easing into the pitch it is read
 * at.
 */

import {
  isExtrudedLayer,
  polygonFillColorProperty,
  resolveExtrusionHeightExpression,
  toMaplibreLayer,
} from 'src/adapters/maplibre/layerTranslation';
import { specPaintKeyToMaplibre } from 'src/adapters/maplibre/paintKeyMap';
import { syncMapView } from 'src/adapters/maplibre/viewSync';
import type { MapData, VisualizationLayer } from 'src/spec/types';
import type { LegendSpec } from 'src/spec/types.legend';

const legend: LegendSpec = {
  id: 'rates',
  colorBy: {
    type: 'quantitative',
    property: 'value',
    scale: 'threshold',
    thresholds: [10],
    colors: ['#eee', '#111'],
  },
};

const polygon: VisualizationLayer = {
  id: 'districts-fill',
  sourceId: 'districts',
  geometry: 'polygon',
  mapDataId: 'rates',
  activeLegendId: 'rates',
};

const extruded: VisualizationLayer = {
  ...polygon,
  extrusion: { maxHeight: 2000 },
};

describe('toMaplibreLayer', () => {
  test('an extruded polygon becomes a fill-extrusion layer', () => {
    const layer = toMaplibreLayer(
      { ...extruded, paint: { fillOpacity: 0.7 } },
      undefined,
      [legend]
    ) as { type: string; paint: Record<string, unknown> };

    expect(layer.type).toBe('fill-extrusion');
    expect(layer.paint['fill-extrusion-color']).toEqual(
      expect.arrayContaining(['step'])
    );
    expect(layer.paint['fill-extrusion-opacity']).toBe(0.7);
    expect(layer.paint['fill-extrusion-base']).toBe(0);
    expect(layer.paint['fill-extrusion-height']).toEqual([
      'case',
      ['!=', ['feature-state', 'value'], null],
      ['step', ['to-number', ['feature-state', 'value'], 0], 1000, 10, 2000],
      0,
    ]);
    expect(layer.paint).not.toHaveProperty('fill-outline-color');
  });

  test('without a legend the prisms take the static fill colour, or the default', () => {
    const withColor = toMaplibreLayer({
      ...extruded,
      activeLegendId: undefined,
      paint: { fillColor: '#f00' },
    }) as { paint: Record<string, unknown> };
    const withoutColor = toMaplibreLayer({
      ...extruded,
      activeLegendId: undefined,
    }) as { paint: Record<string, unknown> };

    expect(withColor.paint['fill-extrusion-color']).toBe('#f00');
    expect(withoutColor.paint['fill-extrusion-color']).toBe('#3b82f6');
    expect(withoutColor.paint['fill-extrusion-opacity']).toBe(1);
  });

  test('a polygon without extrusion stays a flat fill', () => {
    expect(toMaplibreLayer(polygon, undefined, [legend]).type).toBe('fill');
  });
});

describe('extrusion helpers', () => {
  test('isExtrudedLayer needs a polygon that declares extrusion', () => {
    expect(isExtrudedLayer(extruded)).toBe(true);
    expect(isExtrudedLayer(polygon)).toBe(false);
    expect(
      isExtrudedLayer({ ...extruded, geometry: 'point' } as VisualizationLayer)
    ).toBe(false);
  });

  test('polygonFillColorProperty follows the layer type', () => {
    expect(polygonFillColorProperty(extruded)).toBe('fill-extrusion-color');
    expect(polygonFillColorProperty(polygon)).toBe('fill-color');
  });

  test('the height reads the colour dataset, by dimension', () => {
    const mapData: MapData[] = [
      {
        mapDataId: 'sizes',
        mapId: 'districts',
        dimension: 'size',
        stateKey: 'size',
        data: [],
      },
      {
        mapDataId: 'colors',
        mapId: 'districts',
        dimension: 'color',
        stateKey: 'rate',
        data: [{ geometryId: 1, value: 40 }],
      },
    ];

    const height = resolveExtrusionHeightExpression(
      { ...extruded, extrusion: { mode: 'continuous', maxHeight: 400 } },
      [legend],
      mapData
    );

    expect(height).toEqual([
      'case',
      ['!=', ['feature-state', 'rate'], null],
      [
        'interpolate',
        ['linear'],
        ['to-number', ['feature-state', 'rate'], 0],
        0,
        0,
        40,
        400,
      ],
      0,
    ]);
  });

  test('the height falls back to the value key without a dataset', () => {
    const height = resolveExtrusionHeightExpression(extruded, [legend], []);
    expect((height as unknown[])[1]).toEqual([
      '!=',
      ['feature-state', 'value'],
      null,
    ]);
  });

  test('a flat layer has no height', () => {
    expect(resolveExtrusionHeightExpression(polygon, [legend])).toBeUndefined();
  });
});

describe('specPaintKeyToMaplibre', () => {
  test('moves fill keys to the extrusion and drops the outline', () => {
    expect(specPaintKeyToMaplibre('fillColor', extruded)).toBe(
      'fill-extrusion-color'
    );
    expect(specPaintKeyToMaplibre('fillOpacity', extruded)).toBe(
      'fill-extrusion-opacity'
    );
    expect(specPaintKeyToMaplibre('lineColor', extruded)).toBeUndefined();
  });

  test('leaves flat polygons and other geometries alone', () => {
    expect(specPaintKeyToMaplibre('fillColor', polygon)).toBe('fill-color');
    expect(specPaintKeyToMaplibre('lineColor', polygon)).toBe(
      'fill-outline-color'
    );
    expect(specPaintKeyToMaplibre('lineWidth', extruded)).toBeUndefined();
    expect(specPaintKeyToMaplibre('lineColor', { geometry: 'line' })).toBe(
      'line-color'
    );
    expect(specPaintKeyToMaplibre('unknown', polygon)).toBeUndefined();
  });
});

describe('syncMapView camera angles', () => {
  const makeMap = () => {
    return {
      setCenter: jest.fn(),
      setZoom: jest.fn(),
      setMaxZoom: jest.fn(),
      setMinZoom: jest.fn(),
      setPitch: jest.fn(),
      setBearing: jest.fn(),
      easeTo: jest.fn(),
    };
  };
  type MapArg = Parameters<typeof syncMapView>[0];

  test('eases only the changed angles when the view asks for a transition', () => {
    const map = makeMap();
    syncMapView(
      map as unknown as MapArg,
      { pitch: 0, bearing: 10 },
      { pitch: 45, bearing: 10, cameraAngleTransitionMs: 600 }
    );

    expect(map.easeTo).toHaveBeenCalledWith({ duration: 600, pitch: 45 });
    expect(map.setPitch).not.toHaveBeenCalled();
  });

  test('eases the bearing alone', () => {
    const map = makeMap();
    syncMapView(
      map as unknown as MapArg,
      { pitch: 30 },
      { pitch: 30, bearing: -20, cameraAngleTransitionMs: 300 }
    );

    expect(map.easeTo).toHaveBeenCalledWith({ duration: 300, bearing: -20 });
  });

  test('does nothing when no angle changed', () => {
    const map = makeMap();
    syncMapView(
      map as unknown as MapArg,
      { pitch: 30 },
      { pitch: 30, cameraAngleTransitionMs: 300 }
    );

    expect(map.easeTo).not.toHaveBeenCalled();
    expect(map.setPitch).not.toHaveBeenCalled();
  });

  test('jumps without a transition', () => {
    const map = makeMap();
    syncMapView(map as unknown as MapArg, undefined, {
      pitch: 45,
      bearing: 15,
    });

    expect(map.setPitch).toHaveBeenCalledWith(45);
    expect(map.setBearing).toHaveBeenCalledWith(15);
    expect(map.easeTo).not.toHaveBeenCalled();
  });
});
