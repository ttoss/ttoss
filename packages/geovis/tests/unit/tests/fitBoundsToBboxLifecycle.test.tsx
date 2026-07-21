/**
 * @jest-environment jsdom
 *
 * Full rendering-lifecycle test for the FitBoundsToBbox camera preservation.
 *
 * # Problem
 *
 * After `fitBounds` positions the camera on mount, the component's spec
 * changes because async data (e.g. `mapData`) arrives. `GeoVisProvider` calls
 * `runtime.update(newSpec)` → `adapter.update(newSpec)` → `syncMapView`.
 *
 * `syncMapView` compares `previousSpec.view` with `newSpec.view` by value.
 * If the values are identical (only `mapData` changed), it is a no-op and the
 * camera set by `fitBounds` is preserved. If there is a bug that accidentally
 * changes `spec.view`, `setCenter`/`setZoom` would be called, overriding the
 * fit with the default initial position.
 *
 * # What these tests verify
 *
 * 1. `fitBounds` is called on mount with the correct bounds and insets.
 * 2. After a spec update that only changes `mapData` (same `view` values),
 *    `setCenter` and `setZoom` are NOT called — the camera is preserved.
 * 3. `fitBounds` is not called again when only `mapData` changes (the
 *    `FitBoundsToBbox` effect deps `[runtime, bounds, insets]` are stable).
 *
 * # Approach
 *
 * Uses the real `GeoVisProvider`, `createRuntime`, and `MapLibreAdapter` so
 * that `syncMapView` executes for real. `maplibre-gl` is mocked so all
 * map method calls are tracked via `jest.fn()`.
 */

import { act, render, waitFor } from '@testing-library/react';
import maplibregl from 'maplibre-gl';
import * as React from 'react';
import { GeoVisCanvas } from 'src/react/GeoVisCanvas';
import { GeoVisProvider, useGeoVis } from 'src/react/GeoVisProvider';
import type { VisualizationSpec } from 'src/spec/types';

// ---------------------------------------------------------------------------
// maplibre-gl mock
//
// Intercepts `new maplibregl.Map(...)` so every method call is trackable.
// The real MapLibreAdapter, createRuntime, and GeoVisProvider are NOT mocked:
// syncMapView runs for real, which is the core of what this test exercises.
// ---------------------------------------------------------------------------

