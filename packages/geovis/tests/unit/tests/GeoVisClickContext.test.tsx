/**
 * @jest-environment jsdom
 */

import { act, render, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { useGeoVisClick } from 'src/react/contexts';
import { GeoVisProvider, useGeoVis } from 'src/react/GeoVisProvider';
import type { VisualizationSpec } from 'src/spec/types';

// ---------------------------------------------------------------------------
// Mock plumbing — mirrors GeoVisHoverTooltip.test.tsx exactly
// ---------------------------------------------------------------------------

type MapClickHandler = (event: {
  point: { x: number; y: number };
  lngLat: { lng: number; lat: number };
  features?: ReadonlyArray<{ id?: string | number; layer?: { id: string } }>;
}) => void;
type MapGenericHandler = () => void;

interface MockMap {
  on: jest.Mock;
  off: jest.Mock;
  queryRenderedFeatures: jest.Mock;
  getFeatureState: jest.Mock;
  setFeatureState: jest.Mock;
  getCanvas: jest.Mock;
  getLayer: jest.Mock;
  isStyleLoaded: jest.Mock;
  setPaintProperty: jest.Mock;
  once: jest.Mock;
  project: jest.Mock;
  __handlers: Map<string, MapClickHandler | MapGenericHandler>;
  __canvas: { style: { cursor: string }; getBoundingClientRect: () => DOMRect };
}

const buildMockMap = (): MockMap => {
  const handlers = new Map<string, MapClickHandler | MapGenericHandler>();
  const canvas = {
    style: { cursor: '' },
    getBoundingClientRect: () => {
      return { left: 0, top: 0 } as DOMRect;
    },
  };
  const map: MockMap = {
    on: jest.fn((event: string, layerOrHandler, maybeHandler) => {
      const layerId = typeof layerOrHandler === 'string' ? layerOrHandler : '*';
      const handler = (
        typeof layerOrHandler === 'string' ? maybeHandler : layerOrHandler
      ) as MapClickHandler | MapGenericHandler;
      handlers.set(`${event}:${layerId}`, handler);
    }),
    off: jest.fn((event: string, layerOrHandler) => {
      const layerId = typeof layerOrHandler === 'string' ? layerOrHandler : '*';
      handlers.delete(`${event}:${layerId}`);
    }),
    queryRenderedFeatures: jest.fn(),
    getFeatureState: jest.fn(),
    setFeatureState: jest.fn(),
    getCanvas: jest.fn(() => {
      return canvas;
    }),
    getLayer: jest.fn(() => {
      return undefined;
    }),
    isStyleLoaded: jest.fn(() => {
      return true;
    }),
    setPaintProperty: jest.fn(),
    once: jest.fn(),
    project: jest.fn((_lngLat: { lng: number; lat: number }) => {
      return { x: 100, y: 200 };
    }),
    __handlers: handlers,
    __canvas: canvas,
  };
  return map;
};

let mockCurrentMap: MockMap;

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
        getNativeInstance: jest.fn(() => {
          return mockCurrentMap;
        }),
      };
    }),
  };
});

