/**
 * Integration tests for the internal "fit to data" auto-centering wired into
 * `MapLibreAdapter` (mount + update). Complements the pure bbox math tested
 * in `spec/bounds.test.ts` and the low-level guard/lifecycle contract in
 * `fitBoundsToData.test.ts`.
 */

import maplibregl from 'maplibre-gl';
import createMapLibreAdapter from 'src/adapters/maplibre/MapLibreAdapter';
import type { VisualizationSpec } from 'src/spec/types';

import {
  installMapLibreDomMocks,
  makeContainer,
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

const makeFitMapMock = () => {
  return {
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    loaded: jest.fn(() => {
      return true;
    }),
    getContainer: jest.fn(() => {
      return { clientWidth: 800, clientHeight: 500 };
    }),
    resize: jest.fn(),
    fitBounds: jest.fn(),
    getCanvasContainer: jest.fn(() => {
      return { addEventListener: jest.fn(), removeEventListener: jest.fn() };
    }),
    addControl: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
    getSource: jest.fn(() => {
      return null;
    }),
    getLayer: jest.fn(() => {
      return null;
    }),
    removeLayer: jest.fn(),
    removeSource: jest.fn(),
    moveLayer: jest.fn(),
    getStyle: jest.fn(() => {
      return { layers: [] };
    }),
    isStyleLoaded: jest.fn(() => {
      return true;
    }),
    isSourceLoaded: jest.fn(() => {
      return false;
    }),
    setLayoutProperty: jest.fn(),
    setPaintProperty: jest.fn(),
    setFeatureState: jest.fn(),
    setFilter: jest.fn(),
    setStyle: jest.fn(),
    setCenter: jest.fn(),
    setZoom: jest.fn(),
    setMaxZoom: jest.fn(),
    setMinZoom: jest.fn(),
    setPitch: jest.fn(),
    setBearing: jest.fn(),
    remove: jest.fn(),
  };
};

/** A controllable promise, so a test can decide exactly when a `fetch` resolves. */
const deferred = <T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

/** Waits for every microtask already queued (fetch/`.then()` chains) to run. */
const flushMicrotasks = (): Promise<void> => {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
};

const fetchResponse = (body: unknown) => {
  return {
    json: () => {
      return Promise.resolve(body);
    },
  } as Response;
};

const featureCollectionAt = (
  bbox: [number, number, number, number]
): unknown => {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: null,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [bbox[0], bbox[1]],
              [bbox[2], bbox[1]],
              [bbox[2], bbox[3]],
              [bbox[0], bbox[3]],
              [bbox[0], bbox[1]],
            ],
          ],
        },
      },
    ],
  };
};

const districtsSource = (bbox: [number, number, number, number]) => {
  return {
    id: 'districts',
    type: 'geojson' as const,
    data: {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: null,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [bbox[0], bbox[1]],
                [bbox[2], bbox[1]],
                [bbox[2], bbox[3]],
                [bbox[0], bbox[3]],
                [bbox[0], bbox[1]],
              ],
            ],
          },
        },
      ],
    },
  };
};

const makeSpecWithoutView = (
  bbox: [number, number, number, number]
): VisualizationSpec => {
  return {
    engine: 'maplibre',
    sources: [districtsSource(bbox)],
    layers: [{ id: 'fill', sourceId: 'districts', geometry: 'polygon' }],
  };
};

beforeEach(() => {
  resetMapLibreDomMocks();
});

describe('MapLibreAdapter — auto fit to data', () => {
  test('fits the camera to the sources bbox on mount when spec.view is absent', () => {
    const map = makeFitMapMock();
    jest.mocked(maplibregl.Map).mockImplementation(() => {
      return map as never;
    });

    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      makeSpecWithoutView([-47, -24, -46, -23]),
      'v'
    );

    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    const [bounds, options] = map.fitBounds.mock.calls[0];
    expect(bounds).toEqual([
      [-47, -24],
      [-46, -23],
    ]);
    expect(options).toMatchObject({
      padding: { top: 30, bottom: 30, left: 48, right: 48 },
    });
  });

  test('does NOT auto-fit when spec.view.center is explicit', () => {
    const map = makeFitMapMock();
    jest.mocked(maplibregl.Map).mockImplementation(() => {
      return map as never;
    });

    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      {
        ...makeSpecWithoutView([-47, -24, -46, -23]),
        view: { center: [0, 0] },
      },
      'v'
    );

    expect(map.fitBounds).not.toHaveBeenCalled();
  });

  test('refits when a source geometry update changes the bbox', () => {
    const map = makeFitMapMock();
    jest.mocked(maplibregl.Map).mockImplementation(() => {
      return map as never;
    });

    const adapter = createMapLibreAdapter();
    const spec = makeSpecWithoutView([-47, -24, -46, -23]);
    adapter.mount(makeContainer(), spec, 'v');
    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    map.fitBounds.mockClear();

    adapter.update(makeSpecWithoutView([-10, -10, -9, -9]));

    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    const [bounds] = map.fitBounds.mock.calls[0];
    expect(bounds).toEqual([
      [-10, -10],
      [-9, -9],
    ]);
  });

  test('does NOT refit when the update leaves source geometry unchanged (e.g. mapData only)', () => {
    const map = makeFitMapMock();
    jest.mocked(maplibregl.Map).mockImplementation(() => {
      return map as never;
    });

    const adapter = createMapLibreAdapter();
    const spec = makeSpecWithoutView([-47, -24, -46, -23]);
    adapter.mount(makeContainer(), spec, 'v');
    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    map.fitBounds.mockClear();

    adapter.update({
      ...spec,
      mapData: [
        {
          mapDataId: 'population',
          mapId: 'districts',
          data: [{ geometryId: 1, value: 100 }],
        },
      ],
    });

    expect(map.fitBounds).not.toHaveBeenCalled();
  });
});

