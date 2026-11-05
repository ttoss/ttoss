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
import type { ProximityResult } from 'src/spec/types.proximity';
import { SIZE, TOP } from 'src/ui/GeoVisMapModeControl';
import { DOUBLE_CLICK_WAIT_MS } from 'src/ui/GeoVisProximitySearch.hooks';
import { STACK_GAP } from 'src/ui/GeoVisProximitySearch.locate';

import { render } from '../renderWithI18n';
import {
  buildMap,
  buildQuery,
  buildSpec,
  METRES_PER_DEGREE,
  type MockMap,
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
  fromUserLocation,
  fromAnyPoint,
  searchLayers,
  children = null,
}: {
  fromUserLocation?: boolean;
  fromAnyPoint?: boolean;
  searchLayers?: string[];
  children?: React.ReactNode;
} = {}) => {
  mockMap = buildMap({ width: 800 });
  const { query, calls } = buildQuery();
  const spec = buildSpec({
    query,
    fromUserLocation,
    fromAnyPoint,
    searchLayers,
  });
  render(<GeoVisProvider spec={spec}>{children}</GeoVisProvider>);
  // The search follows the camera from the moment it finds the map.
  await waitFor(() => {
    expect(mockMap.on).toHaveBeenCalledWith('move', expect.any(Function));
  });
  return { query, calls };
};

/** A point of the bare map, away from the pin. */
const POINT = { lng: -46.64, lat: -23.56 };

/** A place `metres` north of {@link POINT}. */
const northOfPoint = (id: number, metres: number): ProximityResult => {
  return {
    id,
    name: `Place ${id}`,
    lngLat: [POINT.lng, POINT.lat + metres / METRES_PER_DEGREE],
  };
};

const clickMap = (lngLat = POINT) => {
  act(() => {
    mockMap.fire('click', { point: { x: 100, y: 100 }, lngLat });
  });
};

/** Lets a click on the bare map outlast the wait for a second one. */
const waitOutDoubleClick = () => {
  act(() => {
    jest.advanceTimersByTime(DOUBLE_CLICK_WAIT_MS);
  });
};

const anyPointButton = () => {
  return screen.getByRole('button', {
    name: 'Search services from any point of the map',
  });
};

/** Presses the button that turns searching from any point on, or off. */
const toggleAnyPoint = () => {
  fireEvent.click(anyPointButton());
};

beforeEach(() => {
  jest.useFakeTimers();
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
  jest.useRealTimers();
  mockMap.container.remove();
  jest.mocked(HTMLCanvasElement.prototype.getContext).mockRestore();
});