const buildSpec = (): VisualizationSpec => {
  return {
    id: 'click-spec',
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    sources: [
      {
        id: 'districts',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [
      {
        id: 'districts-fill',
        sourceId: 'districts',
        geometry: 'polygon',
        activeLegendId: 'pop',
      },
    ],
    legends: [
      {
        id: 'pop',
        label: 'Population',
        colorBy: {
          type: 'quantitative',
          property: 'value',
          scale: 'threshold',
          thresholds: [100, 200],
          colors: ['#e5f5e0', '#a1d99b', '#31a354'],
        },
      },
    ],
  };
};

// ---------------------------------------------------------------------------
// Helper — exposes runtime readiness
// ---------------------------------------------------------------------------

const ExposeRuntime = ({ onReady }: { onReady: () => void }) => {
  const { runtime } = useGeoVis();
  React.useEffect(() => {
    if (runtime) onReady();
  }, [runtime, onReady]);
  return null;
};

// ---------------------------------------------------------------------------
// Helper — fires the stored click handler for a given key
// ---------------------------------------------------------------------------

const triggerClick = (
  map: MockMap,
  layerId: string,
  event: {
    point: { x: number; y: number };
    lngLat: { lng: number; lat: number };
    features?: ReadonlyArray<{ id?: string | number; layer?: { id: string } }>;
  }
) => {
  const handler = map.__handlers.get(`click:${layerId}`) as
    | MapClickHandler
    | undefined;
  if (!handler)
    throw new Error(`click handler missing for key click:${layerId}`);
  act(() => {
    handler(event);
  });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GeoVisClickContext', () => {
  beforeEach(() => {
    mockCurrentMap = buildMockMap();
  });

  // 1. useGeoVisClick throws outside provider
  test('useGeoVisClick throws when used outside GeoVisProvider', async () => {
    expect(() => {
      renderHook(() => {
        return useGeoVisClick();
      });
    }).toThrow('useGeoVisClick must be used inside <GeoVisProvider>');
  });

  // 2. useGeoVisClick returns null initially inside provider
  test('useGeoVisClick returns null when no feature has been clicked', async () => {
    const { result } = renderHook(
      () => {
        return useGeoVisClick();
      },
      {
        wrapper: ({ children }) => {
          return <GeoVisProvider spec={buildSpec()}>{children}</GeoVisProvider>;
        },
      }
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(result.current).toBeNull();
  });

  // 3. useMapClick registers map.on("click", layerId) for layers with activeLegendId
  test('useMapClick registers map.on("click", layerId) for layers with activeLegendId', async () => {
    const onReady = jest.fn();

    render(
      <GeoVisProvider spec={buildSpec()}>
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    const clickRegistrations = mockCurrentMap.on.mock.calls.filter(
      (call: unknown[]) => {
        return call[0] === 'click' && call[1] === 'districts-fill';
      }
    );

    expect(clickRegistrations.length).toBeGreaterThanOrEqual(1);
  });

  // 4. useMapClick sets click state when a layer feature is clicked
  test('useMapClick sets click state when a layer feature is clicked', async () => {
    const onReady = jest.fn();

    const { result } = renderHook(
      () => {
        return useGeoVisClick();
      },
      {
        wrapper: ({ children }) => {
          return (
            <GeoVisProvider spec={buildSpec()}>
              <ExposeRuntime onReady={onReady} />
              {children}
            </GeoVisProvider>
          );
        },
      }
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    mockCurrentMap.getFeatureState.mockReturnValue({ value: 150 });

    triggerClick(mockCurrentMap, 'districts-fill', {
      point: { x: 100, y: 200 },
      lngLat: { lng: -46.6, lat: -23.5 },
      features: [{ id: 'sp', layer: { id: 'districts-fill' } }],
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current!.featureId).toBe('sp');
    expect(result.current!.lngLat).toEqual([-46.6, -23.5]);
    expect(result.current!.layerId).toBe('districts-fill');
  });

  // 5. useMapClick clears click state on Escape keydown
  test('useMapClick clears click state on Escape keydown', async () => {
    const onReady = jest.fn();

    const { result } = renderHook(
      () => {
        return useGeoVisClick();
      },
      {
        wrapper: ({ children }) => {
          return (
            <GeoVisProvider spec={buildSpec()}>
              <ExposeRuntime onReady={onReady} />
              {children}
            </GeoVisProvider>
          );
        },
      }
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    mockCurrentMap.getFeatureState.mockReturnValue({ value: 42 });

    triggerClick(mockCurrentMap, 'districts-fill', {
      point: { x: 10, y: 20 },
      lngLat: { lng: -46.6, lat: -23.5 },
      features: [{ id: 'sp', layer: { id: 'districts-fill' } }],
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });

  // 6. useMapClick clears click state when clicking outside all layers
  test('useMapClick clears click state when clicking outside all layers', async () => {
    const onReady = jest.fn();

    const { result } = renderHook(
      () => {
        return useGeoVisClick();
      },
      {
        wrapper: ({ children }) => {
          return (
            <GeoVisProvider spec={buildSpec()}>
              <ExposeRuntime onReady={onReady} />
              {children}
            </GeoVisProvider>
          );
        },
      }
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    mockCurrentMap.getFeatureState.mockReturnValue({ value: 42 });

    triggerClick(mockCurrentMap, 'districts-fill', {
      point: { x: 10, y: 20 },
      lngLat: { lng: -46.6, lat: -23.5 },
      features: [{ id: 'sp', layer: { id: 'districts-fill' } }],
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    const genericHandler = mockCurrentMap.__handlers.get('click:*') as
      | MapClickHandler
      | undefined;

    if (!genericHandler) {
      throw new Error('Generic click:* handler not registered on map');
    }

    act(() => {
      genericHandler({
        point: { x: 300, y: 300 },
        lngLat: { lng: 0, lat: 0 },
        features: [],
      });
    });

    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });
});
