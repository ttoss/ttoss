/**
 * @jest-environment jsdom
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import type * as React from 'react';
import { renderPinSvg } from 'src/adapters/maplibre/pinImages';
import { GeoVisProvider } from 'src/react/GeoVisProvider';
import {
  type GeoVisProximitySearchValue,
  useGeoVisProximitySearch,
} from 'src/react/proximityContext';
import { AREA_IDS } from 'src/ui/GeoVisProximitySearch.area';

import { render } from '../renderWithI18n';
import {
  buildMap,
  buildQuery,
  buildSpec,
  METRES_PER_DEGREE,
  type MockMap,
  northBy,
  ORIGIN,
  settle,
} from './proximitySearchFixtures';

jest.mock('src/adapters/maplibre/pinImages', () => {
  return {
    ...jest.requireActual('src/adapters/maplibre/pinImages'),
    renderPinSvg: jest.fn(),
  };
});

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

/** Renders the map and waits for the search to find it. */
const renderSearch = async ({
  width = 800,
  fromUserLocation,
  fromAnyPoint,
  searchLayers,
  children = null,
}: {
  width?: number;
  fromUserLocation?: boolean;
  fromAnyPoint?: boolean;
  searchLayers?: string[];
  children?: React.ReactNode;
} = {}) => {
  mockMap = buildMap({ width });
  const { query, calls } = buildQuery();
  const spec = buildSpec({
    query,
    fromUserLocation,
    fromAnyPoint,
    searchLayers,
  });
  const view = render(<GeoVisProvider spec={spec}>{children}</GeoVisProvider>);
  // The search follows the camera from the moment it finds the map.
  await waitFor(() => {
    expect(mockMap.on).toHaveBeenCalledWith('move', expect.any(Function));
  });
  return { query, calls, view };
};

const clickPin = (lngLat = { lng: ORIGIN[0], lat: ORIGIN[1] }) => {
  act(() => {
    mockMap.fire('click', { point: { x: 400, y: 250 }, lngLat });
  });
};

beforeEach(() => {
  // jsdom draws no canvas: the search's sweep skips its frames.
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  mockSetPinFocus = jest.fn();
  jest.mocked(renderPinSvg).mockResolvedValue({
    svg: '<svg xmlns="http://www.w3.org/2000/svg"/>',
    width: 39,
    height: 34,
  });
});

