import type { LayerFilterOperator } from '@ttoss/geovis';

/** Presence indicator for spatio-temporal dimensions (D8, D10). */
export type Presence = 'described' | 'not_applicable' | 'unknown';

/** ISO-8601 duration or grain keyword for temporal data (D10). */
export type TemporalGrain =
  | 'instant'
  | 'irregular'
  | 'continuous'
  | 'unknown'
  | string; // ISO-8601 duration: P1Y, P1M, PT15M, P10Y, etc.

/** Temporal interval with optional open ends (D10). */
export interface Interval {
  start?: string; // ISO-8601 date/datetime
  end?: string; // ISO-8601 date/datetime
}

/** Reference to a coded geography value (D10). */
export interface CodedRef {
  /** External code value, e.g. IBGE municipality code '3304557' */
  code: string;
  /** Optional label for the code value */
  label?: string;
}

/** History/update pattern for temporal data (D10). */
export type TemporalHistory =
  | 'snapshot' // entire dataset re-observed at each period
  | 'overwrite' // values replace previous; no historic record
  | 'append_only' // new records appended; never updated
  | 'revised' // historical values may change under a pinned Catalog.version
  | 'unknown';

/** Temporal dimension — when/how a dataset is measured (D10). */
export interface Temporal {
  /** Whether temporal grain/coverage is documented */
  status: Presence;
  /** ISO-8601 durations or keywords (P1Y, PT15M, instant, continuous, unknown) */
  grain?: TemporalGrain;
  /** Time intervals the dataset covers; extents for time-bounded datasets */
  extent?: Interval[];
  /** Update pattern: snapshot, overwrite, append_only, revised, unknown */
  history?: TemporalHistory;
  /** Explicit periods, optional — overrides gaps or carries per-period metadata */
  periods?: Array<{ start: string; end: string; label?: string }>;
}

/** Spatial geometry type extended with grid support (D10). */
export type SpatialGeometry =
  | 'point'
  | 'polygon'
  | 'line'
  | 'multipolygon'
  | 'none';

/** Spatial grain as code scheme + code in data dictionary (D8 — seam binding). */
export interface SpatialGrain {
  /** Code system, e.g. 'ibge:municipio', 'sicar:imovel', 'h3' */
  scheme: string;
  /** Field name or code value in the dataset */
  code: string;
  /** Optional label for display */
  label?: string;
}

/** Spatial grain reference as FK in visualization Catalog (D8 — seam binding). */
export interface SpatialGrainRef {
  /** Foreign key to catalog.geographies[].id */
  geographyId: string;
  /** Optional label for display */
  label?: string;
}

/** Spatial dimension — where/how a dataset is located (D10). */
export interface Spatial {
  /** Whether spatial coverage is documented */
  status: Presence;
  /** Geometry type: point, polygon, line, multipolygon, or none (D10) */
  geometry?: SpatialGeometry;
  /** Geographic regions/codes covered by the dataset */
  extent?: CodedRef[];
  /** Grain: ISO-8601 token or spatial resolution */
  grain?: TemporalGrain; // reuses same pattern as temporal for consistency
  /** Dataset field name carrying spatial reference */
  field?: string;
}

/** Dimension for metric slicing — distinct from spatial/temporal (D10). */
export interface Dimension {
  /** Unique identifier for this dimension */
  id: string;
  /** Human-readable name */
  label: string;
  /** Description of what the dimension slices */
  description?: string;
  /** Data type: categorical (enums), numeric (range), temporal (dates) */
  kind: 'categorical' | 'numeric' | 'temporal';
  /** Dataset field carrying the dimension values */
  property: string;
  /** Alternative names for search/discovery */
  aliases?: string[];
}

/** Series: metric + dimensions + spatio-temporal grain combinations (D10). */
export interface Series {
  /** Unique identifier for this series */
  id: string;
  /** Metric id for the measure */
  metricId: string;
  /** Optional spatial grain binding (FK to geography) */
  spatialGrain?: SpatialGrainRef;
  /** Optional temporal grain resolution */
  temporalGrain?: TemporalGrain;
  /** Dimensions for metric slicing (e.g., by sex, age group) */
  dimensions?: Dimension[];
}

