import type maplibregl from 'maplibre-gl';

import type { SetViewOptions } from '../../runtime/adapter';
import type { GeoJSONBoundingBox } from '../../spec/types';

/** The camera fields the options declare — where the map ends up. */
const toCamera = (options: SetViewOptions): maplibregl.CameraOptions => {
  const { center, zoom, pitch, bearing } = options;
  const camera: maplibregl.CameraOptions = {};
  if (center !== undefined) camera.center = center as maplibregl.LngLatLike;
  if (zoom !== undefined) camera.zoom = zoom;
  if (pitch !== undefined) camera.pitch = pitch;
  if (bearing !== undefined) camera.bearing = bearing;
  return camera;
};

/**
 * The flight fields the options declare — how the map gets there.
 *
 * Only the declared ones are carried: MapLibre reads a missing `duration`,
 * `speed` or `curve` as "derive it from the distance", which an explicit
 * `undefined` would not say.
 */
const toFlight = (options: SetViewOptions): maplibregl.FlyToOptions => {
  const { duration, curve, speed, essential } = options;
  const flight: maplibregl.FlyToOptions = {};
  if (duration !== undefined) flight.duration = duration;
  if (curve !== undefined) flight.curve = curve;
  if (speed !== undefined) flight.speed = speed;
  if (essential !== undefined) flight.essential = essential;
  return flight;
};

/** MapLibre's corner pair, from the GeoJSON `[w, s, e, n]` box. */
const toLngLatBounds = (
  bbox: GeoJSONBoundingBox
): [[number, number], [number, number]] => {
  return [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[3]],
  ];
};

/**
 * Moves the camera imperatively, for `runtime.setView()` and the actions that
 * compile to it — a flight by default, an instant cut with `animate: false`.
 *
 * `bounds` frames an extent and takes precedence over `center`/`zoom`: the two
 * answer the same question, and the box is the more specific answer — it says
 * how close to end up rather than being told. Everything about the flight
 * applies either way, since `fitBounds` is a `flyTo` that works out its own
 * destination.
 *
 * With neither a box nor a camera field nothing is called: an options object
 * that says only how to travel has nowhere to travel to, and moving the map to
 * where it already is would still animate.
 *
 * MapLibre turns a flight into a jump for a viewer whose system asks for
 * reduced motion; `essential` is what overrides that, and it is the caller's
 * to set, because only the caller knows whether the movement carries meaning.
 *
 * @param map - The mounted map.
 * @param options - Where to go, and how.
 */
export const applySetView = (
  map: maplibregl.Map,
  options: SetViewOptions
): void => {
  const { bounds, padding, maxZoom, animate } = options;

  if (bounds) {
    const fit: maplibregl.FitBoundsOptions = {
      ...toFlight(options),
      animate: animate !== false,
    };
    if (padding !== undefined) fit.padding = padding;
    if (maxZoom !== undefined) fit.maxZoom = maxZoom;
    map.fitBounds(toLngLatBounds(bounds), fit);
    return;
  }

  const camera = toCamera(options);
  if (Object.keys(camera).length === 0) return;

  if (animate === false) {
    map.jumpTo(camera);
    return;
  }

  map.flyTo({ ...camera, ...toFlight(options) });
};
