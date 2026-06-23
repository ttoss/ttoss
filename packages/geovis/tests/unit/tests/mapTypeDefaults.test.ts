import { resolveSpecFromMapType } from 'src/spec/mapTypeDefaults';
import { resolveChoropleth } from 'src/spec/mapTypeDefaults/chropleth';
import {
  computeJenksBreaks,
  computeNumClasses,
  inspectDataValues,
  pickPaletteColors,
} from 'src/spec/mapTypeDefaults/utils';

describe('inspectDataValues', () => {
  test('detects numeric dataset', () => {
    const result = inspectDataValues([
      { geometryId: 'a', value: 100 },
      { geometryId: 'b', value: 200 },
      { geometryId: 'c', value: 300 },
    ]);
    expect(result.isNumeric).toBe(true);
    expect(result.numericValues).toEqual([100, 200, 300]);
  });

  test('detects categorical dataset', () => {
    const result = inspectDataValues([
      { geometryId: 'a', value: 'red' },
      { geometryId: 'b', value: 'blue' },
      { geometryId: 'c', value: 'green' },
    ]);
    expect(result.isNumeric).toBe(false);
    expect(result.categoricalValues).toEqual(['red', 'blue', 'green']);
  });

  test('handles mixed with majority numeric', () => {
    // 2/3 = 66.7% numeric, which is below the 80% threshold
    const result = inspectDataValues([
      { geometryId: 'a', value: 100 },
      { geometryId: 'b', value: 200 },
      { geometryId: 'c', value: 'other' },
    ]);
    expect(result.isNumeric).toBe(false);
  });

  test('handles null values', () => {
    const result = inspectDataValues([
      { geometryId: 'a', value: null },
      { geometryId: 'b', value: 100 },
    ]);
    expect(result.isNumeric).toBe(true);
    expect(result.numericValues).toEqual([100]);
  });
});

describe('computeJenksBreaks', () => {
  test('returns empty for empty input', () => {
    expect(computeJenksBreaks([], 5)).toEqual([]);
  });

  test('returns breaks for numeric data', () => {
    const values = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    const breaks = computeJenksBreaks(values, 3);
    expect(breaks.length).toBe(2);
    expect(
      breaks.every((b) => {
        return typeof b === 'number';
      })
    ).toBe(true);
  });
});

describe('pickPaletteColors', () => {
  test('picks evenly from palette', () => {
    const palette = ['#a', '#b', '#c', '#d', '#e'];
    // Implementation: step = palette.length / count = 5/3 = 1.666
    // i=0: floor(0*1.666)=0→'#a', i=1: floor(1.666)=1→'#b', i=2: floor(3.333)=3→'#d'
    expect(pickPaletteColors(palette, 3)).toEqual(['#a', '#b', '#d']);
  });

  test('returns full palette when count matches', () => {
    const palette = ['#a', '#b', '#c'];
    expect(pickPaletteColors(palette, 3)).toEqual(['#a', '#b', '#c']);
  });
});

describe('resolveChoropleth', () => {
  test('generates quantitative legend for numeric data', () => {
    const result = resolveChoropleth(
      {
        id: 'test',
        engine: 'maplibre',
        mapType: 'choropleth',
        sources: [],
        layers: [],
      },
      'regions',
      {
        mapDataId: 'pop',
        mapId: 'regions',
        data: [
          { geometryId: 'a', value: 10000 },
          { geometryId: 'b', value: 50000 },
          { geometryId: 'c', value: 100000 },
        ],
      }
    );
    expect(result.legends[0].colorBy.type).toBe('quantitative');
    expect(result.layers[0].geometry).toBe('polygon');
  });

  test('generates categorical legend for text data', () => {
    const result = resolveChoropleth(
      {
        id: 'test',
        engine: 'maplibre',
        mapType: 'choropleth',
        sources: [],
        layers: [],
      },
      'regions',
      {
        mapDataId: 'type',
        mapId: 'regions',
        data: [
          { geometryId: 'a', value: 'urban' },
          { geometryId: 'b', value: 'rural' },
        ],
      }
    );
    expect(result.legends[0].colorBy.type).toBe('categorical');
  });

  test('generates fill and outline layers', () => {
    const result = resolveChoropleth(
      {
        id: 'test',
        engine: 'maplibre',
        mapType: 'choropleth',
        sources: [],
        layers: [],
      },
      'regions',
      {
        mapDataId: 'pop',
        mapId: 'regions',
        data: [{ geometryId: 'a', value: 100 }],
      }
    );
    expect(result.layers).toHaveLength(2);
    expect(result.layers[0].geometry).toBe('polygon');
    expect(result.layers[1].geometry).toBe('line');
  });

  test('does not add normalization to legend', () => {
    const result = resolveChoropleth(
      {
        id: 'test',
        engine: 'maplibre',
        mapType: 'choropleth',
        sources: [],
        layers: [],
      },
      'regions',
      {
        mapDataId: 'pop',
        mapId: 'regions',
        data: [{ geometryId: 'a', value: 100 }],
      }
    );
    expect(result.legends[0].normalization).toBeUndefined();
  });
});

