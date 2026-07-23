import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

import type { CatalogIssue, CatalogResult } from './catalogResult';
import { resolveCatalogOverallStatus } from './catalogResult';
import catalogSchema from './schema/catalog.schema.json';
import type { Catalog } from './schema/types';

const ajv = new Ajv2020({ strict: false });
addFormats(ajv);
const _validate = ajv.compile(catalogSchema);

/** Indexes of items whose `id` repeats one already seen earlier in `items`. */
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
 * Id-uniqueness per collection. No `repair` is computed — the fix is "choose
 * an id not already taken", and the only known values are the ones already
 * in use, which would be a self-defeating `allowed-values` suggestion.
 */
const checkDuplicateIds = (catalog: Catalog): CatalogIssue[] => {
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

  return issues;
};

/**
 * `Join.from`/`Join.to` referential integrity. `Join.cardinality` needs no
 * runtime check — the schema's `enum` already rejects any value outside
 * `'1:1' | '1:m' | 'm:1'` as `invalid-catalog-schema`.
 */
const checkJoinReferences = (catalog: Catalog): CatalogIssue[] => {
  const issues: CatalogIssue[] = [];
  const datasetIds = catalog.datasets.map((dataset) => {
    return dataset.id;
  });
  const geographyIds = catalog.geographies.map((geography) => {
    return geography.id;
  });
  const datasetIdSet = new Set(datasetIds);
  const geographyIdSet = new Set(geographyIds);

  for (const [index, join] of catalog.joins.entries()) {
    if (!datasetIdSet.has(join.from)) {
      issues.push({
        code: 'unknown-join-dataset',
        subject: { path: `joins[${index}].from`, id: join.from },
        message: `join references unknown dataset '${join.from}'`,
        repair: [
          {
            kind: 'allowed-values',
            path: `joins[${index}].from`,
            values: datasetIds,
          },
        ],
      });
    }

    if (!geographyIdSet.has(join.to)) {
      issues.push({
        code: 'unknown-join-geography',
        subject: { path: `joins[${index}].to`, id: join.to },
        message: `join references unknown geography '${join.to}'`,
        repair: [
          {
            kind: 'allowed-values',
            path: `joins[${index}].to`,
            values: geographyIds,
          },
        ],
      });
    }
  }

  return issues;
};

/**
 * `Dataset.geographyIds[]`/`metricIds[]` referential integrity. Closes the
 * gap left by only checking `Join.from`/`to`: a dataset could otherwise
 * declare a `metricIds`/`geographyIds` entry naming nothing in the catalog
 * and still pass validation, contradicting PRD-004's own Outcome ("the
 * catalog validates its own referential integrity").
 */
const checkDatasetReferences = (catalog: Catalog): CatalogIssue[] => {
  const issues: CatalogIssue[] = [];
  const geographyIds = catalog.geographies.map((geography) => {
    return geography.id;
  });
  const metricIds = catalog.metrics.map((metric) => {
    return metric.id;
  });
  const geographyIdSet = new Set(geographyIds);
  const metricIdSet = new Set(metricIds);

  for (const [datasetIndex, dataset] of catalog.datasets.entries()) {
    for (const [
      geographyIndex,
      geographyId,
    ] of dataset.geographyIds.entries()) {
      if (geographyIdSet.has(geographyId)) continue;
      issues.push({
        code: 'unknown-dataset-geography',
        subject: {
          path: `datasets[${datasetIndex}].geographyIds[${geographyIndex}]`,
          id: geographyId,
        },
        message: `dataset '${dataset.id}' references unknown geography '${geographyId}'`,
        repair: [
          {
            kind: 'allowed-values',
            path: `datasets[${datasetIndex}].geographyIds[${geographyIndex}]`,
            values: geographyIds,
          },
        ],
      });
    }

    for (const [metricIndex, metricId] of dataset.metricIds.entries()) {
      if (metricIdSet.has(metricId)) continue;
      issues.push({
        code: 'unknown-dataset-metric',
        subject: {
          path: `datasets[${datasetIndex}].metricIds[${metricIndex}]`,
          id: metricId,
        },
        message: `dataset '${dataset.id}' references unknown metric '${metricId}'`,
        repair: [
          {
            kind: 'allowed-values',
            path: `datasets[${datasetIndex}].metricIds[${metricIndex}]`,
            values: metricIds,
          },
        ],
      });
    }
  }

  return issues;
};

