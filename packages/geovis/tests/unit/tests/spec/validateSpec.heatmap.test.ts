import {
  findHeatmapLayerForLegend,
  isHeatmapPaletteName,
  resolveDensityLegendColors,
  resolveHeatmapColors,
} from 'src/spec/heatmap';
import { SEQUENTIAL_PALETTES } from 'src/spec/mapTypeDefaults/palettes';
import type { LegendSpec, VisualizationSpec } from 'src/spec/types';
import { validateSpec } from 'src/spec/validateSpec';
import { validateHeatmaps } from 'src/spec/validateSpec.heatmapChecks';

const densityLegend: LegendSpec = {
  id: 'density',
  colorBy: { type: 'density' },
};

const specWith = ({
  paint,
  legends,
  activeLegendId,
}: {
  paint?: Record<string, unknown>;
  legends?: LegendSpec[];
  activeLegendId?: string;
} = {}): VisualizationSpec => {
  return {
    engine: 'maplibre',
    sources: [
      {
        id: 'crashes',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [
      {
        id: 'heat',
        sourceId: 'crashes',
        geometry: 'heatmap',
        activeLegendId,
        paint,
      },
    ],
    legends,
  } as VisualizationSpec;
};

const pathsOf = (spec: VisualizationSpec) => {
  return validateHeatmaps(spec).map((issue) => {
    return issue.subject.path;
  });
};

describe('heatmap paint validation', () => {
  test('accepts the full heatmap vocabulary, and resolves through validateSpec', () => {
    const spec = specWith({
      activeLegendId: 'density',
      legends: [densityLegend],
      paint: {
        heatmapColors: 'red',
        heatmapRadius: [
          [10, 6],
          [16, 40],
        ],
        heatmapOpacity: [
          [14, 1],
          [16, 0],
        ],
        heatmapIntensity: 2,
        heatmapWeight: { property: 'peso', max: 10 },
      },
    });

    expect(validateHeatmaps(spec)).toEqual([]);
    expect(validateSpec(spec).status).toBe('resolved');
  });

  test.each([
    ['a negative number', -1, 'must be 0 or more'],
    ['an empty list', [], 'non-empty list of [zoom, value] pairs'],
    ['a malformed pair', [[10]], 'non-empty list of [zoom, value] pairs'],
    [
      'zooms out of order',
      [
        [16, 40],
        [10, 6],
      ],
      'ascending zoom',
    ],
    [
      'a repeated zoom',
      [
        [10, 6],
        [10, 8],
      ],
      'ascending zoom',
    ],
    ['a negative stop value', [[10, -2]], 'keep every value 0 or more'],
  ])('rejects heatmapRadius as %s', (_, value, message) => {
    const [issue] = validateHeatmaps(
      specWith({ paint: { heatmapRadius: value } })
    );

    expect(issue.code).toBe('invalid-schema');
    expect(issue.subject.path).toBe('layers[heat].paint.heatmapRadius');
    expect(issue.message).toContain(message);
  });

  test('holds heatmapOpacity between 0 and 1, fixed or by zoom', () => {
    expect(pathsOf(specWith({ paint: { heatmapOpacity: 1.5 } }))).toEqual([
      'layers[heat].paint.heatmapOpacity',
    ]);
    const [issue] = validateHeatmaps(
      specWith({ paint: { heatmapOpacity: [[10, 2]] } })
    );
    expect(issue.message).toContain('between 0 and 1');
  });

  test('offers the palette names for an unknown one', () => {
    const [issue] = validateHeatmaps(
      specWith({ paint: { heatmapColors: 'rainbow' } })
    );

    expect(issue.subject.path).toBe('layers[heat].paint.heatmapColors');
    expect(issue.repair).toEqual([
      {
        kind: 'allowed-values',
        path: 'layers[heat].paint.heatmapColors',
        values: ['blue', 'green', 'red'],
      },
    ]);
  });

  test.each([
    ['a single colour', ['#dc2626']],
    ['an empty colour', ['#fde68a', '']],
    ['a number', 3],
  ])('rejects heatmapColors as %s', (_, colors) => {
    expect(pathsOf(specWith({ paint: { heatmapColors: colors } }))).toEqual([
      'layers[heat].paint.heatmapColors',
    ]);
  });

  test.each([
    ['a negative number', -1],
    ['a weight without a property', { max: 10 }],
    ['a weight with a zero max', { property: 'peso', max: 0 }],
    ['null', null],
  ])('rejects heatmapWeight as %s', (_, weight) => {
    expect(pathsOf(specWith({ paint: { heatmapWeight: weight } }))).toEqual([
      'layers[heat].paint.heatmapWeight',
    ]);
  });

  test('leaves the paint of other geometries alone', () => {
    const spec = specWith();
    spec.layers[0] = {
      ...spec.layers[0],
      geometry: 'point',
      paint: { heatmapRadius: -1 } as never,
    };
    expect(validateHeatmaps(spec)).toEqual([]);
  });
});

describe('density legend validation', () => {
  test('rejects a density legend no heatmap layer refers to', () => {
    const [issue] = validateHeatmaps(specWith({ legends: [densityLegend] }));

    expect(issue.subject).toEqual({
      path: 'legends[density].colorBy',
      id: 'density',
    });
    expect(validateSpec(specWith({ legends: [densityLegend] })).status).toBe(
      'invalid'
    );
  });

  test('accepts one the heatmap layer declares itself', () => {
    const spec = specWith();
    spec.layers[0] = { ...spec.layers[0], legends: [densityLegend] };
    expect(validateHeatmaps(spec)).toEqual([]);
  });

  test('rejects one declared on a layer that is not a heatmap', () => {
    const spec = specWith();
    spec.layers.push({
      id: 'pts',
      sourceId: 'crashes',
      geometry: 'point',
      legends: [densityLegend],
    });
    expect(pathsOf(spec)).toEqual(['layers[pts].legends[density].colorBy']);
  });

  test('the schema rejects an unknown field on a density colorBy', () => {
    const spec = specWith({
      activeLegendId: 'density',
      legends: [
        {
          id: 'density',
          colorBy: { type: 'density', colors: ['#000'] } as never,
        },
      ],
    });
    expect(validateSpec(spec).status).toBe('invalid');
  });
});

describe('heatmap spec helpers', () => {
  test('isHeatmapPaletteName knows only the sequential palettes', () => {
    expect(isHeatmapPaletteName('blue')).toBe(true);
    expect(isHeatmapPaletteName('rainbow')).toBe(false);
    expect(isHeatmapPaletteName(1)).toBe(false);
  });

  test('resolveHeatmapColors', () => {
    expect(resolveHeatmapColors(['#000', '#fff'])).toEqual(['#000', '#fff']);
    expect(resolveHeatmapColors('green')).toEqual([
      ...SEQUENTIAL_PALETTES.green,
    ]);
    expect(resolveHeatmapColors([])).toBeUndefined();
    expect(resolveHeatmapColors(undefined)).toBeUndefined();
  });

  test('resolveDensityLegendColors reads the referring heatmap layer', () => {
    const spec = specWith({
      activeLegendId: 'density',
      legends: [densityLegend],
      paint: { heatmapColors: ['#000', '#fff'] },
    });

    expect(findHeatmapLayerForLegend(spec, densityLegend)?.id).toBe('heat');
    expect(resolveDensityLegendColors(spec, densityLegend)).toEqual([
      '#000',
      '#fff',
    ]);
    expect(
      resolveDensityLegendColors(spec, {
        id: 'density',
        colorBy: { type: 'categorical' },
      })
    ).toBeUndefined();
    expect(
      resolveDensityLegendColors(specWith(), densityLegend)
    ).toBeUndefined();
  });
});
