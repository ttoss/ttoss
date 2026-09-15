/**
 * Unit tests for the paint-deferral helpers in `legendFillPaint.ts`.
 *
 * `setPaintWhenReady` has no style-readiness gate: layer presence *is* the
 * readiness check, and `styledata` is what waits for it. These tests drive a
 * stateful mock map whose layer set and listener registry can be mutated
 * between emissions, so the deferral, the re-registration guard and the
 * cancellation path are all exercised against realistic event ordering.
 */

import {
  cancelPendingStyleListenersForLayer,
  setPaintWhenReady,
} from 'src/adapters/maplibre/legendFillPaint';

// ---------------------------------------------------------------------------
// Stateful mock map
// ---------------------------------------------------------------------------

type Listener = () => void;

const makeMapMock = () => {
  const layers = new Set<string>();
  const listeners = new Map<string, Listener[]>();

  const map = {
    getLayer: jest.fn((id: string) => {
      return layers.has(id) ? { id } : undefined;
    }),
    setPaintProperty: jest.fn(),
    on: jest.fn((event: string, cb: Listener) => {
      const bucket = listeners.get(event) ?? [];
      bucket.push(cb);
      listeners.set(event, bucket);
    }),
    off: jest.fn((event: string, cb: Listener) => {
      const bucket = listeners.get(event) ?? [];
      const index = bucket.indexOf(cb);
      if (index >= 0) bucket.splice(index, 1);
    }),
  };

  /** Fires `event` over a snapshot, so a listener may unregister itself. */
  const emit = (event: string) => {
    for (const cb of [...(listeners.get(event) ?? [])]) cb();
  };

  const listenerCount = (event: string) => {
    return (listeners.get(event) ?? []).length;
  };

  return { map, layers, emit, listenerCount };
};

type MapArg = Parameters<typeof setPaintWhenReady>[0];

const asMap = (map: ReturnType<typeof makeMapMock>['map']) => {
  return map as unknown as MapArg;
};

// ---------------------------------------------------------------------------
// setPaintWhenReady
// ---------------------------------------------------------------------------

describe('setPaintWhenReady', () => {
  test('applies the paint property immediately when the layer is on the map', () => {
    const { map, layers, listenerCount } = makeMapMock();
    layers.add('states');

    setPaintWhenReady(asMap(map), 'states', 'fill-color', '#f00');

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'states',
      'fill-color',
      '#f00'
    );
    expect(listenerCount('styledata')).toBe(0);
  });

  test('defers to `styledata` and applies once the layer appears', () => {
    const { map, layers, emit, listenerCount } = makeMapMock();

    setPaintWhenReady(asMap(map), 'states', 'fill-color', '#f00');

    expect(map.setPaintProperty).not.toHaveBeenCalled();
    expect(listenerCount('styledata')).toBe(1);

    layers.add('states');
    emit('styledata');

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'states',
      'fill-color',
      '#f00'
    );
    // Applied once, so the listener unregisters itself.
    expect(listenerCount('styledata')).toBe(0);
  });

  test('keeps waiting when `styledata` fires before the layer exists', () => {
    const { map, layers, emit, listenerCount } = makeMapMock();

    setPaintWhenReady(asMap(map), 'states', 'fill-color', '#f00');

    emit('styledata');
    expect(map.setPaintProperty).not.toHaveBeenCalled();
    expect(listenerCount('styledata')).toBe(1);

    emit('styledata');
    expect(map.setPaintProperty).not.toHaveBeenCalled();
    expect(listenerCount('styledata')).toBe(1);

    layers.add('states');
    emit('styledata');
    expect(map.setPaintProperty).toHaveBeenCalledTimes(1);
    expect(listenerCount('styledata')).toBe(0);
  });

  test('replaces the pending listener when the same layer+property defers twice', () => {
    const { map, layers, emit, listenerCount } = makeMapMock();

    setPaintWhenReady(asMap(map), 'states', 'fill-color', '#f00');
    setPaintWhenReady(asMap(map), 'states', 'fill-color', '#0f0');

    // The stale listener is detached rather than left to fire alongside.
    expect(map.off).toHaveBeenCalledWith('styledata', expect.any(Function));
    expect(listenerCount('styledata')).toBe(1);

    layers.add('states');
    emit('styledata');

    expect(map.setPaintProperty).toHaveBeenCalledTimes(1);
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'states',
      'fill-color',
      '#0f0'
    );
  });

  test('keeps pending listeners for different layers and properties apart', () => {
    const { map, layers, emit, listenerCount } = makeMapMock();

    setPaintWhenReady(asMap(map), 'states', 'fill-color', '#f00');
    setPaintWhenReady(asMap(map), 'states', 'fill-opacity', 0.5);
    setPaintWhenReady(asMap(map), 'cities', 'fill-color', '#00f');

    expect(listenerCount('styledata')).toBe(3);

    layers.add('states');
    emit('styledata');

    expect(map.setPaintProperty).toHaveBeenCalledTimes(2);
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'states',
      'fill-color',
      '#f00'
    );
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'states',
      'fill-opacity',
      0.5
    );
    // `cities` is still absent, so its listener stays registered.
    expect(listenerCount('styledata')).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// cancelPendingStyleListenersForLayer
// ---------------------------------------------------------------------------

describe('cancelPendingStyleListenersForLayer', () => {
  test('is a no-op for a map that never registered a pending listener', () => {
    const { map } = makeMapMock();

    cancelPendingStyleListenersForLayer(asMap(map), 'states');

    expect(map.off).not.toHaveBeenCalled();
  });

  test('detaches every pending listener for the layer', () => {
    const { map, layers, emit, listenerCount } = makeMapMock();

    setPaintWhenReady(asMap(map), 'states', 'fill-color', '#f00');
    setPaintWhenReady(asMap(map), 'states', 'fill-opacity', 0.5);
    expect(listenerCount('styledata')).toBe(2);

    cancelPendingStyleListenersForLayer(asMap(map), 'states');

    expect(listenerCount('styledata')).toBe(0);

    // A later re-add must not resurrect the cancelled paint.
    layers.add('states');
    emit('styledata');
    expect(map.setPaintProperty).not.toHaveBeenCalled();
  });

  test('leaves listeners belonging to other layers registered', () => {
    const { map, layers, emit, listenerCount } = makeMapMock();

    setPaintWhenReady(asMap(map), 'states', 'fill-color', '#f00');
    setPaintWhenReady(asMap(map), 'cities', 'fill-color', '#00f');

    cancelPendingStyleListenersForLayer(asMap(map), 'states');

    expect(listenerCount('styledata')).toBe(1);

    layers.add('states');
    layers.add('cities');
    emit('styledata');

    expect(map.setPaintProperty).toHaveBeenCalledTimes(1);
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'cities',
      'fill-color',
      '#00f'
    );
  });

  test('does not match a layer whose id is a prefix of another', () => {
    const { map, layers, emit } = makeMapMock();

    setPaintWhenReady(asMap(map), 'states-outline', 'fill-color', '#f00');

    cancelPendingStyleListenersForLayer(asMap(map), 'states');

    layers.add('states-outline');
    emit('styledata');

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'states-outline',
      'fill-color',
      '#f00'
    );
  });
});
