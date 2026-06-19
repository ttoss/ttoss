import { toMaplibreLayer } from 'src/adapters/maplibre/layerTranslation';
import type { LegendSpec, MapData, VisualizationLayer } from 'src/spec/types';

describe('toMaplibreLayer — point layer with sizeBy', () => {
  const baseLayer: VisualizationLayer = {
    id: 'cities',
    sourceId: 'geo',
    geometry: 'point',
  };

  test('continuous sizeBy produces interpolate expression for circle-radius', () => {
    const layer: VisualizationLayer = {
      ...baseLayer,
      activeLegendId: 'pop-legend',
      sizeBy: { range: [4, 20] },
    };

    const legends: LegendSpec[] = [
      {
        id: 'pop-legend',
        colorBy: {
          type: 'quantitative',
          property: 'population',
          scale: 'threshold',
          thresholds: [100, 1000],
        },
      },
    ];

    const mapLayer = toMaplibreLayer(layer, undefined, legends);

    expect(mapLayer.type).toBe('circle');
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'];
    expect(Array.isArray(radius)).toBe(true);
    expect((radius as unknown[])[0]).toBe('interpolate');
  });

  test('stepped sizeBy with explicit thresholds produces step expression for circle-radius', () => {
    const layer: VisualizationLayer = {
      ...baseLayer,
      sizeBy: {
        range: [4, 20],
        mode: 'stepped',
        thresholds: [100, 500],
      },
    };

    const mapLayer = toMaplibreLayer(layer);

    expect(mapLayer.type).toBe('circle');
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'];
    expect(Array.isArray(radius)).toBe(true);
    expect((radius as unknown[])[0]).toBe('step');
  });

  test('point layer without sizeBy keeps static circle-radius (existing behavior)', () => {
    const layer: VisualizationLayer = {
      ...baseLayer,
      paint: { circleRadius: 10 },
    };

    const mapLayer = toMaplibreLayer(layer);

    expect(mapLayer.type).toBe('circle');
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    expect(paint?.['circle-radius']).toBe(10);
  });
});