jest.mock('maplibre-gl', () => {
  return {
    Map: jest.fn(),
    NavigationControl: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

// ---------------------------------------------------------------------------
// ResizeObserver stub — not available in jsdom
//
// Stored and restored around the suite so the stub does not leak into other
// test files running in the same Jest worker.
// ---------------------------------------------------------------------------

const originalResizeObserver = global.ResizeObserver;

beforeAll(() => {
  global.ResizeObserver = jest.fn().mockImplementation(() => {
    return {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    };
  });
});

afterAll(() => {
  global.ResizeObserver = originalResizeObserver;
});

// ---------------------------------------------------------------------------
// Mock map factory
// ---------------------------------------------------------------------------

const makeMapMock = () => {
  return {
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    addControl: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
    getSource: jest.fn(() => {
      return null;
    }),
    getLayer: jest.fn(() => {
      return null;
    }),
    removeLayer: jest.fn(),
    removeSource: jest.fn(),
    isStyleLoaded: jest.fn(() => {
      return true;
    }),
    setLayoutProperty: jest.fn(),
    setPaintProperty: jest.fn(),
    setStyle: jest.fn(),
    setCenter: jest.fn(),
    setZoom: jest.fn(),
    setPitch: jest.fn(),
    setBearing: jest.fn(),
    isSourceLoaded: jest.fn(() => {
      return false;
    }),
    setFeatureState: jest.fn(),
    getContainer: jest.fn(() => {
      return { clientWidth: 800, clientHeight: 520 };
    }),
    resize: jest.fn(),
    fitBounds: jest.fn(),
  };
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SP_BOUNDS: [[number, number], [number, number]] = [
  [-46.8253, -24.0082],
  [-46.3653, -23.3567],
];

const INSETS = { top: 8, bottom: 8, left: 152, right: 8 };

// ---------------------------------------------------------------------------
// Inline FitBoundsToBbox
//
// Exact replica of the production pattern.
// Must be placed AFTER GeoVisCanvas in the JSX tree so that runtime.mount()
// has already registered the native map when this effect fires.
// ---------------------------------------------------------------------------

const FitBoundsToBboxInline = ({
  bounds,
  insets,
}: {
  bounds: [[number, number], [number, number]];
  insets: typeof INSETS;
}) => {
  const { runtime } = useGeoVis();

  React.useEffect(() => {
    if (!runtime) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = runtime.getAdapter().getNativeInstance() as any;
    if (!map) return;

    const apply = () => {
      const container = map.getContainer();
      if (container.clientWidth === 0 || container.clientHeight === 0) return;
      map.resize();
      map.fitBounds(bounds, { padding: insets, animate: false, duration: 0 });
    };

    map.once('idle', apply);

    const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width === 0 || rect.height === 0) return;
      apply();
    });
    observer.observe(map.getContainer());

    return () => {
      map.off('idle', apply);
      observer.disconnect();
    };
  }, [runtime, bounds, insets]);

  return null;
};

// ---------------------------------------------------------------------------
// Minimal component under test
//
// Mirrors the story pattern at the smallest possible scale:
//   - `entries` state is empty on mount (populationData not yet loaded)
//   - `loadData()` simulates the async fetch completing
//   - `spec.view` is the same literal values in both renders
//   - GeoVisCanvas comes BEFORE FitBoundsToBboxInline (correct ordering)
// ---------------------------------------------------------------------------

type MapDataRow = { geometryId: number; value: number };

interface MapController {
  loadData: () => void;
}

const buildSpec = (mapDataEntries: MapDataRow[]): VisualizationSpec => {
  return {
    engine: 'maplibre',
    // view values are intentionally identical across renders — only mapData changes.
    view: { center: [-46.6333, -23.5505] as [number, number], zoom: 10 },
    basemap: { styleUrl: 'https://tiles.example.com/style.json' },
    sources: [
      {
        id: 'districts',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [{ id: 'fill', sourceId: 'districts', geometry: 'polygon' }],
    mapData: [
      { mapDataId: 'population', mapId: 'districts', data: mapDataEntries },
    ],
  };
};

const MinimalMap = React.forwardRef<MapController, object>((_, ref) => {
  const [entries, setEntries] = React.useState<MapDataRow[]>([]);

  React.useImperativeHandle(ref, () => {
    return {
      loadData: () => {
        setEntries([{ geometryId: 1, value: 50_000 }]);
      },
    };
  }, []);

  const spec = React.useMemo(() => {
    return buildSpec(entries);
  }, [entries]);

  return (
    <GeoVisProvider spec={spec}>
      <div>
        {/* GeoVisCanvas MUST come first so runtime.mount() registers the map
            before FitBoundsToBboxInline's effect fires. */}
        <GeoVisCanvas viewId="default" />
        <FitBoundsToBboxInline bounds={SP_BOUNDS} insets={INSETS} />
      </div>
    </GeoVisProvider>
  );
});

MinimalMap.displayName = 'MinimalMap';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let mapMock: ReturnType<typeof makeMapMock>;

beforeEach(() => {
  jest.clearAllMocks();

  mapMock = makeMapMock();

  // `once('idle', cb)` fires asynchronously (deferred via setTimeout) to
  // simulate the real MapLibre behaviour where `idle` fires after the style
  // loads, which is always async. Assertions use `waitFor` accordingly.
  mapMock.once.mockImplementation((event: string, cb: () => void) => {
    if (event === 'idle') setTimeout(cb, 0);
  });

  jest.mocked(maplibregl.Map).mockImplementation(() => {
    return mapMock as never;
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FitBoundsToBbox camera preservation across spec lifecycle', () => {
  test('fitBounds is called on mount with correct bounds and insets', async () => {
    await act(async () => {
      render(<MinimalMap ref={React.createRef()} />);
    });

    await waitFor(() => {
      expect(mapMock.fitBounds).toHaveBeenCalledTimes(1);
    });
    expect(mapMock.fitBounds).toHaveBeenCalledWith(SP_BOUNDS, {
      padding: INSETS,
      animate: false,
      duration: 0,
    });
  });

  test('setCenter and setZoom are NOT called after mapData loads (camera preserved)', async () => {
    const ref = React.createRef<MapController>();

    await act(async () => {
      render(<MinimalMap ref={ref} />);
    });

    // Wait for the async idle callback to fire and fitBounds to be called.
    await waitFor(() => {
      expect(mapMock.fitBounds).toHaveBeenCalledTimes(1);
    });

    // Camera is now positioned by fitBounds. Clear tracking before the update.
    mapMock.setCenter.mockClear();
    mapMock.setZoom.mockClear();

    // Simulate async mapData arriving — spec.view values are identical.
    // syncMapView compares numbers by value, so both axes are no-ops.
    await act(async () => {
      ref.current?.loadData();
    });

    expect(mapMock.setCenter).not.toHaveBeenCalled();
    expect(mapMock.setZoom).not.toHaveBeenCalled();
  });

  test('fitBounds is NOT called again when only mapData changes', async () => {
    const ref = React.createRef<MapController>();

    await act(async () => {
      render(<MinimalMap ref={ref} />);
    });

    // Wait for the initial async idle callback to fire.
    await waitFor(() => {
      expect(mapMock.fitBounds).toHaveBeenCalledTimes(1);
    });

    // fitBounds was called on mount. Clear so the next assertion is isolated.
    mapMock.fitBounds.mockClear();

    await act(async () => {
      ref.current?.loadData();
    });

    // FitBoundsToBboxInline deps are [runtime, bounds, insets] — none changed.
    // The effect must NOT re-run, so fitBounds must NOT be called again.
    expect(mapMock.fitBounds).not.toHaveBeenCalled();
  });
});
