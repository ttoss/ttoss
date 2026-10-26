/**
 * @jest-environment jsdom
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderPinSvg } from 'src/adapters/maplibre/pinImages';
import { GeoVisProvider } from 'src/react/GeoVisProvider';
import type { VisualizationSpec } from 'src/spec/types';
import type {
  ProximityQueryParams,
  ProximityResult,
} from 'src/spec/types.proximity';

import { render } from '../renderWithI18n';

jest.mock('src/adapters/maplibre/pinImages', () => {
  return {
    ...jest.requireActual('src/adapters/maplibre/pinImages'),
    renderPinSvg: jest.fn(),
  };
});

type Handler = (event?: unknown) => void;

/** The map the fake adapter hands out, with what the test drives it by. */
type MockMap = ReturnType<typeof buildMap>;

/** Metres in one degree of latitude. */
const METRES_PER_DEGREE = 111_195;

const ORIGIN: [number, number] = [-46.63, -23.55];

const buildMap = ({ width }: { width: number }) => {
  const handlers = new Map<string, Handler[]>();
  const container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth', { value: width });
  Object.defineProperty(container, 'clientHeight', { value: 500 });
  document.body.append(container);
  const canvas = {
    style: { cursor: '' },
    getBoundingClientRect: () => {
      return { left: 0, top: 0 } as DOMRect;
    },
  };
  const map = {
    container,
    feature: {
      id: 7 as number | undefined,
      layer: { id: 'pins' },
      geometry: { type: 'Point', coordinates: ORIGIN } as {
        type: string;
        coordinates?: unknown;
      },
    } as unknown,
    hasLayer: true,
    on: jest.fn((event: string, layerOrHandler: unknown, maybe?: unknown) => {
      const handler = (
        typeof layerOrHandler === 'function' ? layerOrHandler : maybe
      ) as Handler;
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
    }),
    off: jest.fn((event: string, layerOrHandler: unknown, maybe?: unknown) => {
      const handler =
        typeof layerOrHandler === 'function' ? layerOrHandler : maybe;
      handlers.set(
        event,
        (handlers.get(event) ?? []).filter((known) => {
          return known !== handler;
        })
      );
    }),
    fire: (event: string, payload?: unknown) => {
      for (const handler of handlers.get(event) ?? []) handler(payload);
    },
    getContainer: () => {
      return container;
    },
    getCanvas: () => {
      return canvas;
    },
    getCanvasContainer: () => {
      return { addEventListener: jest.fn(), removeEventListener: jest.fn() };
    },
    getLayer: (id: string) => {
      return map.hasLayer && id === 'pins' ? { id } : undefined;
    },
    queryRenderedFeatures: () => {
      return map.feature ? [map.feature] : [];
    },
    project: ([lng, lat]: [number, number]) => {
      return {
        x: 400 + (lng - ORIGIN[0]) * 10_000,
        y: 250 - (lat - ORIGIN[1]) * 10_000,
      };
    },
    getZoom: () => {
      return 14;
    },
    easeTo: jest.fn(),
    getFeatureState: () => {
      return {};
    },
    setFeatureState: jest.fn(),
    isStyleLoaded: () => {
      return true;
    },
  };
  return map;
};

// var is hoisted alongside jest.mock so the reference is valid inside the factory.
// eslint-disable-next-line no-var
var mockMap: MockMap;
// eslint-disable-next-line no-var
var mockSetPinFocus: jest.Mock;

jest.mock('src/adapters/maplibre/MapLibreAdapter', () => {
  return {
    __esModule: true,
    default: jest.fn(() => {
      return {
        id: 'maplibre',
        getCapabilities: jest.fn(),
        mount: jest.fn(() => {
          return { viewId: 'v', container: {}, destroy: jest.fn() };
        }),
        update: jest.fn(),
        destroy: jest.fn(),
        setView: jest.fn(),
        setPinFocus: (...args: unknown[]) => {
          return mockSetPinFocus(...args);
        },
        getNativeInstance: () => {
          return mockMap;
        },
      };
    }),
  };
});

