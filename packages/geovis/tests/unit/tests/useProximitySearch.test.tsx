/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import {
  DEFAULT_PROXIMITY_RADII,
  useProximitySearch,
} from 'src/react/proximity';
import type {
  ProximityQueryParams,
  ProximityResult,
  ProximitySearch,
} from 'src/spec/types.proximity';

/** Metres in one degree of latitude. */
const METRES_PER_DEGREE = 111_195;

const ORIGIN: [number, number] = [-46.63, -23.55];

/** A place `metres` north of the origin. */
const northBy = (id: number, metres: number): ProximityResult => {
  return {
    id,
    name: `Place ${id}`,
    categoryId: 'ubs',
    lngLat: [ORIGIN[0], ORIGIN[1] + metres / METRES_PER_DEGREE],
  };
};

/** A query the test answers by hand, one call at a time. */
const buildQuery = () => {
  const calls: {
    params: ProximityQueryParams;
    resolve: (results: ProximityResult[]) => void;
    reject: (error: unknown) => void;
  }[] = [];
  const query = jest.fn((params: ProximityQueryParams) => {
    return new Promise<ProximityResult[]>((resolve, reject) => {
      calls.push({ params, resolve, reject });
    });
  });
  return { query, calls };
};

const setup = (config: Partial<ProximitySearch> = {}) => {
  const { query, calls } = buildQuery();
  const map = { easeTo: jest.fn() } as unknown as MapLibreMap;
  const hook = renderHook(() => {
    return useProximitySearch({
      config: { layers: ['pins'], query, ...config },
      map,
      framePixels: 150,
    });
  });
  return { ...hook, query, calls, map };
};