describe('MapLibreAdapter — auto fit to data (URL-based geojson sources)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('does NOT recenter when spec.view is explicit and a source is a URL that resolves later (real-world case: cozsolidarias SUDESTE_VIEW + assentamentos.json, imagemsp explicit view + distrito-municipal-v2.geojson)', async () => {
    const map = makeFitMapMock();
    jest.mocked(maplibregl.Map).mockImplementation(() => {
      return map as never;
    });

    const fetchDeferred = deferred<Response>();
    global.fetch = jest.fn(() => {
      return fetchDeferred.promise;
    }) as unknown as typeof fetch;

    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      {
        engine: 'maplibre',
        // Mirrors SUDESTE_VIEW / imagemsp's MapsView explicit camera.
        view: { center: [-45.5, -20.0], zoom: 5 },
        sources: [
          { id: 'remote', type: 'geojson', data: '/geo/assentamentos.json' },
        ],
        layers: [{ id: 'fill', sourceId: 'remote', geometry: 'polygon' }],
      },
      'v'
    );

    expect(map.fitBounds).not.toHaveBeenCalled();

    fetchDeferred.resolve(
      fetchResponse(featureCollectionAt([-70, -30, -60, -25]))
    );
    await flushMicrotasks();
    await flushMicrotasks();

    expect(map.fitBounds).not.toHaveBeenCalled();
  });

  test('does NOT recenter when spec.view becomes explicit via update() while the URL fetch is still in flight', async () => {
    const map = makeFitMapMock();
    jest.mocked(maplibregl.Map).mockImplementation(() => {
      return map as never;
    });

    const fetchDeferred = deferred<Response>();
    global.fetch = jest.fn(() => {
      return fetchDeferred.promise;
    }) as unknown as typeof fetch;

    const specWithoutView: VisualizationSpec = {
      engine: 'maplibre',
      sources: [
        { id: 'remote', type: 'geojson', data: '/geo/assentamentos.json' },
      ],
      layers: [{ id: 'fill', sourceId: 'remote', geometry: 'polygon' }],
    };

    const adapter = createMapLibreAdapter();
    adapter.mount(makeContainer(), specWithoutView, 'v');

    // The app sets an explicit view (e.g. a "focus region" button) before the
    // fetch resolves.
    adapter.update({
      ...specWithoutView,
      view: { center: [-45.5, -20.0], zoom: 5 },
    });

    fetchDeferred.resolve(
      fetchResponse(featureCollectionAt([-70, -30, -60, -25]))
    );
    await flushMicrotasks();
    await flushMicrotasks();

    expect(map.fitBounds).not.toHaveBeenCalled();
  });

  test('applies only the bbox of the most recently requested URL source when two updates race (an older fetch resolving late must not override a newer one)', async () => {
    const map = makeFitMapMock();
    jest.mocked(maplibregl.Map).mockImplementation(() => {
      return map as never;
    });

    const firstFetch = deferred<Response>();
    const secondFetch = deferred<Response>();
    const fetchMock = jest
      .fn()
      .mockImplementationOnce(() => {
        return firstFetch.promise;
      })
      .mockImplementationOnce(() => {
        return secondFetch.promise;
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      {
        engine: 'maplibre',
        sources: [{ id: 'remote', type: 'geojson', data: '/geo/first.json' }],
        layers: [{ id: 'fill', sourceId: 'remote', geometry: 'polygon' }],
      },
      'v'
    );

    // Before the first fetch resolves, the app moves on to a different URL
    // source (e.g. cozsolidarias toggling between modes).
    adapter.update({
      engine: 'maplibre',
      sources: [{ id: 'remote', type: 'geojson', data: '/geo/second.json' }],
      layers: [{ id: 'fill', sourceId: 'remote', geometry: 'polygon' }],
    });

    // The newer fetch resolves first.
    secondFetch.resolve(fetchResponse(featureCollectionAt([-10, -10, -9, -9])));
    await flushMicrotasks();
    await flushMicrotasks();

    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    map.fitBounds.mockClear();

    // The stale first fetch resolves late — its bbox must be discarded.
    firstFetch.resolve(
      fetchResponse(featureCollectionAt([-70, -30, -60, -25]))
    );
    await flushMicrotasks();
    await flushMicrotasks();

    expect(map.fitBounds).not.toHaveBeenCalled();
  });
});
