import { z } from 'zod';

import {
  coverageSchema,
  filterKindSchema,
  precisionSchema,
  presenceSchema,
  slugSchema,
  spatialGeometrySchema,
  temporalGrainSchema,
  temporalHistorySchema,
  updateFrequencySchema,
} from './enums';

/** An instant (event time), an interval (start/end), or a recorded (system time) field name. */
export const temporalFieldsSchema = z
  .strictObject({
    instant: z.string().optional(),
    start: z.string().optional(),
    end: z.string().optional(),
    recorded: z.string().optional(),
  })
  .check((ctx) => {
    const fields = ctx.value;
    const hasInstant = fields.instant !== undefined;
    const hasStart = fields.start !== undefined;
    const hasEnd = fields.end !== undefined;

    if (hasInstant && (hasStart || hasEnd)) {
      ctx.issues.push({
        code: 'custom',
        input: fields,
        path: ['instant'],
        message:
          "declare either 'instant' or the 'start'/'end' pair, not both — they describe mutually exclusive column roles",
      });
    } else if (hasStart !== hasEnd) {
      ctx.issues.push({
        code: 'custom',
        input: fields,
        path: hasStart ? ['end'] : ['start'],
        message:
          "'start' and 'end' must be declared together — a record's interval has to have both ends named",
      });
    } else if (!hasInstant && !hasStart && !hasEnd) {
      ctx.issues.push({
        code: 'custom',
        input: fields,
        path: ['instant'],
        message:
          "declare 'instant', or the 'start'/'end' pair, to name which column carries the temporal reading",
      });
    }
  })
  .meta({ id: 'TemporalFields' });

/** Shared presence check every spatio-temporal dimension declares (D8, D10). */
const dimensionPresenceSchema = z.strictObject({
  dimensionStatus: presenceSchema,
});

/** `Interval` as part of temporal extent (D10). */
export const intervalSchema = z
  .strictObject({
    start: z.string().optional(),
    end: z.string().optional(),
  })
  .meta({ id: 'Interval' });

/** Temporal dimension — when/how a dataset is measured (D10, D16). */
export const temporalSchema = dimensionPresenceSchema
  .extend({
    temporalGrain: temporalGrainSchema.optional(),
    extent: z.array(intervalSchema).optional(),
    updateFrequency: updateFrequencySchema.optional(),
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
    field: temporalFieldsSchema.optional(),
    timezone: z.string().optional(),
  })
  .meta({ id: 'Temporal' });

/** Coded reference as code + label (D10). */
export const codedRefSchema = z
  .strictObject({
    code: z.string(),
    label: z.string().optional(),
  })
  .meta({ id: 'CodedRef' });

/** Spatial grain as code scheme + code in data dictionary (D8). */
export const spatialGrainSchema = z
  .strictObject({
    scheme: z.string(),
    code: z.string(),
    label: z.string().optional(),
  })
  .meta({ id: 'SpatialGrain' });

/** Spatial grain reference as FK in visualization Catalog (D8). */
export const spatialGrainRefSchema = z
  .strictObject({
    geographyId: z.string(),
    label: z.string().optional(),
  })
  .meta({ id: 'SpatialGrainRef' });

/** Spatial dimension — where/how a dataset is located (D10, D16). */
export const spatialSchema = dimensionPresenceSchema
  .extend({
    spatialGeometry: spatialGeometrySchema.optional(),
    extent: z.array(codedRefSchema).optional(),
    coverage: coverageSchema.optional(),
    spatialGrain: spatialGrainSchema.optional(),
    precision: precisionSchema.optional(),
    srid: z.number().optional(),
    field: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .meta({ id: 'Spatial' });

/** Dimension for metric slicing — distinct from spatial/temporal (D10). */
export const dimensionSchema = z
  .strictObject({
    id: z.string(),
    title: z.string(),
    slug: slugSchema.optional(),
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
