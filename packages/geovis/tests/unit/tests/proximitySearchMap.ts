type Handler = (event?: unknown) => void;

/** The map the fake adapter hands out, with what the test drives it by. */
export type MockMap = ReturnType<typeof buildMap>;

/** Metres in one degree of latitude. */
export const METRES_PER_DEGREE = 111_195;

export const ORIGIN: [number, number] = [-46.63, -23.55];

/** The sources and layers added to the map, as the searched area adds its own. */
const buildStyle = () => {
  const sources = new Map<string, { spec: unknown; setData: jest.Mock }>();
  const layers = new Map<string, { id: string; type: string }>([
    // The basemap's labels, which the area goes beneath.
    ['labels', { id: 'labels', type: 'symbol' }],
  ]);
  return {
    sources,
    layers,
    addSource: jest.fn((id: string, spec: unknown) => {
      sources.set(id, { spec, setData: jest.fn() });
    }),
    getSource: (id: string) => {
      return sources.get(id);
    },
    removeSource: jest.fn((id: string) => {
      sources.delete(id);
    }),
    addLayer: jest.fn((layer: { id: string; type: string }) => {
      layers.set(layer.id, layer);
    }),
    removeLayer: jest.fn((id: string) => {
      layers.delete(id);
    }),
    getStyle: () => {
      return { layers: [...layers.values()] };
    },
  };
};

/** The map's events: what the search listens to, and `fire` to raise one. */
const buildEvents = () => {
  const handlers = new Map<string, Handler[]>();
  return {
    on: jest.fn((event: string, layerOrHandler: unknown, maybe?: unknown) => {
      const handler = (
        typeof layerOrHandler === 'function' ? layerOrHandler : maybe
      ) as Handler;
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
    }),
    off: jest.fn((event: string, layerOrHandler: unknown, maybe?: unknown) => {
      const handler =
        typeof layerOrHandler === 'function' ? layerOrHandler : maybe;
      handlers.set(
        event,
        (handlers.get(event) ?? []).filter((known) => {
          return known !== handler;
        })
      );
    }),
    fire: (event: string, payload?: unknown) => {
      for (const handler of handlers.get(event) ?? []) handler(payload);
    },
  };
};

/**
 * The MapLibre map the proximity search's tests hand the search: it records
 * the handlers, sources and layers the search adds, and answers the queries
 * they drive it by.
 */
export const buildMap = ({ width }: { width: number }) => {
  const style = buildStyle();
  const container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth', { value: width });
  Object.defineProperty(container, 'clientHeight', { value: 500 });
  document.body.append(container);
  const canvas = {
    style: { cursor: '' },
    getBoundingClientRect: () => {
      return { left: 0, top: 0 } as DOMRect;
    },
  };
  const map = {
    container,
    ...style,
    ...buildEvents(),
    feature: {
      id: 7 as number | undefined,
      layer: { id: 'pins' },
      geometry: { type: 'Point', coordinates: ORIGIN } as {
        type: string;
        coordinates?: unknown;
      },
    } as unknown,
    hasLayer: true,
    getContainer: () => {
      return container;
    },
    getCanvas: () => {
      return canvas;
    },
    getCanvasContainer: () => {
      return { addEventListener: jest.fn(), removeEventListener: jest.fn() };
    },
    getLayer: (id: string) => {
      if (style.layers.has(id)) return style.layers.get(id);
      return map.hasLayer && (id === 'pins' || id === 'areas')
        ? { id }
        : undefined;
    },
    queryRenderedFeatures: (
      _point: unknown,
      options?: { layers?: string[] }
    ) => {
      const feature = map.feature as { layer: { id: string } } | null;
      if (!feature) return [];
      if (options?.layers && !options.layers.includes(feature.layer.id)) {
        return [];
      }
      return [feature];
    },
    project: ([lng, lat]: [number, number]) => {
      return {
        x: 400 + (lng - ORIGIN[0]) * 10_000,
        y: 250 - (lat - ORIGIN[1]) * 10_000,
      };
    },
    getZoom: () => {
      return 14;
    },
    easeTo: jest.fn(),
    getFeatureState: () => {
      return {};
    },
    setFeatureState: jest.fn(),
    isStyleLoaded: () => {
      return true;
    },
  };
  return map;
};
