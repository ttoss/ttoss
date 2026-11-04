import { act } from '@testing-library/react';
import type { VisualizationSpec } from 'src/spec/types';
import type {
  ProximityQueryParams,
  ProximityResult,
} from 'src/spec/types.proximity';

type Handler = (event?: unknown) => void;

/** The map the fake adapter hands out, with what the test drives it by. */
export type MockMap = ReturnType<typeof buildMap>;

/** Metres in one degree of latitude. */
export const METRES_PER_DEGREE = 111_195;

export const ORIGIN: [number, number] = [-46.63, -23.55];

type MockLayer = { id: string; type: string };

/**
 * Puts `layer` beneath `beforeId` — or on top without one — as MapLibre's
 * `addLayer` and `moveLayer` do: the Map keeps the layers bottom to top.
 */
const placeLayer = ({
  layers,
  layer,
  beforeId,
}: {
  layers: Map<string, MockLayer>;
  layer: MockLayer;
  beforeId?: string;
}) => {
  const ordered = [...layers.values()];
  const at = beforeId
    ? ordered.findIndex((known) => {
        return known.id === beforeId;
      })
    : -1;
  ordered.splice(at === -1 ? ordered.length : at, 0, layer);
  layers.clear();
  for (const known of ordered) layers.set(known.id, known);
};

/** The sources and layers added to the map, as the searched area adds its own. */
const buildStyle = () => {
  const sources = new Map<string, { spec: unknown; setData: jest.Mock }>();
  const layers = new Map<string, MockLayer>([
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
    addLayer: jest.fn(
      (layer: { id: string; type: string }, beforeId?: string) => {
        placeLayer({ layers, layer, beforeId });
      }
    ),
    moveLayer: jest.fn((id: string, beforeId?: string) => {
      const layer = layers.get(id);
      if (!layer) return;
      layers.delete(id);
      placeLayer({ layers, layer, beforeId });
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

/** A place `metres` north of the origin. */
export const northBy = (
  id: number,
  metres: number,
  categoryId?: string
): ProximityResult => {
  return {
    id,
    name: `Place ${id}`,
    categoryId,
    lngLat: [ORIGIN[0], ORIGIN[1] + metres / METRES_PER_DEGREE],
  };
};

/** A query the test answers by hand. */
export const buildQuery = () => {
  const calls: {
    params: ProximityQueryParams;
    resolve: (results: ProximityResult[]) => void;
  }[] = [];
  const query = jest.fn((params: ProximityQueryParams) => {
    return new Promise<ProximityResult[]>((resolve) => {
      calls.push({ params, resolve });
    });
  });
  return { query, calls };
};

/** A spec with one layer of pins to search from and one with its own click. */
export const buildSpec = ({
  query,
  fromUserLocation,
  fromAnyPoint,
  searchLayers = ['pins'],
}: {
  query: (params: ProximityQueryParams) => Promise<ProximityResult[]>;
  fromUserLocation?: boolean;
  fromAnyPoint?: boolean;
  searchLayers?: string[];
}): VisualizationSpec => {
  return {
    engine: 'maplibre',
    view: { center: ORIGIN, zoom: 14 },
    images: [
      { id: 'pin', kind: 'pin', icon: 'maki:hospital', color: '#C0392B' },
    ],
    sources: [
      {
        id: 's',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [
      {
        id: 'pins',
        sourceId: 's',
        geometry: 'symbol',
        paint: { iconImage: 'pin' },
      },
      // A layer whose click opens its own card.
      { id: 'areas', sourceId: 's', geometry: 'polygon', click: {} },
    ],
    proximitySearch: {
      ...(searchLayers.length > 0 && { layers: searchLayers }),
      query,
      radii: [1000, 2000],
      categories: [
        { id: 'ubs', label: 'UBS', color: '#1E8449', icon: 'maki:doctor' },
      ],
      labels: { one: 'service', other: 'services' },
      fromUserLocation,
      fromAnyPoint,
    },
  };
};

/** Lets an answer travel through the search's awaits into its state. */
export const settle = async () => {
  await act(async () => {
    for (let tick = 0; tick < 5; tick += 1) await Promise.resolve();
  });
};
