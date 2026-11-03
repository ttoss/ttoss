/** Earth's circumference at the equator, in metres (Web Mercator). */
const EARTH_CIRCUMFERENCE = 40_075_016.686;

/** MapLibre's tile size: one zoom level doubles this many pixels. */
const TILE_SIZE = 512;

/** Mean Earth radius, in metres, for great-circle distances. */
const EARTH_RADIUS = 6_371_008.8;

const toRadians = (degrees: number) => {
  return (degrees * Math.PI) / 180;
};

/**
 * Metres one screen pixel covers at a latitude and zoom.
 *
 * @example
 * metresPerPixel(0, 0); // ≈ 78271.5
 */
export const metresPerPixel = (lat: number, zoom: number) => {
  return (
    (EARTH_CIRCUMFERENCE * Math.cos(toRadians(lat))) / (TILE_SIZE * 2 ** zoom)
  );
};

/**
 * The zoom at which `metres` spans `pixels` on screen at a latitude — what
 * frames a search radius at the size the circle is drawn at.
 *
 * @example
 * zoomForRadius({ lat: 0, metres: 78271.5, pixels: 1 }); // ≈ 0
 */
export const zoomForRadius = ({
  lat,
  metres,
  pixels,
}: {
  lat: number;
  metres: number;
  pixels: number;
}) => {
  return Math.log2(
    (EARTH_CIRCUMFERENCE * Math.cos(toRadians(lat)) * pixels) /
      (TILE_SIZE * metres)
  );
};

/**
 * Great-circle distance between two `[lng, lat]` points, in metres.
 *
 * @example
 * distanceInMetres([0, 0], [0, 1]); // ≈ 111195
 */
export const distanceInMetres = (
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number]
) => {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(a));
};

const toDegrees = (radians: number) => {
  return (radians * 180) / Math.PI;
};

/**
 * The point `metres` away from `origin` along a great circle, heading
 * `bearing` degrees clockwise from north.
 *
 * @example
 * destinationPoint({ origin: [0, 0], metres: 111195, bearing: 0 }); // ≈ [0, 1]
 */
export const destinationPoint = ({
  origin: [lng, lat],
  metres,
  bearing,
}: {
  origin: [number, number];
  metres: number;
  bearing: number;
}): [number, number] => {
  const angle = metres / EARTH_RADIUS;
  const heading = toRadians(bearing);
  const lat1 = toRadians(lat);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angle) +
      Math.cos(lat1) * Math.sin(angle) * Math.cos(heading)
  );
  const lng2 =
    toRadians(lng) +
    Math.atan2(
      Math.sin(heading) * Math.sin(angle) * Math.cos(lat1),
      Math.cos(angle) - Math.sin(lat1) * Math.sin(lat2)
    );
  return [toDegrees(lng2), toDegrees(lat2)];
};

/**
 * The closed ring of a circle of `metres` around `origin`, as a GeoJSON
 * polygon holds it: `steps` points clockwise from north, the first repeated
 * at the end.
 *
 * @example
 * circleRing({ origin: [0, 0], metres: 1000, steps: 4 }).length; // 5
 */
export const circleRing = ({
  origin,
  metres,
  steps = 96,
}: {
  origin: [number, number];
  metres: number;
  steps?: number;
}): [number, number][] => {
  const ring = Array.from({ length: steps }, (_, index) => {
    return destinationPoint({ origin, metres, bearing: (index * 360) / steps });
  });
  return [...ring, ring[0]];
};
