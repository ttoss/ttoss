/**
 * @jest-environment jsdom
 *
 * Contract tests for `attachFitToData` (`./fitBoundsToData.ts`),
 * the internal "fit to data" auto-centering wired into `MapLibreAdapter`.
 *
 * # Root cause — the race condition this guards against
 *
 * `attachFitToData` registers a camera fit via `map.once('idle', apply)`.
 * MapLibre fires `idle` as soon as the style and first tile batch resolve,
 * which can happen **before** the browser has run its first CSS layout pass
 * on the parent container. At that point `container.clientWidth` and
 * `container.clientHeight` are both 0.
 *
 * Sequence without a guard:
 *   1. React renders → MapLibre inits in a 0×0 container (CSS not yet applied)
 *   2. `idle` fires → `apply()` runs → `map.resize()` reports 0×0 to MapLibre
 *   3. `fitBounds(bbox, { padding })` computes a projection with 0-px viewport
 *      → camera center/zoom is wrong (or NaN)
 *   4. `ResizeObserver` fires with real dimensions → `apply()` runs again
 *   5. MapLibre now has the correct viewport… but the `idle` slot was already
 *      consumed, so the second fit lands on a properly-sized canvas.
 *
 * The fix: `apply` guards `container.clientWidth > 0 && container.clientHeight > 0`
 * before calling `map.resize()` / `fitBounds`. When the guard rejects (step 2),
 * the `ResizeObserver` callback is responsible for the eventual correct fit.
 *
 * # What these tests verify
 *
 * 1. Guard — `fitBounds` is NOT called when the container is 0×0.
 * 2. Recovery path — after the guard rejects and the container later
 *    receives its real CSS dimensions, `fitBounds` is called exactly once
 *    with the correct bbox and padding.
 * 3. Happy path — when the container already has valid dimensions when
 *    `idle` fires (normal fast layout), `fitBounds` is called immediately.
 */

import { attachFitToData } from 'src/adapters/maplibre/fitBoundsToData';

// ---------------------------------------------------------------------------
// ResizeObserver stub
//
// jsdom has no real layout engine, so a real ResizeObserver never fires.
// The stub captures the callback each `attachFitToData` call registers so
// tests can invoke it directly to simulate a layout pass completing.
// ---------------------------------------------------------------------------

let resizeCallbacks: Array<(entries: ResizeObserverEntry[]) => void>;

const originalResizeObserver = global.ResizeObserver;

beforeEach(() => {
  resizeCallbacks = [];
  global.ResizeObserver = jest.fn().mockImplementation((cb) => {
    resizeCallbacks.push(cb);
    return { observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() };
  }) as unknown as typeof ResizeObserver;
});

afterAll(() => {
  global.ResizeObserver = originalResizeObserver;
});

const fireResize = (width: number, height: number): void => {
  const entry = { contentRect: { width, height } } as ResizeObserverEntry;
  for (const cb of resizeCallbacks) cb([entry]);
};

// ---------------------------------------------------------------------------
// Mock map factory
// ---------------------------------------------------------------------------

interface MockContainer {
  clientWidth: number;
  clientHeight: number;
}

const makeMockMap = (initial: MockContainer) => {
  const container: MockContainer = { ...initial };
  let idleCallback: (() => void) | undefined;
  return {
    getContainer: jest.fn(() => {
      return container;
    }),
    resize: jest.fn(),
    fitBounds: jest.fn(),
    once: jest.fn((event: string, cb: () => void) => {
      if (event === 'idle') idleCallback = cb;
    }),
    off: jest.fn(),
    loaded: jest.fn(() => {
      return false;
    }),
    fireIdle: () => {
      idleCallback?.();
    },
    setContainerSize: (width: number, height: number) => {
      container.clientWidth = width;
      container.clientHeight = height;
    },
  };
};

const SP_BBOX: [number, number, number, number] = [
  -46.8253, -24.0082, -46.3653, -23.3567,
];

