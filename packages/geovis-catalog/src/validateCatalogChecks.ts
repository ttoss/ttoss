import type { CapabilitySet } from '@ttoss/geovis';

import type { CatalogIssue } from './catalogResult';
import type { Catalog } from './schema/types';

/**
 * Renders a Zod issue path in the JSON-Pointer style the previous Ajv-backed
 * implementation reported (`/datasets/0/id`), so `subject.path` stays stable
 * for consumers across the validator swap.
 */
export const formatIssuePath = (path: ReadonlyArray<PropertyKey>): string => {
  if (path.length === 0) return '(root)';
  return `/${path.join('/')}`;
};

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

  for (const index of findDuplicateIndexes(catalog.series ?? [])) {
    const id = (catalog.series ?? [])[index].id;
    issues.push({
      code: 'duplicate-series-id',
      subject: { path: `series[${index}].id`, id },
      message: `series id '${id}' is declared more than once`,
    });
  }

  return issues;
};

/**
 * `Dataset.fields[]` name-uniqueness (D12). Two fields sharing a name on the
 * same dataset would make `IntentFilter.field` resolution (PRD-005's
 * `validateIntent`) ambiguous — which field a filter targets has to be
 * unambiguous within one dataset, the same way ids are unambiguous within
 * one catalog collection (`checkDuplicateIds`).
 */
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

/**
 * `FilterField` referential integrity. The schema already guarantees exactly
 * one of `sourceDatasetId`/`sourceGeographyId` is present and that the
 * kind/domain/operator combination is coherent; what it cannot see is whether
 * the ids resolve, which is what a UI needs before it can label a control.
 */
export const checkFilterReferences = (catalog: Catalog): CatalogIssue[] => {
  const issues: CatalogIssue[] = [];
  const datasetIds = catalog.datasets.map((dataset) => {
    return dataset.id;
  });
  const geographyIds = catalog.geographies.map((geography) => {
    return geography.id;
  });
  const metricIds = catalog.metrics.map((metric) => {
    return metric.id;
  });
  const datasetIdSet = new Set(datasetIds);
  const geographyIdSet = new Set(geographyIds);
  const metricIdSet = new Set(metricIds);

  for (const [index, filter] of catalog.filters.entries()) {
    if (
      filter.sourceDatasetId !== undefined &&
      !datasetIdSet.has(filter.sourceDatasetId)
    ) {
      issues.push({
        code: 'unknown-filter-dataset',
        subject: {
          path: `filters[${index}].sourceDatasetId`,
          id: filter.sourceDatasetId,
        },
        message: `filter '${filter.id}' references unknown dataset '${filter.sourceDatasetId}'`,
        repair: [
          {
            kind: 'allowed-values',
            path: `filters[${index}].sourceDatasetId`,
            values: datasetIds,
          },
        ],
      });
    }

    if (
      filter.sourceGeographyId !== undefined &&
      !geographyIdSet.has(filter.sourceGeographyId)
    ) {
      issues.push({
        code: 'unknown-filter-geography',
        subject: {
          path: `filters[${index}].sourceGeographyId`,
          id: filter.sourceGeographyId,
        },
        message: `filter '${filter.id}' references unknown geography '${filter.sourceGeographyId}'`,
        repair: [
          {
            kind: 'allowed-values',
            path: `filters[${index}].sourceGeographyId`,
            values: geographyIds,
          },
        ],
      });
    }

    if (filter.metricId !== undefined && !metricIdSet.has(filter.metricId)) {
      issues.push({
        code: 'unknown-filter-metric',
        subject: {
          path: `filters[${index}].metricId`,
          id: filter.metricId,
        },
        message: `filter '${filter.id}' references unknown metric '${filter.metricId}'`,
        repair: [
          {
            kind: 'allowed-values',
            path: `filters[${index}].metricId`,
            values: metricIds,
          },
        ],
      });
    }
  }

  return issues;
};

/**
 * `Join.from`/`Join.to` referential integrity. `Join.cardinality` needs no
 * runtime check — the schema's `enum` already rejects any value outside
 * `'1:1' | '1:m' | 'm:1'` as `invalid-catalog-schema`.
 */
export const checkJoinReferences = (catalog: Catalog): CatalogIssue[] => {
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
export const checkDatasetReferences = (catalog: Catalog): CatalogIssue[] => {
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
export const checkGeographyHierarchy = (catalog: Catalog): CatalogIssue[] => {
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
 * `Series.metricId`/`Series.spatialGrain.geographyId` referential integrity —
 * the same closure D5 already applies to `Join`/`Dataset`/`FilterField`,
 * extended to `catalog.series` so a dangling reference there is caught here
 * instead of surfacing only when a future PRD-006 resolver walks it.
 */
export const checkSeriesReferences = (catalog: Catalog): CatalogIssue[] => {
  const issues: CatalogIssue[] = [];
  const metricIds = catalog.metrics.map((metric) => {
    return metric.id;
  });
  const geographyIds = catalog.geographies.map((geography) => {
    return geography.id;
  });
  const metricIdSet = new Set(metricIds);
  const geographyIdSet = new Set(geographyIds);

  for (const [index, series] of (catalog.series ?? []).entries()) {
    if (!metricIdSet.has(series.metricId)) {
      issues.push({
        code: 'unknown-series-metric',
        subject: { path: `series[${index}].metricId`, id: series.metricId },
        message: `series '${series.id}' references unknown metric '${series.metricId}'`,
        repair: [
          {
            kind: 'allowed-values',
            path: `series[${index}].metricId`,
            values: metricIds,
          },
        ],
      });
    }

    const geographyId = series.spatialGrain?.geographyId;
    if (geographyId !== undefined && !geographyIdSet.has(geographyId)) {
      issues.push({
        code: 'unknown-series-geography',
        subject: {
          path: `series[${index}].spatialGrain.geographyId`,
          id: geographyId,
        },
        message: `series '${series.id}' references unknown geography '${geographyId}'`,
        repair: [
          {
            kind: 'allowed-values',
            path: `series[${index}].spatialGrain.geographyId`,
            values: geographyIds,
          },
        ],
      });
    }
  }

  return issues;
};

/**
 * `MapTypeCatalogEntry.supportedGeometries` documents which geometries make
 * a map type *data-adequate* — it says nothing about whether the active
 * engine adapter can actually render that geometry. Passing the adapter's
 * `CapabilitySet` (from `@ttoss/geovis`) lets `validateCatalog` report the
 * intersection: a map type the catalog declares data-adequate but the
 * adapter cannot render is a mismatch the catalog alone cannot see.
 */
export const checkMapTypeCapabilities = (
  catalog: Catalog,
  capabilities: CapabilitySet | undefined
): CatalogIssue[] => {
  if (capabilities === undefined) return [];

  const issues: CatalogIssue[] = [];

  for (const [index, mapType] of catalog.mapTypes.entries()) {
    const unsupported = mapType.supportedGeometries.filter((geometry) => {
      return !capabilities.layerGeometries.includes(geometry);
    });

    if (unsupported.length === 0) continue;

    issues.push({
      code: 'unsupported-map-type-geometry',
      subject: {
        path: `mapTypes[${index}].supportedGeometries`,
        id: mapType.name,
      },
      message: `map type '${mapType.name}' declares geometries [${unsupported.join(', ')}] the active adapter's capabilities do not render`,
      repair: [
        {
          kind: 'allowed-values',
          path: `mapTypes[${index}].supportedGeometries`,
          values: capabilities.layerGeometries,
        },
      ],
    });
  }

  return issues;
};