describe('fromAnyPoint', () => {
  /** What the hook last returned to a component under the provider. */
  let seen: GeoVisProximitySearchValue | null | undefined;

  const Probe = () => {
    seen = useGeoVisProximitySearch();
    return null;
  };

  beforeEach(() => {
    seen = undefined;
  });

  describe('the any-point button', () => {
    test('is offered only with fromAnyPoint', async () => {
      await renderSearch();
      expect(
        screen.queryByRole('button', {
          name: 'Search services from any point of the map',
        })
      ).toBeNull();
    });

    test('starts off, at the top of the column, and turns the mode on and off', async () => {
      await renderSearch({ fromAnyPoint: true, children: <Probe /> });

      const button = anyPointButton();
      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(button.getAttribute('title')).toBe('Services around any point');
      expect(button.parentElement!.style.top).toBe(`${TOP}px`);
      expect(seen).toMatchObject({ anyPoint: false });

      toggleAnyPoint();
      expect(anyPointButton().getAttribute('aria-pressed')).toBe('true');
      expect(seen).toMatchObject({ anyPoint: true });

      toggleAnyPoint();
      expect(seen).toMatchObject({ anyPoint: false });
    });

    test('stands under the location button when the browser can locate', async () => {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: { getCurrentPosition: jest.fn() },
      });
      await renderSearch({ fromAnyPoint: true, fromUserLocation: true });

      expect(anyPointButton().parentElement!.style.top).toBe(
        `${TOP + SIZE + STACK_GAP}px`
      );
      Reflect.deleteProperty(navigator, 'geolocation');
    });

    test('darkens under the pointer', async () => {
      await renderSearch({ fromAnyPoint: true });
      const idle = anyPointButton().style.color;

      fireEvent.mouseEnter(anyPointButton());
      expect(anyPointButton().style.color).not.toBe(idle);

      fireEvent.mouseLeave(anyPointButton());
      expect(anyPointButton().style.color).toBe(idle);
    });

    test('the app can turn the mode on too, but not without fromAnyPoint', async () => {
      await renderSearch({ children: <Probe /> });
      act(() => {
        seen!.setAnyPoint(true);
      });
      expect(seen).toMatchObject({ anyPoint: false });
    });
  });

  describe('GeoVisProximitySearch from any point', () => {
    test('off, a click off the pins searches nothing and the cursor stays the default', async () => {
      const { query } = await renderSearch({ fromAnyPoint: true });
      mockMap.feature = null;

      clickMap();
      waitOutDoubleClick();
      act(() => {
        mockMap.fire('mousemove', { point: { x: 100, y: 100 } });
      });

      expect(query).not.toHaveBeenCalled();
      expect(mockMap.getCanvas().style.cursor).toBe('default');
    });

    test('on, a click off the pins searches from where it landed, marked with a dot, with no pin in focus', async () => {
      const { query, calls } = await renderSearch({
        fromAnyPoint: true,
        children: <Probe />,
      });
      toggleAnyPoint();
      mockMap.feature = null;

      clickMap();
      expect(query).not.toHaveBeenCalled();
      waitOutDoubleClick();

      expect(calls[0].params).toMatchObject({
        lat: POINT.lat,
        lng: POINT.lng,
        radiusMin: 0,
        radius: 1000,
      });
      expect(mockSetPinFocus).toHaveBeenLastCalledWith({
        layerId: null,
        featureId: null,
      });
      expect(
        screen.getByText('Searching services near this point…')
      ).toBeTruthy();
      // The search spends the mode: the button turns off as it starts.
      expect(anyPointButton().getAttribute('aria-pressed')).toBe('false');
      expect(seen).toMatchObject({ anyPoint: false });

      calls[0].resolve([northOfPoint(1, 300)]);
      await settle();

      expect(
        screen.getByText('1 service within 1 km of this point')
      ).toBeTruthy();
      expect(seen).toMatchObject({
        status: 'done',
        origin: [POINT.lng, POINT.lat],
        fromUser: false,
        fromPoint: true,
      });

      fireEvent.click(screen.getByTitle('Searched point · clear search'));

      expect(
        screen.queryByText('1 service within 1 km of this point')
      ).toBeNull();
      expect(seen).toMatchObject({ status: 'idle', fromPoint: false });
      expect(mockSetPinFocus).toHaveBeenLastCalledWith(null);
    });

    test('after a search, another point searches nothing until the button is pressed again, the search staying shown', async () => {
      const { query, calls } = await renderSearch({ fromAnyPoint: true });
      toggleAnyPoint();
      mockMap.feature = null;
      clickMap();
      waitOutDoubleClick();
      calls[0].resolve([northOfPoint(1, 300)]);
      await settle();

      clickMap({ lng: -46.62, lat: -23.54 });
      waitOutDoubleClick();
      expect(query).toHaveBeenCalledTimes(1);

      // Turned on and off again by hand, the search stays too.
      toggleAnyPoint();
      toggleAnyPoint();
      clickMap({ lng: -46.62, lat: -23.54 });
      waitOutDoubleClick();

      expect(
        screen.getByText('1 service within 1 km of this point')
      ).toBeTruthy();
      expect(query).toHaveBeenCalledTimes(1);
    });

    test('a pin still searches from itself, at once', async () => {
      const { query } = await renderSearch({ fromAnyPoint: true });
      toggleAnyPoint();

      clickMap();
      expect(query).toHaveBeenCalledTimes(1);
      expect(mockSetPinFocus).toHaveBeenLastCalledWith({
        layerId: 'pins',
        featureId: 7,
      });

      waitOutDoubleClick();
      expect(query).toHaveBeenCalledTimes(1);
    });

    test('a feature of a layer with its own click keeps it', async () => {
      const { query } = await renderSearch({ fromAnyPoint: true });
      toggleAnyPoint();
      mockMap.feature = {
        id: 3,
        layer: { id: 'areas' },
        geometry: { type: 'Polygon', coordinates: [] },
      };

      clickMap();
      waitOutDoubleClick();

      expect(query).not.toHaveBeenCalled();
    });

    test('a double-click zooms instead of searching', async () => {
      const { query } = await renderSearch({ fromAnyPoint: true });
      toggleAnyPoint();
      mockMap.feature = null;

      clickMap();
      clickMap();
      act(() => {
        mockMap.fire('dblclick');
      });
      waitOutDoubleClick();

      expect(query).not.toHaveBeenCalled();
    });

    test('pressed again, another point moves the search there', async () => {
      const { calls } = await renderSearch({ fromAnyPoint: true });
      toggleAnyPoint();
      mockMap.feature = null;
      clickMap();
      waitOutDoubleClick();
      calls[0].resolve([northOfPoint(1, 300)]);
      await settle();

      toggleAnyPoint();
      clickMap({ lng: -46.62, lat: -23.54 });
      waitOutDoubleClick();

      expect(calls[1].params).toMatchObject({ lng: -46.62, lat: -23.54 });
      expect(
        screen.getByText('Searching services near this point…')
      ).toBeTruthy();
    });

    test('needs no layers to search from', async () => {
      const { query } = await renderSearch({
        fromAnyPoint: true,
        searchLayers: [],
      });
      toggleAnyPoint();
      mockMap.feature = null;

      clickMap();
      waitOutDoubleClick();

      expect(query).toHaveBeenCalledTimes(1);
    });

    test('without it, a click off the pins searches nothing, even after the wait', async () => {
      const { query } = await renderSearch();
      mockMap.feature = null;

      clickMap();
      waitOutDoubleClick();

      expect(query).not.toHaveBeenCalled();
    });

    test('on, the bare map shows a crosshair, a pin the pointer', async () => {
      await renderSearch({ fromAnyPoint: true });
      toggleAnyPoint();

      mockMap.feature = null;
      act(() => {
        mockMap.fire('mousemove', { point: { x: 100, y: 100 } });
      });
      expect(mockMap.getCanvas().style.cursor).toBe('crosshair');

      mockMap.feature = {
        id: 7,
        layer: { id: 'pins' },
        geometry: { type: 'Point', coordinates: ORIGIN },
      };
      act(() => {
        mockMap.fire('mousemove', { point: { x: 400, y: 250 } });
      });
      expect(mockMap.getCanvas().style.cursor).toBe('pointer');
    });
  });
});
