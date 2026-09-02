/**
 * Tests for applying mapData to MapLibre feature state.
 */

import maplibregl from 'maplibre-gl';
import createMapLibreAdapter from 'src/adapters/maplibre/MapLibreAdapter';

import {
  installMapLibreDomMocks,
  makeContainer,
  makeMapMock,
  makeSpec,
  resetMapLibreDomMocks,
} from './mapLibreAdapterTestUtils';

jest.mock('maplibre-gl', () => {
  return {
    Map: jest.fn(),
    NavigationControl: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

installMapLibreDomMocks();

beforeEach(() => {
  resetMapLibreDomMocks();
});

describe('mapData — feature-state application', () => {
  const makeMapWithEvents = () => {
    const handlers: Record<string, Array<(...a: unknown[]) => void>> = {};
    const map = {
      ...makeMapMock(),
      on: jest.fn((evt: string, cb: (...a: unknown[]) => void) => {
        handlers[evt] = handlers[evt] ?? [];
        handlers[evt].push(cb);
      }),
      off: jest.fn((evt: string, cb: (...a: unknown[]) => void) => {
        handlers[evt] = (handlers[evt] ?? []).filter((h) => {
          return h !== cb;
        });
      }),
      // Source treated as already registered so applyMapDataToSource proceeds.
      getSource: jest.fn(() => {
        return { setData: jest.fn() } as unknown as ReturnType<
          typeof maplibregl.Map.prototype.getSource
        >;
      }),
      isSourceLoaded: jest.fn(() => {
        return true;
      }),
      setFeatureState: jest.fn(),
      removeFeatureState: jest.fn(),
      querySourceFeatures: jest.fn(() => {
        return [];
      }),
    };
    const fire = (evt: string, ...args: unknown[]) => {
      for (const cb of handlers[evt] ?? []) cb(...args);
    };
    return { map, fire };
  };

  const baseSpec = (mapData?: unknown) => {
    return {
      ...makeSpec(),
      sources: [
        {
          id: 'states',
          type: 'geojson' as const,
          data: { type: 'FeatureCollection' as const, features: [] },
        },
      ],
      layers: [
        { id: 'fill', sourceId: 'states', geometry: 'polygon' as const },
      ],
      ...(mapData ? { mapData } : {}),
    };
  };

  // 3.1
  test('applies setFeatureState for each row after load (no joinKey → uses feature.id)', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      baseSpec([
        {
          mapDataId: 'pop',
          mapId: 'states',
          data: [
            { geometryId: 'BR', value: 211 },
            { geometryId: 'AR', value: 45 },
          ],
        },
      ]),
      'v'
    );

    fire('load');

    expect(map.setFeatureState).toHaveBeenCalledTimes(2);
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'states', id: 'BR' },
      { value: 211 }
    );
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'states', id: 'AR' },
      { value: 45 }
    );
  });

  // 3.2 — numeric geometryId stored as string is coerced to number for setFeatureState
  test('coerces string geometryId to number when it represents a finite number', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      baseSpec([
        {
          mapDataId: 'pop',
          mapId: 'states',
          data: [
            { geometryId: '1', value: 100 },
            { geometryId: '2', value: 200 },
          ],
        },
      ]),
      'v'
    );

    fire('load');

    expect(map.setFeatureState).toHaveBeenCalledTimes(2);
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'states', id: 1 },
      { value: 100 }
    );
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'states', id: 2 },
      { value: 200 }
    );
  });

  // 3.2b — removeFeatureState also coerces string geometryId to number
  test('op:remove coerces string geometryId to number for removeFeatureState', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      baseSpec([
        {
          mapDataId: 'pop',
          mapId: 'states',
          data: [{ geometryId: '1', value: 100 }],
        },
      ]),
      'v'
    );
    fire('load');

    adapter.applyPatch?.({ target: 'mapData', op: 'remove', value: 'pop' });

    expect(map.removeFeatureState).toHaveBeenCalledWith(
      {
        source: 'states',
        id: 1,
      },
      'value'
    );
  });

  // 3.3
  test('applyPatch granular replace calls setFeatureState with the right id and value', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      baseSpec([
        {
          mapDataId: 'pop',
          mapId: 'states',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ]),
      'v'
    );
    fire('load');
    jest.mocked(map.setFeatureState).mockClear();

    adapter.applyPatch?.({
      target: 'mapData',
      op: 'replace',
      path: 'mapData.pop.data.BR',
      value: 215,
    });

    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'states', id: 'BR' },
      { value: 215 }
    );
  });

  // 3.6
  test('mounting without mapData never calls setFeatureState (V1 no-regression)', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(makeContainer(), baseSpec(), 'v');

    fire('load');

    expect(map.setFeatureState).not.toHaveBeenCalled();
  });

  // 3.7 — joinKey: applies setFeatureState directly by geometryId (promoted to feature.id)
  test('joinKey: applies setFeatureState directly by geometryId', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      baseSpec([
        {
          mapDataId: 'pop',
          mapId: 'states',
          joinKey: 'name',
          data: [
            { geometryId: 'BR', value: 211 },
            { geometryId: 'AR', value: 45 },
          ],
        },
      ]),
      'v'
    );

    fire('load');

    // `joinKey` is promoted to `feature.id`, so the join value is the id —
    // no viewport-bound resolution.
    expect(map.querySourceFeatures).not.toHaveBeenCalled();
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'states', id: 'BR' },
      { value: 211 }
    );
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'states', id: 'AR' },
      { value: 45 }
    );
  });

  // 3.7b — joinKey: numeric-string geometryId is coerced to a number id
  test('joinKey: coerces numeric-string geometryId to a number id', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });

    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      baseSpec([
        {
          mapDataId: 'pop',
          mapId: 'states',
          joinKey: 'district_code',
          data: [
            { geometryId: '67', value: 211 },
            { geometryId: '88', value: 45 },
          ],
        },
      ]),
      'v'
    );

    fire('load');

    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'states', id: 67 },
      { value: 211 }
    );
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'states', id: 88 },
      { value: 45 }
    );
  });

  // 3.4 — NaN/Infinity row values are sanitized to 0 before setFeatureState
  test.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
  ])(
    'non-finite value (%s) is sanitized to 0 before setFeatureState (no joinKey)',
    (_label, badValue) => {
      const { map, fire } = makeMapWithEvents();
      jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
        return map as never;
      });
      const adapter = createMapLibreAdapter();
      adapter.mount(
        makeContainer(),
        baseSpec([
          {
            mapDataId: 'pop',
            mapId: 'states',
            data: [{ geometryId: 'BR', value: badValue }],
          },
        ]),
        'v'
      );

      fire('load');

      expect(map.setFeatureState).toHaveBeenCalledWith(
        { source: 'states', id: 'BR' },
        { value: 0 }
      );
    }
  );

  // 3.4b — granular replace also sanitizes NaN/Infinity
  test('granular replace patch sanitizes non-finite value to 0', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      baseSpec([
        {
          mapDataId: 'pop',
          mapId: 'states',
          data: [{ geometryId: 'BR', value: 100 }],
        },
      ]),
      'v'
    );
    fire('load');
    jest.mocked(map.setFeatureState).mockClear();

    adapter.applyPatch?.({
      target: 'mapData',
      op: 'replace',
      path: 'mapData.pop.data.BR',
      value: Number.NaN,
    });

    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'states', id: 'BR' },
      { value: 0 }
    );
  });

  // 3.8 — joinKey: granular replace applies directly by geometryId
  test('joinKey: granular replace patch applies directly by geometryId', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      baseSpec([
        {
          mapDataId: 'pop',
          mapId: 'states',
          joinKey: 'name',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ]),
      'v'
    );
    fire('load');
    jest.mocked(map.setFeatureState).mockClear();

    adapter.applyPatch?.({
      target: 'mapData',
      op: 'replace',
      path: 'mapData.pop.data.BR',
      value: 999,
    });

    expect(map.querySourceFeatures).not.toHaveBeenCalled();
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'states', id: 'BR' },
      { value: 999 }
    );
  });

  // 3.9 — joinKey: granular replace no longer depends on the source being loaded
  test('joinKey: granular replace applies even when source is not loaded', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(map.isSourceLoaded).mockReturnValue(false);
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      baseSpec([
        {
          mapDataId: 'pop',
          mapId: 'states',
          joinKey: 'name',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ]),
      'v'
    );
    fire('load');
    jest.mocked(map.setFeatureState).mockClear();

    adapter.applyPatch?.({
      target: 'mapData',
      op: 'replace',
      path: 'mapData.pop.data.BR',
      value: 999,
    });

    // Feature state is keyed by id (no querySourceFeatures), so it applies
    // lazily regardless of load state — MapLibre paints it when the tile loads.
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'states', id: 'BR' },
      { value: 999 }
    );
  });

  // 3.10 — pending listener is cancelled on op:remove before source loads
  test('op:remove cancels pending sourcedata listener; no setFeatureState when source eventually loads', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(map.isSourceLoaded).mockReturnValue(false);
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      baseSpec([
        {
          mapDataId: 'pop',
          mapId: 'states',
          data: [{ geometryId: 'BR', value: 1 }],
        },
      ]),
      'v'
    );
    fire('load'); // registers pending sourcedata listener

    adapter.applyPatch?.({ target: 'mapData', op: 'remove', value: 'pop' });

    // Source loads after removal — stale listener must NOT apply feature state
    fire('sourcedata', { sourceId: 'states', isSourceLoaded: true });

    expect(map.setFeatureState).not.toHaveBeenCalled();
  });

  // 3.11 — pending listener is replaced on full-entry replace before source loads
  test('full-entry replace cancels stale listener and applies only new data when source loads', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(map.isSourceLoaded).mockReturnValue(false);
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      baseSpec([
        {
          mapDataId: 'pop',
          mapId: 'states',
          data: [{ geometryId: 'BR', value: 1 }],
        },
      ]),
      'v'
    );
    fire('load'); // registers pending sourcedata listener for old data (value: 1)

    adapter.applyPatch?.({
      target: 'mapData',
      op: 'replace',
      path: 'mapData.pop',
      value: {
        mapDataId: 'pop',
        mapId: 'states',
        data: [{ geometryId: 'BR', value: 99 }],
      },
    });

    // Source loads — only the replacement data (99) must be applied, not the stale (1)
    fire('sourcedata', { sourceId: 'states', isSourceLoaded: true });

    expect(map.setFeatureState).toHaveBeenCalledTimes(1);
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'states', id: 'BR' },
      { value: 99 }
    );
  });

  test('update() with changed mapData reapplies active legend fill-color expression', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(map.isStyleLoaded).mockReturnValue(true);
    jest.mocked(map.getLayer).mockReturnValue({} as never);
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });

    const adapter = createMapLibreAdapter();
    const withLegend = baseSpec([
      {
        mapDataId: 'pop',
        mapId: 'states',
        data: [{ geometryId: 'BR', value: 211 }],
      },
    ]);
    withLegend.layers = [
      {
        ...withLegend.layers[0],
        legends: [
          {
            id: 'status',
            colorBy: {
              type: 'categorical',
              property: 'status',
              mapping: { high: '#16a34a' },
              defaultColor: '#6b7280',
            },
          },
        ],
        activeLegendId: 'status',
      },
    ];

    adapter.mount(makeContainer(), withLegend, 'v');
    fire('load');
    jest.mocked(map.setPaintProperty).mockClear();

    adapter.update({
      ...withLegend,
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'states',
          data: [{ geometryId: 'BR', value: 300 }],
        },
      ],
    });

    expect(map.setPaintProperty).toHaveBeenCalledWith('fill', 'fill-color', [
      'match',
      ['to-string', ['coalesce', ['feature-state', 'value'], '__missing__']],
      'high',
      '#16a34a',
      '#6b7280',
    ]);
  });

  test('update() keeps adapter-managed legend fill-color for mapData layers', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(map.isStyleLoaded).mockReturnValue(true);
    jest.mocked(map.getLayer).mockReturnValue({} as never);
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });

    const adapter = createMapLibreAdapter();
    const withLegend = baseSpec([
      {
        mapDataId: 'pop',
        mapId: 'states',
        data: [{ geometryId: 'BR', value: 211 }],
      },
    ]);
    withLegend.layers = [
      {
        ...withLegend.layers[0],
        mapDataId: 'pop',
        activeLegendId: 'population',
      },
    ];
    withLegend.legends = [
      {
        id: 'population',
        colorBy: {
          type: 'quantitative',
          property: 'population',
          scale: 'threshold',
          thresholds: [50, 100],
          colors: ['#f0f9ff', '#bfdbfe', '#60a5fa'],
          defaultColor: '#f0f9ff',
        },
      },
    ];

    adapter.mount(makeContainer(), withLegend, 'v');
    fire('load');
    jest.mocked(map.setPaintProperty).mockClear();

    adapter.update({
      ...withLegend,
      legends: [
        {
          id: 'population',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
            thresholds: [50, 100],
            colors: ['#eff6ff', '#93c5fd', '#3b82f6'],
            defaultColor: '#eff6ff',
          },
        },
      ],
    });

    expect(map.setPaintProperty).toHaveBeenCalledWith('fill', 'fill-color', [
      'step',
      ['to-number', ['coalesce', ['feature-state', 'value'], 0], 0],
      '#eff6ff',
      50,
      '#93c5fd',
      100,
      '#3b82f6',
    ]);
  });

  test('mapData patch replace reapplies active legend fill-color expression', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(map.isStyleLoaded).mockReturnValue(true);
    jest.mocked(map.getLayer).mockReturnValue({} as never);
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });

    const adapter = createMapLibreAdapter();
    const withLegend = baseSpec([
      {
        mapDataId: 'pop',
        mapId: 'states',
        data: [{ geometryId: 'BR', value: 211 }],
      },
    ]);
    withLegend.layers = [
      {
        ...withLegend.layers[0],
        legends: [
          {
            id: 'status',
            colorBy: {
              type: 'categorical',
              property: 'status',
              mapping: { high: '#16a34a' },
              defaultColor: '#6b7280',
            },
          },
        ],
        activeLegendId: 'status',
      },
    ];

    adapter.mount(makeContainer(), withLegend, 'v');
    fire('load');
    jest.mocked(map.setPaintProperty).mockClear();

    adapter.applyPatch?.({
      target: 'mapData',
      op: 'replace',
      path: 'mapData.pop.data.BR',
      value: 500,
    });

    expect(map.setPaintProperty).toHaveBeenCalledWith('fill', 'fill-color', [
      'match',
      ['to-string', ['coalesce', ['feature-state', 'value'], '__missing__']],
      'high',
      '#16a34a',
      '#6b7280',
    ]);
  });

  test('mapData patch replace reapplies legend fill-color when layer appears after initial pass', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(map.isStyleLoaded).mockReturnValue(true);
    jest.mocked(map.getLayer).mockReturnValue(null);
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });

    const adapter = createMapLibreAdapter();
    const withLegend = baseSpec([
      {
        mapDataId: 'pop',
        mapId: 'states',
        data: [{ geometryId: 'BR', value: 211 }],
      },
    ]);
    withLegend.layers = [
      {
        ...withLegend.layers[0],
        legends: [
          {
            id: 'status',
            colorBy: {
              type: 'categorical',
              property: 'status',
              mapping: { high: '#16a34a' },
              defaultColor: '#6b7280',
            },
          },
        ],
        activeLegendId: 'status',
      },
    ];

    adapter.mount(makeContainer(), withLegend, 'v');
    fire('load');
    jest.mocked(map.setPaintProperty).mockClear();

    adapter.applyPatch?.({
      target: 'mapData',
      op: 'replace',
      path: 'mapData.pop.data.BR',
      value: 500,
    });

    expect(map.setPaintProperty).not.toHaveBeenCalled();

    jest.mocked(map.getLayer).mockReturnValue({} as never);
    fire('styledata', { dataType: 'style' });

    expect(map.setPaintProperty).toHaveBeenCalledWith('fill', 'fill-color', [
      'match',
      ['to-string', ['coalesce', ['feature-state', 'value'], '__missing__']],
      'high',
      '#16a34a',
      '#6b7280',
    ]);
  });
});
