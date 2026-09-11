/**
 * @jest-environment jsdom
 *
 * Full rendering-lifecycle test for the internal "fit to data" auto-centering
 * (`src/adapters/maplibre/fitBoundsToData.ts`, wired into `MapLibreAdapter`).
 *
 * # Problem
 *
 * After `fitBounds` positions the camera on mount, the component's spec
 * changes because async data (e.g. `mapData`) arrives. `GeoVisProvider` calls
 * `runtime.update(newSpec)` → `adapter.update(newSpec)` → `syncFitToData`.
 *
 * `syncFitToData` compares the *computed sources bbox*, not `spec.view` — so
 * a `mapData`-only update (attribute values, no geometry change) must be a
 * no-op and the camera set by the initial `fitBounds` must be preserved. Only
 * a change to `sources` geometry (or `spec.view` going from absent to
 * explicit) must trigger anything.
 *
 * # What these tests verify
 *
 * 1. `fitBounds` is called on mount with the bbox derived from `spec.sources`
 *    and the default responsive padding.
 * 2. After a spec update that only changes `mapData` (no geometry change),
 *    `setCenter`/`setZoom` are NOT called and `fitBounds` is NOT called again
 *    — the camera set by the initial fit is preserved.
 * 3. `fitBounds` IS called again when the update replaces `sources` with
 *    different geometry.
 *
 * # Approach
 *
 * Uses the real `GeoVisProvider`, `createRuntime`, and `MapLibreAdapter` —
 * no hand-copied inline replica of the fit pattern — so this exercises the
 * actual production code path. `maplibre-gl` is mocked so all map method
 * calls are tracked via `jest.fn()`.
 */

import { act, render, waitFor } from '@testing-library/react';
import maplibregl from 'maplibre-gl';
import * as React from 'react';
import { GeoVisCanvas } from 'src/react/GeoVisCanvas';
import { GeoVisProvider } from 'src/react/GeoVisProvider';
import type { VisualizationSpec } from 'src/spec/types';

// ---------------------------------------------------------------------------
// maplibre-gl mock
//
// Intercepts `new maplibregl.Map(...)` so every method call is trackable.
// The real MapLibreAdapter, createRuntime, and GeoVisProvider are NOT mocked:
// syncFitToData runs for real, which is the core of what this test exercises.
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
    getCanvasContainer: jest.fn(() => {
      return { addEventListener: jest.fn(), removeEventListener: jest.fn() };
    }),
    getContainer: jest.fn(() => {
      return { clientWidth: 800, clientHeight: 520 };
    }),
    loaded: jest.fn(() => {
      return true;
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

const OTHER_BOUNDS: [[number, number], [number, number]] = [
  [-10, -10],
  [-9, -9],
];

const RESPONSIVE_PADDING = { top: 31, bottom: 31, left: 48, right: 48 };

const districtsSource = (bounds: [[number, number], [number, number]]) => {
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  return {
    id: 'districts',
    type: 'geojson' as const,
    data: {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: null,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [minLng, minLat],
                [maxLng, minLat],
                [maxLng, maxLat],
                [minLng, maxLat],
                [minLng, minLat],
              ],
            ],
          },
        },
      ],
    },
  };
};

// ---------------------------------------------------------------------------
// Component under test
//
// Mirrors the story pattern at the smallest possible scale:
//   - `entries` state is empty on mount (populationData not yet loaded)
//   - `loadData()` simulates the async mapData fetch completing
//   - `replaceGeometry()` simulates the source's geometry being replaced
//   - `spec.view` is intentionally absent, so the internal auto-fit is active
// ---------------------------------------------------------------------------

type MapDataRow = { geometryId: number; value: number };

interface MapController {
  loadData: () => void;
  replaceGeometry: () => void;
}

const buildSpec = (
  mapDataEntries: MapDataRow[],
  bounds: [[number, number], [number, number]]
): VisualizationSpec => {
  return {
    engine: 'maplibre',
    basemap: { styleUrl: 'https://tiles.example.com/style.json' },
    sources: [districtsSource(bounds)],
    layers: [{ id: 'fill', sourceId: 'districts', geometry: 'polygon' }],
    mapData: [
      { mapDataId: 'population', mapId: 'districts', data: mapDataEntries },
    ],
  };
};

const MinimalMap = React.forwardRef<MapController, object>((_, ref) => {
  const [entries, setEntries] = React.useState<MapDataRow[]>([]);
  const [bounds, setBounds] = React.useState(SP_BOUNDS);

  React.useImperativeHandle(ref, () => {
    return {
      loadData: () => {
        setEntries([{ geometryId: 1, value: 50_000 }]);
      },
      replaceGeometry: () => {
        setBounds(OTHER_BOUNDS);
      },
    };
  }, []);

  const spec = React.useMemo(() => {
    return buildSpec(entries, bounds);
  }, [entries, bounds]);

  return (
    <GeoVisProvider spec={spec}>
      <GeoVisCanvas viewId="default" />
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

  jest.mocked(maplibregl.Map).mockImplementation(() => {
    return mapMock as never;
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MapLibreAdapter auto fit-to-data — camera preservation across spec lifecycle', () => {
  test('fitBounds is called on mount with the sources bbox and responsive padding', async () => {
    await act(async () => {
      render(<MinimalMap ref={React.createRef()} />);
    });

    await waitFor(() => {
      expect(mapMock.fitBounds).toHaveBeenCalledTimes(1);
    });
    const [bounds, options] = mapMock.fitBounds.mock.calls[0];
    expect(bounds).toEqual(SP_BOUNDS);
    expect(options).toMatchObject({ padding: RESPONSIVE_PADDING });
  });

  test('setCenter and setZoom are NOT called after mapData loads (camera preserved)', async () => {
    const ref = React.createRef<MapController>();

    await act(async () => {
      render(<MinimalMap ref={ref} />);
    });

    await waitFor(() => {
      expect(mapMock.fitBounds).toHaveBeenCalledTimes(1);
    });

    mapMock.setCenter.mockClear();
    mapMock.setZoom.mockClear();

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

    await waitFor(() => {
      expect(mapMock.fitBounds).toHaveBeenCalledTimes(1);
    });

    mapMock.fitBounds.mockClear();

    await act(async () => {
      ref.current?.loadData();
    });

    // The bbox derived from `spec.sources` is unchanged — mapData carries
    // values, not geometry — so the camera must not jump.
    expect(mapMock.fitBounds).not.toHaveBeenCalled();
  });

  test('fitBounds IS called again when source geometry changes', async () => {
    const ref = React.createRef<MapController>();

    await act(async () => {
      render(<MinimalMap ref={ref} />);
    });

    await waitFor(() => {
      expect(mapMock.fitBounds).toHaveBeenCalledTimes(1);
    });

    mapMock.fitBounds.mockClear();

    await act(async () => {
      ref.current?.replaceGeometry();
    });

    expect(mapMock.fitBounds).toHaveBeenCalledTimes(1);
    const [bounds] = mapMock.fitBounds.mock.calls[0];
    expect(bounds).toEqual(OTHER_BOUNDS);
  });
});