export type MetricKind =
  | 'count'
  | 'rate' // e.g. "per capita" or "per household"
  | 'ratio' // e.g. "male/female" or "urban/rural"
  | 'index' // e.g. "HDI" or "Gini"
  | 'density' // e.g. "population per km²"
  | 'distance';

export interface Metric {
  /** Unique identifier for the metric, referenced by Dataset.metricIds. */
  id: string;
  /** Human-readable name. */
  label: string;
  /** Detailed description of what the metric measures and how it is calculated. */
  description: string;
  /** Alternative names for search/discovery. */
  aliases?: string[];
  /** Measurement unit — free-form string (km, USD, hab/km²), not an enum. */
  unit?: string;
  /** Semantic category: count, rate, ratio, index, density, or distance. */
  kind: MetricKind;
  /** Hint for how to format values in the UI. */
  formatter?: 'number' | 'percent' | 'currency' | 'compact';
  /** How null values should be treated when rendering. */
  nullPolicy: 'hide' | 'zero' | 'explain';
}

export interface Dataset {
  /** Unique identifier for the dataset, referenced by Join.from. */
  id: string;
  /** Human-readable name. */
  label: string;
  /** Detailed description of the data, its collection methodology, and any caveats. */
  description: string;
  /** Alternative names for search/discovery. */
  aliases?: string[];
  /** IDs of geographies this dataset can be joined to — validated by `validateCatalog`. */
  geographyIds: string[];
  /** IDs of metrics this dataset carries — validated by `validateCatalog`. */
  metricIds: string[];
  /** Provenance/attribution — free-form, e.g. 'ibge', 'ipea', 'sicar'. */
  source?: string;
  /** Temporal dimension: coverage, grain, history (D10, supersedes D4 temporal). */
  temporal?: Temporal;
  /** Spatial dimension: coverage, geometry, grain (D10, supersedes D7 geometry). */
  spatial?: Spatial;
  /** Where the data artifact is located and in what format (D9). */
  artifact?: { url: string; format: 'csv' | 'json' | 'geojson' | 'parquet' };
  /** Metric ID → dataset column carrying the metric's values (D9). */
  columns?: Record<string, string>;
}

/**
 * How a geography's features are structured (D7).
 * Absent ⇒ treated as 'administrative' (the commonest case).
 */
export type GeographyKind = 'administrative' | 'grid' | 'poi' | 'custom';

export interface Geography {
  /** Unique identifier for the geography, referenced by Dataset.geographyIds and Join.to. */
  id: string;
  /** Human-readable name. */
  label: string;
  /** Description of the geographic coverage and the boundary source. */
  description: string;
  /** Alternative names for search/discovery, e.g. 'município' for 'municipality'. */
  aliases?: string[];
  /**
   * Discriminates admin boundary (IBGE malha territorial) vs. spatial-index
   * grid (H3/S2/geohash, IBGE grade estatística) vs. POI collection vs.
   * custom parcel (SICAR rural property, arbitrary polygon not part of any
   * official hierarchy).
   */
  kind?: GeographyKind;
  /** Ordinal depth in a nesting hierarchy — lower is coarser (0 = country, 1 = state, 2 = city). */
  level?: number;
  /** Geography id one level up that contains this one, enabling roll-up/drill-down — validated by `validateCatalog`. */
  parentId?: string;
  /** External code system feature ids follow, e.g. 'ibge:municipio', 'sicar:imovel', 'h3'. */
  codeScheme?: string;
  /** Tessellation resolution for `kind: 'grid'`, e.g. 'h3:8', '1km'. */
  resolution?: string;
}

export interface Join {
  /** Dataset id that is the source of the join. */
  from: string;
  /** Geography id that is the target of the join. */
  to: string;
  /** Field mapping: left = field in dataset, right = field in geography. */
  on: { left: string; right: string };
  /** Cardinality: 1:1 (one-to-one), 1:m (one dataset row → many geography features), m:1 (many dataset rows → one geography feature). */
  cardinality: '1:1' | '1:m' | 'm:1';
}

