import type {
  AddLayerObject,
  GeoJSONSource,
  Map as MapLibreMap,
  MapLayerMouseEvent,
} from 'maplibre-gl';
import * as React from 'react';

import { addPinImage } from '../adapters/maplibre/pinImages';
import type { ProximityHit, ProximityState } from '../react/proximity';
import { metresPerPixel } from '../react/proximity.geo';
import type {
  ProximityCategory,
  ProximitySearch,
} from '../spec/types.proximity';
import {
  addWhenStyleReady,
  AREA_IDS,
  keepOwnLayersOnTop,
  ownLayerBeforeId,
  removeLayers,
} from './GeoVisProximitySearch.area';
import { UNCATEGORISED } from './GeoVisProximitySearch.hitPin';

/** Width, in CSS pixels, of the box a place's pin stands in. */
const PIN_SIZE = 30;
/** How much larger the pin of the place whose card is open stands. */
const SELECTED_SCALE = 1.25;
/** How long the places' pins take to fade in once an answer arrives. */
const FADE_MS = 400;

/** The pin image of a category, or of a place of none. */
const pinImageId = (categoryId?: string) => {
  return `geovis-proximity-pin-${categoryId || 'none'}`;
};

/**
 * Registers a pin per category — drawn as the map's own pins are, in the
 * category's colour with its icon — and one for a place of no category.
 */
const addPinImages = ({
  map,
  categories,
}: {
  map: MapLibreMap;
  categories: Map<string, ProximityCategory>;
}) => {
  addPinImage({
    map,
    image: {
      id: pinImageId(),
      kind: 'pin',
      icon: '',
      color: UNCATEGORISED,
      size: PIN_SIZE,
    },
  });
  for (const category of categories.values()) {
    addPinImage({
      map,
      image: {
        id: pinImageId(category.id),
        kind: 'pin',
        icon: category.icon ?? '',
        color: category.color,
        size: PIN_SIZE,
      },
    });
  }
};

/** The places' pins: a symbol per place, the open one larger and on top. */
const hitsLayer = (scale: number): AddLayerObject => {
  return {
    id: AREA_IDS.hits,
    type: 'symbol',
    source: AREA_IDS.hitsSource,
    layout: {
      'icon-image': ['get', 'image'],
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-size': [
        'case',
        ['==', ['get', 'selected'], 1],
        scale * SELECTED_SCALE,
        scale,
      ],
      'symbol-sort-key': ['get', 'sort'],
    },
    paint: {
      'icon-opacity': 1,
      'icon-opacity-transition': { duration: FADE_MS, delay: 0 },
    },
  };
};

