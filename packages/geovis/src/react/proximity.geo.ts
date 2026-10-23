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