describe('resolveSpecFromMapType', () => {
  test('returns spec unchanged when no mapType', () => {
    const spec = {
      id: 'test',
      engine: 'maplibre' as const,
      sources: [],
      layers: [],
    };
    expect(resolveSpecFromMapType(spec)).toBe(spec);
  });

  test('resolves choropleth spec', () => {
    const spec = {
      id: 'test',
      engine: 'maplibre' as const,
      mapType: 'choropleth' as const,
      sources: [
        {
          id: 'r',
          type: 'geojson' as const,
          data: { type: 'FeatureCollection' as const, features: [] },
        },
      ],
      layers: [],
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'r',
          data: [{ geometryId: 'a', value: 100 }],
        },
      ],
    };
    const resolved = resolveSpecFromMapType(spec);
    expect(resolved.layers.length).toBeGreaterThan(0);
    expect(resolved.legends?.length).toBeGreaterThan(0);
  });

  test('does not override user-provided layers', () => {
    const userLayers = [
      { id: 'custom', sourceId: 'r', geometry: 'polygon' as const },
    ];
    const spec = {
      id: 'test',
      engine: 'maplibre' as const,
      mapType: 'choropleth' as const,
      sources: [
        {
          id: 'r',
          type: 'geojson' as const,
          data: { type: 'FeatureCollection' as const, features: [] },
        },
      ],
      layers: userLayers,
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'r',
          data: [{ geometryId: 'a', value: 100 }],
        },
      ],
    };
    const resolved = resolveSpecFromMapType(spec);
    expect(resolved.layers).toEqual(userLayers);
  });

  test('does not override user-provided legends', () => {
    const userLegends = [
      {
        id: 'custom-legend',
        colorBy: {
          type: 'categorical' as const,
          property: 'x',
          mapping: {},
          defaultColor: '#fff',
        },
      },
    ];
    const spec = {
      id: 'test',
      engine: 'maplibre' as const,
      mapType: 'choropleth' as const,
      sources: [
        {
          id: 'r',
          type: 'geojson' as const,
          data: { type: 'FeatureCollection' as const, features: [] },
        },
      ],
      layers: [],
      legends: userLegends,
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'r',
          data: [{ geometryId: 'a', value: 100 }],
        },
      ],
    };
    const resolved = resolveSpecFromMapType(spec);
    expect(resolved.legends).toEqual(userLegends);
  });

  test('fills in missing colorBy from single auto-generated legend even when IDs differ', () => {
    const spec = {
      id: 'test',
      engine: 'maplibre' as const,
      mapType: 'choropleth' as const,
      sources: [
        {
          id: 'r',
          type: 'geojson' as const,
          data: { type: 'FeatureCollection' as const, features: [] },
        },
      ],
      layers: [],
      legends: [
        {
          id: 'population',
          title: 'Population by district',
        },
      ],
      mapData: [
        {
          mapDataId: 'population',
          mapId: 'r',
          data: [
            { geometryId: 'a', value: 10000 },
            { geometryId: 'b', value: 50000 },
            { geometryId: 'c', value: 100000 },
          ],
        },
      ],
    };
    const resolved = resolveSpecFromMapType(spec);
    expect(resolved.legends).toHaveLength(1);
    expect(resolved.legends![0].id).toBe('population');
    expect(resolved.legends![0].colorBy).toBeDefined();
    expect(resolved.legends![0].colorBy.type).toBe('quantitative');
  });

  test('fills in missing colorBy using positional fallback for multi-legend spec', () => {
    const spec = {
      id: 'test',
      engine: 'maplibre' as const,
      mapType: 'choropleth' as const,
      sources: [
        {
          id: 'r',
          type: 'geojson' as const,
          data: { type: 'FeatureCollection' as const, features: [] },
        },
      ],
      layers: [],
      legends: [
        {
          id: 'pop-custom',
          title: 'Population',
        },
      ],
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'r',
          data: [
            { geometryId: 'a', value: 10000 },
            { geometryId: 'b', value: 50000 },
            { geometryId: 'c', value: 100000 },
          ],
        },
      ],
    };
    const resolved = resolveSpecFromMapType(spec);
    expect(resolved.legends).toHaveLength(1);
    expect(resolved.legends![0].id).toBe('pop-custom');
    expect(resolved.legends![0].colorBy).toBeDefined();
    expect(resolved.legends![0].title).toBe('Population');
  });

  test('preserves user-provided colorBy when present', () => {
    const userColorBy = {
      type: 'categorical' as const,
      property: 'x',
      mapping: { red: '#ff0000' },
      defaultColor: '#fff',
    };
    const spec = {
      id: 'test',
      engine: 'maplibre' as const,
      mapType: 'choropleth' as const,
      sources: [
        {
          id: 'r',
          type: 'geojson' as const,
          data: { type: 'FeatureCollection' as const, features: [] },
        },
      ],
      layers: [],
      legends: [
        {
          id: 'custom',
          colorBy: userColorBy,
        },
      ],
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'r',
          data: [{ geometryId: 'a', value: 100 }],
        },
      ],
    };
    const resolved = resolveSpecFromMapType(spec);
    expect(resolved.legends![0].colorBy).toEqual(userColorBy);
  });

  test('inherits thresholds from auto-generated when user provides only colors', () => {
    const greenColors = ['#C7E9C0', '#A1D99B', '#74C476', '#41AB5D'];
    const spec = {
      id: 'test',
      engine: 'maplibre' as const,
      mapType: 'choropleth' as const,
      sources: [
        {
          id: 'r',
          type: 'geojson' as const,
          data: { type: 'FeatureCollection' as const, features: [] },
        },
      ],
      layers: [],
      legends: [
        {
          id: 'density',
          title: 'Density',
          colorBy: {
            type: 'quantitative' as const,
            colors: greenColors,
          },
        },
      ],
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'r',
          data: [
            { geometryId: 'a', value: 10000 },
            { geometryId: 'b', value: 50000 },
            { geometryId: 'c', value: 100000 },
          ],
        },
      ],
    };
    const resolved = resolveSpecFromMapType(spec);
    const merged = resolved.legends![0].colorBy;
    expect(merged.type).toBe('quantitative');
    if (merged.type === 'quantitative') {
      expect(merged.colors).toEqual(greenColors);
      expect(merged.thresholds).toBeDefined();
      expect(merged.thresholds!.length).toBeGreaterThan(0);
      expect(merged.property).toBe('value');
      expect(merged.scale).toBe('threshold');
    }
  });

  test('produces non-empty Jenks breaks for ≤5 data points', () => {
    const result = resolveChoropleth(
      {
        id: 'test',
        engine: 'maplibre',
        mapType: 'choropleth',
        sources: [],
        layers: [],
      },
      'regions',
      {
        mapDataId: 'pop',
        mapId: 'regions',
        data: [
          { geometryId: 'a', value: 100 },
          { geometryId: 'b', value: 200 },
          { geometryId: 'c', value: 300 },
          { geometryId: 'd', value: 400 },
          { geometryId: 'e', value: 500 },
        ],
      }
    );
    const colorBy = result.legends[0].colorBy;
    expect(colorBy.type).toBe('quantitative');
    if (colorBy.type === 'quantitative') {
      expect(colorBy.thresholds!.length).toBeGreaterThan(0);
      expect(colorBy.colors!.length).toBeGreaterThan(1);
    }
  });
});

describe('computeNumClasses', () => {
  test('returns 3 for small datasets (sqrt(n) < 3)', () => {
    expect(computeNumClasses(3)).toBe(3);
    expect(computeNumClasses(5)).toBe(3);
    expect(computeNumClasses(8)).toBe(3);
  });

  test('returns 4 for ~10 values', () => {
    expect(computeNumClasses(9)).toBe(3);
    expect(computeNumClasses(10)).toBe(4);
    expect(computeNumClasses(15)).toBe(4);
  });

  test('returns 5 for ~20 values', () => {
    expect(computeNumClasses(16)).toBe(4);
    expect(computeNumClasses(20)).toBe(5);
    expect(computeNumClasses(24)).toBe(5);
  });

  test('caps at 6 (palette size - 1)', () => {
    expect(computeNumClasses(36)).toBe(6);
    expect(computeNumClasses(100)).toBe(6);
    expect(computeNumClasses(1000)).toBe(6);
  });

  test('returns at least 3 for edge cases', () => {
    expect(computeNumClasses(0)).toBe(3);
    expect(computeNumClasses(1)).toBe(3);
    expect(computeNumClasses(2)).toBe(3);
  });
});
