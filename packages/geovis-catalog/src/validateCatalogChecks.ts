import type { CapabilitySet } from '@ttoss/geovis';

import type { CatalogIssue } from './catalogResult';
import type { Catalog } from './schema/types';
import {
  checkDatasetReferences,
  checkFilterReferences,
  checkGeographyHierarchy,
  checkJoinReferences,
  checkMapTypeCapabilities,
  checkSeriesReferences,
} from './validate-references';

export const formatIssuePath = (path: ReadonlyArray<PropertyKey>): string => {
  if (path.length === 0) return '(root)';
  return `/${path.join('/')}`;
};

const findDuplicateIndexes = (
  items: ReadonlyArray<{ id: string }>
): number[] => {
  const seen = new Set<string>();
  const duplicateIndexes: number[] = [];

  for (const [index, item] of items.entries()) {
    if (seen.has(item.id)) {
      duplicateIndexes.push(index);
    } else {
      seen.add(item.id);
    }
  }

  return duplicateIndexes;
};

export const checkDuplicateIds = (catalog: Catalog): CatalogIssue[] => {
  const issues: CatalogIssue[] = [];

  for (const index of findDuplicateIndexes(catalog.metrics)) {
    const id = catalog.metrics[index].id;
    issues.push({
      code: 'duplicate-metric-id',
      subject: { path: `metrics[${index}].id`, id },
      message: `metric id '${id}' is declared more than once`,
    });
  }

  for (const index of findDuplicateIndexes(catalog.datasets)) {
    const id = catalog.datasets[index].id;
    issues.push({
      code: 'duplicate-dataset-id',
      subject: { path: `datasets[${index}].id`, id },
      message: `dataset id '${id}' is declared more than once`,
    });
  }

  for (const index of findDuplicateIndexes(catalog.geographies)) {
    const id = catalog.geographies[index].id;
    issues.push({
      code: 'duplicate-geography-id',
      subject: { path: `geographies[${index}].id`, id },
      message: `geography id '${id}' is declared more than once`,
    });
  }

  for (const index of findDuplicateIndexes(catalog.filters)) {
    const id = catalog.filters[index].id;
    issues.push({
      code: 'duplicate-filter-id',
      subject: { path: `filters[${index}].id`, id },
      message: `filter id '${id}' is declared more than once`,
    });
  }

  const collections = catalog.collections ?? [];
  for (const index of findDuplicateIndexes(collections)) {
    const id = collections[index].id;
    issues.push({
      code: 'duplicate-collection-id',
      subject: { path: `collections[${index}].id`, id },
      message: `collection id '${id}' is declared more than once`,
    });
  }

  const series = catalog.series ?? [];
  for (const index of findDuplicateIndexes(series)) {
    const id = series[index].id;
    issues.push({
      code: 'duplicate-series-id',
      subject: { path: `series[${index}].id`, id },
      message: `series id '${id}' is declared more than once`,
    });
  }

  return issues;
};

export const checkDuplicateDatasetFieldNames = (
  catalog: Catalog
): CatalogIssue[] => {
  const issues: CatalogIssue[] = [];

  for (const [datasetIndex, dataset] of catalog.datasets.entries()) {
    if (dataset.fields === undefined) continue;

    const seen = new Set<string>();
    for (const [fieldIndex, field] of dataset.fields.entries()) {
      if (seen.has(field.name)) {
        issues.push({
          code: 'duplicate-dataset-field-name',
          subject: {
            path: `datasets[${datasetIndex}].fields[${fieldIndex}].name`,
            id: field.name,
          },
          message: `dataset '${dataset.id}' declares field name '${field.name}' more than once`,
        });
      } else {
        seen.add(field.name);
      }
    }
  }

  return issues;
};

export const checkCatalogIssues = (
  catalog: Catalog,
  capabilities: CapabilitySet | undefined
): CatalogIssue[] => {
  return [
    ...checkDuplicateIds(catalog),
    ...checkDuplicateDatasetFieldNames(catalog),
    ...checkFilterReferences(catalog),
    ...checkJoinReferences(catalog),
    ...checkDatasetReferences(catalog),
    ...checkGeographyHierarchy(catalog),
    ...checkSeriesReferences(catalog),
    ...checkMapTypeCapabilities(catalog, capabilities),
  ];
};

// Re-export from validate-references for convenience
export {
  checkDatasetReferences,
  checkFilterReferences,
  checkGeographyHierarchy,
  checkJoinReferences,
  checkMapTypeCapabilities,
  checkSeriesReferences,
} from './validate-references';
