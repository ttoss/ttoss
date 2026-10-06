/**
 * The extruded height's ease: MapLibre lands a new data-driven height at once,
 * so the adapter writes a blend of the old and new expressions frame by frame.
 * A manual scheduler drives the frames one at a time.
 */

import {
  forgetExtrusionHeight,
  isExtrusionAnimating,
  setExtrusionScheduler,
  transitionExtrusionHeight,
} from 'src/adapters/maplibre/extrusionTransition';

const makeScheduler = () => {
  let now = 0;
  let nextHandle = 1;
  const frames = new Map<number, () => void>();

  return {
    scheduler: {
      now: () => {
        return now;
      },
      raf: (cb: () => void) => {
        const handle = nextHandle++;
        frames.set(handle, cb);
        return handle;
      },
      caf: (handle: number) => {
        frames.delete(handle);
      },
    },
    /** Moves the clock and runs the frames pending at that moment. */
    advance: (ms: number) => {
      now += ms;
      const pending = [...frames.values()];
      frames.clear();
      for (const cb of pending) cb();
    },
    pendingFrames: () => {
      return frames.size;
    },
  };
};

const makeMap = () => {
  const layers = new Set<string>(['prisms']);
  return {
    layers,
    map: {
      getLayer: jest.fn((id: string) => {
        return layers.has(id) ? { id, type: 'fill-extrusion' } : undefined;
      }),
      setPaintProperty: jest.fn(),
    },
  };
};

type MapArg = Parameters<typeof transitionExtrusionHeight>[0]['map'];

const lastHeight = (map: ReturnType<typeof makeMap>['map']) => {
  const calls = map.setPaintProperty.mock.calls;
  return calls[calls.length - 1]?.[2];
};

let clock: ReturnType<typeof makeScheduler>;

beforeEach(() => {
  clock = makeScheduler();
  setExtrusionScheduler(clock.scheduler);
});

afterEach(() => {
  setExtrusionScheduler();
  delete (globalThis as { window?: unknown }).window;
});

test('eases from the start height to the target, then rests there', () => {
  const { map } = makeMap();
  const onComplete = jest.fn();

  transitionExtrusionHeight({
    map: map as unknown as MapArg,
    layerId: 'prisms',
    from: 0,
    to: 100,
    durationMs: 100,
    onComplete,
  });

  // The first frame is written at once, at the start height.
  expect(lastHeight(map)).toBe(0);
  expect(isExtrusionAnimating(map as unknown as MapArg, 'prisms')).toBe(true);

  clock.advance(50);
  expect(lastHeight(map)).toEqual(['+', ['*', 0.5, 0], ['*', 0.5, 100]]);
  expect(onComplete).not.toHaveBeenCalled();

  clock.advance(50);
  expect(lastHeight(map)).toBe(100);
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(isExtrusionAnimating(map as unknown as MapArg, 'prisms')).toBe(false);
  expect(clock.pendingFrames()).toBe(0);
});

test('snaps when the duration is 0', () => {
  const { map } = makeMap();
  const onComplete = jest.fn();

  transitionExtrusionHeight({
    map: map as unknown as MapArg,
    layerId: 'prisms',
    to: ['get', 'h'],
    durationMs: 0,
    onComplete,
  });

  expect(lastHeight(map)).toEqual(['get', 'h']);
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(clock.pendingFrames()).toBe(0);
});

test('snaps when the viewer prefers reduced motion', () => {
  (globalThis as { window?: unknown }).window = {
    matchMedia: () => {
      return { matches: true };
    },
  };
  const { map } = makeMap();

  transitionExtrusionHeight({
    map: map as unknown as MapArg,
    layerId: 'prisms',
    from: 0,
    to: 100,
    durationMs: 300,
  });

  expect(lastHeight(map)).toBe(100);
  expect(clock.pendingFrames()).toBe(0);
});

test('a repeat of the current target neither restarts nor rewrites', () => {
  const { map } = makeMap();
  const params = {
    map: map as unknown as MapArg,
    layerId: 'prisms',
    to: 100,
    durationMs: 100,
  };
  transitionExtrusionHeight({ ...params, from: 0 });
  clock.advance(50);
  const writes = map.setPaintProperty.mock.calls.length;

  transitionExtrusionHeight(params);
  expect(map.setPaintProperty.mock.calls.length).toBe(writes);

  // Resting at the target, a repeat completes at once.
  clock.advance(50);
  const onComplete = jest.fn();
  transitionExtrusionHeight({ ...params, onComplete });
  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('an interruption picks up from where the ease had got to', () => {
  const { map } = makeMap();
  const firstComplete = jest.fn();
  transitionExtrusionHeight({
    map: map as unknown as MapArg,
    layerId: 'prisms',
    from: 0,
    to: 100,
    durationMs: 100,
    onComplete: firstComplete,
  });
  clock.advance(50);

  transitionExtrusionHeight({
    map: map as unknown as MapArg,
    layerId: 'prisms',
    to: 0,
    durationMs: 100,
  });

  // The new ease starts from the half-way blend, not from either end.
  expect(lastHeight(map)).toEqual(['+', ['*', 0.5, 0], ['*', 0.5, 100]]);
  clock.advance(100);
  expect(lastHeight(map)).toBe(0);
  // The interrupted ease never completes.
  expect(firstComplete).not.toHaveBeenCalled();
});

test('a layer gone mid-ease stops the frames', () => {
  const { map, layers } = makeMap();
  const onComplete = jest.fn();
  transitionExtrusionHeight({
    map: map as unknown as MapArg,
    layerId: 'prisms',
    from: 0,
    to: 100,
    durationMs: 100,
    onComplete,
  });

  layers.delete('prisms');
  clock.advance(50);

  expect(clock.pendingFrames()).toBe(0);
  expect(onComplete).not.toHaveBeenCalled();
  expect(isExtrusionAnimating(map as unknown as MapArg, 'prisms')).toBe(false);
});

test('forgetting a layer cancels its ease without completing it', () => {
  const { map } = makeMap();
  const onComplete = jest.fn();
  transitionExtrusionHeight({
    map: map as unknown as MapArg,
    layerId: 'prisms',
    from: 0,
    to: 100,
    durationMs: 100,
    onComplete,
  });

  forgetExtrusionHeight(map as unknown as MapArg, 'prisms');
  clock.advance(100);

  expect(onComplete).not.toHaveBeenCalled();
  expect(isExtrusionAnimating(map as unknown as MapArg, 'prisms')).toBe(false);
  // Forgetting an unknown layer is harmless.
  forgetExtrusionHeight(map as unknown as MapArg, 'other');
});

test('the default scheduler drives frames with requestAnimationFrame', () => {
  setExtrusionScheduler();
  const raf = jest.fn(() => {
    return 7;
  });
  const caf = jest.fn();
  (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame =
    raf;
  (globalThis as { cancelAnimationFrame?: unknown }).cancelAnimationFrame = caf;
  const { map } = makeMap();

  transitionExtrusionHeight({
    map: map as unknown as MapArg,
    layerId: 'prisms',
    from: 0,
    to: 100,
    durationMs: 100_000,
  });
  forgetExtrusionHeight(map as unknown as MapArg, 'prisms');

  expect(raf).toHaveBeenCalledTimes(1);
  expect(caf).toHaveBeenCalledWith(7);
  delete (globalThis as { requestAnimationFrame?: unknown })
    .requestAnimationFrame;
  delete (globalThis as { cancelAnimationFrame?: unknown })
    .cancelAnimationFrame;
});
