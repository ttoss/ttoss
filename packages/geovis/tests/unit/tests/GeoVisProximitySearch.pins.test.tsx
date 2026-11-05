/**
 * @jest-environment jsdom
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import type * as React from 'react';
import { renderPinSvg } from 'src/adapters/maplibre/pinImages';
import { GeoVisProvider } from 'src/react/GeoVisProvider';
import type { ProximityResult } from 'src/spec/types.proximity';
import { AREA_IDS } from 'src/ui/GeoVisProximitySearch.area';

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

const clickPin = () => {
  act(() => {
    mockMap.fire('click', {
      point: { x: 400, y: 250 },
      lngLat: { lng: ORIGIN[0], lat: ORIGIN[1] },
    });
  });
};

/** `count` places in a row north of the pin, nearest first, 20 m apart. */
const placesNorth = (count: number): ProximityResult[] => {
  return Array.from({ length: count }, (_, index) => {
    return {
      id: index + 1,
      name: `Place ${index + 1}`,
      lngLat: [ORIGIN[0], ORIGIN[1] + ((index + 1) * 20) / METRES_PER_DEGREE],
    };
  });
};

/** The keys of the places the pins' layer last received. */
const onLayer = () => {
  const data = mockMap.sources.get(AREA_IDS.hitsSource)!.setData.mock
    .lastCall![0] as { features: { properties: { key: string } }[] };
  return data.features.map((feature) => {
    return feature.properties.key;
  });
};

/** Lets every HTML pin land, so all join the layer. */
const land = () => {
  act(() => {
    jest.advanceTimersByTime(5000);
  });
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

describe("the places' pins on the map", () => {
  test('the 30 nearest fall in as HTML pins, the rest on the layer, all of it once they land', async () => {
    const { calls } = await renderSearch();
    clickPin();
    calls[0].resolve(placesNorth(32));
    await settle();

    expect(screen.getByRole('button', { name: 'Place 30' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Place 31' })).toBeNull();
    expect(onLayer()).toEqual(['31', '32']);
    expect(mockMap.layers.has(AREA_IDS.hits)).toBe(true);

    land();

    expect(screen.queryByRole('button', { name: 'Place 1' })).toBeNull();
    expect(onLayer()).toHaveLength(32);
  });

  test('fade in as an answer arrives', async () => {
    const { calls } = await renderSearch();
    clickPin();
    calls[0].resolve(placesNorth(2));
    await settle();

    expect(mockMap.setPaintProperty).toHaveBeenCalledWith(
      AREA_IDS.hits,
      'icon-opacity',
      0
    );
    act(() => {
      jest.advanceTimersByTime(20);
    });
    expect(mockMap.setPaintProperty).toHaveBeenLastCalledWith(
      AREA_IDS.hits,
      'icon-opacity',
      1
    );
  });

  test("a pin on the layer opens its card, larger and on top; the card's × closes it", async () => {
    const { calls } = await renderSearch();
    clickPin();
    calls[0].resolve(placesNorth(2));
    await settle();
    land();
    mockMap.feature = null;

    act(() => {
      mockMap.fire('click', {
        point: { x: 400, y: 200 },
        lngLat: { lng: ORIGIN[0], lat: ORIGIN[1] },
        features: [{ properties: { key: '2' } }],
      });
    });

    expect(screen.getByText('40 m from the point')).toBeTruthy();
    const data = mockMap.sources.get(AREA_IDS.hitsSource)!.setData.mock
      .lastCall![0] as {
      features: { properties: { key: string; selected: number } }[];
    };
    expect(
      data.features.find((feature) => {
        return feature.properties.key === '2';
      })?.properties.selected
    ).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('40 m from the point')).toBeNull();
  });

  test('a click on the layer off any place opens nothing', async () => {
    const { calls } = await renderSearch();
    clickPin();
    calls[0].resolve(placesNorth(2));
    await settle();
    land();
    mockMap.feature = null;

    act(() => {
      mockMap.fire('click', {
        point: { x: 10, y: 10 },
        lngLat: { lng: ORIGIN[0], lat: ORIGIN[1] },
        features: [{ properties: { key: 'nowhere' } }],
      });
    });

    expect(screen.queryByText(/from the point/)).toBeNull();
  });

  test('a new basemap gets the pins back, and clearing takes them off', async () => {
    const { calls } = await renderSearch();
    clickPin();
    calls[0].resolve(placesNorth(2));
    await settle();
    land();

    mockMap.sources.clear();
    mockMap.layers.clear();
    act(() => {
      mockMap.fire('styledata');
    });
    expect(mockMap.layers.has(AREA_IDS.hits)).toBe(true);
    expect(onLayer()).toEqual(['1', '2']);

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Clear search' }).at(-1)!
    );
    expect(mockMap.layers.has(AREA_IDS.hits)).toBe(false);
    expect(mockMap.sources.has(AREA_IDS.hitsSource)).toBe(false);
  });
});
