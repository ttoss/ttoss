import type {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  GeoJSONObject,
  GeoVisDataEntry,
  GeoVisGeometryType,
} from './types';

const mapGeometryType = (t: string): GeoVisGeometryType | undefined => {
  switch (t) {
    case 'Point':
    case 'MultiPoint':
      return 'point';
    case 'LineString':
    case 'MultiLineString':
      return 'line';
    case 'Polygon':
    case 'MultiPolygon':
      return 'polygon';
    default:
      return undefined;
  }
};

const inferFromGeoJSONObject = (
  obj: GeoJSONObject
): GeoVisGeometryType | undefined => {
  let first: GeoJSONFeature | undefined;
  if (obj.type === 'FeatureCollection') {
    first = (obj as GeoJSONFeatureCollection).features.find((f) => {
      return f.geometry !== null;
    });
  } else if (obj.type === 'Feature') {
    first = obj as GeoJSONFeature;
  } else {
    return mapGeometryType(obj.type);
  }

  if (!first || !first.geometry) return undefined;
  return mapGeometryType(first.geometry.type);
};

/**
 * Infers the GeoVis geometry kind (`point`, `line`, `polygon`, `raster`)
 * for a data entry, used by `applyDefaults` when a layer is auto-derived
 * from a data entry without explicit `geometry`. Returns `undefined` when
 * the entry has no statically-determinable shape (e.g. `geojson-url`,
 * vector tiles, native).
 */
export const inferGeometryFromEntry = (
  entry: GeoVisDataEntry
): GeoVisGeometryType | undefined => {
  if (entry.kind === 'raster-tiles' || entry.kind === 'image') {
    return 'raster';
  }
  if (entry.kind !== 'geojson-inline') return undefined;
  return inferFromGeoJSONObject(entry.geojson);
};
