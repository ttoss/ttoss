import { z } from 'zod';

import { seriesSchema, spatialSchema, temporalSchema } from './dimensions';
import {
  filterKindSchema,
  geographyKindSchema,
  geometrySchema,
  layerFilterOperatorSchema,
  metricKindSchema,
  slugSchema,
} from './enums';

// Re-export enums
export {
  coverageSchema,
  datasetFieldRoleSchema,
  filterKindSchema,
  geographyKindSchema,
  geometrySchema,
  layerFilterOperatorSchema,
  metricKindSchema,
  precisionSchema,
  presenceSchema,
  slugSchema,
  spatialGeometrySchema,
  temporalGrainSchema,
  temporalHistorySchema,
  updateFrequencySchema,
} from './enums';

// Re-export dimensions
export {
  codedRefSchema,
  dimensionSchema,
  intervalSchema,
  seriesSchema,
  spatialGrainRefSchema,
  spatialGrainSchema,
  spatialSchema,
  temporalFieldsSchema,
  temporalSchema,
} from './dimensions';

/**
 * A closed value a `'nominal'` metric may take (D1). `order` positions it in
 * legends/UI independent of alphabetical id sort; `colorToken` is a `@ttoss/ui`
 * theme token, not a raw color, so a categorical choropleth stays on-theme.
 */
export const metricCategorySchema = z
  .strictObject({
    id: z.string(),
    title: z.string(),
    slug: slugSchema.optional(),
    order: z.number().optional(),
    colorToken: z.string().optional(),
  })
  .meta({ id: 'MetricCategory' });

export const metricSchema = z
  .strictObject({
    id: z.string(),
    title: z.string(),
    slug: slugSchema.optional(),
    description: z.string(),
    aliases: z.array(z.string()).optional(),
    unit: z.string().optional(),
    kind: metricKindSchema,
    categories: z.array(metricCategorySchema).optional(),
    formatter: z.enum(['number', 'percent', 'currency', 'compact']).optional(),
    nullPolicy: z.enum(['hide', 'zero', 'explain']),
  })
  .check((ctx) => {
    const metric = ctx.value;
    if (metric.kind === 'nominal') {
      if (metric.categories === undefined || metric.categories.length === 0) {
        ctx.issues.push({
          code: 'custom',
          input: metric,
          path: ['categories'],
          message:
            "a 'nominal' metric must declare a non-empty 'categories' whitelist",
        });
      }
    } else if (metric.categories !== undefined) {
      ctx.issues.push({
        code: 'custom',
        input: metric,
        path: ['categories'],
        message: `'categories' only applies to a 'nominal' metric, not '${metric.kind}'`,
      });
    }
  })
  .meta({ id: 'Metric' });

export const cameraFramingSchema = z
  .strictObject({
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    cameraCenter: z.tuple([z.number(), z.number()]).optional(),
    cameraZoom: z.number().optional(),
  })
  .meta({ id: 'CameraFraming' });

export const geographySchema = z
  .strictObject({
    id: z.string(),
    title: z.string(),
    slug: slugSchema.optional(),
    description: z.string(),
    aliases: z.array(z.string()).optional(),
    kind: geographyKindSchema.optional(),
    level: z.number().optional(),
    parentId: z.string().optional(),
    codeScheme: z.string().optional(),
    resolution: z.string().optional(),
    cameraFraming: cameraFramingSchema.optional(),
  })
  .meta({ id: 'Geography' });

export const collectionSchema = z
  .strictObject({
    id: z.string(),
    title: z.string(),
    slug: slugSchema.optional(),
    description: z.string(),
    organization: z.string().optional(),
    sourceUrl: z.string().optional(),
    publicReferenceUrl: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  })
  .meta({ id: 'Collection' });

export const joinSchema = z
  .strictObject({
    from: z.string(),
    to: z.string(),
    on: z.strictObject({ left: z.string(), right: z.string() }),
    cardinality: z.enum(['1:1', '1:m', 'm:1']),
  })
  .meta({ id: 'Join' });

export const datasetFieldSchema = z
  .strictObject({
    name: z.string(),
    title: z.string().optional(),
    role: z.enum(['identifier', 'geometry', 'join']).optional(),
    unit: z.string().optional(),
    sensible: z.boolean().optional(),
  })
  .check((ctx) => {
    const field = ctx.value;
    if (field.sensible === true && field.title === undefined) {
      ctx.issues.push({
        code: 'custom',
        input: field,
        path: ['title'],
        message:
          "a field with 'sensible: true' must declare 'title' — exposure can never be the result of an omission",
      });
    }
  })
  .meta({ id: 'DatasetField' });

export const datasetProvenanceSchema = z
  .strictObject({
    url: z.string().optional(),
    notes: z.string().optional(),
  })
  .meta({ id: 'DatasetProvenance' });

export const datasetAccessSchema = z
  .strictObject({
    level: z.enum(['public', 'restricted']),
    containsPersonalData: z.boolean(),
    notes: z.string().optional(),
  })
  .meta({ id: 'DatasetAccess' });

export const datasetSchema = z
  .strictObject({
    id: z.string(),
    title: z.string(),
    slug: slugSchema.optional(),
    description: z.string(),
    aliases: z.array(z.string()).optional(),
    geographyIds: z.array(z.string()),
    metricIds: z.array(z.string()),
    collectionId: z.string().optional(),
    temporal: temporalSchema.optional(),
    spatial: spatialSchema.optional(),
    artifact: z
      .strictObject({
        url: z.string(),
        format: z.enum(['csv', 'json', 'geojson', 'parquet']),
      })
      .optional(),
    columns: z.record(z.string(), z.string()).optional(),
    fields: z.array(datasetFieldSchema).optional(),
    generatedBy: z.string().optional(),
    provenance: datasetProvenanceSchema.optional(),
    access: datasetAccessSchema.optional(),
    sensible: z.boolean().optional(),
  })
  .meta({ id: 'Dataset' });

export const filterDomainSchema = z.strictObject({
  mode: z.literal('runtime'),
});

const OPERATORS_BY_KIND = {
  categorical: ['eq', 'neq', 'in', 'not-in'],
  numeric: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'],
  temporal: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'],
} as const;

export const filterFieldSchema = z
  .strictObject({
    id: z.string(),
    title: z.string(),
    slug: slugSchema.optional(),
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
    sensible: z.boolean().optional(),
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
          'declare exactly one of `sourceDatasetId` or `sourceGeographyId`',
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
        message: '`multiple` only applies to a categorical filter',
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
    collections: z.array(collectionSchema).optional(),
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
