import type { LayerFilterOperator } from '@ttoss/geovis';
import type { z } from 'zod';

import type {
  cameraFramingSchema,
  catalogSchema,
  codedRefSchema,
  collectionSchema,
  coverageSchema,
  datasetAccessSchema,
  datasetFieldRoleSchema,
  datasetFieldSchema,
  datasetProvenanceSchema,
  datasetSchema,
  dimensionSchema,
  filterDomainSchema,
  filterFieldSchema,
  filterKindSchema,
  geographyKindSchema,
  geographySchema,
  geometrySchema,
  intervalSchema,
  joinSchema,
  layerFilterOperatorSchema,
  mapTypeCatalogEntrySchema,
  metricCategorySchema,
  metricKindSchema,
  metricSchema,
  precisionSchema,
  presenceSchema,
  seriesSchema,
  spatialGeometrySchema,
  spatialGrainRefSchema,
  spatialGrainSchema,
  spatialSchema,
  temporalFieldsSchema,
  temporalGrainSchema,
  temporalHistorySchema,
  temporalSchema,
  updateFrequencySchema,
} from './catalog';

/**
 * The public types are `z.infer` aliases of the schemas in `./catalog`, which
 * are the single source of truth (D1). Field-level documentation lives in the
 * package README and in the schema module; a type here can never describe a
 * field the validator does not accept.
 */

/** Presence indicator for spatio-temporal dimensions (D8, D10). */
export type Presence = z.infer<typeof presenceSchema>;

/**
 * ISO-8601 duration (`P1Y`, `P1M`, `PT15M`) or keyword (`instant`,
 * `irregular`, `continuous`, `unknown`) for temporal resolution (D10).
 */
export type TemporalGrain = z.infer<typeof temporalGrainSchema>;

/** Temporal interval with optional open ends (D10). */
export type Interval = z.infer<typeof intervalSchema>;

/** Reference to a coded geography value, e.g. IBGE municipality '3304557'. */
export type CodedRef = z.infer<typeof codedRefSchema>;

/** An institutional data source, referenced by `Dataset.collectionId` (D13). */
export type Collection = z.infer<typeof collectionSchema>;

/** History/update pattern for temporal data (D10). */
export type TemporalHistory = z.infer<typeof temporalHistorySchema>;

/** Update cadence — with what frequency new data arrives (D16). Independent of `TemporalGrain`. */
export type UpdateFrequency = z.infer<typeof updateFrequencySchema>;

/** Column(s) carrying temporal values — `instant` xor `start`+`end`, plus optional `recorded` (D16). */
export type TemporalFields = z.infer<typeof temporalFieldsSchema>;

/** Temporal dimension — when/how a dataset is measured (D10, D16). */
export type Temporal = z.infer<typeof temporalSchema>;

/** Spatial geometry type extended with grid support (D10). */
export type SpatialGeometry = z.infer<typeof spatialGeometrySchema>;

/** How completely `Spatial.extent` is populated with data (D16). */
export type Coverage = z.infer<typeof coverageSchema>;

/** Positional precision of point/geocoded data (D16). */
export type Precision = z.infer<typeof precisionSchema>;

/** Spatial grain as code scheme + code in a data dictionary (D8 — seam binding). */
export type SpatialGrain = z.infer<typeof spatialGrainSchema>;

/** Spatial grain reference as FK into `catalog.geographies` (D8 — seam binding). */
export type SpatialGrainRef = z.infer<typeof spatialGrainRefSchema>;

/** Spatial dimension — where/how a dataset is located (D10, D16). */
export type Spatial = z.infer<typeof spatialSchema>;

/** Dimension for metric slicing — distinct from spatial/temporal (D10). */
export type Dimension = z.infer<typeof dimensionSchema>;

/** Series: metric + dimensions + spatio-temporal grain combinations (D10). */
export type Series = z.infer<typeof seriesSchema>;

/** Geometry types a map type can render. */
export type Geometry = z.infer<typeof geometrySchema>;

/** Semantic category of a measure: count, rate, ratio, index, density, distance, nominal. */
export type MetricKind = z.infer<typeof metricKindSchema>;

/** A closed value a `'nominal'` metric may take (D1). */
export type MetricCategory = z.infer<typeof metricCategorySchema>;

/** A measure/indicator carried by one or more datasets. */
export type Metric = z.infer<typeof metricSchema>;

/** Role a `DatasetField` plays in its dataset — identifier, geometry, or join column (D16). */
export type DatasetFieldRole = z.infer<typeof datasetFieldRoleSchema>;

/** Per-column metadata for a `Dataset`, including per-field sensitivity (D12) and role (D16). */
export type DatasetField = z.infer<typeof datasetFieldSchema>;

/** Per-dataset acquisition detail, finer-grained than `Collection` (D16). */
export type DatasetProvenance = z.infer<typeof datasetProvenanceSchema>;

/** Structured LGPD/governance classification for a `Dataset`, alongside the coarser `sensible` flag (D16). */
export type DatasetAccess = z.infer<typeof datasetAccessSchema>;

/** A data collection, its spatio-temporal dimensions, and its artifact (D9, D10). */
export type Dataset = z.infer<typeof datasetSchema>;

/**
 * How a geography's features are structured (D7).
 * Absent ⇒ treated as 'administrative' (the commonest case).
 */
export type GeographyKind = z.infer<typeof geographyKindSchema>;

/** A geographic boundary set or spatial index available for joining. */
export type Geography = z.infer<typeof geographySchema>;

/** Bounding box + optional centre/zoom — resolver input, never a view preset (D5). */
export type CameraFraming = z.infer<typeof cameraFramingSchema>;

/** A declared join path from a dataset to a geography. */
export type Join = z.infer<typeof joinSchema>;

/** Data type of a filter field — decides which operators are legal. */
export type FilterKind = z.infer<typeof filterKindSchema>;

/**
 * Filter domain marker. Always `{ mode: 'runtime' }` — domain is computed by
 * the application from the data. Catalog declares only that a domain exists.
 */
export type FilterDomain = z.infer<typeof filterDomainSchema>;

/** A user-facing filter control declared by the catalog. */
export type FilterField = z.infer<typeof filterFieldSchema>;

/** A map type with its geometry and metric-kind constraints. */
export type MapTypeCatalogEntry = z.infer<typeof mapTypeCatalogEntrySchema>;

/** The catalog document — the contract every geovis intent validates against. */
export type Catalog = z.infer<typeof catalogSchema>;

/**
 * `FilterField.operators` has to stay assignable to `@ttoss/geovis`'s
 * `LayerFilterOperator`, since each operator maps 1:1 to a `LayerFilter`.
 * A divergence between the two packages breaks this line at compile time.
 */
type AssertOperatorParity =
  z.infer<typeof layerFilterOperatorSchema> extends LayerFilterOperator
    ? LayerFilterOperator extends z.infer<typeof layerFilterOperatorSchema>
      ? true
      : never
    : never;

export type { AssertOperatorParity };
