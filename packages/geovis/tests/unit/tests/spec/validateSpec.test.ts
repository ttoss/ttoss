import { validateSpec } from 'src/spec/validateSpec';

import geojsonUrlMap from '../../../../src/fixtures/geojson-url-map.json';
import singleMap from '../../../../src/fixtures/single-map.json';

const issueMessages = (result: ReturnType<typeof validateSpec>): string => {
  return result.status === 'resolved'
    ? ''
    : result.issues
        .map((issue) => {
          return issue.message;
        })
        .join('\n');
};

describe('validateSpec', () => {
  test.each([
    ['single-map (geojson source)', singleMap],
    ['geojson-url-map (geojson url source)', geojsonUrlMap],
  ])('fixture "%s" is valid', (_name, fixture) => {
    const result = validateSpec(fixture);

    expect(result.status).toBe('resolved');
  });

  test('returns issues for an invalid spec', () => {
    const result = validateSpec({ title: 'missing required fields' });

    expect(result.status).toBe('invalid');

    if (result.status !== 'resolved') {
      expect(result.issues.length).toBeGreaterThan(0);
      expect(
        result.issues.every((issue) => {
          return issue.code === 'invalid-schema';
        })
      ).toBe(true);
    }
  });
});

describe('validateSpec — mapData', () => {
  const baseSpec = {
    engine: 'maplibre' as const,
    view: { center: [0, 0] as [number, number], zoom: 1 },
    sources: [
      {
        id: 'states',
        type: 'geojson' as const,
        data: { type: 'FeatureCollection' as const, features: [] },
      },
    ],
    layers: [
      { id: 'states-fill', sourceId: 'states', geometry: 'polygon' as const },
    ],
  };

  // 1.1
  test('accepts spec with valid inline mapData', () => {
    const result = validateSpec({
      ...baseSpec,
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'states',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ],
      layers: [{ ...baseSpec.layers[0], mapDataId: 'pop' }],
    });
    expect(result.status).toBe('resolved');
  });

  // 1.2
  test('accepts V1 spec without mapData (no regression)', () => {
    const result = validateSpec(baseSpec);
    expect(result.status).toBe('resolved');
  });

  // 1.3
  test('rejects mapData.mapId pointing to unknown source', () => {
    const result = validateSpec({
      ...baseSpec,
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'does-not-exist',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ],
    });
    expect(result.status).toBe('mismatch');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/does-not-exist/);
      const issue = result.issues.find((i) => {
        return i.code === 'unknown-source';
      });
      expect(issue).toBeDefined();
      expect(issue?.repair).toEqual([
        {
          kind: 'allowed-values',
          path: 'mapData[pop].mapId',
          values: ['states'],
        },
      ]);
    }
  });

  // 1.4
  test('rejects mapData.mapId pointing to a non-geojson source', () => {
    const result = validateSpec({
      ...baseSpec,
      sources: [
        ...baseSpec.sources,
        {
          id: 'tiles',
          type: 'vector-tiles' as const,
          tiles: ['https://example/{z}/{x}/{y}.pbf'],
        },
      ],
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'tiles',
          data: [{ geometryId: 'BR', value: 1 }],
        },
      ],
    });
    expect(result.status).toBe('unsupported');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/geojson/);
      const issue = result.issues.find((i) => {
        return i.code === 'unsupported-source-type';
      });
      expect(issue?.repair).toEqual([
        {
          kind: 'allowed-values',
          path: 'sources[tiles].type',
          values: ['geojson'],
        },
      ]);
    }
  });

  // 1.5
  test('rejects layer.mapDataId referencing unknown mapData entry', () => {
    const result = validateSpec({
      ...baseSpec,
      layers: [{ ...baseSpec.layers[0], mapDataId: 'ghost' }],
    });
    expect(result.status).toBe('mismatch');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/ghost/);
      const issue = result.issues.find((i) => {
        return i.code === 'unknown-map-data-id';
      });
      expect(issue?.repair).toEqual([
        {
          kind: 'allowed-values',
          path: 'layers[states-fill].mapDataId',
          values: [],
        },
      ]);
    }
  });

  // 1.6
  test('rejects duplicate mapData.mapDataId', () => {
    const dupEntry = {
      mapDataId: 'pop',
      mapId: 'states',
      data: [{ geometryId: 'BR', value: 10 }],
    };
    const result = validateSpec({
      ...baseSpec,
      mapData: [
        dupEntry,
        { ...dupEntry, data: [{ geometryId: 'AR', value: 5 }] },
      ],
    });
    expect(result.status).toBe('mismatch');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/pop/);
      const issue = result.issues.find((i) => {
        return i.code === 'duplicate-map-data-id';
      });
      expect(issue?.repair).toBeUndefined();
    }
  });

  // 1.7
  test('rejects layer.mapDataId whose mapId does not match layer.sourceId', () => {
    const result = validateSpec({
      ...baseSpec,
      sources: [
        ...baseSpec.sources,
        {
          id: 'other',
          type: 'geojson' as const,
          data: { type: 'FeatureCollection' as const, features: [] },
        },
      ],
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'other',
          data: [{ geometryId: 'BR', value: 1 }],
        },
      ],
      layers: [{ ...baseSpec.layers[0], mapDataId: 'pop' }],
      // layer.sourceId = 'states', mapData.mapId = 'other' → mismatch
    });
    expect(result.status).toBe('mismatch');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/source-scoped/);
      const issue = result.issues.find((i) => {
        return i.code === 'source-scope-conflict';
      });
      expect(issue?.repair).toEqual([
        {
          kind: 'set-value',
          path: 'layers[states-fill].sourceId',
          value: 'other',
          label: `Point layer 'states-fill' at source 'other'`,
        },
      ]);
    }
  });

  // 1.8
  test('accepts unknown joinKey at schema-validation time (property existence is runtime concern)', () => {
    const result = validateSpec({
      ...baseSpec,
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'states',
          joinKey: 'does-not-exist-in-properties',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ],
      layers: [{ ...baseSpec.layers[0], mapDataId: 'pop' }],
    });

    expect(result.status).toBe('resolved');
  });

  test('rejects threshold legends with out-of-order breakpoints', () => {
    const result = validateSpec({
      ...baseSpec,
      legends: [
        {
          id: 'population',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
            thresholds: [100, 50],
            colors: ['#eff6ff', '#93c5fd', '#3b82f6'],
          },
        },
      ],
      layers: [
        {
          ...baseSpec.layers[0],
          activeLegendId: 'population',
        },
      ],
    });

    expect(result.status).toBe('invalid');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/ascending order/);
      const issue = result.issues.find((i) => {
        return i.code === 'invalid-threshold-order';
      });
      expect(issue?.repair).toBeUndefined();
    }
  });

  test('rejects threshold legends with non-finite threshold values (NaN)', () => {
    const result = validateSpec({
      ...baseSpec,
      legends: [
        {
          id: 'population',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
            thresholds: [Number.NaN],
            colors: ['#eff6ff', '#93c5fd'],
          },
        },
      ],
      layers: [
        {
          ...baseSpec.layers[0],
          activeLegendId: 'population',
        },
      ],
    });

    expect(result.status).toBe('invalid');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/non-finite/);
      expect(
        result.issues.every((i) => {
          return i.code === 'invalid-threshold-value';
        })
      ).toBe(true);
    }
  });

  test('rejects threshold legends with non-finite threshold values (Infinity)', () => {
    const result = validateSpec({
      ...baseSpec,
      legends: [
        {
          id: 'population',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
            thresholds: [Infinity],
            colors: ['#eff6ff', '#93c5fd'],
          },
        },
      ],
      layers: [
        {
          ...baseSpec.layers[0],
          activeLegendId: 'population',
        },
      ],
    });

    expect(result.status).toBe('invalid');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/non-finite/);
    }
  });

  test('accepts legends with labelFormat and reference fields', () => {
    const result = validateSpec({
      ...baseSpec,
      legends: [
        {
          id: 'pop',
          title: 'Population',
          subtitle: 'Residents per district',
          labelFormat: { type: 'count', abbreviate: true, extended: true },
          normalization: { type: 'raw', numeratorLabel: 'inhabitants' },
          reference: 'SMUL/GEOINFO — Resident population evolution',
          noDataLabel: 'No data',
          position: 'bottom-right',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
            thresholds: [50000, 100000, 150000, 200000],
            colors: ['#f0f9ff', '#bfdbfe', '#60a5fa', '#3b82f6', '#1d4ed8'],
          },
        },
      ],
      layers: [
        {
          ...baseSpec.layers[0],
          activeLegendId: 'pop',
        },
      ],
    });

    expect(result.status).toBe('resolved');
  });

  test('rejects legend with additional unknown fields', () => {
    const result = validateSpec({
      ...baseSpec,
      legends: [
        {
          id: 'pop',
          unknownField: 'should-fail',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
          },
        },
      ],
    });

    expect(result.status).toBe('invalid');
  });
});