/** Adds whatever of the pins' images, source and layer the map lacks. */
const ensureHitsLayer = ({
  map,
  categories,
  scale,
}: {
  map: MapLibreMap;
  categories: Map<string, ProximityCategory>;
  scale: number;
}) => {
  addPinImages({ map, categories });
  if (!map.getSource(AREA_IDS.hitsSource)) {
    map.addSource(AREA_IDS.hitsSource, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
  if (!map.getLayer(AREA_IDS.hits)) {
    map.addLayer(hitsLayer(scale), ownLayerBeforeId(map, AREA_IDS.hits));
  }
  keepOwnLayersOnTop(map);
};

/**
 * The places as GeoJSON, but those `hidden` — still falling in as HTML pins.
 * The open place sorts above the rest; the others, the farther ones on top,
 * as the HTML pins stacked.
 */
const hitsData = ({
  hits,
  hidden,
  selectedId,
}: {
  hits: ProximityHit[];
  hidden: Set<string | number>;
  selectedId: string | number | null;
}) => {
  return {
    type: 'FeatureCollection' as const,
    features: hits
      .filter((hit) => {
        return !hidden.has(hit.id);
      })
      .map((hit, index) => {
        const selected = hit.id === selectedId;
        return {
          type: 'Feature' as const,
          id: index,
          properties: {
            key: String(hit.id),
            image: pinImageId(hit.categoryId),
            selected: selected ? 1 : 0,
            sort: selected ? Number.MAX_SAFE_INTEGER : hit.order,
          },
          geometry: { type: 'Point' as const, coordinates: hit.lngLat },
        };
      }),
  };
};

/**
 * Fades the pins in: at once to transparent, then, a frame later, back to
 * opaque over {@link FADE_MS} — MapLibre eases a paint property it is told
 * to change.
 */
const fadeIn = (map: MapLibreMap) => {
  map.setPaintProperty(AREA_IDS.hits, 'icon-opacity-transition', {
    duration: 0,
    delay: 0,
  });
  map.setPaintProperty(AREA_IDS.hits, 'icon-opacity', 0);
  requestAnimationFrame(() => {
    if (!map.getLayer(AREA_IDS.hits)) return;
    map.setPaintProperty(AREA_IDS.hits, 'icon-opacity-transition', {
      duration: FADE_MS,
      delay: 0,
    });
    map.setPaintProperty(AREA_IDS.hits, 'icon-opacity', 1);
  });
};

/** Opens the card of the place whose pin is clicked, read off `latest`. */
const useClickOnPins = ({
  map,
  latest,
}: {
  map: MapLibreMap | null;
  latest: React.RefObject<{
    hits: ProximityHit[];
    onSelect: (id: string | number) => void;
  }>;
}) => {
  React.useEffect(() => {
    if (!map) return;
    const onClick = (event: MapLayerMouseEvent) => {
      const key = event.features?.[0]?.properties?.key;
      const hit = latest.current.hits.find((candidate) => {
        return String(candidate.id) === key;
      });
      if (hit) latest.current.onSelect(hit.id);
    };
    map.on('click', AREA_IDS.hits, onClick);
    return () => {
      map.off('click', AREA_IDS.hits, onClick);
    };
  }, [map, latest]);
};

/**
 * Draws the places a search found as a symbol layer of the map — each a pin
 * in its category's colour, drawn by the map as its own pins are — rather
 * than as HTML: hundreds of places then cost the map nothing as it moves,
 * where hundreds of HTML pins redrawn on every frame of a camera flight made
 * it stutter. The pins sit over the circle and under the app's panels, fade
 * in as an answer arrives, and open their place's card when clicked. The
 * layer goes when the search clears.
 *
 * @param params.hits - The places to draw: within the radius, of the
 * category shown.
 * @param params.hidden - Places left off the layer for now — the nearest,
 * still falling in as HTML pins.
 * @param params.scale - The pins' size, `1` or smaller on a small circle.
 * @param params.request - The search's number: a new answer fades the pins in.
 */
export const useHitPinLayer = ({
  map,
  hits,
  hidden,
  categories,
  selectedId,
  scale,
  request,
  onSelect,
}: {
  map: MapLibreMap | null;
  hits: ProximityHit[];
  hidden: Set<string | number>;
  categories: Map<string, ProximityCategory>;
  selectedId: string | number | null;
  scale: number;
  request: number | null;
  onSelect: (id: string | number) => void;
}) => {
  const latest = React.useRef({ hits, onSelect });
  React.useEffect(() => {
    latest.current = { hits, onSelect };
  });
  useClickOnPins({ map, latest });

  // The answer last faded in: one fade per answer, not per redraw.
  const fadedRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (!map || request === null) return;
    const draw = () => {
      if (
        !addWhenStyleReady(() => {
          ensureHitsLayer({ map, categories, scale });
        })
      ) {
        return;
      }
      map.setLayoutProperty(AREA_IDS.hits, 'icon-size', [
        'case',
        ['==', ['get', 'selected'], 1],
        scale * SELECTED_SCALE,
        scale,
      ]);
      (map.getSource(AREA_IDS.hitsSource) as GeoJSONSource).setData(
        hitsData({ hits, hidden, selectedId })
      );
      if (hits.length > 0 && fadedRef.current !== request) {
        fadedRef.current = request;
        fadeIn(map);
      }
    };
    // After a new basemap discarded the layer, draw it again. Only then: the
    // draw changes the style itself, and each change fires `styledata`.
    const restore = () => {
      if (!map.getLayer(AREA_IDS.hits)) draw();
    };
    draw();
    map.on('styledata', restore);
    return () => {
      map.off('styledata', restore);
    };
  }, [map, hits, hidden, categories, selectedId, scale, request]);

  const searching = request !== null;
  React.useEffect(() => {
    if (!map || !searching) return;
    return () => {
      fadedRef.current = null;
      removeLayers(map, [AREA_IDS.hits], AREA_IDS.hitsSource);
    };
  }, [map, searching]);
};

