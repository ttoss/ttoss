import type {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  GeoJSONGeometry,
  GeoJSONObject,
  GeoJSONPosition,
  GeoVisDataEntry,
  LngLat,
  ViewState,
} from './types';

interface Bounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

const expandBoundsByPosition = (bounds: Bounds, pos: GeoJSONPosition): void => {
  const [lng, lat] = pos;
  if (lng < bounds.minLng) bounds.minLng = lng;
  if (lng > bounds.maxLng) bounds.maxLng = lng;
  if (lat < bounds.minLat) bounds.minLat = lat;
  if (lat > bounds.maxLat) bounds.maxLat = lat;
};

const walkGeometry = (geom: GeoJSONGeometry, bounds: Bounds): void => {
  switch (geom.type) {
    case 'Point':
      expandBoundsByPosition(bounds, geom.coordinates);
      break;
    case 'MultiPoint':
    case 'LineString':
      for (const pos of geom.coordinates) expandBoundsByPosition(bounds, pos);
      break;
    case 'MultiLineString':
    case 'Polygon':
      for (const ring of geom.coordinates)
        for (const pos of ring) expandBoundsByPosition(bounds, pos);
      break;
    case 'MultiPolygon':
      for (const poly of geom.coordinates)
        for (const ring of poly)
          for (const pos of ring) expandBoundsByPosition(bounds, pos);
      break;
    case 'GeometryCollection':
      for (const inner of geom.geometries) walkGeometry(inner, bounds);
      break;
  }
};

const walkObject = (obj: GeoJSONObject, bounds: Bounds): void => {
  if (obj.type === 'FeatureCollection') {
    for (const f of (obj as GeoJSONFeatureCollection).features) {
      if (f.geometry) walkGeometry(f.geometry, bounds);
    }
  } else if (obj.type === 'Feature') {
    const f = obj as GeoJSONFeature;
    if (f.geometry) walkGeometry(f.geometry, bounds);
  } else {
    walkGeometry(obj, bounds);
  }
};

/** Default view used when no inline geojson features are available. */
const WORLD_VIEW: ViewState = { center: [0, 0], zoom: 1 };

/**
 * Approximates a `ViewState` from the bounding box of all inline GeoJSON
 * features across `data`. URL-based or tiled entries are skipped because
 * their bounds cannot be determined statically.
 *
 * Returns `WORLD_VIEW` when no inline data is present. The zoom estimation
 * is intentionally coarse — adapter consumers (MapLibre) typically run a
 * `fitBounds` pass once data loads to refine it.
 */
export const computeBoundsFromSources = (
  data: ReadonlyArray<GeoVisDataEntry>
): ViewState => {
  const bounds: Bounds = {
    minLng: Number.POSITIVE_INFINITY,
    minLat: Number.POSITIVE_INFINITY,
    maxLng: Number.NEGATIVE_INFINITY,
    maxLat: Number.NEGATIVE_INFINITY,
  };

  let touched = false;
  for (const entry of data) {
    if (entry.kind !== 'geojson-inline') continue;
    walkObject(entry.geojson, bounds);
    touched = true;
  }

  if (!touched || !Number.isFinite(bounds.minLng)) {
    return WORLD_VIEW;
  }

  const center: LngLat = [
    (bounds.minLng + bounds.maxLng) / 2,
    (bounds.minLat + bounds.maxLat) / 2,
  ];

  // Coarse zoom estimation from longitudinal extent. Refined by the
  // adapter at mount time when needed. For single points or very tight
  // clusters (span below ~0.01 degrees, ≈1km) fall back to a moderate
  // regional zoom rather than the maximum because the latter rarely
  // matches the user's intent for the initial framing.
  const lngSpan = bounds.maxLng - bounds.minLng;
  const latSpan = bounds.maxLat - bounds.minLat;
  const span = Math.max(lngSpan, latSpan);

  const SINGLE_POINT_ZOOM = 4;
  const SINGLE_POINT_THRESHOLD = 0.01;
  if (span < SINGLE_POINT_THRESHOLD) {
    return { center, zoom: SINGLE_POINT_ZOOM };
  }

  const zoom = Math.max(1, Math.min(18, Math.round(Math.log2(360 / span))));

  return { center, zoom };
};
