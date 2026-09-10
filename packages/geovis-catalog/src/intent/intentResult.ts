import type { RepairOption } from '@ttoss/geovis';

import type { CatalogIssueCode, CatalogResultStatus } from '../catalogResult';
import { CATALOG_ISSUE_CODE_STATUS } from '../catalogResult';
import type { AnalyticalIntent } from './schema';

/**
 * `IntentResultStatus` extends `CatalogResultStatus` with
 * `'needs-clarification'` — PRD-004 plan D3 anticipated this extension for
 * the case where an intent is well-formed but genuinely ambiguous (D4 step
 * 5): more than one dataset matches, and picking one silently would violate
 * PRD-005's "ambiguity is representable" Must item.
 */
export type IntentResultStatus = CatalogResultStatus | 'needs-clarification';

/**
 * `CatalogIssueCode` is inherited for status-taxonomy consistency with
 * `CatalogResultStatus` (PRD-004 plan D3) — `validateIntent` itself never
 * emits a bare `CatalogIssueCode`, since it takes an already-typed,
 * already-validated `Catalog`, not a raw value it re-validates. Every code
 * `validateIntent` can actually produce is one of the members listed after
 * the union.
 */
export type IntentIssueCode =
  | CatalogIssueCode
  | 'invalid-intent-schema'
  | 'invalid-intent-schema-version'
  | 'unknown-metric'
  | 'unknown-category'
  | 'unknown-denominator-metric'
  | 'unknown-geography'
  | 'dataset-metric-mismatch'
  | 'dataset-geography-mismatch'
  | 'no-matching-dataset'
  | 'ambiguous-dataset'
  | 'unknown-filter-field'
  | 'sensitive-filter-field'
  | 'unsupported-filter-operator';

/** Maps every `IntentIssueCode` this package can actually emit to its `IntentResultStatus` category (PRD-005 plan D4's `no-matching-dataset` rename included). */
export const INTENT_ISSUE_CODE_STATUS: Record<
  IntentIssueCode,
  IntentResultStatus
> = {
  ...CATALOG_ISSUE_CODE_STATUS,
  'invalid-intent-schema': 'invalid',
  'invalid-intent-schema-version': 'invalid',
  'unknown-metric': 'mismatch',
  'unknown-category': 'mismatch',
  'unknown-denominator-metric': 'mismatch',
  'unknown-geography': 'mismatch',
  'dataset-metric-mismatch': 'mismatch',
  'dataset-geography-mismatch': 'mismatch',
  'no-matching-dataset': 'mismatch',
  'ambiguous-dataset': 'needs-clarification',
  'unknown-filter-field': 'mismatch',
  'sensitive-filter-field': 'mismatch',
  'unsupported-filter-operator': 'mismatch',
};

export interface IntentIssue {
  /** Closed enum — see `IntentIssueCode`. Never parse `message`. */
  code: IntentIssueCode;
  /** Machine-locatable subject: a path into the intent, plus the offending id when one exists. */
  subject: { path: string; id?: string };
  /** Human-readable explanation. Presentation only, never driving logic. */
  message: string;
  /** Present only when alternatives are computable at the check site. */
  repair?: RepairOption[];
}

/**
 * Discriminated union returned by `validateIntent`. A `'valid'` result
 * always resolves `datasetId` — supplied and confirmed, or inferred as the
 * single matching candidate (PRD-005 plan D4/D9) — so PRD-006's resolver
 * never repeats dataset-selection logic.
 */
export type IntentResult =
  | {
      status: 'valid';
      intent: AnalyticalIntent;
      datasetId: string;
      catalogVersion: string;
    }
  | { status: IntentResultStatus; issues: IntentIssue[] };

/** Precedence order used to pick one overall status when issues span categories. */
const STATUS_PRECEDENCE: IntentResultStatus[] = [
  'invalid',
  'mismatch',
  'needs-clarification',
];

/**
 * Picks the overall result status from a non-empty set of failure issues,
 * using `STATUS_PRECEDENCE` — mirrors `resolveCatalogOverallStatus`.
 */
export const resolveIntentOverallStatus = (
  issues: ReadonlyArray<IntentIssue>
): IntentResultStatus => {
  const statuses = new Set(
    issues.map((issue) => {
      return INTENT_ISSUE_CODE_STATUS[issue.code];
    })
  );
  const overall = STATUS_PRECEDENCE.find((status) => {
    return statuses.has(status);
  });
  return overall!;
};
