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
  /** Primary geometry type of the dataset features. */
  geometry: 'point' | 'polygon' | 'line';
  /** IDs of geographies this dataset can be joined to — validated by `validateCatalog`. */
  geographyIds: string[];
  /** IDs of metrics this dataset carries — validated by `validateCatalog`. */
  metricIds: string[];
  /** Provenance/attribution — free-form, e.g. 'ibge', 'ipea', 'sicar'. */
  source?: string;
  /** Temporal coverage interval (ISO 8601 dates). */
  temporal?: { start: string; end: string };
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

export interface FilterField {
  /** Field name to filter on. */
  field: string;
  /** Data type of the filter field — determines how the domain is interpreted. */
  kind: 'categorical' | 'numeric' | 'temporal';
  /** Allowed domain values: string[] for categorical, { min; max } for numeric/temporal. Interpreted based on `kind`. */
  domain?: unknown;
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
  /** Map types supported by this catalog, with their geometry and metric constraints. */
  mapTypes: MapTypeCatalogEntry[];
  /** User-facing filter controls for exploring the catalog. */
  filters: FilterField[];
  /** Authz metadata — opaque to the schema, consumed by the application layer. */
  permissions?: Record<string, unknown>;
}
