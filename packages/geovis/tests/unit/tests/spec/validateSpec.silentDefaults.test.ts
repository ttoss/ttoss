/**
 * Spec mistakes that used to pass validation and render a silent default:
 * unknown `paint` keys (#1297), a dangling `activeLegendId` (#1299), and the
 * `colorBy.property` the schema required but nothing read (#1300) — plus the
 * resolver exported so a caller can validate what a `mapType` spec expands to
 * (#1301).
 */

import {
  type GeoVisIssue,
  resolveSpecFromMapType,
  validateSpec,
  type VisualizationLayer,
  type VisualizationSpec,
} from 'src/index';
import type { EngineAdapter } from 'src/runtime/adapter';
import { createRuntime } from 'src/runtime/createRuntime';

const specWith = (
  layer: Partial<VisualizationLayer>,
  extra: Partial<VisualizationSpec> = {}
): VisualizationSpec => {
  return {
    engine: 'maplibre',
    sources: [
      {
        id: 'districts',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [
      {
        id: 'fill',
        sourceId: 'districts',
        geometry: 'polygon',
        ...layer,
      } as VisualizationLayer,
    ],
    ...extra,
  };
};

const issuesOf = (spec: unknown): GeoVisIssue[] => {
  const result = validateSpec(spec);
  return result.status === 'resolved' ? [] : result.issues;
};

const legend = (id: string, withProperty = true) => {
  return {
    id,
    colorBy: {
      type: 'quantitative' as const,
      ...(withProperty && { property: 'value' }),
      scale: 'threshold' as const,
      thresholds: [10],
      colors: ['#eee', '#111'],
    },
  };
};

describe('paint keys (#1297)', () => {
  test("rejects MapLibre's kebab-case key, suggesting the camelCase one", () => {
    const [issue] = issuesOf(
      specWith({ paint: { 'fill-color': '#e8e0d5' } as never })
    );

    expect(issue.code).toBe('invalid-schema');
    expect(issue.subject).toEqual({
      path: 'layers[fill].paint.fill-color',
      id: 'fill',
    });
    expect(issue.repair).toEqual([
      {
        kind: 'set-value',
        path: 'layers[fill].paint.fillColor',
        value: '#e8e0d5',
        label: "Use 'fillColor' instead of 'fill-color'",
      },
      {
        kind: 'allowed-values',
        path: 'layers[fill].paint',
        values: ['fillColor', 'fillOpacity', 'lineColor'],
      },
    ]);
  });

  test('rejects a key of another geometry, with the accepted keys only', () => {
    const [issue] = issuesOf(specWith({ paint: { lineWidth: 2 } as never }));

    expect(issue.subject.path).toBe('layers[fill].paint.lineWidth');
    expect(issue.repair).toEqual([
      {
        kind: 'allowed-values',
        path: 'layers[fill].paint',
        values: ['fillColor', 'fillOpacity', 'lineColor'],
      },
    ]);
  });

  test('accepts every key of the geometry', () => {
    const spec = specWith({
      geometry: 'point',
      paint: {
        circleColor: '#f00',
        circleRadius: 4,
        circleOpacity: 1,
        circleStrokeColor: '#fff',
        circleStrokeOpacity: 0.5,
        circleStrokeWidth: 1,
      },
    });
    expect(validateSpec(spec).status).toBe('resolved');
  });

  test('a mapType spec validates once expanded, its generated paint included', () => {
    const spec: VisualizationSpec = {
      engine: 'maplibre',
      mapType: 'proportionalCircles',
      sources: [
        {
          id: 'cities',
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        },
      ],
      layers: [],
      mapData: [
        {
          mapDataId: 'population',
          mapId: 'cities',
          data: [{ geometryId: 1, value: 10 }],
        },
      ],
    };
    expect(validateSpec(resolveSpecFromMapType(spec)).status).toBe('resolved');
  });

  test('a patch writing an unknown key is rejected, not applied', () => {
    const adapter = {
      id: 'maplibre',
      getCapabilities: () => {
        return {
          engine: 'maplibre',
          sourceTypes: ['geojson'],
          layerGeometries: ['polygon'],
          dataFeatures: { featureState: ['geojson'], filter: ['geojson'] },
          viewFeatures: { pitch: true, bearing: true },
        };
      },
      mount: jest.fn(),
      update: jest.fn(),
      applyPatch: jest.fn(),
      destroy: jest.fn(),
    } as unknown as EngineAdapter;
    const runtime = createRuntime(adapter, specWith({}));

    const result = runtime.applyPatch({
      target: 'layer',
      op: 'replace',
      path: 'layers.fill.paint.fill-color',
      value: '#f00',
    });

    expect(result.status).toBe('invalid');
    expect(adapter.applyPatch).not.toHaveBeenCalled();
  });
});

describe('activeLegendId (#1299)', () => {
  test('rejects an id no legend carries, listing the ones the layer sees', () => {
    const [issue] = issuesOf(
      specWith(
        { activeLegendId: 'rates-legnd', legends: [legend('own')] },
        { legends: [legend('rates-legend')] }
      )
    );

    expect(issue.code).toBe('unknown-legend-id');
    expect(issue.subject).toEqual({
      path: 'layers[fill].activeLegendId',
      id: 'fill',
    });
    expect(issue.repair).toEqual([
      {
        kind: 'allowed-values',
        path: 'layers[fill].activeLegendId',
        values: ['own', 'rates-legend'],
      },
    ]);
    expect(validateSpec(specWith({ activeLegendId: 'x' }, {})).status).toBe(
      'mismatch'
    );
  });

  test('without any legend, says so and offers no list', () => {
    const [issue] = issuesOf(specWith({ activeLegendId: 'rates' }));

    expect(issue.code).toBe('unknown-legend-id');
    expect(issue.message).toMatch(/declares any legend/);
    expect(issue.repair).toBeUndefined();
  });

  test("resolves from the layer's legends or the spec's", () => {
    expect(
      validateSpec(
        specWith({ activeLegendId: 'own', legends: [legend('own')] })
      ).status
    ).toBe('resolved');
    expect(
      validateSpec(
        specWith({ activeLegendId: 'shared' }, { legends: [legend('shared')] })
      ).status
    ).toBe('resolved');
  });
});

describe('colorBy.property (#1300)', () => {
  test('is optional now', () => {
    const spec = specWith(
      { activeLegendId: 'rates' },
      { legends: [legend('rates', false)] }
    );
    expect(validateSpec(spec).status).toBe('resolved');
  });

  test('is still accepted where specs declare it', () => {
    const spec = specWith(
      { activeLegendId: 'rates' },
      { legends: [legend('rates')] }
    );
    expect(validateSpec(spec).status).toBe('resolved');
  });
});
