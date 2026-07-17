/**
 * @jest-environment jsdom
 */

import { act, render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { GeoVisProvider, useGeoVis } from 'src/react/GeoVisProvider';
import type { VisualizationSpec } from 'src/spec/types';
import { GeoVisHoverTooltip } from 'src/ui/GeoVisHoverTooltip';

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
  __canvas: { style: { cursor: string }; getBoundingClientRect: () => DOMRect };
}

const buildMockMap = (): MockMap => {
  const handlers = new Map<string, MapMouseHandler | MapLeaveHandler>();
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
    id: 'hover-spec',
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

const ExposeRuntime = ({ onReady }: { onReady: () => void }) => {
  const { runtime } = useGeoVis();
  React.useEffect(() => {
    if (runtime) onReady();
  }, [runtime, onReady]);
  return null;
};

describe('GeoVisHoverTooltip', () => {
  beforeEach(() => {
    mockCurrentMap = buildMockMap();
  });

  test('renders nothing when no feature is hovered', async () => {
    await act(async () => {
      render(
        <GeoVisProvider spec={buildSpec()}>
          <GeoVisHoverTooltip />
        </GeoVisProvider>
      );
    });

    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  test('renders tooltip with formatted value when a feature is hovered', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider spec={buildSpec()}>
        <ExposeRuntime onReady={onReady} />
        <GeoVisHoverTooltip
          formatValue={(v) => {
            return `${v} people`;
          }}
        />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    mockCurrentMap.queryRenderedFeatures.mockReturnValue([
      { id: 42, layer: { id: 'districts-fill' } },
    ]);
    mockCurrentMap.getFeatureState.mockReturnValue({ value: 150 });

    triggerMove(mockCurrentMap, 'districts-fill', { x: 100, y: 50 });

    await waitFor(() => {
      expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    });
    const tooltip = document.querySelector('[role="tooltip"]') as HTMLElement;
    expect(tooltip.textContent).toContain('Feature #42');
    expect(tooltip.textContent).toContain('150 people');
    expect(mockCurrentMap.__canvas.style.cursor).toBe('');
  });

  test('hides tooltip on mouseleave and resets cursor', async () => {
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

    mockCurrentMap.queryRenderedFeatures.mockReturnValue([
      { id: 7, layer: { id: 'districts-fill' } },
    ]);
    mockCurrentMap.getFeatureState.mockReturnValue({ value: 50 });
    triggerMove(mockCurrentMap, 'districts-fill', { x: 10, y: 10 });
    await waitFor(() => {
      expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    });

    triggerLeave(mockCurrentMap, 'districts-fill');

    await waitFor(() => {
      expect(document.querySelector('[role="tooltip"]')).toBeNull();
    });
    expect(mockCurrentMap.__canvas.style.cursor).toBe('');
  });

  test('uses custom render prop when provided', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider spec={buildSpec()}>
        <ExposeRuntime onReady={onReady} />
        <GeoVisHoverTooltip
          render={(info) => {
            return <span>custom-{String(info.featureId)}</span>;
          }}
        />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    mockCurrentMap.queryRenderedFeatures.mockReturnValue([
      { id: 'abc', layer: { id: 'districts-fill' } },
    ]);
    mockCurrentMap.getFeatureState.mockReturnValue({ value: 99 });
    triggerMove(mockCurrentMap, 'districts-fill', { x: 0, y: 0 });

    await waitFor(() => {
      const tooltip = document.querySelector('[role="tooltip"]');
      expect(tooltip?.textContent).toBe('custom-abc');
    });
  });

  test('shows emptyValueLabel when feature-state.value is missing', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider spec={buildSpec()}>
        <ExposeRuntime onReady={onReady} />
        <GeoVisHoverTooltip emptyValueLabel="—" />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    mockCurrentMap.queryRenderedFeatures.mockReturnValue([
      { id: 1, layer: { id: 'districts-fill' } },
    ]);
    mockCurrentMap.getFeatureState.mockReturnValue({});
    triggerMove(mockCurrentMap, 'districts-fill', { x: 0, y: 0 });

    await waitFor(() => {
      const tooltip = document.querySelector('[role="tooltip"]');
      expect(tooltip?.textContent).toContain('—');
    });
  });

  test('does not attach handlers when no polygon layer has activeLegendId', async () => {
    const onReady = jest.fn();
    const specWithoutLegend: VisualizationSpec = {
      ...buildSpec(),
      layers: [
        {
          id: 'districts-fill',
          sourceId: 'districts',
          geometry: 'polygon',
        },
      ],
    };

    render(
      <GeoVisProvider spec={specWithoutLegend}>
        <ExposeRuntime onReady={onReady} />
        <GeoVisHoverTooltip />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    expect(mockCurrentMap.on).not.toHaveBeenCalled();
  });

  test('uses delegated event.features and skips queryRenderedFeatures', async () => {
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

    mockCurrentMap.getFeatureState.mockReturnValue({ value: 77 });
    triggerMove(mockCurrentMap, 'districts-fill', { x: 5, y: 5 }, [
      { id: 'd1', layer: { id: 'districts-fill' } },
    ]);

    await waitFor(() => {
      expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    });
    // Adapter should never fall back to queryRenderedFeatures when MapLibre
    // already delivers the hit feature in `event.features`.
    expect(mockCurrentMap.queryRenderedFeatures).not.toHaveBeenCalled();
    const tooltip = document.querySelector('[role="tooltip"]') as HTMLElement;
    expect(tooltip.textContent).toContain('Feature #d1');
  });

  test('clears cursor and tooltip when hovered feature has no source mapping', async () => {
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

    // Prime a valid hover so cursor=pointer and tooltip is visible.
    mockCurrentMap.queryRenderedFeatures.mockReturnValue([
      { id: 1, layer: { id: 'districts-fill' } },
    ]);
    mockCurrentMap.getFeatureState.mockReturnValue({ value: 1 });
    triggerMove(mockCurrentMap, 'districts-fill', { x: 1, y: 1 });
    await waitFor(() => {
      expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    });
    expect(mockCurrentMap.__canvas.style.cursor).toBe('');

    // Now hit a feature whose `layer.id` is unknown to `sourceByLayerId`.
    triggerMove(mockCurrentMap, 'districts-fill', { x: 2, y: 2 }, [
      { id: 2, layer: { id: 'ghost-layer' } },
    ]);

    await waitFor(() => {
      expect(document.querySelector('[role="tooltip"]')).toBeNull();
    });
    expect(mockCurrentMap.__canvas.style.cursor).toBe('');
  });
});
