/**
 * @jest-environment jsdom
 */

import { act, render, waitFor } from '@testing-library/react';
import * as React from 'react';
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

const baseLegends: VisualizationSpec['legends'] = [
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
];

const buildSpec = (layers: VisualizationSpec['layers']): VisualizationSpec => {
  return {
    id: 'spec-tooltip',
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    sources: [
      {
        id: 'districts',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers,
    legends: baseLegends,
  };
};

const triggerMove = (
  map: MockMap,
  layerId: string,
  point: { x: number; y: number },
  features?: ReadonlyArray<{ id?: string | number; layer?: { id: string } }>
) => {
  const handler = map.__handlers.get(`mousemove:${layerId}`) as
    MapMouseHandler | undefined;
  if (!handler) throw new Error(`mousemove handler missing for ${layerId}`);
  act(() => {
    handler({ point, features });
  });
};

const ExposeRuntime = ({ onReady }: { onReady: () => void }) => {
  const { runtime } = useGeoVis();
  React.useEffect(() => {
    if (runtime) onReady();
  }, [runtime, onReady]);
  return null;
};

describe('spec-driven hover tooltip (layer.hoverTooltip)', () => {
  beforeEach(() => {
    mockCurrentMap = buildMockMap();
  });

  test('does not render a tooltip when the layer has no hoverTooltip', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider
        spec={buildSpec([
          {
            id: 'districts-fill',
            sourceId: 'districts',
            geometry: 'polygon',
            activeLegendId: 'pop',
          },
        ])}
      >
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    mockCurrentMap.getFeatureState.mockReturnValue({ value: 10 });
    triggerMove(mockCurrentMap, 'districts-fill', { x: 1, y: 1 }, [
      { id: 1, layer: { id: 'districts-fill' } },
    ]);

    // Give React a tick; no tooltip must ever appear.
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  test('renders the default tooltip layout when hoverTooltip is an empty object', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider
        spec={buildSpec([
          {
            id: 'districts-fill',
            sourceId: 'districts',
            geometry: 'polygon',
            activeLegendId: 'pop',
            hoverTooltip: {},
          },
        ])}
      >
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    mockCurrentMap.getFeatureState.mockReturnValue({ value: 150 });
    triggerMove(mockCurrentMap, 'districts-fill', { x: 5, y: 5 }, [
      { id: 42, layer: { id: 'districts-fill' } },
    ]);

    await waitFor(() => {
      expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    });
    const tooltip = document.querySelector('[role="tooltip"]') as HTMLElement;
    expect(tooltip.textContent).toContain('Feature #42');
    expect(tooltip.textContent).toContain('150');
  });

  test('uses the config render and formatValue from the spec', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider
        spec={buildSpec([
          {
            id: 'districts-fill',
            sourceId: 'districts',
            geometry: 'polygon',
            activeLegendId: 'pop',
            hoverTooltip: {
              render: (info) => {
                return <span>spec-{String(info.featureId)}</span>;
              },
            },
          },
        ])}
      >
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    mockCurrentMap.getFeatureState.mockReturnValue({ value: 1 });
    triggerMove(mockCurrentMap, 'districts-fill', { x: 0, y: 0 }, [
      { id: 'abc', layer: { id: 'districts-fill' } },
    ]);

    await waitFor(() => {
      const tooltip = document.querySelector('[role="tooltip"]');
      expect(tooltip?.textContent).toBe('spec-abc');
    });
  });

  test('selects the hovered layer config when multiple layers declare hoverTooltip', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider
        spec={buildSpec([
          {
            id: 'districts-fill',
            sourceId: 'districts',
            geometry: 'polygon',
            activeLegendId: 'pop',
            hoverTooltip: {
              render: () => {
                return <span>district-tooltip</span>;
              },
            },
          },
          {
            id: 'subprefeituras-fill',
            sourceId: 'districts',
            geometry: 'polygon',
            activeLegendId: 'pop',
            hoverTooltip: {
              render: () => {
                return <span>subpref-tooltip</span>;
              },
            },
          },
        ])}
      >
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    mockCurrentMap.getFeatureState.mockReturnValue({ value: 1 });
    triggerMove(mockCurrentMap, 'subprefeituras-fill', { x: 0, y: 0 }, [
      { id: 9, layer: { id: 'subprefeituras-fill' } },
    ]);

    await waitFor(() => {
      const tooltip = document.querySelector('[role="tooltip"]');
      expect(tooltip?.textContent).toBe('subpref-tooltip');
    });
  });
});
