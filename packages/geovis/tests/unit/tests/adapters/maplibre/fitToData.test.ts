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
