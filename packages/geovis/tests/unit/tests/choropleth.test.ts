import { buildFillColorExpression } from 'src/adapters/maplibre/legendTranslation';
import { resolveSpecFromMapType } from 'src/spec/mapTypeDefaults';
import { resolveChoropleth } from 'src/spec/mapTypeDefaults/chropleth';
import { SEQUENTIAL_PALETTES } from 'src/spec/mapTypeDefaults/palettes';
import type { VisualizationSpec } from 'src/spec/types';

const makeSpec = (
  overrides: Partial<VisualizationSpec> & {
    mapData: VisualizationSpec['mapData'];
  }
): VisualizationSpec => {
  return {
    id: 'test',
    engine: 'maplibre',
    mapType: 'choropleth',
    basemap: {
      style: 'https://demotiles.maplibre.org/style.json',
    },
    sources: [
      {
        id: 'regions',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [],
    ...overrides,
  };
};

describe('choropleth happy path — zero-config', () => {
  test('resolves full spec from minimal mapType + mapData', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        mapData: [
          {
            mapDataId: 'pop',
            mapId: 'regions',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 200 },
              { geometryId: 'c', value: 300 },
              { geometryId: 'd', value: 400 },
              { geometryId: 'e', value: 500 },
              { geometryId: 'f', value: 600 },
            ],
          },
        ],
      })
    );

    expect(resolved.layers.length).toBeGreaterThan(0);
    expect(resolved.legends).toHaveLength(1);

    const legend = resolved.legends![0];
    expect(legend.colorBy.type).toBe('quantitative');

    if (legend.colorBy.type === 'quantitative') {
      expect(legend.colorBy.thresholds).toBeDefined();
      expect(legend.colorBy.thresholds!.length).toBeGreaterThan(0);
      expect(legend.colorBy.colors).toBeDefined();
      expect(legend.colorBy.colors!.length).toBeGreaterThan(1);
      expect(legend.colorBy.property).toBe('value');
      expect(legend.colorBy.scale).toBe('threshold');
    }
  });

  test('auto-generates fill and outline layers', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        mapData: [
          {
            mapDataId: 'pop',
            mapId: 'regions',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 200 },
            ],
          },
        ],
      })
    );

    const fillLayer = resolved.layers.find((l) => {
      return l.geometry === 'polygon';
    });
    const outlineLayer = resolved.layers.find((l) => {
      return l.geometry === 'line';
    });

    expect(fillLayer).toBeDefined();
    expect(outlineLayer).toBeDefined();
    expect(fillLayer!.mapDataId).toBe('pop');
    expect(fillLayer!.activeLegendId).toBe('pop-legend');
  });

  test('legend ID follows ${mapDataId}-legend convention', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        mapData: [
          {
            mapDataId: 'density',
            mapId: 'regions',
            data: [
              { geometryId: 'a', value: 10 },
              { geometryId: 'b', value: 20 },
            ],
          },
        ],
      })
    );

    expect(resolved.legends![0].id).toBe('density-legend');
  });

  test('uses title from mapData when provided', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        mapData: [
          {
            mapDataId: 'pop',
            mapId: 'regions',
            title: 'Population by district',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 200 },
            ],
          },
        ],
      })
    );

    expect(resolved.legends![0].title).toBe('Population by district');
  });

  test('defaults title to "value" when mapData has no title', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        mapData: [
          {
            mapDataId: 'pop',
            mapId: 'regions',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 200 },
            ],
          },
        ],
      })
    );

    expect(resolved.legends![0].title).toBe('value');
  });
});

describe('choropleth happy path — auto-Jenks thresholds', () => {
  test('produces correct number of bins for 6 data points', () => {
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
          { geometryId: 'f', value: 600 },
        ],
      }
    );

    const colorBy = result.legends[0].colorBy;
    expect(colorBy.type).toBe('quantitative');
    if (colorBy.type === 'quantitative') {
      // 6 values, NUM_CLASSES=6 → 6 breaks (internal: 5)
      expect(colorBy.thresholds!.length).toBe(5);
      // colors = breaks.length + 1 = 6
      expect(colorBy.colors!.length).toBe(6);
    }
  });

  test('thresholds are monotonically increasing', () => {
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
          { geometryId: 'a', value: 50 },
          { geometryId: 'b', value: 150 },
          { geometryId: 'c', value: 250 },
          { geometryId: 'd', value: 350 },
          { geometryId: 'e', value: 450 },
          { geometryId: 'f', value: 550 },
        ],
      }
    );

    const thresholds =
      result.legends[0].colorBy.type === 'quantitative'
        ? result.legends[0].colorBy.thresholds!
        : [];

    for (let i = 1; i < thresholds.length; i++) {
      expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
    }
  });

  test('colors count equals thresholds count + 1', () => {
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
          { geometryId: 'a', value: 10 },
          { geometryId: 'b', value: 20 },
          { geometryId: 'c', value: 30 },
          { geometryId: 'd', value: 40 },
          { geometryId: 'e', value: 50 },
          { geometryId: 'f', value: 60 },
        ],
      }
    );

    const colorBy = result.legends[0].colorBy;
    if (colorBy.type === 'quantitative') {
      expect(colorBy.colors!.length).toBe(colorBy.thresholds!.length + 1);
    }
  });

  test('uses default blue palette when no colors provided', () => {
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
          { geometryId: 'f', value: 600 },
        ],
      }
    );

    const colorBy = result.legends[0].colorBy;
    if (colorBy.type === 'quantitative') {
      // All colors should come from the blue palette
      for (const color of colorBy.colors!) {
        expect(SEQUENTIAL_PALETTES.blue).toContain(color);
      }
    }
  });
});

