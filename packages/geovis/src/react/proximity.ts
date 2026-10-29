import type { Map as MapLibreMap } from 'maplibre-gl';
import * as React from 'react';

import type { PinFocus } from '../runtime/adapter';
import type {
  ProximityQueryParams,
  ProximityResult,
  ProximitySearch,
} from '../spec/types.proximity';
import { distanceInMetres, zoomForRadius } from './proximity.geo';

/** The radii a search offers when the spec declares none, in metres. */
export const DEFAULT_PROXIMITY_RADII = [1000, 2000, 3000];

/** How long the camera takes to frame a new radius, in milliseconds. */
const FRAME_DURATION_MS = 450;

/**
 * A place the search found, with what drawing it needs: its distance from the
 * searched point and its place in the order the pins drop in.
 */
export type ProximityHit = ProximityResult & {
  /** Distance from the searched point, in metres. */
  distance: number;
  /** Position within the answer it came in, nearest first. */
  order: number;
};

/**
 * Where a search stands: `idle` before the reader clicks the pin, `loading`
 * while an answer is awaited, `done` once it arrived.
 */
export type ProximityState = {
  status: 'idle' | 'loading' | 'done';
  /** The searched point, `[lng, lat]`; `null` while idle. */
  origin: [number, number] | null;
  /** The radius shown, in metres. */
  radius: number;
  /** The widest radius already searched, in metres. */
  fetched: number;
  /** Every place found so far, out to {@link fetched}. */
  hits: ProximityHit[];
  /** Ids of the places the last widening brought, which drop in at once. */
  fresh: (string | number)[];
  /** Counts the searches, so an answer to a superseded one is dropped. */
  request: number;
  /** The place whose card is open. */
  selectedId: string | number | null;
  /** The pin the search started from, the one kept on the map meanwhile. */
  focus: PinFocus | null;
  /** Whether the search started from the reader's location, not a pin. */
  fromUser: boolean;
};

/**
 * The focus a search from the reader's location holds: no pin, so the engine
 * hides every pin while it is shown, as it does around a clicked one.
 */
const NO_PIN: PinFocus = { layerId: null, featureId: null };

const idleState = (radius: number, request: number): ProximityState => {
  return {
    status: 'idle',
    origin: null,
    radius,
    fetched: 0,
    hits: [],
    fresh: [],
    request,
    selectedId: null,
    focus: null,
    fromUser: false,
  };
};

/**
 * Pairs each answer with its distance from `origin`, nearest first, numbering
 * the order the pins drop in.
 */
const toHits = (
  results: ProximityResult[],
  origin: [number, number]
): ProximityHit[] => {
  return results
    .map((result) => {
      return { ...result, distance: distanceInMetres(origin, result.lngLat) };
    })
    .sort((a, b) => {
      return a.distance - b.distance;
    })
    .map((hit, order) => {
      return { ...hit, order };
    });
};

/** The search's state, and its latest value for callbacks to read. */
type StateHandle = {
  stateRef: { current: ProximityState };
  setState: React.Dispatch<React.SetStateAction<ProximityState>>;
};

/** Eases the camera to frame a radius around a point at `framePixels`. */
const useFrameRadius = (map: MapLibreMap | null, framePixels: number) => {
  return React.useCallback(
    (origin: [number, number], radius: number) => {
      map?.easeTo({
        center: origin,
        zoom: zoomForRadius({
          lat: origin[1],
          metres: radius,
          pixels: framePixels,
        }),
        duration: FRAME_DURATION_MS,
      });
    },
    [map, framePixels]
  );
};

/** What {@link useRingQuery}'s `ask` asks for. */
type Ring = {
  origin: [number, number];
  radiusMin: number;
  radius: number;
  /** The search the answer belongs to. */
  request: number;
};

/**
 * Asks the spec's query for a ring, one request at a time: a new one cancels
 * the last, and an answer to a search no longer current is dropped (`null`).
 * A failure is logged and answers `null` too.
 */
const useRingQuery = (
  query: ProximitySearch['query'],
  stateRef: StateHandle['stateRef']
) => {
  const queryRef = React.useRef(query);
  const abortRef = React.useRef<AbortController | null>(null);
  React.useEffect(() => {
    queryRef.current = query;
  });
  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const abort = React.useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const ask = React.useCallback(
    async ({ origin, radiusMin, radius, request }: Ring) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const params: ProximityQueryParams = {
        lat: origin[1],
        lng: origin[0],
        radiusMin,
        radius,
        signal: controller.signal,
      };
      try {
        const results = await queryRef.current(params);
        if (stateRef.current.request !== request) return null;
        return toHits(results, origin);
      } catch (error) {
        if (!controller.signal.aborted) {
          // eslint-disable-next-line no-console
          console.error('[GeoVis] Proximity search failed:', error);
        }
        return null;
      }
    },
    [stateRef]
  );

  return { ask, abort };
};

/**
 * The state after a widening's answer: the places it brought joined to those
 * already shown — the new ones `fresh`, so they drop in at once — unless the
 * search moved on since, which keeps the state as it is.
 */
const withWidening = ({
  prev,
  more,
  radius,
  request,
}: {
  prev: ProximityState;
  more: ProximityHit[];
  radius: number;
  request: number;
}): ProximityState => {
  if (prev.request !== request || prev.radius !== radius) return prev;
  const known = new Set(
    prev.hits.map((hit) => {
      return hit.id;
    })
  );
  const added = more.filter((hit) => {
    return !known.has(hit.id);
  });
  return {
    ...prev,
    status: 'done',
    fetched: radius,
    hits: [...prev.hits, ...added],
    fresh: added.map((hit) => {
      return hit.id;
    }),
  };
};

