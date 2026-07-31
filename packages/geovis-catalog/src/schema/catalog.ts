import { z } from 'zod';

/**
 * Zod is the single source of truth for the catalog contract (D1): runtime
 * validation comes from these schemas, `getCatalogJSONSchema()` derives the
 * JSON Schema document from them via `z.toJSONSchema`, and the public types in
 * `./types` are `z.infer` aliases of them — so drift is impossible by
 * construction rather than asserted after the fact.
 *
 * `strictObject` throughout mirrors the previous document's
 * `additionalProperties: false` — an unknown key is a catalog authoring
 * mistake, not something to silently strip.
 */

// Enums and simple schemas

export const metricKindSchema = z.enum([
  'count',
  'rate',
  'ratio',
  'index',
  'density',
  'distance',
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

/** Spatial geometry type extended with grid support (D10). */
export const spatialGeometrySchema = z.enum([
  'point',
  'polygon',
  'line',
  'multipolygon',
  'none',
]);

// Metric, Filter, and Geography schemas

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

// Spatio-temporal dimension schemas (D8, D10)

/** Temporal interval with optional open ends (D10). */
export const intervalSchema = z
  .strictObject({
    start: z.string().optional(),
    end: z.string().optional(),
  })
  .meta({ id: 'Interval' });

/** Reference to a coded geography value (D10). */
export const codedRefSchema = z
  .strictObject({
    code: z.string(),
    label: z.string().optional(),
  })
  .meta({ id: 'CodedRef' });

/** Temporal dimension — when/how a dataset is measured (D10). */
export const temporalSchema = z
  .strictObject({
    dimensionStatus: presenceSchema,
    temporalGrain: temporalGrainSchema.optional(),
    extent: z.array(intervalSchema).optional(),
    temporalHistory: temporalHistorySchema.optional(),
    periods: z
      .array(
        z.strictObject({
          start: z.string(),
          end: z.string(),
          label: z.string().optional(),
        })
      )
      .optional(),
  })
  .meta({ id: 'Temporal' });

/** Spatial grain as code scheme + code in data dictionary (D8 — seam binding). */
export const spatialGrainSchema = z
  .strictObject({
    scheme: z.string(),
    code: z.string(),
    label: z.string().optional(),
  })
  .meta({ id: 'SpatialGrain' });

/** Spatial grain reference as FK in visualization Catalog (D8 — seam binding). */
export const spatialGrainRefSchema = z
  .strictObject({
    geographyId: z.string(),
    label: z.string().optional(),
  })
  .meta({ id: 'SpatialGrainRef' });

/** Spatial dimension — where/how a dataset is located (D10). */
export const spatialSchema = z
  .strictObject({
    dimensionStatus: presenceSchema,
    spatialGeometry: spatialGeometrySchema.optional(),
    extent: z.array(codedRefSchema).optional(),
    spatialGrain: spatialGrainSchema.optional(),
    field: z.string().optional(),
  })
  .meta({ id: 'Spatial' });

/** Dimension for metric slicing — distinct from spatial/temporal (D10). */
export const dimensionSchema = z
  .strictObject({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    kind: filterKindSchema,
    property: z.string(),
    aliases: z.array(z.string()).optional(),
  })
  .meta({ id: 'Dimension' });

/** Series: metric + dimensions + spatio-temporal grain combinations (D10). */
export const seriesSchema = z
  .strictObject({
    id: z.string(),
    metricId: z.string(),
    spatialGrain: spatialGrainRefSchema.optional(),
    temporalGrain: temporalGrainSchema.optional(),
    dimensions: z.array(dimensionSchema).optional(),
  })
  .meta({ id: 'Series' });

// Dataset schema (uses Temporal and Spatial)

export const datasetSchema = z
  .strictObject({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    aliases: z.array(z.string()).optional(),
    geographyIds: z.array(z.string()),
    metricIds: z.array(z.string()),
    source: z.string().optional(),
    temporal: temporalSchema.optional(),
    spatial: spatialSchema.optional(),
    artifact: z
      .strictObject({
        url: z.string(),
        format: z.enum(['csv', 'json', 'geojson', 'parquet']),
      })
      .optional(),
    columns: z.record(z.string(), z.string()).optional(),
  })
  .meta({ id: 'Dataset' });

// Filter schemas

/**
 * Filter domain always computed at runtime by the application. Catalog declares
 * only that a domain exists; the UI determines its shape from the data.
 *
 * Historical modes (no longer in use):
 * - 'values': pre-declared categorical options (UI built dropdown)
 * - 'range': pre-declared numeric bounds (UI built slider)
 * - 'interval': pre-declared temporal bounds (UI built date picker)
 *
 * All control logic now lives in the application, not the catalog.
 */
export const filterDomainSchema = z.strictObject({
  mode: z.literal('runtime'),
});

/** Operators that carry meaning for each kind. Ordering is irrelevant. */
const OPERATORS_BY_KIND = {
  categorical: ['eq', 'neq', 'in', 'not-in'],
  numeric: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'],
  temporal: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'],
} as const;

export const filterFieldSchema = z
  .strictObject({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    property: z.string(),
    kind: filterKindSchema,
    sourceDatasetId: z.string().optional(),
    sourceGeographyId: z.string().optional(),
    metricId: z.string().optional(),
    operators: z.array(layerFilterOperatorSchema).min(1),
    multiple: z.boolean().optional(),
    domain: filterDomainSchema,
  })
  .check((ctx) => {
    const filter = ctx.value;

    const declaredSources = [
      filter.sourceDatasetId,
      filter.sourceGeographyId,
    ].filter((source) => {
      return source !== undefined;
    });

    if (declaredSources.length !== 1) {
      ctx.issues.push({
        code: 'custom',
        input: filter,
        path: ['sourceDatasetId'],
        message:
          'declare exactly one of `sourceDatasetId` or `sourceGeographyId` — the property has to live somewhere, and it cannot live in two places',
      });
    }

    const allowedOperators: readonly string[] = OPERATORS_BY_KIND[filter.kind];

    for (const [index, operator] of filter.operators.entries()) {
      if (allowedOperators.includes(operator)) continue;
      ctx.issues.push({
        code: 'custom',
        input: filter,
        path: ['operators', index],
        message: `operator '${operator}' is meaningless for a '${filter.kind}' filter; allowed: ${allowedOperators.join(', ')}`,
      });
    }

    if (filter.multiple === true && filter.kind !== 'categorical') {
      ctx.issues.push({
        code: 'custom',
        input: filter,
        path: ['multiple'],
        message:
          '`multiple` only applies to a categorical filter, where several values can be selected at once',
      });
    }
  })
  .meta({ id: 'FilterField' });

export const mapTypeCatalogEntrySchema = z
  .strictObject({
    name: z.enum(['choropleth', 'dotDensity', 'proportionalCircles']),
    supportedGeometries: z.array(geometrySchema),
    metricKinds: z.array(metricKindSchema),
  })
  .meta({ id: 'MapTypeCatalogEntry' });

// Catalog schema (composes all others)

export const catalogSchema = z
  .strictObject({
    version: z.string().min(1),
    domain: z.string().optional(),
    datasets: z.array(datasetSchema),
    metrics: z.array(metricSchema),
    geographies: z.array(geographySchema),
    joins: z.array(joinSchema),
    series: z.array(seriesSchema).optional(),
    mapTypes: z.array(mapTypeCatalogEntrySchema),
    filters: z.array(filterFieldSchema),
    permissions: z.record(z.string(), z.unknown()).optional(),
  })
  .meta({
    id: 'Catalog',
    title: 'Catalog',
    $id: 'https://ttoss.dev/geovis-catalog/catalog.schema.json',
  });