afterEach(() => {
  mockMap.container.remove();
  jest.mocked(HTMLCanvasElement.prototype.getContext).mockRestore();
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

describe('the place card', () => {
  test('its × closes it, leaving the search on the map', async () => {
    const { calls } = await renderSearch();
    clickPin();
    calls[0].resolve([northBy(1, 300, 'ubs')]);
    await settle();

    fireEvent.click(screen.getByRole('button', { name: 'Place 1' }));
    expect(screen.getByText('300 m from the point')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByText('300 m from the point')).toBeNull();
    expect(screen.getByText('1 service within 1 km')).toBeTruthy();
  });
});

describe('useGeoVisProximitySearch', () => {
  /** What the hook last returned to a component under the provider. */
  let seen: GeoVisProximitySearchValue | null | undefined;

  const Probe = () => {
    seen = useGeoVisProximitySearch();
    return null;
  };

  beforeEach(() => {
    seen = undefined;
  });

  test('follows the search from idle to its results, nearest first, within the radius', async () => {
    const { calls } = await renderSearch({ children: <Probe /> });
    expect(seen).toMatchObject({
      status: 'idle',
      origin: null,
      radius: 1000,
      radii: [1000, 2000],
      results: [],
      selectedId: null,
    });

    clickPin();
    expect(seen).toMatchObject({
      status: 'loading',
      origin: ORIGIN,
      fromUser: false,
    });

    calls[0].resolve([northBy(2, 600), northBy(1, 300, 'ubs')]);
    await settle();

    expect(seen?.status).toBe('done');
    expect(
      seen?.results.map((hit) => {
        return [hit.id, Math.round(hit.distance)];
      })
    ).toEqual([
      [1, 300],
      [2, 600],
    ]);
  });

  test('drives the search: select toggles a card, setRadius widens, clear ends it', async () => {
    const { calls } = await renderSearch({ children: <Probe /> });
    clickPin();
    calls[0].resolve([northBy(1, 300)]);
    await settle();

    act(() => {
      seen?.select(1);
    });
    expect(seen?.selectedId).toBe(1);
    expect(screen.getByText('300 m from the point')).toBeTruthy();
    act(() => {
      seen?.select(1);
    });
    expect(seen?.selectedId).toBeNull();

    act(() => {
      seen?.setRadius(2000);
    });
    expect(calls[1].params).toMatchObject({ radiusMin: 1000, radius: 2000 });
    calls[1].resolve([northBy(2, 1500)]);
    await settle();
    expect(seen).toMatchObject({ status: 'done', radius: 2000 });
    expect(seen?.results).toHaveLength(2);

    act(() => {
      seen?.clear();
    });
    expect(seen).toMatchObject({ status: 'idle', origin: null, results: [] });
  });

  test('is null outside a provider, and for a spec without a proximity search', async () => {
    render(<Probe />);
    expect(seen).toBeNull();

    mockMap = buildMap({ width: 800 });
    const { proximitySearch: _, ...spec } = buildSpec({
      query: buildQuery().query,
    });
    render(
      <GeoVisProvider spec={spec}>
        <Probe />
      </GeoVisProvider>
    );
    await settle();
    expect(seen).toBeNull();
  });
});

describe('GeoVisProximitySearch from the reader location', () => {
  /** Where the fake browser places the reader, `[lng, lat]`. */
  const READER: [number, number] = [-46.6559, -23.5614];

  /** The browser's geolocation, answered by hand, and its permission. */
  const fakeGeolocation = ({
    permission = 'prompt' as PermissionState | Error,
  } = {}) => {
    const lookups: {
      succeed: () => void;
      fail: () => void;
      options?: PositionOptions;
    }[] = [];
    const getCurrentPosition = jest.fn(
      (
        success: PositionCallback,
        failure: PositionErrorCallback,
        options?: PositionOptions
      ) => {
        lookups.push({
          options,
          succeed: () => {
            success({
              coords: { longitude: READER[0], latitude: READER[1] },
            } as GeolocationPosition);
          },
          fail: () => {
            failure({ code: 1 } as GeolocationPositionError);
          },
        });
      }
    );
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: {
        query: jest.fn(async () => {
          if (permission instanceof Error) throw permission;
          return { state: permission };
        }),
      },
    });
    return { lookups, getCurrentPosition };
  };

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'geolocation');
    Reflect.deleteProperty(navigator, 'permissions');
  });

  const locateButton = () => {
    return screen.getByRole('button', {
      name: 'Search services near my location',
    });
  };

  const clickLocate = async () => {
    fireEvent.click(locateButton());
    await settle();
  };

  test('offers no button unless the spec asks for it', async () => {
    fakeGeolocation();
    await renderSearch();

    expect(
      screen.queryByRole('button', { name: 'Search services near my location' })
    ).toBeNull();
  });

  test('offers no button where the browser cannot locate', async () => {
    await renderSearch({ fromUserLocation: true });

    expect(
      screen.queryByRole('button', { name: 'Search services near my location' })
    ).toBeNull();
  });

  test('explains first, then searches from the reader with no pin in focus', async () => {
    const { lookups } = fakeGeolocation();
    const { calls } = await renderSearch({ fromUserLocation: true });
    expect(locateButton().title).toBe('Services near me');

    await clickLocate();

    expect(
      screen.getByRole('dialog', { name: 'Use your location?' })
    ).toBeTruthy();
    expect(lookups).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Allow access' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Getting your location…')).toBeTruthy();
    expect(locateButton().getAttribute('aria-busy')).toBe('true');
    expect(lookups[0].options).toMatchObject({ enableHighAccuracy: true });

    act(() => {
      lookups[0].succeed();
    });

    expect(screen.queryByText('Getting your location…')).toBeNull();
    expect(calls[0].params).toMatchObject({
      lng: READER[0],
      lat: READER[1],
      radius: 1000,
    });
    expect(mockSetPinFocus).toHaveBeenLastCalledWith({
      layerId: null,
      featureId: null,
    });
    expect(screen.getByText('Searching services near you…')).toBeTruthy();
    expect(screen.getByText('You')).toBeTruthy();

    calls[0].resolve(
      [1, 2].map((id) => {
        return {
          id,
          name: `Place ${id}`,
          lngLat: [READER[0], READER[1] + (id * 300) / METRES_PER_DEGREE],
        };
      })
    );
    await settle();

    expect(screen.getByText('2 services within 1 km of you')).toBeTruthy();
    expect(locateButton().getAttribute('aria-pressed')).toBe('true');
  });

  test('clicked again while the search from the reader is shown, clears it', async () => {
    const { lookups } = fakeGeolocation({ permission: 'granted' });
    const { calls } = await renderSearch({ fromUserLocation: true });
    await clickLocate();
    act(() => {
      lookups[0].succeed();
    });
    calls[0].resolve([]);
    await settle();

    fireEvent.click(locateButton());

    expect(screen.queryByText('You')).toBeNull();
    expect(locateButton().getAttribute('aria-pressed')).toBe('false');
    expect(mockSetPinFocus).toHaveBeenLastCalledWith(null);
  });

  test('the blue dot clears the search, as the clicked pin does', async () => {
    const { lookups } = fakeGeolocation({ permission: 'granted' });
    const { calls } = await renderSearch({ fromUserLocation: true });
    await clickLocate();
    act(() => {
      lookups[0].succeed();
    });
    calls[0].resolve([]);
    await settle();

    fireEvent.click(screen.getByTitle('You are here · clear search'));

    expect(screen.queryByText('You')).toBeNull();
  });

  test('already granted, it looks the reader up without asking, and ignores clicks meanwhile', async () => {
    const { getCurrentPosition } = fakeGeolocation({ permission: 'granted' });
    await renderSearch({ fromUserLocation: true });

    await clickLocate();
    await clickLocate();

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  test('a permission it cannot read is asked for, as a new one', async () => {
    fakeGeolocation({ permission: new Error('unsupported') });
    await renderSearch({ fromUserLocation: true });

    await clickLocate();

    expect(
      screen.getByRole('dialog', { name: 'Use your location?' })
    ).toBeTruthy();
  });

  test('already denied, it says so and offers searching from a pin', async () => {
    const { getCurrentPosition } = fakeGeolocation({ permission: 'denied' });
    await renderSearch({ fromUserLocation: true });

    await clickLocate();

    expect(
      screen.getByRole('dialog', { name: "We couldn't get your location" })
    ).toBeTruthy();
    expect(getCurrentPosition).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Use a pin' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('a failed lookup says so, and trying again looks the reader up anew', async () => {
    const { lookups } = fakeGeolocation({ permission: 'granted' });
    const { calls } = await renderSearch({ fromUserLocation: true });
    await clickLocate();

    act(() => {
      lookups[0].fail();
    });

    expect(
      screen.getByRole('dialog', { name: "We couldn't get your location" })
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    act(() => {
      lookups[1].succeed();
    });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(calls).toHaveLength(1);
  });

  test('the dialog closes on Escape, on its backdrop and on "Not now"', async () => {
    fakeGeolocation();
    await renderSearch({ fromUserLocation: true });

    await clickLocate();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();

    await clickLocate();
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.pointerDown(screen.getByRole('dialog'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.pointerDown(screen.getByRole('dialog').parentElement!);
    expect(screen.queryByRole('dialog')).toBeNull();

    await clickLocate();
    expect(document.activeElement?.textContent).toBe('Allow access');
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('an answer that comes after the map is gone is dropped', async () => {
    const { lookups } = fakeGeolocation({ permission: 'granted' });
    const { query, view } = await renderSearch({ fromUserLocation: true });
    await clickLocate();

    view.unmount();
    lookups[0].succeed();
    lookups[0].fail();

    expect(query).not.toHaveBeenCalled();
  });

  test('the button darkens under the pointer', async () => {
    fakeGeolocation();
    await renderSearch({ fromUserLocation: true });
    const idle = locateButton().style.color;

    fireEvent.mouseEnter(locateButton());
    expect(locateButton().style.color).not.toBe(idle);

    fireEvent.mouseLeave(locateButton());
    expect(locateButton().style.color).toBe(idle);
  });
});

describe('the searched area on the map', () => {
  /** A 2D context recording what the sweep draws: jsdom has none. */
  const fakeContext = () => {
    return {
      clearRect: jest.fn(),
      createConicGradient: jest.fn(() => {
        return { addColorStop: jest.fn() };
      }),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      fillStyle: '' as unknown,
      strokeStyle: '',
      lineWidth: 1,
    };
  };
  let context: ReturnType<typeof fakeContext>;

  /** The kinds of the features the area's source last received. */
  const drawnKinds = () => {
    const { setData } = mockMap.sources.get(AREA_IDS.source)!;
    const data = setData.mock.lastCall![0] as {
      features: { properties: { kind: string } }[];
    };
    return data.features.map((feature) => {
      return feature.properties.kind;
    });
  };

  /** Lets the circle grow in, frame by frame. */
  const growIn = () => {
    act(() => {
      jest.advanceTimersByTime(500);
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    context = fakeContext();
    jest
      .mocked(HTMLCanvasElement.prototype.getContext)
      .mockReturnValue(context as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('a search draws the circle beneath the labels, growing it in before the radius line', async () => {
    await renderSearch();
    clickPin();

    expect(mockMap.addSource).toHaveBeenCalledWith(
      AREA_IDS.source,
      expect.objectContaining({ type: 'geojson' })
    );
    for (const id of [AREA_IDS.fill, AREA_IDS.outline, AREA_IDS.dashes]) {
      expect(mockMap.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({ id, source: AREA_IDS.source }),
        'labels'
      );
    }
    expect(drawnKinds()).toEqual(['area']);

    growIn();

    expect(drawnKinds()).toEqual(['area', 'radius']);
  });

  test('widening redraws at once, with a ring at the smaller radius; clearing takes the circle off', async () => {
    const { calls } = await renderSearch();
    clickPin();
    growIn();
    calls[0].resolve([]);
    await settle();

    fireEvent.click(screen.getByRole('radio', { name: '2 km' }));
    expect(drawnKinds()).toEqual(['area', 'ring', 'radius']);

    calls[1].resolve([]);
    await settle();
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Clear search' }).at(-1)!
    );

    for (const id of [AREA_IDS.fill, AREA_IDS.outline, AREA_IDS.dashes]) {
      expect(mockMap.layers.has(id)).toBe(false);
    }
    expect(mockMap.sources.has(AREA_IDS.source)).toBe(false);
  });

  test('while the answer is awaited, a canvas sweeps and pulses over the circle, gone once it is in', async () => {
    const { calls } = await renderSearch();
    clickPin();

    expect(mockMap.addSource).toHaveBeenCalledWith(
      AREA_IDS.sweepSource,
      expect.objectContaining({ type: 'canvas', animate: true })
    );
    expect(mockMap.layers.has(AREA_IDS.sweep)).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(context.createConicGradient).toHaveBeenCalled();
    expect(context.stroke).toHaveBeenCalled();

    calls[0].resolve([]);
    await settle();

    expect(mockMap.layers.has(AREA_IDS.sweep)).toBe(false);
    expect(mockMap.sources.has(AREA_IDS.sweepSource)).toBe(false);
    expect(mockMap.layers.has(AREA_IDS.fill)).toBe(true);
  });

  test('without a conic gradient, the sweep still pulses', async () => {
    const { createConicGradient: _, ...withoutConic } = context;
    jest
      .mocked(HTMLCanvasElement.prototype.getContext)
      .mockReturnValue(withoutConic as unknown as CanvasRenderingContext2D);
    await renderSearch();
    clickPin();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(context.fill).not.toHaveBeenCalled();
    expect(context.stroke).toHaveBeenCalled();
  });

  test('a style still being parsed waits, and a new basemap gets the circle back', async () => {
    const { calls } = await renderSearch();
    const addSource = mockMap.addSource.getMockImplementation()!;
    mockMap.addSource.mockImplementation(() => {
      throw new Error('Style is not done loading');
    });
    clickPin();
    growIn();
    calls[0].resolve([]);
    await settle();
    expect(mockMap.sources.has(AREA_IDS.source)).toBe(false);

    mockMap.addSource.mockImplementation(addSource);
    act(() => {
      mockMap.fire('styledata');
    });
    expect(mockMap.sources.has(AREA_IDS.source)).toBe(true);

    // A new basemap discards the style, and with it the area.
    mockMap.sources.clear();
    mockMap.layers.clear();
    act(() => {
      mockMap.fire('styledata');
    });

    expect(mockMap.layers.has(AREA_IDS.fill)).toBe(true);
    expect(drawnKinds()).toEqual(['area', 'radius']);
  });
});
