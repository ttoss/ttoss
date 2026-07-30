import { z } from 'zod';

/**
 * Zod is the single source of truth for the catalog contract (D1): runtime
 * validation comes from these schemas, and `getCatalogJSONSchema()` derives
 * the JSON Schema document from them via `z.toJSONSchema`. The hand-written
 * interfaces in `./types` remain the documented public API; `types.parity`
 * asserts at compile time that the two never drift.
 *
 * `strictObject` throughout mirrors the previous document's
 * `additionalProperties: false` — an unknown key is a catalog authoring
 * mistake, not something to silently strip.
 */

export const metricKindSchema = z.enum([
  'count',
  'rate',
  'ratio',
  'index',
  'density',
  'distance',
]);

export const geometrySchema = z.enum(['point', 'polygon', 'line']);

export const metricSchema = z
  .strictObject({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    aliases: z.array(z.string()).optional(),
    unit: z.string().optional(),
    kind: metricKindSchema,
    formatter: z.enum(['number', 'percent', 'currency', 'compact']).optional(),
    nullPolicy: z.enum(['hide', 'zero', 'explain']),
  })
  .meta({ id: 'Metric' });

export const datasetSchema = z
  .strictObject({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    aliases: z.array(z.string()).optional(),
    geometry: geometrySchema,
    geographyIds: z.array(z.string()),
    metricIds: z.array(z.string()),
    source: z.string().optional(),
    temporal: z.strictObject({ start: z.string(), end: z.string() }).optional(),
  })
  .meta({ id: 'Dataset' });

export const geographyKindSchema = z.enum([
  'administrative',
  'grid',
  'poi',
  'custom',
]);

export const geographySchema = z
  .strictObject({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    aliases: z.array(z.string()).optional(),
    kind: geographyKindSchema.optional(),
    level: z.number().optional(),
    parentId: z.string().optional(),
    codeScheme: z.string().optional(),
    resolution: z.string().optional(),
  })
  .meta({ id: 'Geography' });

export const joinSchema = z
  .strictObject({
    from: z.string(),
    to: z.string(),
    on: z.strictObject({ left: z.string(), right: z.string() }),
    cardinality: z.enum(['1:1', '1:m', 'm:1']),
  })
  .meta({ id: 'Join' });

export const filterFieldSchema = z
  .strictObject({
    field: z.string(),
    kind: z.enum(['categorical', 'numeric', 'temporal']),
    domain: z.unknown().optional(),
  })
  .meta({ id: 'FilterField' });

export const mapTypeCatalogEntrySchema = z
  .strictObject({
    name: z.enum(['choropleth', 'dotDensity', 'proportionalCircles']),
    supportedGeometries: z.array(geometrySchema),
    metricKinds: z.array(metricKindSchema),
  })
  .meta({ id: 'MapTypeCatalogEntry' });

export const catalogSchema = z
  .strictObject({
    version: z.string().min(1),
    domain: z.string().optional(),
    datasets: z.array(datasetSchema),
    metrics: z.array(metricSchema),
    geographies: z.array(geographySchema),
    joins: z.array(joinSchema),
    mapTypes: z.array(mapTypeCatalogEntrySchema),
    filters: z.array(filterFieldSchema),
    permissions: z.record(z.string(), z.unknown()).optional(),
  })
  .meta({
    id: 'Catalog',
    title: 'Catalog',
    $id: 'https://ttoss.dev/geovis-catalog/catalog.schema.json',
  });