/** Where a search starts: the point, and what the reader started it from. */
type SearchStart = {
  /** The point, `[lng, lat]`. */
  origin: [number, number];
  /** The pin clicked there, kept in focus while the search is shown. */
  focus: PinFocus | null;
  /** Whether the point is the reader's location. */
  fromUser: boolean;
};

/**
 * Searches from a point — or, started again from the point already searched,
 * clears the search. Another point replaces the search, even mid-flight.
 */
const useSearchFrom = ({
  stateRef,
  setState,
  initialRadius,
  frame,
  ask,
  clear,
}: StateHandle & {
  initialRadius: number;
  frame: (origin: [number, number], radius: number) => void;
  ask: (ring: Ring) => Promise<ProximityHit[] | null>;
  clear: () => void;
}) => {
  return React.useCallback(
    async ({ origin, focus, fromUser }: SearchStart) => {
      const current = stateRef.current;
      const same =
        current.origin?.[0] === origin[0] && current.origin?.[1] === origin[1];
      if (same && current.status !== 'idle') {
        if (current.status === 'done') clear();
        return;
      }
      const request = current.request + 1;
      // Ahead of the commit, so an answer to the search this one replaces is
      // dropped even if it lands before the re-render.
      stateRef.current = { ...current, request };
      setState({
        ...idleState(initialRadius, request),
        status: 'loading',
        origin,
        focus: fromUser ? NO_PIN : focus,
        fromUser,
      });
      frame(origin, initialRadius);
      const hits = await ask({
        origin,
        radiusMin: 0,
        radius: initialRadius,
        request,
      });
      if (!hits) {
        if (stateRef.current.request === request) clear();
        return;
      }
      setState((prev) => {
        if (prev.request !== request) return prev;
        return { ...prev, status: 'done', fetched: initialRadius, hits };
      });
    },
    [stateRef, setState, initialRadius, frame, ask, clear]
  );
};

/**
 * Shows another radius: a narrower one filters what is already there, a
 * wider one asks only for the ring beyond it.
 */
const useSetRadius = ({
  stateRef,
  setState,
  frame,
  ask,
}: StateHandle & {
  frame: (origin: [number, number], radius: number) => void;
  ask: (ring: Ring) => Promise<ProximityHit[] | null>;
}) => {
  return React.useCallback(
    async (radius: number) => {
      const current = stateRef.current;
      if (current.status !== 'done' || !current.origin) return;
      if (current.radius === radius) return;
      const { origin, fetched, request } = current;
      frame(origin, radius);
      const shown = { ...current, radius, fresh: [], selectedId: null };
      if (radius <= fetched) {
        setState(shown);
        return;
      }
      setState({ ...shown, status: 'loading' });
      const more = await ask({ origin, radiusMin: fetched, radius, request });
      setState((prev) => {
        if (more) return withWidening({ prev, more, radius, request });
        return prev.request === request ? { ...prev, status: 'done' } : prev;
      });
    },
    [stateRef, setState, frame, ask]
  );
};

/**
 * The search's state and what changes it: searching from a point or from the
 * reader's location, clearing, widening or narrowing the radius, and opening a
 * place's card.
 * Each search frames its radius in the camera, so the circle is drawn at
 * `framePixels` on screen.
 *
 * @param params.config - The spec's {@link ProximitySearch}.
 * @param params.map - The live map, `null` before it mounts.
 * @param params.framePixels - The circle's radius on screen, in pixels.
 */
export const useProximitySearch = ({
  config,
  map,
  framePixels,
}: {
  config: ProximitySearch;
  map: MapLibreMap | null;
  framePixels: number;
}) => {
  const radii = config.radii?.length ? config.radii : DEFAULT_PROXIMITY_RADII;
  const initialRadius =
    config.initialRadius != null && radii.includes(config.initialRadius)
      ? config.initialRadius
      : radii[0];

  const [state, setState] = React.useState(() => {
    return idleState(initialRadius, 0);
  });
  // The live state, read by the callbacks without re-creating them. Synced
  // after each commit: the callbacks run on events, after it.
  const stateRef = React.useRef(state);
  React.useEffect(() => {
    stateRef.current = state;
  });

  const frame = useFrameRadius(map, framePixels);
  const { ask, abort } = useRingQuery(config.query, stateRef);
  const clear = React.useCallback(() => {
    abort();
    setState((prev) => {
      return idleState(initialRadius, prev.request + 1);
    });
  }, [abort, initialRadius]);
  const handle = { stateRef, setState };
  const start = useSearchFrom({
    ...handle,
    initialRadius,
    frame,
    ask,
    clear,
  });
  /** Searches from a point and the pin clicked there, if any. */
  const searchFrom = React.useCallback(
    (origin: [number, number], focus: PinFocus | null = null) => {
      return start({ origin, focus, fromUser: false });
    },
    [start]
  );
  /** Searches from the reader's location, `[lng, lat]`. */
  const searchFromUser = React.useCallback(
    (origin: [number, number]) => {
      return start({ origin, focus: null, fromUser: true });
    },
    [start]
  );
  const setRadius = useSetRadius({ ...handle, frame, ask });
  const select = React.useCallback((id: string | number | null) => {
    setState((prev) => {
      return { ...prev, selectedId: prev.selectedId === id ? null : id };
    });
  }, []);

  return {
    state,
    radii,
    searchFrom,
    searchFromUser,
    clear,
    setRadius,
    select,
  };
};