describe('choropleth happy path — palette override via colors', () => {
  test('user-provided colors override default blue palette', () => {
    const greenColors = [...SEQUENTIAL_PALETTES.green];
    const resolved = resolveSpecFromMapType(
      makeSpec({
        legends: [
          {
            id: 'density-legend',
            title: 'Density',
            colorBy: {
              type: 'quantitative',
              colors: greenColors,
            },
          },
        ],
        mapData: [
          {
            mapDataId: 'density',
            mapId: 'regions',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 200 },
              { geometryId: 'c', value: 300 },
              { geometryId: 'd', value: 400 },
              { geometryId: 'e', value: 500 },
              { geometryId: 'f', value: 600 },
            ],
          },
        ],
      })
    );

    const colorBy = resolved.legends![0].colorBy;
    expect(colorBy.type).toBe('quantitative');
    if (colorBy.type === 'quantitative') {
      expect(colorBy.colors).toEqual(greenColors);
      // Thresholds inherited from auto-generated
      expect(colorBy.thresholds).toBeDefined();
      expect(colorBy.thresholds!.length).toBeGreaterThan(0);
      expect(colorBy.property).toBe('value');
      expect(colorBy.scale).toBe('threshold');
    }
  });

  test('user colors override palette without affecting thresholds', () => {
    const customColors = [
      '#fee5d9',
      '#fcae91',
      '#fb6a4a',
      '#de2d26',
      '#a50f15',
      '#67000d',
    ];
    const resolved = resolveSpecFromMapType(
      makeSpec({
        legends: [
          {
            id: 'pop-legend',
            colorBy: {
              type: 'quantitative',
              colors: customColors,
            },
          },
        ],
        mapData: [
          {
            mapDataId: 'pop',
            mapId: 'regions',
            data: [
              { geometryId: 'a', value: 10 },
              { geometryId: 'b', value: 20 },
              { geometryId: 'c', value: 30 },
              { geometryId: 'd', value: 40 },
              { geometryId: 'e', value: 50 },
              { geometryId: 'f', value: 60 },
            ],
          },
        ],
      })
    );

    const colorBy = resolved.legends![0].colorBy;
    if (colorBy.type === 'quantitative') {
      expect(colorBy.colors).toEqual(customColors);
      // Thresholds should still be auto-generated
      expect(colorBy.thresholds!.length).toBe(5);
    }
  });

  test('partial colorBy with only colors inherits thresholds, property, scale', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        legends: [
          {
            id: 'pop-legend',
            colorBy: {
              type: 'quantitative',
              colors: ['#f7fbff', '#deebf7', '#9ecae1', '#3182bd'],
            },
          },
        ],
        mapData: [
          {
            mapDataId: 'pop',
            mapId: 'regions',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 200 },
              { geometryId: 'c', value: 300 },
              { geometryId: 'd', value: 400 },
              { geometryId: 'e', value: 500 },
              { geometryId: 'f', value: 600 },
            ],
          },
        ],
      })
    );

    const colorBy = resolved.legends![0].colorBy;
    if (colorBy.type === 'quantitative') {
      expect(colorBy.colors).toEqual([
        '#f7fbff',
        '#deebf7',
        '#9ecae1',
        '#3182bd',
      ]);
      expect(colorBy.thresholds).toBeDefined();
      expect(colorBy.property).toBe('value');
      expect(colorBy.scale).toBe('threshold');
    }
  });
});

describe('choropleth happy path — categorical data', () => {
  test('auto-generates categorical legend for text data', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        mapData: [
          {
            mapDataId: 'status',
            mapId: 'regions',
            data: [
              { geometryId: 'a', value: 'urban' },
              { geometryId: 'b', value: 'rural' },
              { geometryId: 'c', value: 'suburban' },
            ],
          },
        ],
      })
    );

    const legend = resolved.legends![0];
    expect(legend.colorBy.type).toBe('categorical');
    if (legend.colorBy.type === 'categorical') {
      expect(Object.keys(legend.colorBy.mapping!)).toEqual(
        expect.arrayContaining(['urban', 'rural', 'suburban'])
      );
      expect(legend.colorBy.property).toBe('value');
    }
  });

  test('categorical mapping has unique colors per value', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        mapData: [
          {
            mapDataId: 'type',
            mapId: 'regions',
            data: [
              { geometryId: 'a', value: 'forest' },
              { geometryId: 'b', value: 'water' },
              { geometryId: 'c', value: 'urban' },
              { geometryId: 'd', value: 'agriculture' },
            ],
          },
        ],
      })
    );

    const colorBy = resolved.legends![0].colorBy;
    if (colorBy.type === 'categorical') {
      const colors = Object.values(colorBy.mapping!);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    }
  });
});