describe('toMaplibreLayer — MapData dimension support', () => {
  const mapDataPop: MapData = {
    mapDataId: 'pop',
    mapId: 'cities',
    stateKey: 'pop',
    dimension: 'color',
    data: [{ geometryId: 'city-1', value: 100000 }],
  };

  const mapDataDensity: MapData = {
    mapDataId: 'density',
    mapId: 'cities',
    stateKey: 'density',
    dimension: 'size',
    data: [{ geometryId: 'city-1', value: 5000 }],
  };

  test('adapter discovers size dimension from MapData.dimension', () => {
    const layer: VisualizationLayer = {
      id: 'cities-points',
      sourceId: 'cities',
      geometry: 'point',
      sizeBy: { range: [4, 20] },
    };

    const mapLayer = toMaplibreLayer(layer, undefined, undefined, [
      mapDataPop,
      mapDataDensity,
    ]);

    expect(mapLayer.type).toBe('circle');
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'];

    // Should use stateKey 'density' from dimension: 'size' dataset
    expect(radius).toEqual([
      'interpolate',
      ['linear'],
      ['to-number', ['coalesce', ['feature-state', 'density'], 6]],
      expect.any(Number),
      4,
      expect.any(Number),
      20,
    ]);
  });

  test('adapter discovers both color and size from MapData.dimension', () => {
    const legend: LegendSpec = {
      id: 'pop-legend',
      colorBy: {
        type: 'quantitative',
        property: 'population',
        scale: 'threshold',
        thresholds: [100, 1000],
        colors: ['#eff6ff', '#3b82f6'],
      },
    };

    const layer: VisualizationLayer = {
      id: 'cities-points',
      sourceId: 'cities',
      geometry: 'point',
      activeLegendId: 'pop-legend',
      legends: [legend],
      sizeBy: { range: [4, 20] },
    };

    const mapLayer = toMaplibreLayer(
      layer,
      undefined,
      [legend],
      [mapDataPop, mapDataDensity]
    );

    expect(mapLayer.type).toBe('circle');
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;

    // circle-color should use stateKey 'pop' from dimension: 'color'
    const circleColor = paint?.['circle-color'];
    expect(circleColor).toEqual([
      'step',
      ['to-number', ['coalesce', ['feature-state', 'pop'], 0], 0],
      expect.any(String),
      100,
      expect.any(String),
      1000,
      expect.any(String),
    ]);

    // circle-radius should use stateKey 'density' from dimension: 'size'
    const circleRadius = paint?.['circle-radius'];
    expect(circleRadius).toEqual([
      'interpolate',
      ['linear'],
      ['to-number', ['coalesce', ['feature-state', 'density'], 6]],
      expect.any(Number),
      4,
      expect.any(Number),
      20,
    ]);
  });

  test('layer with mapDataId legacy uses stateKey "value" (backward compat)', () => {
    const legacyMapData: MapData = {
      mapDataId: 'legacy-data',
      mapId: 'cities',
      data: [{ geometryId: 'city-1', value: 100000 }],
    };

    const layer: VisualizationLayer = {
      id: 'cities-points',
      sourceId: 'cities',
      geometry: 'point',
      mapDataId: 'legacy-data',
      sizeBy: { range: [4, 20] },
    };

    const mapLayer = toMaplibreLayer(layer, undefined, undefined, [
      legacyMapData,
    ]);

    expect(mapLayer.type).toBe('circle');
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'];

    // Should use default stateKey 'value'
    expect(radius).toEqual([
      'interpolate',
      ['linear'],
      ['to-number', ['coalesce', ['feature-state', 'value'], 6]],
      expect.any(Number),
      4,
      expect.any(Number),
      20,
    ]);
  });

  test('dimension takes precedence over mapDataId fallback', () => {
    const layer: VisualizationLayer = {
      id: 'cities-points',
      sourceId: 'cities',
      geometry: 'point',
      mapDataId: 'legacy-data', // fallback
      sizeBy: { range: [4, 20] },
    };

    const mapLayer = toMaplibreLayer(layer, undefined, undefined, [
      mapDataPop,
      mapDataDensity,
    ]);

    expect(mapLayer.type).toBe('circle');
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'];

    // Should use stateKey 'density' from dimension: 'size', not 'value' from mapDataId
    expect(radius).toEqual([
      'interpolate',
      ['linear'],
      ['to-number', ['coalesce', ['feature-state', 'density'], 6]],
      expect.any(Number),
      4,
      expect.any(Number),
      20,
    ]);
  });

  test('dimension resolution scopes by sourceId — ignores dimensions from other sources', () => {
    const otherSourceColor: MapData = {
      mapDataId: 'other-color',
      mapId: 'other-source',
      stateKey: 'otherColorKey',
      dimension: 'color',
      data: [{ geometryId: 'x-1', value: 42 }],
    };

    const otherSourceSize: MapData = {
      mapDataId: 'other-size',
      mapId: 'other-source',
      stateKey: 'otherSizeKey',
      dimension: 'size',
      data: [{ geometryId: 'x-1', value: 99 }],
    };

    const layer: VisualizationLayer = {
      id: 'cities-points',
      sourceId: 'cities',
      geometry: 'point',
      sizeBy: { range: [4, 20] },
    };

    // Pass mapData from both sources — layer should only pick up 'cities' dimensions
    const mapLayer = toMaplibreLayer(layer, undefined, undefined, [
      mapDataPop,
      mapDataDensity,
      otherSourceColor,
      otherSourceSize,
    ]);

    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'];

    // Should use stateKey 'density' (from cities), NOT 'otherSizeKey' (from other-source)
    expect(radius).toEqual([
      'interpolate',
      ['linear'],
      ['to-number', ['coalesce', ['feature-state', 'density'], 6]],
      expect.any(Number),
      4,
      expect.any(Number),
      20,
    ]);
  });
});

