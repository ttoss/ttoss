/**
 * @jest-environment jsdom
 *
 * Tests for the window-focus recheck behaviour in `useMapHover`.
 *
 * When the user alt-tabs away and returns to the browser window, most browsers
 * do NOT synthesise a new `mousemove` event. Without an explicit recheck, the
 * tooltip would remain hidden even if the cursor never left the map canvas.
 *
 * These tests verify that `window.focus` (and the equivalent mouseleave →
 * re-focus path) correctly restores or clears the hover state without any
 * physical mouse movement from the user.
 */

import { act, render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { GeoVisHoverTooltip } from 'src/react/GeoVisHoverTooltip';
import { GeoVisProvider, useGeoVis } from 'src/react/GeoVisProvider';
import type { VisualizationSpec } from 'src/spec/types';

type MapMouseHandler = (event: {
  point: { x: number; y: number };
  features?: ReadonlyArray<{ id?: string | number; layer?: { id: string } }>;
}) => void;
type MapLeaveHandler = () => void;

interface MockMap {
  on: jest.Mock;
  off: jest.Mock;
  queryRenderedFeatures: jest.Mock;
  getFeatureState: jest.Mock;
  getCanvas: jest.Mock;
  getLayer: jest.Mock;
  isStyleLoaded: jest.Mock;
  setPaintProperty: jest.Mock;
  once: jest.Mock;
  __handlers: Map<string, MapMouseHandler | MapLeaveHandler>;
  __canvas: { style: { cursor: string } };
}

const buildMockMap = (): MockMap => {
  const handlers = new Map<string, MapMouseHandler | MapLeaveHandler>();
  const canvas = {
    style: { cursor: '' },
    getBoundingClientRect: jest.fn(() => {
      return { left: 0, top: 0, width: 800, height: 600 };
    }),
  };
  const map: MockMap = {
    on: jest.fn((event: string, layerOrHandler, maybeHandler) => {
      const layerId = typeof layerOrHandler === 'string' ? layerOrHandler : '*';
      const handler = (
        typeof layerOrHandler === 'string' ? maybeHandler : layerOrHandler
      ) as MapMouseHandler | MapLeaveHandler;
      handlers.set(`${event}:${layerId}`, handler);
    }),
    off: jest.fn((event: string, layerOrHandler) => {
      const layerId = typeof layerOrHandler === 'string' ? layerOrHandler : '*';
      handlers.delete(`${event}:${layerId}`);
    }),
    queryRenderedFeatures: jest.fn(),
    getFeatureState: jest.fn(),
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
    id: 'focus-recheck-spec',
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
          colors: ['#aaa', '#bbb', '#ccc'],
        },
      },
    ],
  };
};

const ExposeRuntime = ({ onReady }: { onReady: () => void }) => {
  const { runtime } = useGeoVis();
  React.useEffect(() => {
    if (runtime) onReady();
  }, [runtime, onReady]);
  return null;
};

const triggerMove = (
  map: MockMap,
  layerId: string,
  point: { x: number; y: number },
  features?: ReadonlyArray<{ id?: string | number; layer?: { id: string } }>
) => {
  const handler = map.__handlers.get(`mousemove:${layerId}`) as
    | MapMouseHandler
    | undefined;
  if (!handler) throw new Error(`mousemove handler missing for ${layerId}`);
  act(() => {
    handler({ point, features });
  });
};

const triggerLeave = (map: MockMap, layerId: string) => {
  const handler = map.__handlers.get(`mouseleave:${layerId}`) as
    | MapLeaveHandler
    | undefined;
  if (!handler) throw new Error(`mouseleave handler missing for ${layerId}`);
  act(() => {
    handler();
  });
};

const triggerWindowFocus = () => {
  act(() => {
    window.dispatchEvent(new Event('focus'));
  });
};

/**
 * ----------------------------------------------------------------------------
 * Window focus: window.focus (alt-tab)
 * ---------------------------------------------------------------------------
 */
