/**
 * An extrusion whose height reads a dataset of its own (`extrusion.mapDataId`)
 * — the colour shows one indicator and the height another — and the checks
 * validation runs on that dataset.
 */

import { resolveExtrusionHeightExpression } from 'src/adapters/maplibre/layerTranslation';
import type {
  MapData,
  VisualizationLayer,
  VisualizationSpec,
} from 'src/spec/types';
import type { LegendSpec } from 'src/spec/types.legend';
import { validateSpec } from 'src/spec/validateSpec';

const legend: LegendSpec = {
  id: 'ivs',
  colorBy: {
    type: 'quantitative',
    property: 'value',
    scale: 'threshold',
    thresholds: [0.3, 0.5],
    colors: ['#0a0', '#fa0', '#d00'],
  },
};

const colour: MapData = {
  mapDataId: 'ivs',
  mapId: 'districts',
  data: [{ geometryId: 1, value: 0.4 }],
};

const population: MapData = {
  mapDataId: 'population',
  mapId: 'districts',
  stateKey: 'population',
  data: [
    { geometryId: 1, value: 1000 },
    { geometryId: 2, value: 4000 },
  ],
};

const layerWith = (
  extrusion: VisualizationLayer['extrusion']
): VisualizationLayer => {
  return {
    id: 'fill',
    sourceId: 'districts',
    geometry: 'polygon',
    mapDataId: 'ivs',
    activeLegendId: 'ivs',
    extrusion,
  };
};

const hasValue = (key: string) => {
  return ['!=', ['feature-state', key], null];
};
const value = (key: string) => {
  return ['to-number', ['feature-state', key], 0];
};

describe('height from a dataset of its own', () => {
  test('reads its state key, continuous without thresholds', () => {
    expect(
      resolveExtrusionHeightExpression(
        layerWith({ mapDataId: 'population', maxHeight: 2000 }),
        [legend],
        [colour, population]
      )
    ).toEqual([
      'case',
      hasValue('population'),
      ['interpolate', ['linear'], value('population'), 0, 0, 4000, 2000],
      0,
    ]);
  });

  test('steps over its own thresholds — sorted, deduplicated, finite', () => {
    expect(
      resolveExtrusionHeightExpression(
        layerWith({
          mapDataId: 'population',
          maxHeight: 300,
          thresholds: [3000, 1000, 3000, Number.NaN],
        }),
        [legend],
        [colour, population]
      )
    ).toEqual([
      'case',
      hasValue('population'),
      ['step', value('population'), 100, 1000, 200, 3000, 300],
      0,
    ]);
  });

  test("an unknown id falls back to the colour's dataset and legend breaks", () => {
    expect(
      resolveExtrusionHeightExpression(
        layerWith({ mapDataId: 'missing', maxHeight: 300 }),
        [legend],
        [colour, population]
      )
    ).toEqual([
      'case',
      hasValue('value'),
      ['step', value('value'), 100, 0.3, 200, 0.5, 300],
      0,
    ]);
  });
});

const specWith = ({
  extrusion,
  mapData = [colour, population],
}: {
  extrusion: VisualizationLayer['extrusion'];
  mapData?: MapData[];
}): VisualizationSpec => {
  return {
    engine: 'maplibre',
    sources: [
      {
        id: 'districts',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
      {
        id: 'other',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [layerWith(extrusion)],
    legends: [legend],
    mapData,
  };
};

const issuesOf = (spec: VisualizationSpec) => {
  const result = validateSpec(spec);
  return result.status === 'resolved' ? [] : result.issues;
};

describe('validation of the height dataset', () => {
  test('accepts a dataset on the same source with a state key of its own', () => {
    expect(
      issuesOf(specWith({ extrusion: { mapDataId: 'population' } }))
    ).toEqual([]);
    expect(issuesOf(specWith({ extrusion: { maxHeight: 100 } }))).toEqual([]);
  });

  test('reports an unknown dataset, listing the declared ones', () => {
    const [issue] = issuesOf(specWith({ extrusion: { mapDataId: 'nope' } }));

    expect(issue.code).toBe('unknown-map-data-id');
    expect(issue.subject.path).toBe('layers[fill].extrusion.mapDataId');
    expect(issue.repair).toEqual([
      {
        kind: 'allowed-values',
        path: 'layers[fill].extrusion.mapDataId',
        values: ['ivs', 'population'],
      },
    ]);
  });

  test('reports a dataset on another source', () => {
    const elsewhere: MapData = { ...population, mapId: 'other' };
    const [issue] = issuesOf(
      specWith({
        extrusion: { mapDataId: 'population' },
        mapData: [colour, elsewhere],
      })
    );

    expect(issue.code).toBe('source-scope-conflict');
  });

  test("reports a dataset sharing the colour's state key", () => {
    const sameKey: MapData = { ...population, stateKey: undefined };
    const [issue] = issuesOf(
      specWith({
        extrusion: { mapDataId: 'population' },
        mapData: [colour, sameKey],
      })
    );

    expect(issue.code).toBe('state-key-collision');
    expect(issue.subject).toEqual({
      path: 'mapData[population].stateKey',
      id: 'population',
    });
  });

  test('a layer without a colour dataset has nothing to collide with', () => {
    const spec = specWith({ extrusion: { mapDataId: 'population' } });
    const [layer] = spec.layers;
    expect(
      issuesOf({ ...spec, layers: [{ ...layer, mapDataId: undefined }] })
    ).toEqual([]);
  });

  test('pointing the height at the colour dataset itself is no collision', () => {
    expect(issuesOf(specWith({ extrusion: { mapDataId: 'ivs' } }))).toEqual([]);
  });
});