describe('validateSpec — layer interaction fields (hoverPaint, selectedPaint, clickAnchor)', () => {
  const baseSpec = {
    engine: 'maplibre' as const,
    view: { center: [0, 0] as [number, number], zoom: 1 },
    sources: [
      {
        id: 'regions',
        type: 'geojson' as const,
        data: { type: 'FeatureCollection' as const, features: [] },
      },
    ],
    layers: [
      { id: 'regions-fill', sourceId: 'regions', geometry: 'polygon' as const },
    ],
  };

  test('accepts layer with hoverPaint', () => {
    const result = validateSpec({
      ...baseSpec,
      layers: [
        {
          ...baseSpec.layers[0],
          hoverPaint: { lineColor: '#ff0000', lineWidth: 2 },
        },
      ],
    });
    expect(result.status).toBe('resolved');
  });

  test('accepts layer with selectedPaint', () => {
    const result = validateSpec({
      ...baseSpec,
      layers: [
        {
          ...baseSpec.layers[0],
          selectedPaint: { lineColor: '#0000ff', lineWidth: 3 },
        },
      ],
    });
    expect(result.status).toBe('resolved');
  });

  test('accepts layer with clickAnchor using iconImage', () => {
    const result = validateSpec({
      ...baseSpec,
      layers: [
        {
          ...baseSpec.layers[0],
          clickAnchor: { iconImage: 'marker-15', iconSize: 1.5 },
        },
      ],
    });
    expect(result.status).toBe('resolved');
  });

  test('accepts layer with clickAnchor using color and offset', () => {
    const result = validateSpec({
      ...baseSpec,
      layers: [
        {
          ...baseSpec.layers[0],
          clickAnchor: { color: '#3FB1CE', offset: [0, -10] },
        },
      ],
    });
    expect(result.status).toBe('resolved');
  });

  test('rejects hoverPaint with unknown property', () => {
    const result = validateSpec({
      ...baseSpec,
      layers: [
        {
          ...baseSpec.layers[0],
          hoverPaint: { lineColor: '#ff0000', unknownProp: true },
        },
      ],
    });
    expect(result.status).toBe('invalid');
  });

  test('rejects clickAnchor with unknown property', () => {
    const result = validateSpec({
      ...baseSpec,
      layers: [
        {
          ...baseSpec.layers[0],
          clickAnchor: { iconImage: 'pin', unknownProp: 'bad' },
        },
      ],
    });
    expect(result.status).toBe('invalid');
  });
});

