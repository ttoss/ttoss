import type { GeoVisIssue, GeoVisResult } from '@ttoss/geovis';

/** A two-level severity: enough for v1 to distinguish a blocking failure from a warning (ADR-0003). */
export type IssueSeverity = 'warning' | 'error';

/**
 * The issues to show for the current result: `resolved` results carry
 * non-blocking `warnings` (severity `'warning'`); every other status carries
 * blocking `issues` (severity `'error'`) — a single severity for the whole
 * result, since a result is never a mix of the two.
 */
export const getResultIssues = (result: GeoVisResult): GeoVisIssue[] => {
  return result.status === 'resolved' ? result.warnings : result.issues;
};

export const getResultSeverity = (result: GeoVisResult): IssueSeverity => {
  return result.status === 'resolved' ? 'warning' : 'error';
};

/**
 * Whether the workspace is in the cold-start case: a failing result with no
 * prior successful resolve. The `map` slot's empty state exclusively covers
 * this case, so the `warnings` slot's default panel suppresses its own issue
 * list here to avoid showing the same failure (and its repair buttons)
 * twice on screen.
 */
export const isColdStart = ({
  result,
  hasResolvedOnce,
}: {
  result: GeoVisResult;
  hasResolvedOnce: boolean;
}): boolean => {
  return !hasResolvedOnce && result.status !== 'resolved';
};