/** How many of an answer's nearest places fall in as HTML pins. */
const FALLING_COUNT = 30;
/**
 * How long the last of them takes to land, in milliseconds: the HTML pins'
 * stagger (`120 + order × 90`, none for a widening's) and the fall itself.
 */
const fallingMs = (widening: boolean) => {
  return (widening ? 0 : 120) + (FALLING_COUNT - 1) * 90 + 600;
};

const NONE = new Set<string | number>();

/**
 * The places an answer brought that fall in as HTML pins before joining the
 * map's layer: its {@link FALLING_COUNT} nearest — of the first answer, or
 * of the ring a widening added — until the last of them has landed. Empty
 * while an answer is awaited, and once they have all landed.
 */
const useFallingPins = (state: ProximityState) => {
  const { status, request, fetched, hits, fresh } = state;
  const key = status === 'done' ? `${request}:${fetched}` : null;
  const widening = fresh.length > 0;
  const ids = React.useMemo(() => {
    if (!key) return NONE;
    const arrived = widening
      ? new Set(fresh)
      : new Set(
          hits.map((hit) => {
            return hit.id;
          })
        );
    return new Set(
      hits
        .filter((hit) => {
          return arrived.has(hit.id) && hit.order < FALLING_COUNT;
        })
        .map((hit) => {
          return hit.id;
        })
    );
  }, [key, widening, hits, fresh]);
  const [landed, setLanded] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!key) return;
    const timer = setTimeout(() => {
      setLanded(key);
    }, fallingMs(widening));
    return () => {
      clearTimeout(timer);
    };
  }, [key, widening]);
  return key && landed !== key ? ids : NONE;
};

/** The spec's categories, by id. */
const categoriesById = (config: ProximitySearch) => {
  return new Map<string, ProximityCategory>(
    (config.categories ?? []).map((category) => {
      return [category.id, category];
    })
  );
};

/**
 * The places the map draws: those within the radius shown and, while a
 * category is picked, of that category only.
 */
const shownHits = (state: ProximityState) => {
  return state.hits.filter((hit) => {
    return (
      hit.distance <= state.radius &&
      (state.categoryId === null || hit.categoryId === state.categoryId)
    );
  });
};

/**
 * The places a search draws, and how: the nearest falling in as HTML pins
 * for a moment, every other on the map's layer of pins (see
 * {@link useHitPinLayer}), and the open place's card over its pin.
 *
 * @returns `falling`, the places to draw as HTML pins now; `selectedOnLayer`,
 * the open place when its pin is on the layer, whose card is drawn alone;
 * the pins' `scale` — smaller on a small circle — and the categories by id.
 */
export const useSearchPins = ({
  map,
  config,
  state,
  select,
}: {
  map: MapLibreMap | null;
  config: ProximitySearch;
  state: ProximityState;
  select: (id: string | number) => void;
}) => {
  const categories = React.useMemo(() => {
    return categoriesById(config);
  }, [config]);
  const shown = React.useMemo(() => {
    return shownHits(state);
    // The places shown change with these alone, not with every state update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hits, state.radius, state.categoryId]);
  const falling = useFallingPins(state);
  const { origin } = state;
  const screenRadius =
    map && origin
      ? state.radius / metresPerPixel(origin[1], map.getZoom())
      : Infinity;
  const scale = screenRadius < 120 ? 0.8 : 1;
  useHitPinLayer({
    map,
    hits: shown,
    hidden: falling,
    categories,
    selectedId: state.selectedId,
    scale,
    request: origin ? state.request : null,
    onSelect: select,
  });
  return {
    falling: shown.filter((hit) => {
      return falling.has(hit.id);
    }),
    selectedOnLayer: shown.find((hit) => {
      return hit.id === state.selectedId && !falling.has(hit.id);
    }),
    scale,
    categories,
  };
};
