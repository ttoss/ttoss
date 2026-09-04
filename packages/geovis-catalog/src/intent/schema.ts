import { z } from 'zod';

import { layerFilterOperatorSchema } from '../schema/catalog';
import { ANALYTICAL_TASKS } from './taskVocabulary';

/** Intent-schema version, checked for exact match by `validateIntent` (D2), not embedded as a schema-level literal — mirrors `@ttoss/geovis`'s `SPEC_SCHEMA_VERSION` pattern. */
export const INTENT_SCHEMA_VERSION = 1;

/**
 * A filter clause on an `AnalyticalIntent`. `field` is a bare string at the
 * shape level — it is grounded against `Catalog.filters[].id` by
 * `validateIntent` (PRD-005 plan D9), not here. `op` reuses
 * `@ttoss/geovis-catalog`'s own `layerFilterOperatorSchema` rather than a
 * separate symbolic vocabulary (D10), so no translation layer is needed
 * when grounding against a `FilterField`'s own `operators` list.
 */
export const intentFilterSchema = z
  .strictObject({
    field: z.string(),
    op: layerFilterOperatorSchema,
    value: z.union([
      z.string(),
      z.number(),
      z.array(z.union([z.string(), z.number()])),
    ]),
  })
  .meta({ id: 'IntentFilter' });

/**
 * `start`/`end` accept either a bare ISO date or a full ISO datetime (D11)
 * — `Dataset.temporal.temporalGrain` ranges from `'instant'` (needs
 * time-of-day) to coarser grains (date precision is enough), so a single
 * fixed format would reject one side or force the other to pad a fake
 * time-of-day. Range plausibility against a resolved dataset's
 * `Temporal.extent` stays a resolver-time concern (PRD-006), not checked
 * here or by `validateIntent`.
 */
export const intentTimeSchema = z
  .strictObject({
    start: z.iso.date().or(z.iso.datetime()).optional(),
    end: z.iso.date().or(z.iso.datetime()).optional(),
  })
  .meta({ id: 'IntentTime' });

/**
 * `AnalyticalIntent`'s Zod schema (PRD-005 plan D1/D2), authored directly —
 * no hand-maintained JSON Schema document is kept anywhere in this package;
 * `getIntentJSONSchema()` derives one via `z.toJSONSchema` on demand.
 *
 * `metricId`/`geographyId`/`categoryId`/`denominatorMetricId` are bare
 * strings at this layer: shape validation only. Whether they resolve
 * against a `Catalog`, and whether `categoryId`/`denominatorMetricId` are
 * *required* given the resolved metric/task, is `validateIntent`'s job
 * (D4/D6/D7), which needs the catalog this schema never sees.
 */
export const intentSchema = z
  .strictObject({
    schemaVersion: z.number(),
    analyticalTask: z.enum(ANALYTICAL_TASKS),
    metricId: z.string(),
    geographyId: z.string(),
    datasetId: z.string().optional(),
    categoryId: z.string().optional(),
    denominatorMetricId: z.string().optional(),
    time: intentTimeSchema.optional(),
    filters: z.array(intentFilterSchema).optional(),
    rationale: z.string().optional(),
  })
  .meta({ id: 'AnalyticalIntent' });

export type IntentFilter = z.infer<typeof intentFilterSchema>;
export type IntentTime = z.infer<typeof intentTimeSchema>;
export type AnalyticalIntent = z.infer<typeof intentSchema>;
