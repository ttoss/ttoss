import type { CapabilitySet } from '@ttoss/geovis';

import type { CatalogIssue, CatalogResult } from './catalogResult';
import { resolveCatalogOverallStatus } from './catalogResult';
import { catalogSchema } from './schema/catalog';
import type { Catalog } from './schema/types';
import {
  checkDatasetReferences,
  checkDuplicateDatasetFieldNames,
  checkDuplicateIds,
  checkFilterReferences,
  checkGeographyHierarchy,
  checkJoinReferences,
  checkMapTypeCapabilities,
  checkSeriesReferences,
  formatIssuePath,
} from './validateCatalogChecks';

/**
 * Validates a raw value against the catalog schema and enforces cross-field
 * referential integrity rules the schema cannot express. Returns a
 * `CatalogResult`: `{ status: 'valid', catalog }` on success, or a failure
 * status carrying every issue found in one pass.
 *
 * `options.capabilities` is optional: pass the active engine adapter's
 * `CapabilitySet` (`adapter.getCapabilities()`) to additionally reject map
 * types the catalog calls data-adequate but that adapter cannot render.
 */
export const validateCatalog = (
  input: unknown,
  options?: { capabilities?: CapabilitySet }
): CatalogResult => {
  const parsed = catalogSchema.safeParse(input);

  if (!parsed.success) {
    const issues: CatalogIssue[] = parsed.error.issues.map((issue) => {
      const path = formatIssuePath(issue.path);
      return {
        code: 'invalid-catalog-schema',
        subject: { path },
        message: `${path} ${issue.message}`,
      };
    });
    return { status: 'invalid', issues };
  }

  const catalog = parsed.data as Catalog;
  const issues: CatalogIssue[] = [
    ...checkDuplicateIds(catalog),
    ...checkDuplicateDatasetFieldNames(catalog),
    ...checkJoinReferences(catalog),
    ...checkDatasetReferences(catalog),
    ...checkFilterReferences(catalog),
    ...checkSeriesReferences(catalog),
    ...checkGeographyHierarchy(catalog),
    ...checkMapTypeCapabilities(catalog, options?.capabilities),
  ];

  if (issues.length > 0) {
    return { status: resolveCatalogOverallStatus(issues), issues };
  }

  return { status: 'valid', catalog };
};
