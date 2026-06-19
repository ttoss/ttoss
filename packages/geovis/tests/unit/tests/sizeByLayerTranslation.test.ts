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
    // With bounds, continuous produces a case expression wrapping interpolate
    expect((radius as unknown[])[0]).toBe('case');
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
    // Stepped expression is wrapped in a case guard for missing data
    expect((radius as unknown[])[0]).toBe('case');
    const stepExpr = (radius as unknown[])[2] as unknown[];
    expect(stepExpr[0]).toBe('step');
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
    // With no bounds, continuous produces a case expression
    expect((radius as unknown[])[0]).toBe('case');
    const interpolated = (radius as unknown[])[2] as unknown[];
    expect(interpolated[0]).toBe('interpolate');
    // No sqrt transform, so input is plain to-number
    expect(interpolated[2]).toEqual([
      'to-number',
      ['feature-state', 'density'],
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
    expect((circleRadius as unknown[])[0]).toBe('case');
    const interpolated = (circleRadius as unknown[])[2] as unknown[];
    expect(interpolated[0]).toBe('interpolate');
    expect(interpolated[2]).toEqual([
      'to-number',
      ['feature-state', 'density'],
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
    expect((radius as unknown[])[0]).toBe('case');
    const interpolated = (radius as unknown[])[2] as unknown[];
    expect(interpolated[0]).toBe('interpolate');
    expect(interpolated[2]).toEqual(['to-number', ['feature-state', 'value']]);
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
    expect((radius as unknown[])[0]).toBe('case');
    const interpolated = (radius as unknown[])[2] as unknown[];
    expect(interpolated[0]).toBe('interpolate');
    expect(interpolated[2]).toEqual([
      'to-number',
      ['feature-state', 'density'],
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
    expect((radius as unknown[])[0]).toBe('case');
    const interpolated = (radius as unknown[])[2] as unknown[];
    expect(interpolated[0]).toBe('interpolate');
    expect(interpolated[2]).toEqual([
      'to-number',
      ['feature-state', 'density'],
    ]);
  });
});

describe('toMaplibreLayer — sizeBy transform sqrt', () => {
  const baseLayer: VisualizationLayer = {
    id: 'cities',
    sourceId: 'geo',
    geometry: 'point',
  };

  test('continuous sizeBy with sqrt applies sqrt to input, not wrapping output', () => {
    const layer: VisualizationLayer = {
      ...baseLayer,
      sizeBy: { range: [4, 20], transform: 'sqrt' },
    };

    const mapLayer = toMaplibreLayer(layer);
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'];

    // sqrt is applied to the input value, output stays within [4, 20]
    const caseExpr = radius as unknown[];
    expect(caseExpr[0]).toBe('case');
    // The true branch contains the interpolation with sqrt on input
    const interpolated = caseExpr[2] as unknown[];
    expect(interpolated[0]).toBe('interpolate');
    expect(interpolated[2]).toEqual([
      'sqrt',
      ['to-number', ['feature-state', 'value']],
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

    // case expression: check feature-state, interpolate with sqrt input
    const caseExpr = radius as unknown[];
    expect(caseExpr[0]).toBe('case');
    const interpolated = caseExpr[2] as unknown[];
    expect(interpolated[0]).toBe('interpolate');
    expect(interpolated[1]).toEqual(['linear']);
    // sqrt applied to input
    expect(interpolated[2]).toEqual([
      'sqrt',
      ['to-number', ['feature-state', 'value']],
    ]);
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

    const caseExpr = radius as unknown[];
    expect(caseExpr[0]).toBe('case');
    const interpolated = caseExpr[2] as unknown[];
    expect(interpolated[0]).toBe('interpolate');
    // sqrt applied to input
    expect(interpolated[2]).toEqual([
      'sqrt',
      ['to-number', ['feature-state', 'value']],
    ]);
    // Data bounds: [50, 200]
    expect(interpolated[3]).toBe(50);
    expect(interpolated[4]).toBe(4);
    expect(interpolated[5]).toBe(200);
    expect(interpolated[6]).toBe(20);
  });

  test('continuous sizeBy without transform does NOT apply sqrt', () => {
    const layer: VisualizationLayer = {
      ...baseLayer,
      sizeBy: { range: [4, 20] },
    };

    const mapLayer = toMaplibreLayer(layer);
    const paint = (mapLayer as { paint?: Record<string, unknown> }).paint;
    const radius = paint?.['circle-radius'];

    // No transform: case expression with plain interpolation
    const caseExpr = radius as unknown[];
    expect(caseExpr[0]).toBe('case');
    const interpolated = caseExpr[2] as unknown[];
    expect(interpolated[0]).toBe('interpolate');
    // Input is plain to-number, not wrapped in sqrt
    expect(interpolated[2]).toEqual(['to-number', ['feature-state', 'value']]);
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

    // case expression with sqrt on input using stateKey 'total'
    const caseExpr = radius as unknown[];
    expect(caseExpr[0]).toBe('case');
    const interpolated = caseExpr[2] as unknown[];
    expect(interpolated[2]).toEqual([
      'sqrt',
      ['to-number', ['feature-state', 'total']],
    ]);
  });
});
