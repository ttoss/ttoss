import type maplibregl from 'maplibre-gl';
import {
  cancelPendingStyleListenersForLayer,
  reapplyLegendDrivenFillPaint,
  setPaintWhenReady,
} from 'src/adapters/maplibre/legendFillPaint';
import { makeMapMock } from 'tests/unit/helpers/makeMapMock';

jest.mock('maplibre-gl', () => {
  return {
    Map: jest.fn(),
    NavigationControl: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

/** Builds a map mock with real event-handler tracking (on/off/once). */
const makeEventMapMock = () => {
  const handlers: Record<string, Array<(...a: unknown[]) => void>> = {};
  return makeMapMock({
    on: jest.fn((evt: string, cb: (...a: unknown[]) => void) => {
      handlers[evt] = handlers[evt] ?? [];
      handlers[evt].push(cb);
    }),
    off: jest.fn((evt: string, cb: (...a: unknown[]) => void) => {
      handlers[evt] = (handlers[evt] ?? []).filter((h) => {
        return h !== cb;
      });
    }),
    once: jest.fn((evt: string, cb: (...a: unknown[]) => void) => {
      handlers[evt] = handlers[evt] ?? [];
      handlers[evt].push(cb);
    }),
  });
};
beforeEach(() => {
  jest.clearAllMocks();
});

describe('cancelPendingStyleListenersForLayer', () => {
  test('returns early when no pending listeners exist for the map', () => {
    const map = makeEventMapMock() as unknown as maplibregl.Map;
    // Should not throw even when no listeners were ever registered
    expect(() => {
      return cancelPendingStyleListenersForLayer(map, 'layer-a');
    }).not.toThrow();
    expect(map.off).not.toHaveBeenCalled();
  });

  test('cancels pending listeners matching the layerId prefix', () => {
    const map = makeEventMapMock() as unknown as maplibregl.Map;

    // Use isStyleLoaded=true + getLayer=null so setPaintWhenReady registers styledata listeners
    jest.mocked(map.isStyleLoaded).mockReturnValue(true);
    jest.mocked(map.getLayer).mockReturnValue(null);

    setPaintWhenReady(map, 'layer-a', 'fill-color', '#ff0000');
    setPaintWhenReady(map, 'layer-a', 'fill-opacity', 0.5);
    setPaintWhenReady(map, 'layer-b', 'fill-color', '#0000ff');

    // Verify 3 styledata listeners were registered
    const onCalls = jest.mocked(map.on).mock.calls;
    expect(onCalls.length).toBe(3);

    // Cancel only layer-a listeners
    cancelPendingStyleListenersForLayer(map, 'layer-a');

    // layer-a listeners should be removed (2 calls to map.off)
    const offCalls = jest.mocked(map.off).mock.calls;
    expect(offCalls.length).toBe(2);
    for (const call of offCalls) {
      expect(call[0]).toBe('styledata');
    }
  });

  test('does not cancel listeners for other layers', () => {
    const map = makeEventMapMock() as unknown as maplibregl.Map;

    jest.mocked(map.isStyleLoaded).mockReturnValue(true);
    jest.mocked(map.getLayer).mockReturnValue(null);

    setPaintWhenReady(map, 'layer-a', 'fill-color', '#ff0000');
    setPaintWhenReady(map, 'layer-b', 'fill-color', '#0000ff');

    jest.mocked(map.off).mockClear();

    cancelPendingStyleListenersForLayer(map, 'layer-a');

    // Only layer-a listeners should have been cancelled (1 call for fill-color)
    expect(map.off).toHaveBeenCalledTimes(1);
    expect(map.off).toHaveBeenCalledWith('styledata', expect.any(Function));
  });
});

describe('setPaintWhenReady', () => {
  test('applies paint immediately when style is loaded and layer exists', () => {
    const map = makeEventMapMock() as unknown as maplibregl.Map;
    jest.mocked(map.isStyleLoaded).mockReturnValue(true);
    jest.mocked(map.getLayer).mockReturnValue({} as never);

    setPaintWhenReady(map, 'my-layer', 'fill-color', '#ff0000');

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'my-layer',
      'fill-color',
      '#ff0000'
    );
    expect(map.on).not.toHaveBeenCalledWith('styledata', expect.any(Function));
  });

  test('defers to styledata when style loaded but layer missing', () => {
    const map = makeEventMapMock() as unknown as maplibregl.Map;
    jest.mocked(map.isStyleLoaded).mockReturnValue(true);
    jest.mocked(map.getLayer).mockReturnValue(null);

    setPaintWhenReady(map, 'my-layer', 'fill-color', '#ff0000');

    expect(map.setPaintProperty).not.toHaveBeenCalled();
    expect(map.on).toHaveBeenCalledWith('styledata', expect.any(Function));
  });

  test('cancels existing listener before registering new one for same key', () => {
    const map = makeEventMapMock() as unknown as maplibregl.Map;
    jest.mocked(map.isStyleLoaded).mockReturnValue(true);
    jest.mocked(map.getLayer).mockReturnValue(null);

    // First registration — registers styledata listener
    setPaintWhenReady(map, 'layer-a', 'fill-color', '#ff0000');
    expect(map.on).toHaveBeenCalledTimes(1);
    const firstCb = jest.mocked(map.on).mock.calls[0][1];

    // Second registration for same layer+property — should cancel first
    setPaintWhenReady(map, 'layer-a', 'fill-color', '#00ff00');
    expect(map.off).toHaveBeenCalledWith('styledata', firstCb);
    expect(map.on).toHaveBeenCalledTimes(2);
  });

  test('defers to style.load when style is not loaded', () => {
    const map = makeEventMapMock() as unknown as maplibregl.Map;
    jest.mocked(map.isStyleLoaded).mockReturnValue(false);
    jest.mocked(map.getLayer).mockReturnValue(null);

    setPaintWhenReady(map, 'my-layer', 'fill-color', '#ff0000');

    // Should register a style.load listener, not apply immediately
    expect(map.once).toHaveBeenCalledWith('style.load', expect.any(Function));
    expect(map.setPaintProperty).not.toHaveBeenCalled();
  });

  test('style.load callback applies paint when layer appears', () => {
    const map = makeEventMapMock() as unknown as maplibregl.Map;
    jest.mocked(map.isStyleLoaded).mockReturnValue(false);
    jest.mocked(map.getLayer).mockReturnValue(null);

    setPaintWhenReady(map, 'my-layer', 'fill-color', '#ff0000');

    // Simulate style.load — layer still missing → defers to styledata
    jest.mocked(map.getLayer).mockReturnValue(null);
    const styleLoadCb = jest.mocked(map.once).mock.calls[0][1] as () => void;
    styleLoadCb();

    expect(map.setPaintProperty).not.toHaveBeenCalled();
    expect(map.on).toHaveBeenCalledWith('styledata', expect.any(Function));

    // Simulate styledata — layer now exists → applies paint
    jest.mocked(map.getLayer).mockReturnValue({} as never);
    const styleDataCb = jest.mocked(map.on).mock.calls[0][1] as () => void;
    styleDataCb();

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'my-layer',
      'fill-color',
      '#ff0000'
    );
  });
});

describe('reapplyLegendDrivenFillPaint', () => {
  test('skips non-polygon layers', () => {
    const map = makeEventMapMock() as unknown as maplibregl.Map;
    jest.mocked(map.isStyleLoaded).mockReturnValue(true);

    const spec = {
      engine: 'maplibre' as const,
      view: { center: [-46.6, -23.5] as [number, number], zoom: 10 },
      sources: [],
      layers: [
        { id: 'line-layer', sourceId: 's', geometry: 'line' as const },
        { id: 'point-layer', sourceId: 's', geometry: 'point' as const },
      ],
    };

    reapplyLegendDrivenFillPaint(map, spec);
    expect(map.setPaintProperty).not.toHaveBeenCalled();
  });

  test('skips polygon layers without active legends', () => {
    const map = makeEventMapMock() as unknown as maplibregl.Map;
    jest.mocked(map.isStyleLoaded).mockReturnValue(true);

    const spec = {
      engine: 'maplibre' as const,
      view: { center: [-46.6, -23.5] as [number, number], zoom: 10 },
      sources: [],
      layers: [{ id: 'poly', sourceId: 's', geometry: 'polygon' as const }],
    };

    reapplyLegendDrivenFillPaint(map, spec);
    expect(map.setPaintProperty).not.toHaveBeenCalled();
  });
});
