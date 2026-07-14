import type { VisualizationSpec } from './types';

/**
 * Closed set of failure categories a `GeoVisResult` can carry (ADR-0001).
 * `insufficient-data` and `needs-clarification` are reserved: no v1 check
 * produces them yet, but they are part of the union so it never changes shape.
 */
export type GeoVisResultStatus =
  | 'invalid'
  | 'mismatch'
  | 'unsupported'
  | 'insufficient-data'
  | 'needs-clarification';

/**
 * Closed list of machine-readable issue codes. Each code maps 1:1 to a check;
 * adding a code is additive, renaming or removing one is breaking.
 */
export type GeoVisIssueCode =
  | 'invalid-schema'
  | 'invalid-threshold-order'
  | 'invalid-threshold-value'
  | 'invalid-size-range'
  | 'invalid-size-mode'
  | 'duplicate-map-data-id'
  | 'unknown-map-data-id'
  | 'unknown-source'
  | 'source-scope-conflict'
  | 'duplicate-dimension'
  | 'state-key-collision'
  | 'unsupported-source-type'
  | 'unsupported-layer-type'
  | 'unsupported-data-feature'
  | 'unsupported-view-feature'
  | 'unsupported-engine'
  | 'unsupported-patch-target'
  | 'policy-violation';

/**
 * Maps each failure `GeoVisIssueCode` to the `GeoVisResultStatus` category it
 * belongs to. `policy-violation` is intentionally absent — it is a warning
 * attached to `resolved` results, never a failure status on its own.
 */
export const ISSUE_CODE_STATUS: Record<
  Exclude<GeoVisIssueCode, 'policy-violation'>,
  GeoVisResultStatus
> = {
  'invalid-schema': 'invalid',
  'invalid-threshold-order': 'invalid',
  'invalid-threshold-value': 'invalid',
  'invalid-size-range': 'invalid',
  'invalid-size-mode': 'invalid',
  'duplicate-map-data-id': 'mismatch',
  'unknown-map-data-id': 'mismatch',
  'unknown-source': 'mismatch',
  'source-scope-conflict': 'mismatch',
  'duplicate-dimension': 'mismatch',
  'state-key-collision': 'mismatch',
  'unsupported-source-type': 'unsupported',
  'unsupported-layer-type': 'unsupported',
  'unsupported-data-feature': 'unsupported',
  'unsupported-view-feature': 'unsupported',
  'unsupported-engine': 'unsupported',
  'unsupported-patch-target': 'unsupported',
};

/** Precedence order used to pick one overall status when issues span categories. */
const STATUS_PRECEDENCE: GeoVisResultStatus[] = [
  'invalid',
  'mismatch',
  'unsupported',
  'insufficient-data',
  'needs-clarification',
];

/**
 * A concrete, already-known alternative attached to an issue when — and only
 * when — the check site already has the correct value in hand. `values` for
 * `allowed-values` and `value` for `set-value` must never be invented.
 */
export type RepairOption =
  | {
      kind: 'allowed-values';
      path: string;
      values: ReadonlyArray<string | number>;
    }
  | { kind: 'set-value'; path: string; value: unknown; label?: string };

export interface GeoVisIssue {
  /** Closed enum — see `GeoVisIssueCode`. Never parse `message`. */
  code: GeoVisIssueCode;
  /** Machine-locatable subject: a path into the spec, plus the offending id when one exists. */
  subject: { path: string; id?: string };
  /** Human-readable explanation. Presentation only, never driving logic. */
  message: string;
  /** Present only when alternatives are computable at the check site. */
  repair?: RepairOption[];
}

/**
 * Discriminated union returned by every resolution-affecting entry point.
 * `resolved` never coexists with issues that block rendering — `warnings`
 * holds non-blocking issues (e.g. policy violations) instead.
 */
export type GeoVisResult =
  | { status: 'resolved'; spec: VisualizationSpec; warnings: GeoVisIssue[] }
  | { status: GeoVisResultStatus; issues: GeoVisIssue[] };

/**
 * Picks the overall result status from a non-empty set of failure issues,
 * using `STATUS_PRECEDENCE`. Each issue keeps its own category via `code`.
 */
export const resolveOverallStatus = (
  issues: ReadonlyArray<GeoVisIssue>
): GeoVisResultStatus => {
  const statuses = new Set(
    issues.map((issue) => {
      return ISSUE_CODE_STATUS[
        issue.code as Exclude<GeoVisIssueCode, 'policy-violation'>
      ];
    })
  );
  const overall = STATUS_PRECEDENCE.find((status) => {
    return statuses.has(status);
  });
  // Every failure issue has a status-bearing code, so this is unreachable in practice.
  return overall ?? 'invalid';
};
