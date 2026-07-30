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
    status: presenceSchema,
    grain: temporalGrainSchema.optional(),
    extent: z.array(intervalSchema).optional(),
    history: temporalHistorySchema.optional(),
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
    status: presenceSchema,
    geometry: spatialGeometrySchema.optional(),
    extent: z.array(codedRefSchema).optional(),
    grain: temporalGrainSchema.optional(),
    field: z.string().optional(),
  })
  .meta({ id: 'Spatial' });

/** Dimension for metric slicing — distinct from spatial/temporal (D10). */
export const dimensionSchema = z
  .strictObject({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    kind: z.enum(['categorical', 'numeric', 'temporal']),
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

export const filterOptionSchema = z.strictObject({
  value: z.union([z.string(), z.number()]),
  label: z.string(),
  count: z.number().int().nonnegative().optional(),
});

export const filterDomainSchema = z.discriminatedUnion('mode', [
  z.strictObject({
    mode: z.literal('values'),
    values: z.array(filterOptionSchema),
  }),
  z.strictObject({
    mode: z.literal('range'),
    min: z.number(),
    max: z.number(),
    step: z.number().positive().optional(),
  }),
  z.strictObject({
    mode: z.literal('interval'),
    start: z.string(),
    end: z.string(),
  }),
  z.strictObject({ mode: z.literal('runtime') }),
]);

/** Domain modes each kind may declare, beyond the always-legal `runtime`. */
const DOMAIN_MODES_BY_KIND = {
  categorical: ['values'],
  numeric: ['range'],
  temporal: ['interval'],
} as const;

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

    const allowedModes: readonly string[] = DOMAIN_MODES_BY_KIND[filter.kind];

    if (
      filter.domain.mode !== 'runtime' &&
      !allowedModes.includes(filter.domain.mode)
    ) {
      ctx.issues.push({
        code: 'custom',
        input: filter,
        path: ['domain', 'mode'],
        message: `a '${filter.kind}' filter takes domain mode '${allowedModes[0]}' or 'runtime', not '${filter.domain.mode}'`,
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