describe('attachFitToData — race condition guard', () => {
  test('fitBounds is NOT called when idle fires with clientWidth === 0', () => {
    const map = makeMockMap({ clientWidth: 0, clientHeight: 520 });
    attachFitToData(map as never, SP_BBOX);

    map.fireIdle();

    expect(map.fitBounds).not.toHaveBeenCalled();
    expect(map.resize).not.toHaveBeenCalled();
  });

  test('fitBounds is NOT called when idle fires with clientHeight === 0', () => {
    const map = makeMockMap({ clientWidth: 800, clientHeight: 0 });
    attachFitToData(map as never, SP_BBOX);

    map.fireIdle();

    expect(map.fitBounds).not.toHaveBeenCalled();
    expect(map.resize).not.toHaveBeenCalled();
  });

  test('fitBounds is NOT called when both dimensions are 0', () => {
    const map = makeMockMap({ clientWidth: 0, clientHeight: 0 });
    attachFitToData(map as never, SP_BBOX);

    map.fireIdle();

    expect(map.fitBounds).not.toHaveBeenCalled();
    expect(map.resize).not.toHaveBeenCalled();
  });
});

describe('attachFitToData — recovery path via ResizeObserver', () => {
  test('fitBounds is called exactly once after the container gets real dimensions', () => {
    const map = makeMockMap({ clientWidth: 0, clientHeight: 0 });
    attachFitToData(map as never, SP_BBOX);

    map.fireIdle();
    expect(map.fitBounds).not.toHaveBeenCalled();

    map.setContainerSize(800, 520);
    fireResize(800, 520);

    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    expect(map.resize).toHaveBeenCalledTimes(1);
  });

  test('the recovery fit receives the correct bbox, responsive padding, and is instant', () => {
    const map = makeMockMap({ clientWidth: 0, clientHeight: 0 });
    attachFitToData(map as never, SP_BBOX);

    map.fireIdle();
    map.setContainerSize(800, 520);
    fireResize(800, 520);

    const [bounds, options] = map.fitBounds.mock.calls[0];
    expect(bounds).toEqual([
      [SP_BBOX[0], SP_BBOX[1]],
      [SP_BBOX[2], SP_BBOX[3]],
    ]);
    expect(options).toMatchObject({
      padding: { top: 31, bottom: 31, left: 48, right: 48 },
      animate: false,
      duration: 0,
    });
  });

  test('a resize with a still-zero dimension is a no-op', () => {
    const map = makeMockMap({ clientWidth: 0, clientHeight: 0 });
    attachFitToData(map as never, SP_BBOX);

    map.fireIdle();
    fireResize(0, 0);

    expect(map.fitBounds).not.toHaveBeenCalled();
  });
});

describe('attachFitToData — happy path', () => {
  test('fitBounds is called immediately when the container already has valid dimensions', () => {
    const map = makeMockMap({ clientWidth: 800, clientHeight: 520 });
    attachFitToData(map as never, SP_BBOX);

    map.fireIdle();

    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    expect(map.resize).toHaveBeenCalledTimes(1);
    const [, options] = map.fitBounds.mock.calls[0];
    expect(options).toMatchObject({ animate: true });
  });

  test('fires immediately (without waiting for idle) when the map is already loaded', () => {
    const map = makeMockMap({ clientWidth: 800, clientHeight: 520 });
    map.loaded.mockReturnValue(true);

    attachFitToData(map as never, SP_BBOX);

    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    expect(map.off).toHaveBeenCalledWith('idle', expect.any(Function));
  });
});

describe('attachFitToData — cleanup', () => {
  test('the returned cleanup function detaches the idle listener and disconnects the observer', () => {
    const map = makeMockMap({ clientWidth: 800, clientHeight: 520 });
    map.loaded.mockReturnValue(false);
    const observeMock = jest.fn();
    const disconnectMock = jest.fn();
    global.ResizeObserver = jest.fn().mockImplementation(() => {
      return {
        observe: observeMock,
        unobserve: jest.fn(),
        disconnect: disconnectMock,
      };
    }) as unknown as typeof ResizeObserver;

    const detach = attachFitToData(map as never, SP_BBOX);
    expect(observeMock).toHaveBeenCalledTimes(1);

    detach();

    expect(map.off).toHaveBeenCalledWith('idle', expect.any(Function));
    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });
});