/** Data type of a filter field — decides which domain modes and operators are legal. */
export type FilterKind = 'categorical' | 'numeric' | 'temporal';

/** One selectable value of a `values` domain, already labelled for display. */
export interface FilterOption {
  /** The value written into the emitted filter predicate. */
  value: string | number;
  /** Human-readable text for the control. */
  label: string;
  /** Number of features carrying this value, when known — lets a UI show counts or hide empty options. */
  count?: number;
}

/**
 * What a control may offer the user. The `mode` discriminant is what tells a
 * UI which widget to build, so it is required — an absent domain used to mean
 * "unknown", which no component could act on.
 *
 * `runtime` declares that the domain exists but is only knowable from the
 * data: call `computeFilterDomain` with the rows to obtain a concrete one.
 */
export type FilterDomain =
  | { mode: 'values'; values: FilterOption[] }
  | { mode: 'range'; min: number; max: number; step?: number }
  | { mode: 'interval'; start: string; end: string }
  | { mode: 'runtime' };

export interface FilterField {
  /** Unique identifier, referenced by intents and by dispatched filter actions. */
  id: string;
  /** Human-readable name for the control. */
  label: string;
  /** Help text explaining what the filter narrows. */
  description?: string;
  /** Alternative names for search/discovery. */
  aliases?: string[];
  /** Feature property the predicate reads — becomes `LayerFilter.property`. */
  property: string;
  /** Data type, which constrains both `domain.mode` and `operators`. */
  kind: FilterKind;
  /** Dataset carrying `property`. Mutually exclusive with `sourceGeographyId`; exactly one is required. */
  sourceDatasetId?: string;
  /** Geography carrying `property`. Mutually exclusive with `sourceDatasetId`; exactly one is required. */
  sourceGeographyId?: string;
  /** Metric this filter narrows, when it filters on a measure — supplies `unit` and `formatter` for display. */
  metricId?: string;
  /** Comparisons the control may emit. Each maps 1:1 to a `LayerFilter.operator`. */
  operators: LayerFilterOperator[];
  /** Whether more than one value may be selected at once. Only meaningful for a `values` domain. */
  multiple?: boolean;
  /** Values or bounds the control offers. */
  domain: FilterDomain;
}

export interface MapTypeCatalogEntry {
  /** Map type name. */
  name: 'choropleth' | 'dotDensity' | 'proportionalCircles';
  /** Geometry types this map type supports. */
  supportedGeometries: Array<'point' | 'polygon' | 'line'>;
  /** Metric kinds that can be visualized with this map type. */
  metricKinds: MetricKind[];
}

export interface Catalog {
  /**
   * Opaque version identifier for this catalog instance — not the package's
   * schema version. Free-form, non-empty string: an organization may version
   * its own catalog by semver, a date/quarter ('2026-Q3'), or an incrementing
   * integer as a string. PRD-005's `IntentResult` records the `Catalog.version`
   * an intent was validated against, so this only needs to be stable and
   * comparable within one organization's catalog history, not globally.
   */
  version: string;
  /** Unique domain/namespace of the catalog, e.g. 'br' for Brazil. */
  domain?: string;
  /** Data collections available in this catalog. */
  datasets: Dataset[];
  /** Metrics (measures/indicators) available across datasets. */
  metrics: Metric[];
  /** Geographic boundaries/indexes available for joining. */
  geographies: Geography[];
  /** Declared join paths between datasets and geographies. */
  joins: Join[];
  /** Metric + spatio-temporal grain + dimension combinations (D10). */
  series?: Series[];
  /** Map types supported by this catalog, with their geometry and metric constraints. */
  mapTypes: MapTypeCatalogEntry[];
  /** User-facing filter controls for exploring the catalog. */
  filters: FilterField[];
  /** Authz metadata — opaque to the schema, consumed by the application layer. */
  permissions?: Record<string, unknown>;
}
