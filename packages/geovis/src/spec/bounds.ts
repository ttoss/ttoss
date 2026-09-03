import type {
  DataSource,
  GeoJSONBoundingBox,
  GeoJSONGeometry,
  GeoJSONObject,
  GeoJSONSource,
  LngLat,
} from './types';

interface BoundsAccumulator {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

const extendWithPosition = (acc: BoundsAccumulator, coords: unknown): void => {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    const [lng, lat] = coords as [number, number];
    if (lng < acc.minLng) acc.minLng = lng;
    if (lat < acc.minLat) acc.minLat = lat;
    if (lng > acc.maxLng) acc.maxLng = lng;
    if (lat > acc.maxLat) acc.maxLat = lat;
    return;
  }
  for (const c of coords) extendWithPosition(acc, c);
};

const extendWithGeometry = (
  acc: BoundsAccumulator,
  geometry: GeoJSONGeometry
): void => {
  if (geometry.type === 'GeometryCollection') {
    for (const g of geometry.geometries) extendWithGeometry(acc, g);
    return;
  }
  extendWithPosition(acc, geometry.coordinates);
};

const extendWithGeoJSONObject = (
  acc: BoundsAccumulator,
  obj: GeoJSONObject
): void => {
  if (obj.type === 'FeatureCollection') {
    for (const feature of obj.features) {
      if (feature.geometry) extendWithGeometry(acc, feature.geometry);
    }
  } else if (obj.type === 'Feature') {
    if (obj.geometry) extendWithGeometry(acc, obj.geometry);
  } else {
    extendWithGeometry(acc, obj);
  }
};

const extendWithSource = (acc: BoundsAccumulator, source: DataSource): void => {
  if (source.type === 'geojson') {
    if (typeof source.data === 'string') return;
    extendWithGeoJSONObject(acc, source.data);
  } else if (source.type === 'image' || source.type === 'video') {
    for (const corner of source.coordinates as [LngLat, LngLat, LngLat, LngLat])
      extendWithPosition(acc, corner);
  }
};

/**
 * Walks every coordinate of every `geojson` source's inline data (plus the
 * four corners of `image`/`video` sources) and returns the axis-aligned
 * bounding box `[minLng, minLat, maxLng, maxLat]` covering all of it.
 *
 * `mapData` never contributes geometry of its own — it only carries values
 * joined to a source's features by id — so the source list is the single
 * place bounds are read from.
 *
 * URL-referenced `geojson` sources (`data` as a `string`) and tile-based
 * sources (`vector-tiles`, `raster-tiles`, `raster-dem`) have no
 * client-side geometry to walk and are skipped. Returns `null` when no
 * source contributes any usable coordinate.
 */
export const computeSourcesBbox = (
  sources: DataSource[]
): GeoJSONBoundingBox | null => {
  const acc: BoundsAccumulator = {
    minLng: Infinity,
    minLat: Infinity,
    maxLng: -Infinity,
    maxLat: -Infinity,
  };

  for (const source of sources) extendWithSource(acc, source);

  if (!Number.isFinite(acc.minLng) || !Number.isFinite(acc.minLat)) return null;
  return [acc.minLng, acc.minLat, acc.maxLng, acc.maxLat];
};

/**
 * Estimates a sensible `maxZoom` ceiling for a `fitBounds` call driven by
 * `bbox`, based on its approximate area in km². Prevents over-zoom on small
 * geometries that would lose geographic context.
 */
export const estimateMaxZoom = (bbox: GeoJSONBoundingBox): number => {
  const areaKm2 = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]) * 111 * 111;
  if (areaKm2 > 100_000) return 8; // country
  if (areaKm2 > 5_000) return 10; // state / large region
  if (areaKm2 > 100) return 13; // municipality
  return 15; // neighbourhood / district
};

/**
 * Detects whether any `geojson` source has URL-based data (string URL instead of inline object).
 */
export const hasUrlSources = (sources: DataSource[]): boolean => {
  return sources.some((s) => {
    return s.type === 'geojson' && typeof s.data === 'string';
  });
};

/**
 * Fetches URL-based GeoJSON sources in parallel and returns their parsed GeoJSONObjects.
 * Non-URL sources are skipped. Failed fetches return null for that entry.
 * Returns empty array if no URL sources exist.
 */
export const fetchUrlSourceData = async (
  sources: DataSource[]
): Promise<(GeoJSONObject | null)[]> => {
  const urlSources = sources.filter(
    (s): s is GeoJSONSource & { data: string } => {
      return s.type === 'geojson' && typeof s.data === 'string';
    }
  );

  return Promise.all(
    urlSources.map((s) => {
      return fetch(s.data)
        .then((r) => {
          return r.json();
        })
        .catch(() => {
          return null;
        });
    })
  );
};

/**
 * Walks a list of already-fetched/parsed GeoJSON objects (as returned by
 * {@link fetchUrlSourceData}) and returns their combined bounding box, using
 * the same coordinate-walking logic as {@link computeSourcesBbox}. `null`
 * entries (failed fetches) are skipped. Returns `null` when nothing
 * contributes a usable coordinate.
 */
export const computeGeoJSONObjectsBbox = (
  objects: (GeoJSONObject | null)[]
): GeoJSONBoundingBox | null => {
  const acc: BoundsAccumulator = {
    minLng: Infinity,
    minLat: Infinity,
    maxLng: -Infinity,
    maxLat: -Infinity,
  };

  for (const obj of objects) {
    if (obj) extendWithGeoJSONObject(acc, obj);
  }

  if (!Number.isFinite(acc.minLng) || !Number.isFinite(acc.minLat)) return null;
  return [acc.minLng, acc.minLat, acc.maxLng, acc.maxLat];
};
