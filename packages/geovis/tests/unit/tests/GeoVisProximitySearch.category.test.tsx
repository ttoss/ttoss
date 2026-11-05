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

import { render } from '../renderWithI18n';
import {
  buildMap,
  buildQuery,
  buildSpec,
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

describe('the category the map shows', () => {
  /** What the hook last returned to a component under the provider. */
  let seen: GeoVisProximitySearchValue | null | undefined;

  const Probe = () => {
    seen = useGeoVisProximitySearch();
    return null;
  };

  /** Searches around the pin and lands a UBS and a place of no category. */
  const searchBoth = async () => {
    const { calls } = await renderSearch({ children: <Probe /> });
    clickPin();
    calls[0].resolve([northBy(1, 300, 'ubs'), northBy(2, 600)]);
    await settle();
    return { calls };
  };

  const setCategory = (categoryId: string | null) => {
    act(() => {
      seen!.setCategory(categoryId);
    });
  };

  beforeEach(() => {
    seen = undefined;
  });

  test("takes the other categories' pins off the map, the results and the bar keeping them all", async () => {
    await searchBoth();
    expect(seen).toMatchObject({ categoryId: null });

    setCategory('ubs');

    expect(screen.getByRole('button', { name: 'Place 1' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Place 2' })).toBeNull();
    expect(seen!.categoryId).toBe('ubs');
    expect(seen!.results).toHaveLength(2);
    expect(screen.getByText('2 services within 1 km')).toBeTruthy();

    setCategory(null);

    expect(screen.getByRole('button', { name: 'Place 2' })).toBeTruthy();
    expect(seen!.categoryId).toBeNull();
  });

  test('closes the open card of a place of another category, keeps one of its own', async () => {
    await searchBoth();

    fireEvent.click(screen.getByRole('button', { name: 'Place 2' }));
    expect(screen.getByText('600 m from the point')).toBeTruthy();
    setCategory('ubs');
    expect(screen.queryByText('600 m from the point')).toBeNull();
    expect(seen!.selectedId).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Place 1' }));
    setCategory('ubs');
    expect(screen.getByText('300 m from the point')).toBeTruthy();
    expect(seen!.selectedId).toBe(1);
  });

  test('a new search shows every place again', async () => {
    const { calls } = await searchBoth();
    setCategory('ubs');

    // The same pin again clears the search; once more starts a new one.
    clickPin();
    expect(seen).toMatchObject({ status: 'idle', categoryId: null });
    clickPin();
    calls[1].resolve([northBy(3, 300, 'ubs'), northBy(4, 600)]);
    await settle();

    expect(seen!.categoryId).toBeNull();
    expect(screen.getByRole('button', { name: 'Place 4' })).toBeTruthy();
  });
});
