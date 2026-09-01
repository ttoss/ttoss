import type { CatalogIssue, CatalogIssueCode } from './catalogResult';
import type { Catalog } from './schema/types';

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

/**
 * One catalog collection whose entries must carry unique ids (D5). Every
 * entry below is the same shape — label, path, code, and how to read the
 * collection off the catalog — the axis the pre-refactor duplicate-id checks
 * had already made visible by repeating.
 */
const DUPLICATE_ID_CHECKS: ReadonlyArray<{
  code: CatalogIssueCode;
  label: string;
  path: string;
  items: (catalog: Catalog) => ReadonlyArray<{ id: string }>;
}> = [
  {
    code: 'duplicate-metric-id',
    label: 'metric',
    path: 'metrics',
    items: (catalog) => {
      return catalog.metrics;
    },
  },
  {
    code: 'duplicate-dataset-id',
    label: 'dataset',
    path: 'datasets',
    items: (catalog) => {
      return catalog.datasets;
    },
  },
  {
    code: 'duplicate-geography-id',
    label: 'geography',
    path: 'geographies',
    items: (catalog) => {
      return catalog.geographies;
    },
  },
  {
    code: 'duplicate-filter-id',
    label: 'filter',
    path: 'filters',
    items: (catalog) => {
      return catalog.filters;
    },
  },
  {
    code: 'duplicate-collection-id',
    label: 'collection',
    path: 'collections',
    items: (catalog) => {
      return catalog.collections ?? [];
    },
  },
  {
    code: 'duplicate-series-id',
    label: 'series',
    path: 'series',
    items: (catalog) => {
      return catalog.series ?? [];
    },
  },
];

export const checkDuplicateIds = (catalog: Catalog): CatalogIssue[] => {
  return DUPLICATE_ID_CHECKS.flatMap(({ code, label, path, items }) => {
    const entries = items(catalog);
    return findDuplicateIndexes(entries).map((index) => {
      const id = entries[index].id;
      return {
        code,
        subject: { path: `${path}[${index}].id`, id },
        message: `${label} id '${id}' is declared more than once`,
      };
    });
  });
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

// Re-export from validate-references for convenience
export {
  checkDatasetReferences,
  checkFilterReferences,
  checkGeographyHierarchy,
  checkJoinReferences,
  checkMapTypeCapabilities,
  checkSeriesReferences,
} from './validateReferences';