/** A place `metres` north of the origin. */
const northBy = (
  id: number,
  metres: number,
  categoryId?: string
): ProximityResult => {
  return {
    id,
    name: `Place ${id}`,
    categoryId,
    lngLat: [ORIGIN[0], ORIGIN[1] + metres / METRES_PER_DEGREE],
  };
};

/** A query the test answers by hand. */
const buildQuery = () => {
  const calls: {
    params: ProximityQueryParams;
    resolve: (results: ProximityResult[]) => void;
  }[] = [];
  const query = jest.fn((params: ProximityQueryParams) => {
    return new Promise<ProximityResult[]>((resolve) => {
      calls.push({ params, resolve });
    });
  });
  return { query, calls };
};

const buildSpec = (
  query: (params: ProximityQueryParams) => Promise<ProximityResult[]>
): VisualizationSpec => {
  return {
    engine: 'maplibre',
    view: { center: ORIGIN, zoom: 14 },
    images: [
      { id: 'pin', kind: 'pin', icon: 'maki:hospital', color: '#C0392B' },
    ],
    sources: [
      {
        id: 's',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [
      {
        id: 'pins',
        sourceId: 's',
        geometry: 'symbol',
        paint: { iconImage: 'pin' },
      },
    ],
    proximitySearch: {
      layers: ['pins'],
      query,
      radii: [1000, 2000],
      categories: [
        { id: 'ubs', label: 'UBS', color: '#1E8449', icon: 'maki:doctor' },
      ],
      labels: { one: 'service', other: 'services' },
    },
  };
};

/** Renders the map and waits for the search to find it. */
const renderSearch = async ({ width = 800 } = {}) => {
  mockMap = buildMap({ width });
  const { query, calls } = buildQuery();
  render(<GeoVisProvider spec={buildSpec(query)}>{null}</GeoVisProvider>);
  await waitFor(() => {
    expect(mockMap.on).toHaveBeenCalledWith('click', expect.any(Function));
  });
  return { query, calls };
};

const clickPin = (lngLat = { lng: ORIGIN[0], lat: ORIGIN[1] }) => {
  act(() => {
    mockMap.fire('click', { point: { x: 400, y: 250 }, lngLat });
  });
};

/** Lets an answer travel through the search's awaits into its state. */
const settle = async () => {
  await act(async () => {
    for (let tick = 0; tick < 5; tick += 1) await Promise.resolve();
  });
};

beforeEach(() => {
  mockSetPinFocus = jest.fn();
  jest.mocked(renderPinSvg).mockResolvedValue({
    svg: '<svg xmlns="http://www.w3.org/2000/svg"/>',
    width: 39,
    height: 34,
  });
});

afterEach(() => {
  mockMap.container.remove();
});

describe('GeoVisProximitySearch', () => {
  test('clicking a pin searches around it, hides the other pins and drops the answers in', async () => {
    const { calls } = await renderSearch();

    clickPin();

    expect(calls[0].params).toMatchObject({
      lat: ORIGIN[1],
      lng: ORIGIN[0],
      radiusMin: 0,
      radius: 1000,
    });
    expect(mockSetPinFocus).toHaveBeenLastCalledWith({
      layerId: 'pins',
      featureId: 7,
    });
    expect(screen.getByText('Searching services…')).toBeTruthy();

    calls[0].resolve([northBy(1, 300, 'ubs'), northBy(2, 600)]);
    await settle();

    expect(screen.getByText('2 services within 1 km')).toBeTruthy();
    expect(screen.getByTitle('UBS').textContent).toBe('1');
    expect(screen.getByRole('button', { name: 'Place 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Place 2' })).toBeTruthy();
  });

  test('a place opens its card with its kind and distance', async () => {
    const { calls } = await renderSearch();
    clickPin();
    calls[0].resolve([northBy(1, 300, 'ubs'), northBy(2, 450)]);
    await settle();

    fireEvent.click(screen.getByRole('button', { name: 'Place 1' }));

    expect(screen.getByText('UBS')).toBeTruthy();
    expect(screen.getByText('300 m from the point')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Place 2' }));
    expect(screen.getByText('450 m from the point')).toBeTruthy();
  });

  test('widening asks for the ring beyond, then shows the places in it', async () => {
    const { calls } = await renderSearch();
    clickPin();
    calls[0].resolve([northBy(1, 300)]);
    await settle();

    fireEvent.click(screen.getByRole('radio', { name: '2 km' }));

    expect(calls[1].params).toMatchObject({ radiusMin: 1000, radius: 2000 });
    expect(screen.getByText('Widening the search to 2 km…')).toBeTruthy();

    calls[1].resolve([northBy(2, 1500)]);
    await settle();

    expect(screen.getByText('2 services within 2 km')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Place 2' }));
    expect(screen.getByText('1.5 km from the point')).toBeTruthy();
  });

  test('the bar clears the search and brings the pins back', async () => {
    const { calls } = await renderSearch();
    clickPin();
    calls[0].resolve([]);
    await settle();
    expect(screen.getByText('Nothing within 1 km')).toBeTruthy();

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Clear search' }).at(-1)!
    );

    expect(screen.queryByText('Nothing within 1 km')).toBeNull();
    expect(mockSetPinFocus).toHaveBeenLastCalledWith(null);
  });

  test('draws the clicked pin above the circle, larger, and clicking it clears', async () => {
    const { calls } = await renderSearch();
    clickPin();
    calls[0].resolve([]);
    await settle();

    const pin = screen.getAllByRole('button', { name: 'Clear search' })[0];
    await waitFor(() => {
      expect(pin.querySelector('img')).not.toBeNull();
    });
    expect(renderPinSvg).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'pin' })
    );

    fireEvent.click(pin);
    expect(screen.queryByText('Nothing within 1 km')).toBeNull();
  });

  test('a pin whose icon will not load is drawn as a plain drop', async () => {
    jest.mocked(renderPinSvg).mockRejectedValue(new Error('unknown icon'));
    const { calls } = await renderSearch();
    clickPin();
    calls[0].resolve([]);
    await settle();

    const pin = screen.getAllByRole('button', { name: 'Clear search' })[0];
    expect(pin.querySelector('img')).toBeNull();
  });

  test('a narrow map shortens the bar and drops the counts by kind', async () => {
    const { calls } = await renderSearch({ width: 300 });
    clickPin();
    calls[0].resolve([northBy(1, 300, 'ubs'), northBy(2, 600, 'ubs')]);
    await settle();

    expect(screen.getByText('2 within 1 km')).toBeTruthy();
    expect(screen.queryByTitle('UBS')).toBeNull();
  });

  test('follows the camera: a move redraws what it placed', async () => {
    const { calls } = await renderSearch();
    clickPin();
    calls[0].resolve([northBy(1, 300)]);
    await settle();

    act(() => {
      mockMap.fire('move');
    });

    expect(screen.getByRole('button', { name: 'Place 1' })).toBeTruthy();
  });

  test('searches from where the click landed on a feature that is not a point', async () => {
    const { query } = await renderSearch();
    mockMap.feature = {
      layer: { id: 'pins' },
      geometry: { type: 'Polygon' },
    };

    clickPin({ lng: -46.6, lat: -23.5 });

    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ lng: -46.6, lat: -23.5 })
    );
    expect(mockSetPinFocus).toHaveBeenLastCalledWith({
      layerId: 'pins',
      featureId: null,
    });
  });

  test('searches nothing for a click off the pins, or with their layer not on the map', async () => {
    const { query } = await renderSearch();
    mockMap.feature = null;
    clickPin();

    mockMap.feature = {
      id: 1,
      layer: { id: 'pins' },
      geometry: { type: 'Point', coordinates: ORIGIN },
    };
    mockMap.hasLayer = false;
    clickPin();

    expect(query).not.toHaveBeenCalled();
  });
});