/**
 * `Geography.parentId` referential integrity and cycle detection. A cycle
 * (`A.parentId = B`, `B.parentId = A`) would otherwise pass every other
 * check and only surface later, when some consumer traverses the hierarchy
 * and loops forever — checked here instead, at catalog-authoring time.
 */
const checkGeographyHierarchy = (catalog: Catalog): CatalogIssue[] => {
  const issues: CatalogIssue[] = [];
  const geographyIds = catalog.geographies.map((geography) => {
    return geography.id;
  });
  const geographyIdSet = new Set(geographyIds);
  const geographyById = new Map(
    catalog.geographies.map((geography) => {
      return [geography.id, geography] as const;
    })
  );
  const indexById = new Map(
    catalog.geographies.map((geography, index) => {
      return [geography.id, index] as const;
    })
  );

  for (const [index, geography] of catalog.geographies.entries()) {
    if (geography.parentId === undefined) continue;
    if (geographyIdSet.has(geography.parentId)) continue;
    issues.push({
      code: 'unknown-parent-geography',
      subject: {
        path: `geographies[${index}].parentId`,
        id: geography.parentId,
      },
      message: `geography '${geography.id}' declares parentId '${geography.parentId}', which is not in catalog.geographies`,
      repair: [
        {
          kind: 'allowed-values',
          path: `geographies[${index}].parentId`,
          values: geographyIds,
        },
      ],
    });
  }

  // Walk each geography's parentId chain. A chain that revisits a geography
  // already seen in the SAME walk has looped — reported once per distinct
  // cycle, at the geography where the loop re-triggers. Unknown parents
  // (already reported above) simply end the walk.
  const reportedCycleIds = new Set<string>();
  for (const start of catalog.geographies) {
    const visited = new Set<string>();
    let currentId: string | undefined = start.id;

    while (currentId !== undefined) {
      if (visited.has(currentId)) {
        if (!reportedCycleIds.has(currentId)) {
          reportedCycleIds.add(currentId);
          issues.push({
            code: 'cyclic-geography-hierarchy',
            subject: {
              path: `geographies[${indexById.get(currentId)}].parentId`,
              id: currentId,
            },
            message: `geography '${currentId}' is part of a parentId cycle and cannot be traversed`,
          });
        }
        break;
      }

      visited.add(currentId);
      currentId = geographyById.get(currentId)?.parentId;
    }
  }

  return issues;
};

/**
 * Validates a raw value against the catalog JSON Schema and enforces
 * cross-field referential integrity rules not expressible in the schema.
 * Returns a `CatalogResult`: `{ status: 'valid', catalog }` on success, or a
 * failure status carrying every issue found in one pass.
 */
export const validateCatalog = (input: unknown): CatalogResult => {
  const schemaValid = _validate(input);

  if (!schemaValid) {
    const issues: CatalogIssue[] = (_validate.errors ?? []).map((e) => {
      const path = e.instancePath || '(root)';
      return {
        code: 'invalid-catalog-schema',
        subject: { path },
        message: `${path} ${e.message}`,
      };
    });
    return { status: 'invalid', issues };
  }

  const catalog = input as unknown as Catalog;
  const issues: CatalogIssue[] = [
    ...checkDuplicateIds(catalog),
    ...checkJoinReferences(catalog),
    ...checkDatasetReferences(catalog),
    ...checkGeographyHierarchy(catalog),
  ];

  if (issues.length > 0) {
    return { status: resolveCatalogOverallStatus(issues), issues };
  }

  return { status: 'valid', catalog };
};