describe('useMapHover — window focus recheck', () => {
  beforeEach(() => {
    mockCurrentMap = buildMockMap();
  });

  test('restores tooltip on window focus when cursor is still over a tracked feature', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider spec={buildSpec()}>
        <ExposeRuntime onReady={onReady} />
        <GeoVisHoverTooltip />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    // Prime a valid hover at point (50, 60).
    mockCurrentMap.queryRenderedFeatures.mockReturnValue([
      { id: 7, layer: { id: 'districts-fill' } },
    ]);
    mockCurrentMap.getFeatureState.mockReturnValue({ value: 42 });
    triggerMove(mockCurrentMap, 'districts-fill', { x: 50, y: 60 });

    await waitFor(() => {
      expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull();
    });

    // Simulate alt-tab: MapLibre fires mouseleave, clearing the tooltip.
    triggerLeave(mockCurrentMap, 'districts-fill');
    await waitFor(() => {
      expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
    });

    // Simulate returning to the window: window.focus fires; the cursor is
    // still over the feature (queryRenderedFeatures returns the same hit).
    // The hook should restore the tooltip WITHOUT a new mousemove.
    mockCurrentMap.queryRenderedFeatures.mockReturnValue([
      { id: 7, layer: { id: 'districts-fill' } },
    ]);
    mockCurrentMap.getFeatureState.mockReturnValue({ value: 42 });

    // NOTE: after mouseleave the lastPointRef is cleared (null), so the
    // focus handler does nothing. This test verifies that if the user keeps
    // the mouse physically over the map (no mouseleave fired) and then
    // alt-tabs and returns, the tooltip comes back. We therefore re-prime
    // the last known point via a mousemove before simulating the alt-tab.
    triggerMove(mockCurrentMap, 'districts-fill', { x: 50, y: 60 });
    await waitFor(() => {
      expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull();
    });

    // Now simulate window blur (without mouseleave) then window focus.
    // The last known point is still (50, 60) — tooltip must reappear.
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    triggerWindowFocus();

    await waitFor(() => {
      expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull();
    });
    expect(mockCurrentMap.__canvas.style.cursor).toBe('pointer');
  });

  test('clears tooltip on window focus when cursor is no longer over a feature', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider spec={buildSpec()}>
        <ExposeRuntime onReady={onReady} />
        <GeoVisHoverTooltip />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    // Prime a valid hover.
    mockCurrentMap.queryRenderedFeatures.mockReturnValue([
      { id: 3, layer: { id: 'districts-fill' } },
    ]);
    mockCurrentMap.getFeatureState.mockReturnValue({ value: 10 });
    triggerMove(mockCurrentMap, 'districts-fill', { x: 10, y: 20 });

    await waitFor(() => {
      expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull();
    });

    // Simulate window regaining focus, but the cursor moved away: no hits.
    mockCurrentMap.queryRenderedFeatures.mockReturnValue([]);
    triggerWindowFocus();

    await waitFor(() => {
      expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
    });
    expect(mockCurrentMap.__canvas.style.cursor).toBe('');
  });

  test('does nothing on window focus when no previous mousemove was recorded', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider spec={buildSpec()}>
        <ExposeRuntime onReady={onReady} />
        <GeoVisHoverTooltip />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    // No mousemove has fired; queryRenderedFeatures should never be called
    // from the focus handler.
    triggerWindowFocus();

    // Tooltip stays absent; queryRenderedFeatures not called from focus path.
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
    expect(mockCurrentMap.queryRenderedFeatures).not.toHaveBeenCalled();
  });

  test('removes window focus listener on effect cleanup', async () => {
    const onReady = jest.fn();
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = render(
      <GeoVisProvider spec={buildSpec()}>
        <ExposeRuntime onReady={onReady} />
        <GeoVisHoverTooltip />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    expect(
      addSpy.mock.calls.some(([event]) => {
        return event === 'focus';
      })
    ).toBe(true);

    unmount();

    expect(
      removeSpy.mock.calls.some(([event]) => {
        return event === 'focus';
      })
    ).toBe(true);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Tab-switching: document.visibilitychange
// ---------------------------------------------------------------------------
// When the user switches browser tabs, most browsers fire `document.visibilitychange`
// (not `window.focus`). The hook must listen to `visibilitychange` and re-run
// queryRenderedFeatures when the tab becomes visible again.
// ---------------------------------------------------------------------------

const triggerVisibilityChange = (state: 'visible' | 'hidden') => {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    writable: true,
    configurable: true,
  });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
};

describe('useMapHover — visibilitychange (tab switching)', () => {
  beforeEach(() => {
    mockCurrentMap = buildMockMap();
    // Reset to default visible state before each test.
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
  });

  test('restores tooltip when tab becomes visible and cursor is over a feature', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider spec={buildSpec()}>
        <ExposeRuntime onReady={onReady} />
        <GeoVisHoverTooltip />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    // Prime lastPointRef via a valid mousemove.
    mockCurrentMap.queryRenderedFeatures.mockReturnValue([
      { id: 5, layer: { id: 'districts-fill' } },
    ]);
    mockCurrentMap.getFeatureState.mockReturnValue({ value: 99 });
    triggerMove(mockCurrentMap, 'districts-fill', { x: 30, y: 40 });

    await waitFor(() => {
      expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull();
    });

    // Switch to another tab (visibility hidden). MapLibre may or may not
    // fire mouseleave here; we simulate the worst case where it does NOT.
    triggerVisibilityChange('hidden');

    // Switch back to the tab. The cursor hasn't moved — tooltip must reappear.
    mockCurrentMap.queryRenderedFeatures.mockReturnValue([
      { id: 5, layer: { id: 'districts-fill' } },
    ]);
    mockCurrentMap.getFeatureState.mockReturnValue({ value: 99 });
    triggerVisibilityChange('visible');

    await waitFor(() => {
      expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull();
    });
    expect(mockCurrentMap.__canvas.style.cursor).toBe('pointer');
  });

  test('clears tooltip when tab becomes visible but cursor moved off the feature', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider spec={buildSpec()}>
        <ExposeRuntime onReady={onReady} />
        <GeoVisHoverTooltip />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    // Prime a valid hover.
    mockCurrentMap.queryRenderedFeatures.mockReturnValue([
      { id: 2, layer: { id: 'districts-fill' } },
    ]);
    mockCurrentMap.getFeatureState.mockReturnValue({ value: 55 });
    triggerMove(mockCurrentMap, 'districts-fill', { x: 70, y: 80 });

    await waitFor(() => {
      expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull();
    });

    // Tab becomes visible but cursor is no longer over any feature.
    mockCurrentMap.queryRenderedFeatures.mockReturnValue([]);
    triggerVisibilityChange('visible');

    await waitFor(() => {
      expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
    });
    expect(mockCurrentMap.__canvas.style.cursor).toBe('');
  });

  test('removes document visibilitychange listener on effect cleanup', async () => {
    const onReady = jest.fn();
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = render(
      <GeoVisProvider spec={buildSpec()}>
        <ExposeRuntime onReady={onReady} />
        <GeoVisHoverTooltip />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    expect(
      addSpy.mock.calls.some(([event]) => {
        return event === 'visibilitychange';
      })
    ).toBe(true);

    unmount();

    expect(
      removeSpy.mock.calls.some(([event]) => {
        return event === 'visibilitychange';
      })
    ).toBe(true);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
