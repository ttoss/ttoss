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
