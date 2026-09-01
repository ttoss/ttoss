/**
 * @jest-environment jsdom
 *
 * Happy-path tests for `useClickAnchor` — the spec-driven DOM-marker hook
 * that `ClickProvider` calls automatically when a `VisualizationLayer` has a
 * `clickAnchor` property set.
 *
 * `maplibre-gl` is mocked so `new maplibregl.Marker()` never touches WebGL.
 * `MapLibreAdapter` is mocked to supply a controllable map stub.
 */

import { act, render, waitFor } from '@testing-library/react';
import maplibregl from 'maplibre-gl';
import * as React from 'react';
import { GeoVisProvider, useGeoVis } from 'src/react/GeoVisProvider';
import type { VisualizationSpec } from 'src/spec/types';

// ---------------------------------------------------------------------------
// Mock: maplibre-gl Marker
//
// The factory must be self-contained (no outer-scope `const` references) because
// babel-jest hoists `jest.mock()` calls above all declarations, which would put
// any outer `const` in the TDZ when the factory first runs.
// ---------------------------------------------------------------------------

jest.mock('maplibre-gl', () => {
  const Marker = jest.fn(() => {
    // Build a realistic marker element: a wrapper <div> whose first child is the
    // pin <svg> (with a white-fill group, as MapLibre's default pin has). Global
    // flags let individual tests drop the svg or the white group to exercise the
    // hook's null branches. Self-contained (no outer refs) — babel hoists the mock.
    const doc = globalThis.document;
    const el = doc.createElement('div');
    if (!(globalThis as Record<string, unknown>).__geovisMarkerNoSvg) {
      const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
      if (!(globalThis as Record<string, unknown>).__geovisMarkerNoWhiteGroup) {
        const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('fill', '#FFFFFF');
        svg.appendChild(g);
      }
      el.appendChild(svg);
    }
    return {
      setLngLat: jest.fn().mockReturnThis(),
      addTo: jest.fn().mockReturnThis(),
      remove: jest.fn(),
      getElement: jest.fn().mockReturnValue(el),
    };
  });
  return { __esModule: true, default: { Marker } };
});

/** Returns the mocked `Marker` constructor. Import is resolved after the mock. */
const getMockMarkerCtor = () => {
  return jest.mocked(maplibregl.Marker);
};

/** Returns the last Marker instance created by the mocked constructor. */
const getLastMarkerInstance = () => {
  const ctor = getMockMarkerCtor();
  const result = ctor.mock.results[ctor.mock.results.length - 1];
  return result?.value as {
    setLngLat: jest.Mock;
    addTo: jest.Mock;
    remove: jest.Mock;
    getElement: jest.Mock;
  };
};

/** Returns the last marker's pin `<svg>` element (its wrapper's first child). */
const getLastMarkerSvg = (): SVGElement | null => {
  const el = getLastMarkerInstance().getElement() as HTMLElement;
  return el.firstElementChild as SVGElement | null;
};