describe('validateSpec — MapData dimension', () => {
  const baseSpec = {
    engine: 'maplibre' as const,
    view: { center: [0, 0] as [number, number], zoom: 1 },
    sources: [
      {
        id: 'cities',
        type: 'geojson' as const,
        data: { type: 'FeatureCollection' as const, features: [] },
      },
    ],
    layers: [
      { id: 'cities-points', sourceId: 'cities', geometry: 'point' as const },
    ],
  };

  test('rejects duplicate dimension on same source', () => {
    const result = validateSpec({
      ...baseSpec,
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'cities',
          dimension: 'color',
          data: [{ geometryId: 'city-1', value: 100000 }],
        },
        {
          mapDataId: 'density',
          mapId: 'cities',
          dimension: 'color',
          data: [{ geometryId: 'city-1', value: 5000 }],
        },
      ],
    });

    expect(result.status).toBe('mismatch');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/duplicate dimension/);
      const issue = result.issues.find((i) => {
        return i.code === 'duplicate-dimension';
      });
      expect(issue?.repair).toBeUndefined();
    }
  });

  test('rejects shared stateKey across different dimensions on same source', () => {
    const result = validateSpec({
      ...baseSpec,
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'cities',
          stateKey: 'shared',
          dimension: 'size',
          data: [{ geometryId: 'city-1', value: 100000 }],
        },
        {
          mapDataId: 'density',
          mapId: 'cities',
          stateKey: 'shared',
          dimension: 'color',
          data: [{ geometryId: 'city-1', value: 50 }],
        },
      ],
    });

    expect(result.status).toBe('mismatch');
    if (result.status !== 'resolved') {
      const messages = issueMessages(result);
      expect(messages).toMatch(/sharing stateKey/);
      expect(messages).toContain('pop');
      expect(messages).toContain('density');
      const issue = result.issues.find((i) => {
        return i.code === 'state-key-collision';
      });
      expect(issue?.repair).toBeUndefined();
    }
  });

  test('accepts valid spec with dimension declarations', () => {
    const result = validateSpec({
      ...baseSpec,
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'cities',
          stateKey: 'pop',
          dimension: 'size',
          data: [{ geometryId: 'city-1', value: 100000 }],
        },
        {
          mapDataId: 'gender',
          mapId: 'cities',
          stateKey: 'gender',
          dimension: 'color',
          data: [{ geometryId: 'city-1', value: 'women' }],
        },
      ],
    });

    expect(result.status).toBe('resolved');
  });

  test('accepts spec without dimension (backward compat)', () => {
    const result = validateSpec({
      ...baseSpec,
      mapData: [
        {
          mapDataId: 'legacy',
          mapId: 'cities',
          data: [{ geometryId: 'city-1', value: 100 }],
        },
      ],
    });

    expect(result.status).toBe('resolved');
  });

  test('accepts dimensions on different sources', () => {
    const result = validateSpec({
      ...baseSpec,
      sources: [
        ...baseSpec.sources,
        {
          id: 'other',
          type: 'geojson' as const,
          data: { type: 'FeatureCollection' as const, features: [] },
        },
      ],
      mapData: [
        {
          mapDataId: 'a',
          mapId: 'cities',
          dimension: 'color',
          data: [{ geometryId: 'city-1', value: 'women' }],
        },
        {
          mapDataId: 'b',
          mapId: 'other',
          dimension: 'color',
          data: [{ geometryId: 'city-1', value: 'men' }],
        },
      ],
    });

    expect(result.status).toBe('resolved');
  });
});

describe('validateSpec — aggregation and status precedence', () => {
  test('reports issues from multiple categories in a single call', () => {
    const result = validateSpec({
      engine: 'maplibre' as const,
      view: { center: [0, 0] as [number, number], zoom: 1 },
      sources: [
        {
          id: 'states',
          type: 'geojson' as const,
          data: { type: 'FeatureCollection' as const, features: [] },
        },
      ],
      layers: [
        {
          id: 'states-fill',
          sourceId: 'states',
          geometry: 'polygon' as const,
          mapDataId: 'ghost',
        },
        {
          id: 'points',
          sourceId: 'states',
          geometry: 'point' as const,
          sizeBy: { range: [20, 4] },
        },
      ],
    });

    expect(result.status).not.toBe('resolved');
    if (result.status !== 'resolved') {
      const codes = result.issues
        .map((i) => {
          return i.code;
        })
        .sort();
      expect(codes).toEqual(
        ['invalid-size-range', 'unknown-map-data-id'].sort()
      );
      // 'unknown-map-data-id' is 'mismatch', 'invalid-size-range' is 'invalid' —
      // 'invalid' takes precedence.
      expect(result.status).toBe('invalid');
    }
  });
});
