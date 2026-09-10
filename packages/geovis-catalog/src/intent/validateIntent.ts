import type { Catalog } from '../schema/types';
import { formatIssuePath } from '../validateCatalogChecks';
import type { IntentIssue, IntentResult } from './intentResult';
import { resolveIntentOverallStatus } from './intentResult';
import { intentSchema } from './schema';
import {
  checkCategory,
  checkDataset,
  checkDenominatorMetric,
  checkFilters,
  checkGeography,
  checkMetric,
  checkSchemaVersion,
} from './validateIntentChecks';

/**
 * Validates a raw value against `intentSchema` and grounds every reference
 * against `catalog` — the PRD-005 plan D4 algorithm, corrected by the
 * grilling session's D9/D10 mechanism fixes: dataset resolution is a
 * `metricIds`/`geographyIds` intersection over `catalog.datasets` (not
 * `Catalog.joins`), and `IntentFilter.field` grounds against
 * `Catalog.filters[]` (not raw dataset columns), scoped to the resolved
 * dataset/geography.
 *
 * Every check runs and its issues are collected — the pass never
 * short-circuits on the first failure, mirroring `validateCatalog`'s
 * "report everything found in one pass" contract. Dataset resolution and
 * filter grounding (`validateIntentChecks.ts`) run only once the metric and
 * geography they depend on have themselves resolved, since there is
 * nothing meaningful to intersect or scope against otherwise.
 */
export const validateIntent = (
  input: unknown,
  catalog: Catalog
): IntentResult => {
  const parsed = intentSchema.safeParse(input);

  if (!parsed.success) {
    const issues: IntentIssue[] = parsed.error.issues.map((issue) => {
      const path = formatIssuePath(issue.path);
      return {
        code: 'invalid-intent-schema',
        subject: { path },
        message: `${path} ${issue.message}`,
      };
    });
    return { status: 'invalid', issues };
  }

  const intent = parsed.data;
  const { resolvedMetric, issues: metricIssues } = checkMetric(intent, catalog);
  const { resolvedGeography, issues: geographyIssues } = checkGeography(
    intent,
    catalog
  );
  const { resolvedDatasetId, issues: datasetIssues } = checkDataset(
    intent,
    catalog,
    resolvedMetric !== undefined && resolvedGeography !== undefined
  );

  const issues: IntentIssue[] = [
    ...checkSchemaVersion(intent),
    ...metricIssues,
    ...checkCategory(intent, resolvedMetric),
    ...checkDenominatorMetric(intent, catalog),
    ...geographyIssues,
    ...datasetIssues,
    ...checkFilters(intent, catalog, resolvedDatasetId),
  ];

  if (issues.length > 0) {
    return { status: resolveIntentOverallStatus(issues), issues };
  }

  return {
    status: 'valid',
    intent,
    datasetId: resolvedDatasetId!,
    catalogVersion: catalog.version,
  };
};