// ---------------------------------------------------------------------------
// Mock: MapLibreAdapter
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
  getCanvas: jest.Mock;
  getCanvasContainer: jest.Mock;
  getLayer: jest.Mock;
  getFeatureState: jest.Mock;
  isStyleLoaded: jest.Mock;
  setPaintProperty: jest.Mock;
  setFeatureState: jest.Mock;
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
    getCanvasContainer: jest.fn(() => {
      return { addEventListener: jest.fn(), removeEventListener: jest.fn() };
    }),
    getCanvas: jest.fn(() => {
      return canvas;
    }),
    getLayer: jest.fn(() => {
      return undefined;
    }),
    getFeatureState: jest.fn(() => {
      return {};
    }),
    isStyleLoaded: jest.fn(() => {
      return true;
    }),
    setPaintProperty: jest.fn(),
    setFeatureState: jest.fn(),
    once: jest.fn(),
    project: jest.fn(() => {
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

// ---------------------------------------------------------------------------
// Spec builder and helpers
// ---------------------------------------------------------------------------

type ClickAnchor = NonNullable<
  VisualizationSpec['layers'][number]['clickAnchor']
>;

/** Builds a minimal spec with one polygon layer. Pass `clickAnchor` to enable the feature. */
const buildSpec = (clickAnchor?: ClickAnchor): VisualizationSpec => {
  return {
    id: 'click-anchor-spec',
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
        ...(clickAnchor ? { clickAnchor } : {}),
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

/** Exposes runtime readiness via a callback — mirrors the helper used in other test files. */
const ExposeRuntime = ({ onReady }: { onReady: () => void }) => {
  const { runtime } = useGeoVis();
  React.useEffect(() => {
    if (runtime) onReady();
  }, [runtime, onReady]);
  return null;
};

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
    MapClickHandler | undefined;
  if (!handler) throw new Error(`click handler missing for click:${layerId}`);
  act(() => {
    handler(event);
  });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useClickAnchor', () => {
  beforeEach(() => {
    mockCurrentMap = buildMockMap();
    getMockMarkerCtor().mockClear();
    delete (globalThis as Record<string, unknown>).__geovisMarkerNoSvg;
    delete (globalThis as Record<string, unknown>).__geovisMarkerNoWhiteGroup;
    document.getElementById('geovis-pin-drop-keyframes')?.remove();
  });

  // 1. clickAnchor.color → DOM Marker created at click.lngLat
  test('clickAnchor.color: creates a DOM Marker at the clicked lngLat and adds it to the map', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider spec={buildSpec({ color: '#2171b5' })}>
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    triggerClick(mockCurrentMap, 'districts-fill', {
      point: { x: 50, y: 50 },
      lngLat: { lng: -46.6, lat: -23.5 },
      features: [{ id: 1, layer: { id: 'districts-fill' } }],
    });

    await waitFor(() => {
      expect(getMockMarkerCtor()).toHaveBeenCalledTimes(1);
    });
    // Marker must be placed at the exact click coordinates.
    expect(getLastMarkerInstance().setLngLat).toHaveBeenCalledWith([
      -46.6, -23.5,
    ]);
    // Marker must be attached to the live map instance.
    expect(getLastMarkerInstance().addTo).toHaveBeenCalledWith(mockCurrentMap);
  });

  // 2. No clickAnchor → Marker is never created
  test('no clickAnchor: Marker constructor is never called even after a feature click', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider spec={buildSpec()}>
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    triggerClick(mockCurrentMap, 'districts-fill', {
      point: { x: 10, y: 10 },
      lngLat: { lng: -46.6, lat: -23.5 },
      features: [{ id: 2, layer: { id: 'districts-fill' } }],
    });

    // Allow any pending microtasks to settle before asserting.
    await act(async () => {});
    expect(getMockMarkerCtor()).not.toHaveBeenCalled();
  });

  // 3. clickAnchor.iconImage only (no element) → symbol-layer path, no DOM Marker
  test('clickAnchor.iconImage without element: no DOM Marker — symbol layer handled by syncSourcesAndLayers', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider spec={buildSpec({ iconImage: 'marker-pin' })}>
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    triggerClick(mockCurrentMap, 'districts-fill', {
      point: { x: 10, y: 10 },
      lngLat: { lng: -46.6, lat: -23.5 },
      features: [{ id: 3, layer: { id: 'districts-fill' } }],
    });

    await act(async () => {});
    expect(getMockMarkerCtor()).not.toHaveBeenCalled();
  });

  // 4. clickAnchor.color → drop keyframes injected once, inner fill darkened, pin animated
  test('clickAnchor.color: injects the drop keyframes, darkens the inner fill, and animates the pin', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider spec={buildSpec({ color: '#2171b5' })}>
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    triggerClick(mockCurrentMap, 'districts-fill', {
      point: { x: 50, y: 50 },
      lngLat: { lng: -46.6, lat: -23.5 },
      features: [{ id: 1, layer: { id: 'districts-fill' } }],
    });
    await waitFor(() => {
      expect(getMockMarkerCtor()).toHaveBeenCalledTimes(1);
    });

    // Keyframes are injected once into <head>.
    expect(document.getElementById('geovis-pin-drop-keyframes')).not.toBeNull();

    const svg = getLastMarkerSvg();
    // Animation is applied to the pin svg.
    expect((svg as unknown as HTMLElement).style.animation).toContain(
      'geovis-pin-drop'
    );
    // The white inner group is recolored to a 30%-darkened shade of #2171b5.
    expect(svg?.querySelector('g')?.getAttribute('fill')).toBe('#174f7f');

    // A second click reuses the already-injected <style> (no duplicate).
    triggerClick(mockCurrentMap, 'districts-fill', {
      point: { x: 60, y: 60 },
      lngLat: { lng: -45, lat: -22 },
      features: [{ id: 2, layer: { id: 'districts-fill' } }],
    });
    await waitFor(() => {
      expect(getMockMarkerCtor()).toHaveBeenCalledTimes(2);
    });
    expect(
      document.querySelectorAll('#geovis-pin-drop-keyframes')
    ).toHaveLength(1);
  });

  // 5. default pin (no color) → animated but inner fill left untouched
  test('default pin without color: animates the pin and leaves the inner fill untouched', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider spec={buildSpec({})}>
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    triggerClick(mockCurrentMap, 'districts-fill', {
      point: { x: 50, y: 50 },
      lngLat: { lng: -46.6, lat: -23.5 },
      features: [{ id: 1, layer: { id: 'districts-fill' } }],
    });
    await waitFor(() => {
      expect(getMockMarkerCtor()).toHaveBeenCalledTimes(1);
    });

    const svg = getLastMarkerSvg();
    expect((svg as unknown as HTMLElement).style.animation).toContain(
      'geovis-pin-drop'
    );
    expect(svg?.querySelector('g')?.getAttribute('fill')).toBe('#FFFFFF');
  });

  // 6. malformed color → darkenHex returns it unchanged
  test('clickAnchor.color malformed: applies the hex unchanged when it is not #rrggbb', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider spec={buildSpec({ color: '#abc' })}>
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    triggerClick(mockCurrentMap, 'districts-fill', {
      point: { x: 50, y: 50 },
      lngLat: { lng: -46.6, lat: -23.5 },
      features: [{ id: 1, layer: { id: 'districts-fill' } }],
    });
    await waitFor(() => {
      expect(getMockMarkerCtor()).toHaveBeenCalledTimes(1);
    });

    expect(getLastMarkerSvg()?.querySelector('g')?.getAttribute('fill')).toBe(
      '#abc'
    );
  });

  // 7. svg present but no white group → recolor is skipped, pin still animates
  test('clickAnchor.color with no white fill group: skips the recolor and still animates', async () => {
    (globalThis as Record<string, unknown>).__geovisMarkerNoWhiteGroup = true;
    const onReady = jest.fn();
    render(
      <GeoVisProvider spec={buildSpec({ color: '#2171b5' })}>
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    triggerClick(mockCurrentMap, 'districts-fill', {
      point: { x: 50, y: 50 },
      lngLat: { lng: -46.6, lat: -23.5 },
      features: [{ id: 1, layer: { id: 'districts-fill' } }],
    });
    await waitFor(() => {
      expect(getMockMarkerCtor()).toHaveBeenCalledTimes(1);
    });

    const svg = getLastMarkerSvg();
    expect(svg?.querySelector('g')).toBeNull();
    expect((svg as unknown as HTMLElement).style.animation).toContain(
      'geovis-pin-drop'
    );
  });

  // 8. marker whose element has no svg child → animation block is a no-op, no crash
  test('marker without an svg child: injects keyframes without touching a pin element', async () => {
    (globalThis as Record<string, unknown>).__geovisMarkerNoSvg = true;
    const onReady = jest.fn();
    render(
      <GeoVisProvider spec={buildSpec({ color: '#2171b5' })}>
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    triggerClick(mockCurrentMap, 'districts-fill', {
      point: { x: 50, y: 50 },
      lngLat: { lng: -46.6, lat: -23.5 },
      features: [{ id: 1, layer: { id: 'districts-fill' } }],
    });
    await waitFor(() => {
      expect(getMockMarkerCtor()).toHaveBeenCalledTimes(1);
    });

    expect(getLastMarkerSvg()).toBeNull();
    expect(document.getElementById('geovis-pin-drop-keyframes')).not.toBeNull();
  });
});