describe('choropleth happy path — full pipeline to MapLibre expression', () => {
  test('resolved spec produces valid step expression for MapLibre', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        mapData: [
          {
            mapDataId: 'pop',
            mapId: 'regions',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 200 },
              { geometryId: 'c', value: 300 },
              { geometryId: 'd', value: 400 },
              { geometryId: 'e', value: 500 },
              { geometryId: 'f', value: 600 },
            ],
          },
        ],
      })
    );

    const legend = resolved.legends![0];
    const colorBy = legend.colorBy;
    expect(colorBy.type).toBe('quantitative');

    if (colorBy.type === 'quantitative') {
      const expression = buildFillColorExpression({
        legend,
        breaks: colorBy.thresholds,
      });

      // Should be a step expression
      expect(expression[0]).toBe('step');
      // Should have the coalesce expression for feature-state
      expect(expression[1]).toEqual([
        'to-number',
        ['coalesce', ['feature-state', 'value'], 0],
        0,
      ]);
      // Should have a fallback color (3rd element)
      expect(typeof expression[2]).toBe('string');
      // Should have break/color pairs after fallback
      const breakColorPairs = expression.slice(3);
      expect(breakColorPairs.length).toBeGreaterThan(0);
      expect(breakColorPairs.length % 2).toBe(0);
    }
  });

  test('resolved spec with user colors produces valid step expression', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        legends: [
          {
            id: 'density-legend',
            colorBy: {
              type: 'quantitative',
              colors: [...SEQUENTIAL_PALETTES.green],
            },
          },
        ],
        mapData: [
          {
            mapDataId: 'density',
            mapId: 'regions',
            data: [
              { geometryId: 'a', value: 50 },
              { geometryId: 'b', value: 150 },
              { geometryId: 'c', value: 250 },
              { geometryId: 'd', value: 350 },
              { geometryId: 'e', value: 450 },
              { geometryId: 'f', value: 550 },
            ],
          },
        ],
      })
    );

    const legend = resolved.legends![0];
    const colorBy = legend.colorBy;

    if (colorBy.type === 'quantitative') {
      const expression = buildFillColorExpression({
        legend,
        breaks: colorBy.thresholds,
      });

      expect(expression[0]).toBe('step');
      // All non-fallback colors should come from the green palette
      const colorsInExpression = expression.filter((el) => {
        return (
          typeof el === 'string' &&
          el.startsWith('#') &&
          el !== colorBy.defaultColor
        );
      });
      for (const color of colorsInExpression) {
        expect(SEQUENTIAL_PALETTES.green).toContain(color);
      }
    }
  });

  test('resolved spec with categorical data produces valid match expression', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        mapData: [
          {
            mapDataId: 'type',
            mapId: 'regions',
            data: [
              { geometryId: 'a', value: 'urban' },
              { geometryId: 'b', value: 'rural' },
            ],
          },
        ],
      })
    );

    const legend = resolved.legends![0];
    const expression = buildFillColorExpression({ legend });

    expect(expression[0]).toBe('match');
    // Should have label/color pairs plus fallback
    expect(expression.length).toBeGreaterThanOrEqual(5);
  });
});

describe('choropleth happy path — legend metadata preservation', () => {
  test('preserves user title, position, and reference', () => {
    const resolved = resolveSpecFromMapType(
      makeSpec({
        legends: [
          {
            id: 'density-legend',
            title: 'Population Density',
            subtitle: 'hab/km²',
            position: 'bottom-right',
            reference: '{link:IBGE|https://ibge.gov.br}',
          },
        ],
        mapData: [
          {
            mapDataId: 'density',
            mapId: 'regions',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 200 },
              { geometryId: 'c', value: 300 },
              { geometryId: 'd', value: 400 },
              { geometryId: 'e', value: 500 },
              { geometryId: 'f', value: 600 },
            ],
          },
        ],
      })
    );

    const legend = resolved.legends![0];
    expect(legend.title).toBe('Population Density');
    expect(legend.subtitle).toBe('hab/km²');
    expect(legend.position).toBe('bottom-right');
    expect(legend.reference).toBe('{link:IBGE|https://ibge.gov.br}');
    // colorBy should still be auto-generated
    expect(legend.colorBy.type).toBe('quantitative');
  });

  test('preserves user-provided layers', () => {
    const userLayers = [
      { id: 'custom-fill', sourceId: 'regions', geometry: 'polygon' as const },
    ];
    const resolved = resolveSpecFromMapType(
      makeSpec({
        layers: userLayers,
        mapData: [
          {
            mapDataId: 'pop',
            mapId: 'regions',
            data: [
              { geometryId: 'a', value: 100 },
              { geometryId: 'b', value: 200 },
            ],
          },
        ],
      })
    );

    expect(resolved.layers).toEqual(userLayers);
  });
});
