/**
 * @jest-environment jsdom
 */

import { act, render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { GeoVisProvider, useGeoVis } from 'src/react/GeoVisProvider';
import type { VisualizationSpec } from 'src/spec/types';
import { validateSpec } from 'src/spec/validateSpec';

// ---------------------------------------------------------------------------
// Mock plumbing — mirrors GeoVisClickContext.test.tsx
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
    queryRenderedFeatures: jest.fn(() => {
      return [];
    }),
    getFeatureState: jest.fn(() => {
      return {};
    }),
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
    project: jest.fn(() => {
      return { x: 100, y: 200 };
    }),
    __handlers: handlers,
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

/**
 * A point layer whose ONLY interaction hook is a spec-driven `click.onSelect`
 * (no `activeLegendId`), proving that declaring `click` alone opts the layer
 * into click tracking.
 */
const buildSpec = (onSelect: (info: unknown) => void): VisualizationSpec => {
  return {
    id: 'click-spec',
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    sources: [
      {
        id: 'kitchens',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [
      {
        id: 'kitchens-pts',
        sourceId: 'kitchens',
        geometry: 'point',
        click: { onSelect },
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
  if (!handler) {
    throw new Error(`click handler missing for key click:${layerId}`);
  }
  act(() => {
    handler(event);
  });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('spec-driven layer.click.onSelect', () => {
  beforeEach(() => {
    mockCurrentMap = buildMockMap();
  });

  test('registers a click handler for a layer whose only hook is `click`', async () => {
    const onReady = jest.fn();

    render(
      <GeoVisProvider spec={buildSpec(jest.fn())}>
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );

    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    const clickRegistrations = mockCurrentMap.on.mock.calls.filter(
      (call: unknown[]) => {
        return call[0] === 'click' && call[1] === 'kitchens-pts';
      }
    );
    expect(clickRegistrations.length).toBeGreaterThanOrEqual(1);
  });

  test('invokes onSelect with the clicked feature, no useGeoVisClick() consumer in the tree', async () => {
    const onReady = jest.fn();
    const onSelect = jest.fn();

    render(
      <GeoVisProvider spec={buildSpec(onSelect)}>
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );

    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    triggerClick(mockCurrentMap, 'kitchens-pts', {
      point: { x: 100, y: 200 },
      lngLat: { lng: -46.6, lat: -23.5 },
      features: [{ id: 'CS016282', layer: { id: 'kitchens-pts' } }],
    });

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalled();
    });

    const info = onSelect.mock.calls.at(-1)?.[0];
    expect(info).not.toBeNull();
    expect(info.featureId).toBe('CS016282');
    expect(info.layerId).toBe('kitchens-pts');
    expect(info.lngLat).toEqual([-46.6, -23.5]);
  });

  test('invokes onSelect(null) when the selection is cleared with Escape', async () => {
    const onReady = jest.fn();
    const onSelect = jest.fn();

    render(
      <GeoVisProvider spec={buildSpec(onSelect)}>
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );

    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    triggerClick(mockCurrentMap, 'kitchens-pts', {
      point: { x: 100, y: 200 },
      lngLat: { lng: -46.6, lat: -23.5 },
      features: [{ id: 'CS016282', layer: { id: 'kitchens-pts' } }],
    });

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ featureId: 'CS016282' })
      );
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    await waitFor(() => {
      expect(onSelect).toHaveBeenLastCalledWith(null);
    });
  });
});

describe('validateSpec accepts layer.click', () => {
  test('a spec declaring layer.click is valid', () => {
    const result = validateSpec({
      engine: 'maplibre',
      view: { center: [0, 0], zoom: 1 },
      sources: [
        {
          id: 'kitchens',
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        },
      ],
      layers: [
        {
          id: 'kitchens-pts',
          sourceId: 'kitchens',
          geometry: 'point',
          click: {},
        },
      ],
    });

    expect(result.status).toBe('resolved');
  });
});