describe('toMaplibreLayer — sizeBy transform sqrt', () => {
  const baseLayer: VisualizationLayer = {
    id: 'cities',
    sourceId: 'geo',
    geometry: 'point',
  };

  test('continuous sizeBy with sqrt wraps the interpolate expression in sqrt', () => {
    const layer: VisualizationLayer = {
      ...baseLayer,
      sizeBy: { range: [4, 20], transform: 'sqrt' },
    };

    const mapLayer = toMaplibreLayer(layer);
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'];

    expect(radius).toEqual([
      'sqrt',
      [
        'interpolate',
        ['linear'],
        ['to-number', ['coalesce', ['feature-state', 'value'], 6]],
        4,
        4,
        20,
        20,
      ],
    ]);
  });

  test('continuous sizeBy with sqrt and legend thresholds', () => {
    const legend: LegendSpec = {
      id: 'pop-legend',
      colorBy: {
        type: 'quantitative',
        property: 'value',
        scale: 'threshold',
        thresholds: [100, 1000],
      },
    };

    const layer: VisualizationLayer = {
      ...baseLayer,
      activeLegendId: 'pop-legend',
      sizeBy: { range: [4, 20], transform: 'sqrt' },
    };

    const mapLayer = toMaplibreLayer(layer, undefined, [legend]);
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'];

    // sqrt wraps the entire interpolate expression
    expect((radius as unknown[])[0]).toBe('sqrt');
    const interpolated = (radius as unknown[])[1] as unknown[];
    expect(interpolated[0]).toBe('interpolate');
    expect(interpolated[1]).toEqual(['linear']);
  });

  test('continuous sizeBy with sqrt and explicit thresholds', () => {
    const layer: VisualizationLayer = {
      ...baseLayer,
      sizeBy: {
        range: [4, 20],
        thresholds: [50, 200],
        transform: 'sqrt',
      },
    };

    const mapLayer = toMaplibreLayer(layer);
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'];

    expect((radius as unknown[])[0]).toBe('sqrt');
    const interpolated = (radius as unknown[])[1] as unknown[];
    expect(interpolated[0]).toBe('interpolate');
    // Data bounds: [50, 200]
    expect(interpolated[3]).toBe(50);
    expect(interpolated[4]).toBe(4);
    expect(interpolated[5]).toBe(200);
    expect(interpolated[6]).toBe(20);
  });

  test('stepped sizeBy with sqrt wraps the step expression in sqrt', () => {
    const layer: VisualizationLayer = {
      ...baseLayer,
      sizeBy: {
        range: [4, 20],
        mode: 'stepped',
        thresholds: [100, 500],
        transform: 'sqrt',
      },
    };

    const mapLayer = toMaplibreLayer(layer);
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'];

    // sqrt wraps the entire step expression
    expect((radius as unknown[])[0]).toBe('sqrt');
    const stepped = (radius as unknown[])[1] as unknown[];
    expect(stepped[0]).toBe('step');
  });

  test('continuous sizeBy without transform does NOT wrap in sqrt', () => {
    const layer: VisualizationLayer = {
      ...baseLayer,
      sizeBy: { range: [4, 20] },
    };

    const mapLayer = toMaplibreLayer(layer);
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'];

    expect((radius as unknown[])[0]).toBe('interpolate');
  });

  test('continuous sizeBy with sqrt uses custom stateKey from dimension', () => {
    const mapData: MapData = {
      mapDataId: 'pop',
      mapId: 'geo',
      stateKey: 'total',
      dimension: 'size',
      data: [{ geometryId: 'city-1', value: 100000 }],
    };

    const layer: VisualizationLayer = {
      ...baseLayer,
      sizeBy: { range: [4, 20], transform: 'sqrt' },
    };

    const mapLayer = toMaplibreLayer(layer, undefined, undefined, [mapData]);
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'];

    // sqrt wraps interpolate, which reads from stateKey 'total'
    expect((radius as unknown[])[0]).toBe('sqrt');
    const interpolated = (radius as unknown[])[1] as unknown[];
    expect(interpolated[2]).toEqual([
      'to-number',
      ['coalesce', ['feature-state', 'total'], 6],
    ]);
  });
});
