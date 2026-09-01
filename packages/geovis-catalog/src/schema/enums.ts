import { z } from 'zod';

export const metricKindSchema = z.enum([
  'count',
  'rate',
  'ratio',
  'index',
  'density',
  'distance',
  'nominal',
]);

export const geometrySchema = z.enum(['point', 'polygon', 'line']);

export const filterKindSchema = z.enum(['categorical', 'numeric', 'temporal']);

export const layerFilterOperatorSchema = z.enum([
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'not-in',
]);

export const geographyKindSchema = z.enum([
  'administrative',
  'grid',
  'poi',
  'custom',
]);

/** Presence indicator for spatio-temporal dimensions (D8, D10). */
export const presenceSchema = z.enum([
  'described',
  'not_applicable',
  'unknown',
]);

/** Kebab-case URL-safe identifier (D16). */
export const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    'must be kebab-case: lowercase letters, digits, and single hyphens (e.g. "municipios-contorno")'
  );

/** ISO-8601 duration or grain keyword for temporal data (D10). */
export const temporalGrainSchema = z
  .enum(['instant', 'irregular', 'continuous', 'unknown'])
  .or(
    z
      .string()
      .regex(
        /^P(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+S)?)?$/,
        'must be an ISO-8601 duration or keyword'
      )
  );

/** History/update pattern for temporal data (D10). */
export const temporalHistorySchema = z.enum([
  'snapshot',
  'overwrite',
  'append_only',
  'revised',
  'unknown',
]);

/** Update cadence (D16) — with what frequency NEW data arrives. */
export const updateFrequencySchema = z.enum([
  'real_time',
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'annual',
  'irregular',
  'on_demand',
  'static',
  'unknown',
]);

/** Spatial geometry type extended with grid support (D10). */
export const spatialGeometrySchema = z.enum([
  'point',
  'polygon',
  'line',
  'multipolygon',
  'none',
]);

/** How completely `Spatial.extent` is populated with data (D16). */
export const coverageSchema = z.enum([
  'exhaustive',
  'partial',
  'sample',
  'unknown',
]);

/** Positional precision of point/geocoded data (D16). */
export const precisionSchema = z.enum([
  'rooftop',
  'parcel',
  'street',
  'postal_centroid',
  'locality_centroid',
  'admin_centroid',
  'not_applicable',
  'unknown',
]);

/** Role a `DatasetField` plays in its dataset (D16). */
export const datasetFieldRoleSchema = z.enum([
  'identifier',
  'geometry',
  'join',
]);
