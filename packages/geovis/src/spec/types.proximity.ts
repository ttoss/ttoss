/**
 * What {@link ProximitySearch.query} is asked: the point the reader searched
 * from and the ring to search, in metres.
 *
 * The first search asks for the whole disc (`radiusMin` is `0`); widening the
 * radius afterwards asks only for the ring the earlier answers do not cover,
 * from the radius already searched (`radiusMin`) out to the new one, so a
 * service never comes back twice.
 */
export interface ProximityQueryParams {
  /** Latitude of the searched point. */
  lat: number;
  /** Longitude of the searched point. */
  lng: number;
  /** Inner edge of the ring, in metres: `0` for the first search. */
  radiusMin: number;
  /** Outer edge of the ring, in metres. */
  radius: number;
  /**
   * Aborted when the search this answer belongs to is no longer current — the
   * reader cleared it or started another — so the request can be cancelled.
   */
  signal: AbortSignal;
}

/** One place a {@link ProximitySearch} found. */
export interface ProximityResult {
  /** Unique among the answers of one search; keys the result on screen. */
  id: string | number;
  /** Where the place is, `[lng, lat]`. */
  lngLat: [number, number];
  /** The place's name, shown when the reader opens its card. */
  name: string;
  /**
   * The {@link ProximityCategory.id} the place belongs to, which gives its pin
   * a colour and an icon. Omitted, or naming no declared category, the pin is
   * drawn in the neutral colour with no icon.
   */
  categoryId?: string;
}

/** A kind of place the search returns, and how its pins look. */
export interface ProximityCategory {
  /** Matched against {@link ProximityResult.categoryId}. */
  id: string;
  /** Name of the kind, shown on the place's card and in the counts. */
  label: string;
  /** The pin's colour, `#RRGGBB`. */
  color: string;
  /** `@ttoss/react-icons` icon drawn in white inside the pin. */
  icon?: string;
}

/**
 * A search for the places within a radius of a feature the reader clicks — or,
 * with {@link fromUserLocation}, of where the reader is.
 *
 * Clicking a feature of one of {@link layers} calls {@link query} with its
 * position. While the search runs, a circle of the radius sweeps around the
 * feature; the answers then drop in as pins of their category, and a bar under
 * the circle counts them, offers the other {@link radii} and clears the search.
 * Clicking the same feature again clears it too.
 *
 * While a search is shown, the clicked pin is the only one of the map's pins
 * left — every `symbol` layer is hidden, and the clicked pin is drawn above
 * the circle, grown a little — and clearing the search brings back the pins
 * of every layer that is on, the clicked one at its own size.
 */
export interface ProximitySearch {
  /**
   * Ids of the layers whose features start a search when clicked — e.g. the
   * hospitals' pins. A point feature is searched from its own position; any
   * other, from where the click landed.
   */
  layers: string[];
  /**
   * Finds the places within a ring around a point — see
   * {@link ProximityQueryParams}. Only callable from code: a spec written as
   * JSON cannot carry it.
   */
  query: (params: ProximityQueryParams) => Promise<ProximityResult[]>;
  /**
   * The radii the reader can choose between, in metres, ascending. Defaults to
   * `[1000, 2000, 3000]`.
   */
  radii?: number[];
  /**
   * The radius the first search uses, in metres — one of {@link radii}.
   * Defaults to the smallest.
   */
  initialRadius?: number;
  /** The kinds of place the answers belong to, and how their pins look. */
  categories?: ProximityCategory[];
  /**
   * How the texts name what is searched, singular and plural — e.g. `serviço`
   * and `serviços` read "Buscar serviços em 1 km", "3 serviços em até 1 km".
   * Defaults to the translated "result" and "results".
   */
  labels?: { one?: string; other?: string };
  /**
   * Adds a button under the map's controls that searches from the reader's
   * own location: it explains why the location is needed, asks the browser
   * for it, and runs the same search from there, marking the reader with a
   * blue dot. Clicking it again clears the search. Hidden where the browser
   * offers no geolocation, as outside HTTPS. Defaults to `false`: asking for
   * the reader's location is the app's choice, not the search's.
   */
  fromUserLocation?: boolean;
}