/** Lets the pending answer's continuation run. */
const settle = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('useProximitySearch', () => {
  test('starts idle, on the default radii', () => {
    const { result } = setup();

    expect(result.current.state.status).toBe('idle');
    expect(result.current.radii).toEqual(DEFAULT_PROXIMITY_RADII);
    expect(result.current.state.radius).toBe(1000);
  });

  test('falls back to the smallest radius for an initial one it does not offer', () => {
    const { result } = setup({ radii: [500, 1500], initialRadius: 999 });

    expect(result.current.state.radius).toBe(500);
  });

  test('searches the disc around a point, frames it, and keeps the answer nearest first', async () => {
    const { result, calls, map } = setup();
    const focus = { layerId: 'pins', featureId: 3 };

    act(() => {
      void result.current.searchFrom(ORIGIN, focus);
    });

    expect(result.current.state).toMatchObject({
      status: 'loading',
      origin: ORIGIN,
      focus,
    });
    expect(calls[0].params).toMatchObject({
      lat: ORIGIN[1],
      lng: ORIGIN[0],
      radiusMin: 0,
      radius: 1000,
    });
    expect(map.easeTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: ORIGIN })
    );

    calls[0].resolve([northBy(1, 800), northBy(2, 200)]);
    await settle();

    expect(result.current.state.status).toBe('done');
    expect(result.current.state.fetched).toBe(1000);
    expect(
      result.current.state.hits.map((hit) => {
        return [hit.id, hit.order, Math.round(hit.distance)];
      })
    ).toEqual([
      [2, 0, 200],
      [1, 1, 800],
    ]);
  });

  test('clicked again on the point it shows, clears the search', async () => {
    const { result, calls } = setup();
    act(() => {
      void result.current.searchFrom(ORIGIN);
    });
    calls[0].resolve([]);
    await settle();

    act(() => {
      void result.current.searchFrom(ORIGIN);
    });

    expect(result.current.state.status).toBe('idle');
    expect(result.current.state.origin).toBeNull();
  });

  test('searches from the reader with no pin in focus, hiding every pin', () => {
    const { result, calls } = setup();

    act(() => {
      void result.current.searchFromUser(ORIGIN);
    });

    expect(result.current.state).toMatchObject({
      status: 'loading',
      origin: ORIGIN,
      fromUser: true,
      focus: { layerId: null, featureId: null },
    });
    expect(calls[0].params).toMatchObject({ lat: ORIGIN[1], lng: ORIGIN[0] });
  });

  test('a search from a pin is not one from the reader', () => {
    const { result } = setup();

    act(() => {
      void result.current.searchFrom(ORIGIN);
    });

    expect(result.current.state).toMatchObject({
      fromUser: false,
      focus: null,
    });
  });

  test('ignores a click on the point it is still searching from', () => {
    const { result, query } = setup();
    act(() => {
      void result.current.searchFrom(ORIGIN);
    });
    act(() => {
      void result.current.searchFrom(ORIGIN);
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  test('another point replaces a search mid-flight, dropping its answer', async () => {
    const { result, calls } = setup();
    const other: [number, number] = [-46.6, -23.5];
    act(() => {
      void result.current.searchFrom(ORIGIN);
    });
    act(() => {
      void result.current.searchFrom(other);
    });

    expect(calls[0].params.signal.aborted).toBe(true);
    calls[0].resolve([northBy(1, 100)]);
    await settle();
    expect(result.current.state).toMatchObject({
      status: 'loading',
      origin: other,
    });
  });

  test('a failed search is logged and clears', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result, calls } = setup();
    act(() => {
      void result.current.searchFrom(ORIGIN);
    });

    calls[0].reject(new Error('offline'));
    await settle();

    expect(error).toHaveBeenCalled();
    expect(result.current.state.status).toBe('idle');
    error.mockRestore();
  });

  describe('setRadius', () => {
    const searched = async () => {
      const handle = setup();
      act(() => {
        void handle.result.current.searchFrom(ORIGIN);
      });
      handle.calls[0].resolve([northBy(1, 500)]);
      await settle();
      return handle;
    };

    test('a wider radius asks only for the ring beyond, and the new places drop in fresh', async () => {
      const { result, calls } = await searched();

      act(() => {
        void result.current.setRadius(2000);
      });
      expect(result.current.state).toMatchObject({
        status: 'loading',
        radius: 2000,
      });
      expect(calls[1].params).toMatchObject({ radiusMin: 1000, radius: 2000 });

      // One place the first answer already had, and one new.
      calls[1].resolve([northBy(1, 500), northBy(2, 1500)]);
      await settle();

      expect(result.current.state).toMatchObject({
        status: 'done',
        fetched: 2000,
        fresh: [2],
      });
      expect(result.current.state.hits).toHaveLength(2);
    });

    test('a narrower radius filters what is there without asking again', async () => {
      const { result, calls } = await searched();
      act(() => {
        void result.current.setRadius(2000);
      });
      calls[1].resolve([]);
      await settle();

      act(() => {
        void result.current.setRadius(1000);
      });

      expect(calls).toHaveLength(2);
      expect(result.current.state).toMatchObject({
        status: 'done',
        radius: 1000,
        fetched: 2000,
      });
    });

    test('a failed widening keeps what is shown', async () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { result, calls } = await searched();
      act(() => {
        void result.current.setRadius(3000);
      });

      calls[1].reject(new Error('offline'));
      await settle();

      expect(result.current.state).toMatchObject({
        status: 'done',
        fetched: 1000,
      });
      expect(result.current.state.hits).toHaveLength(1);
      error.mockRestore();
    });

    test('does nothing before a search is done, or for the radius shown', async () => {
      const idle = setup();
      act(() => {
        void idle.result.current.setRadius(2000);
      });
      expect(idle.query).not.toHaveBeenCalled();

      const { result, calls } = await searched();
      act(() => {
        void result.current.setRadius(1000);
      });
      expect(calls).toHaveLength(1);
    });
  });

  test('select opens a place card, and the same place again closes it', () => {
    const { result } = setup();

    act(() => {
      result.current.select(4);
    });
    expect(result.current.state.selectedId).toBe(4);

    act(() => {
      result.current.select(4);
    });
    expect(result.current.state.selectedId).toBeNull();
  });

  test('clear cancels the request in flight', () => {
    const { result, calls } = setup();
    act(() => {
      void result.current.searchFrom(ORIGIN);
    });

    act(() => {
      result.current.clear();
    });

    expect(calls[0].params.signal.aborted).toBe(true);
    expect(result.current.state.status).toBe('idle');
  });

  test('unmounting cancels the request in flight', () => {
    const { result, calls, unmount } = setup();
    act(() => {
      void result.current.searchFrom(ORIGIN);
    });

    unmount();

    expect(calls[0].params.signal.aborted).toBe(true);
  });
});
