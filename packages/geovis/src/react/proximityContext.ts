import * as React from 'react';

import type { ProximityHit } from './proximity';

/**
 * The proximity search as the app reads it, from
 * {@link useGeoVisProximitySearch}: where it stands, what it found, and what
 * changes it — so the app can draw its own view of the results, such as a list
 * beside the map, kept in step with the pins.
 */
export interface GeoVisProximitySearchValue {
  /**
   * `idle` before a search, `loading` while an answer is awaited — the first
   * one, or a widening when {@link results} already holds places — and `done`
   * once it arrived.
   */
  status: 'idle' | 'loading' | 'done';
  /** The searched point, `[lng, lat]`; `null` while idle. */
  origin: [number, number] | null;
  /** Whether the search started from the reader's location, not a pin. */
  fromUser: boolean;
  /** The radius shown, in metres. */
  radius: number;
  /** The radii the reader can choose between, in metres, ascending. */
  radii: number[];
  /**
   * The places within {@link radius}, nearest first, each with its distance
   * from {@link origin} — the ones the map shows as pins.
   */
  results: ProximityHit[];
  /** The place whose card is open on the map, or `null`. */
  selectedId: string | number | null;
  /** Opens a place's card on the map, or closes it when it is the open one. */
  select: (id: string | number) => void;
  /** Shows another of {@link radii}, asking only for the ring beyond the widest searched. */
  setRadius: (radius: number) => void;
  /** Clears the search, as the bar's × does. */
  clear: () => void;
}

/**
 * Holds the latest {@link GeoVisProximitySearchValue}: the search writes it,
 * the app's components read it. A store rather than a context value, so a
 * change re-renders only the components that read the search — not the
 * provider, and with it every `useGeoVis()` consumer.
 */
export type ProximityStore = {
  get: () => GeoVisProximitySearchValue | null;
  set: (value: GeoVisProximitySearchValue | null) => void;
  subscribe: (listener: () => void) => () => void;
};

/** A store holding no search, for a `<GeoVisProvider>` to hand down. */
export const createProximityStore = (): ProximityStore => {
  let value: GeoVisProximitySearchValue | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => {
      return value;
    },
    set: (next) => {
      value = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

/** The proximity store of the nearest `<GeoVisProvider>`. */
export const GeoVisProximityContext =
  React.createContext<ProximityStore | null>(null);

const noSubscription = () => {
  return () => {};
};

const noSearch = () => {
  return null;
};

/**
 * The proximity search of the nearest `<GeoVisProvider>` — see
 * {@link GeoVisProximitySearchValue}. Readable anywhere under the provider, so
 * the app can show the results in a panel of its own and drive the search
 * from it.
 *
 * @returns The search, or `null` when the spec declares no `proximitySearch`.
 *
 * @example
 * const search = useGeoVisProximitySearch();
 * if (search?.status === 'done') {
 *   return search.results.map((place) => {
 *     return <Row key={place.id} onClick={() => search.select(place.id)} />;
 *   });
 * }
 */
export const useGeoVisProximitySearch =
  (): GeoVisProximitySearchValue | null => {
    const store = React.useContext(GeoVisProximityContext);
    const subscribe = store?.subscribe ?? noSubscription;
    const get = store?.get ?? noSearch;
    return React.useSyncExternalStore(subscribe, get, get);
  };

/**
 * Writes the search into the provider's store whenever it changes, and takes
 * it out when the search unmounts — a spec without `proximitySearch` reads
 * `null`.
 */
export const usePublishProximitySearch = (
  value: GeoVisProximitySearchValue
) => {
  const store = React.useContext(GeoVisProximityContext);
  React.useEffect(() => {
    store?.set(value);
  }, [store, value]);
  React.useEffect(() => {
    return () => {
      store?.set(null);
    };
  }, [store]);
};
