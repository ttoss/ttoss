import type { RepairOption } from '@ttoss/geovis';

import type { Catalog } from './schema/types';

/**
 * Closed set of failure categories a `CatalogResult` can carry — mirrors the
 * shape of `@ttoss/geovis`'s `GeoVisResultStatus` (ADR-0001) without literally
 * reusing its type, since `GeoVisIssueCode` is a closed union scoped to
 * spec/runtime concerns that don't describe catalog failures.
 */
export type CatalogResultStatus = 'mismatch' | 'invalid';

/**
 * Closed list of machine-readable issue codes. Each code maps 1:1 to a check;
 * adding a code is additive, renaming or removing one is breaking.
 */
export type CatalogIssueCode =
  | 'invalid-catalog-schema' // invalid: fails the JSON Schema (Ajv)
  | 'duplicate-metric-id' // invalid: two metrics share an id
  | 'duplicate-dataset-id'
  | 'duplicate-geography-id'
  | 'duplicate-filter-id' // invalid: two filters share an id
  | 'unknown-filter-dataset' // mismatch: FilterField.sourceDatasetId references a dataset id not in catalog.datasets
  | 'unknown-filter-geography' // mismatch: FilterField.sourceGeographyId references a geography id not in catalog.geographies
  | 'unknown-filter-metric' // mismatch: FilterField.metricId references a metric id not in catalog.metrics
  | 'unknown-join-dataset' // mismatch: join references a dataset id not in catalog.datasets
  | 'unknown-join-geography' // mismatch: join references a geography id not in catalog.geographies
  | 'unknown-dataset-geography' // mismatch: Dataset.geographyIds[] references a geography id not in catalog.geographies
  | 'unknown-dataset-metric' // mismatch: Dataset.metricIds[] references a metric id not in catalog.metrics
  | 'unknown-parent-geography' // mismatch: Geography.parentId references a geography id not in catalog.geographies
  | 'cyclic-geography-hierarchy' // mismatch: a Geography.parentId chain loops back on itself
  | 'unsupported-map-type-geometry'; // mismatch: MapTypeCatalogEntry.supportedGeometries names a geometry the active adapter's CapabilitySet does not render

/**
 * Maps each `CatalogIssueCode` to the `CatalogResultStatus` category it
 * belongs to.
 */
export const CATALOG_ISSUE_CODE_STATUS: Record<
  CatalogIssueCode,
  CatalogResultStatus
> = {
  'invalid-catalog-schema': 'invalid',
  'duplicate-metric-id': 'invalid',
  'duplicate-dataset-id': 'invalid',
  'duplicate-geography-id': 'invalid',
  'duplicate-filter-id': 'invalid',
  'unknown-filter-dataset': 'mismatch',
  'unknown-filter-geography': 'mismatch',
  'unknown-filter-metric': 'mismatch',
  'unknown-join-dataset': 'mismatch',
  'unknown-join-geography': 'mismatch',
  'unknown-dataset-geography': 'mismatch',
  'unknown-dataset-metric': 'mismatch',
  'unknown-parent-geography': 'mismatch',
  'cyclic-geography-hierarchy': 'mismatch',
  'unsupported-map-type-geometry': 'mismatch',
};

/** Precedence order used to pick one overall status when issues span categories. */
const STATUS_PRECEDENCE: CatalogResultStatus[] = ['invalid', 'mismatch'];

export interface CatalogIssue {
  /** Closed enum — see `CatalogIssueCode`. Never parse `message`. */
  code: CatalogIssueCode;
  /** Machine-locatable subject: a path into the catalog, plus the offending id when one exists. */
  subject: { path: string; id?: string };
  /** Human-readable explanation. Presentation only, never driving logic. */
  message: string;
  /** Present only when alternatives are computable at the check site. */
  repair?: RepairOption[];
}

/**
 * Discriminated union returned by `validateCatalog`. `valid` never coexists
 * with issues — a `Catalog` either passes every check or reports what
 * failed, mirroring ADR-0001's "nothing renders on failure" contract at the
 * catalog layer.
 */
export type CatalogResult =
  | { status: 'valid'; catalog: Catalog }
  | { status: CatalogResultStatus; issues: CatalogIssue[] };

/**
 * Picks the overall result status from a non-empty set of failure issues,
 * using `STATUS_PRECEDENCE`. Each issue keeps its own category via `code`.
 */
export const resolveCatalogOverallStatus = (
  issues: ReadonlyArray<CatalogIssue>
): CatalogResultStatus => {
  const statuses = new Set(
    issues.map((issue) => {
      return CATALOG_ISSUE_CODE_STATUS[issue.code];
    })
  );
  const overall = STATUS_PRECEDENCE.find((status) => {
    return statuses.has(status);
  });
  return overall!;
};
