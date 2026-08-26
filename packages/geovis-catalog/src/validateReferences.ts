import type { CapabilitySet } from '@ttoss/geovis';

import type { CatalogIssue, CatalogIssueCode } from './catalogResult';
import type { Catalog } from './schema/types';

const idsOf = (items: ReadonlyArray<{ id: string }>): string[] => {
  return items.map((item) => {
    return item.id;
  });
};

const isDefined = <T>(value: T | undefined): value is T => {
  return value !== undefined;
};

/**
 * One id-reference field resolved against one target collection: the shape
 * every check below shares (D5). Returns the issue when `id` is defined and
 * absent from `knownIds`; `undefined` (never absent from the array) when the
 * reference is unset or resolves.
 */
const checkRef = ({
  path,
  id,
  knownIds,
  allowedValues,
  code,
  message,
}: {
  path: string;
  id: string | undefined;
  knownIds: ReadonlySet<string>;
  allowedValues: readonly string[];
  code: CatalogIssueCode;
  message: string;
}): CatalogIssue | undefined => {
  if (id === undefined || knownIds.has(id)) return undefined;
  return {
    code,
    subject: { path, id },
    message,
    repair: [{ kind: 'allowed-values', path, values: allowedValues }],
  };
};

/** `checkRef` applied to every entry of an array-valued reference field. */
const checkRefs = ({
  ids,
  path,
  knownIds,
  allowedValues,
  code,
  message,
}: {
  ids: readonly string[];
  path: (index: number) => string;
  knownIds: ReadonlySet<string>;
  allowedValues: readonly string[];
  code: CatalogIssueCode;
  message: (id: string) => string;
}): CatalogIssue[] => {
  return ids.flatMap((id, index) => {
    const issue = checkRef({
      path: path(index),
      id,
      knownIds,
      allowedValues,
      code,
      message: message(id),
    });
    return issue ? [issue] : [];
  });
};

/**
 * `FilterField` referential integrity. The schema already guarantees exactly
 * one of `sourceDatasetId`/`sourceGeographyId` is present and that the
 * kind/domain/operator combination is coherent; what it cannot see is whether
 * the ids resolve, which is what a UI needs before it can label a control.
 */
export const checkFilterReferences = (catalog: Catalog): CatalogIssue[] => {
  const datasetIds = idsOf(catalog.datasets);
  const geographyIds = idsOf(catalog.geographies);
  const metricIds = idsOf(catalog.metrics);
  const datasetIdSet = new Set(datasetIds);
  const geographyIdSet = new Set(geographyIds);
  const metricIdSet = new Set(metricIds);

  return catalog.filters.flatMap((filter, index) => {
    return [
      checkRef({
        path: `filters[${index}].sourceDatasetId`,
        id: filter.sourceDatasetId,
        knownIds: datasetIdSet,
        allowedValues: datasetIds,
        code: 'unknown-filter-dataset',
        message: `filter '${filter.id}' references unknown dataset '${filter.sourceDatasetId}'`,
      }),
      checkRef({
        path: `filters[${index}].sourceGeographyId`,
        id: filter.sourceGeographyId,
        knownIds: geographyIdSet,
        allowedValues: geographyIds,
        code: 'unknown-filter-geography',
        message: `filter '${filter.id}' references unknown geography '${filter.sourceGeographyId}'`,
      }),
      checkRef({
        path: `filters[${index}].metricId`,
        id: filter.metricId,
        knownIds: metricIdSet,
        allowedValues: metricIds,
        code: 'unknown-filter-metric',
        message: `filter '${filter.id}' references unknown metric '${filter.metricId}'`,
      }),
    ].filter(isDefined);
  });
};

/** `Join.from`/`Join.to` referential integrity. */
export const checkJoinReferences = (catalog: Catalog): CatalogIssue[] => {
  const datasetIds = idsOf(catalog.datasets);
  const geographyIds = idsOf(catalog.geographies);
  const datasetIdSet = new Set(datasetIds);
  const geographyIdSet = new Set(geographyIds);

  return catalog.joins.flatMap((join, index) => {
    return [
      checkRef({
        path: `joins[${index}].from`,
        id: join.from,
        knownIds: datasetIdSet,
        allowedValues: datasetIds,
        code: 'unknown-join-dataset',
        message: `join references unknown dataset '${join.from}'`,
      }),
      checkRef({
        path: `joins[${index}].to`,
        id: join.to,
        knownIds: geographyIdSet,
        allowedValues: geographyIds,
        code: 'unknown-join-geography',
        message: `join references unknown geography '${join.to}'`,
      }),
    ].filter(isDefined);
  });
};

/** `Dataset.collectionId`/`geographyIds[]`/`metricIds[]` referential integrity. */
export const checkDatasetReferences = (catalog: Catalog): CatalogIssue[] => {
  const geographyIds = idsOf(catalog.geographies);
  const metricIds = idsOf(catalog.metrics);
  const collectionIds = idsOf(catalog.collections ?? []);
  const geographyIdSet = new Set(geographyIds);
  const metricIdSet = new Set(metricIds);
  const collectionIdSet = new Set(collectionIds);

  return catalog.datasets.flatMap((dataset, datasetIndex) => {
    const collectionIssue = checkRef({
      path: `datasets[${datasetIndex}].collectionId`,
      id: dataset.collectionId,
      knownIds: collectionIdSet,
      allowedValues: collectionIds,
      code: 'unknown-dataset-collection',
      message: `dataset '${dataset.id}' references unknown collection '${dataset.collectionId}'`,
    });

    const geographyIssues = checkRefs({
      ids: dataset.geographyIds,
      path: (geoIdx) => {
        return `datasets[${datasetIndex}].geographyIds[${geoIdx}]`;
      },
      knownIds: geographyIdSet,
      allowedValues: geographyIds,
      code: 'unknown-dataset-geography',
      message: (geographyId) => {
        return `dataset '${dataset.id}' references unknown geography '${geographyId}'`;
      },
    });

    const metricIssues = checkRefs({
      ids: dataset.metricIds,
      path: (metricIdx) => {
        return `datasets[${datasetIndex}].metricIds[${metricIdx}]`;
      },
      knownIds: metricIdSet,
      allowedValues: metricIds,
      code: 'unknown-dataset-metric',
      message: (metricId) => {
        return `dataset '${dataset.id}' references unknown metric '${metricId}'`;
      },
    });

    return [collectionIssue, ...geographyIssues, ...metricIssues].filter(
      isDefined
    );
  });
};

/** `Geography.parentId` referential integrity and cycle detection. */
export const checkGeographyHierarchy = (catalog: Catalog): CatalogIssue[] => {
  const geographyIds = idsOf(catalog.geographies);
  const geographyIdSet = new Set(geographyIds);
  const geographyById = new Map(
    catalog.geographies.map((g) => {
      return [g.id, g] as const;
    })
  );
  const indexById = new Map(
    catalog.geographies.map((g, idx) => {
      return [g.id, idx] as const;
    })
  );

  const parentIssues = catalog.geographies.flatMap((geography, index) => {
    const issue = checkRef({
      path: `geographies[${index}].parentId`,
      id: geography.parentId,
      knownIds: geographyIdSet,
      allowedValues: geographyIds,
      code: 'unknown-parent-geography',
      message: `geography '${geography.id}' declares parentId '${geography.parentId}', which is not in catalog.geographies`,
    });
    return issue ? [issue] : [];
  });

  const issues: CatalogIssue[] = [...parentIssues];
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
            message: `geography '${currentId}' is part of a parentId cycle`,
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

/** `Series.metricId`/`Series.spatialGrain.geographyId` referential integrity. */
export const checkSeriesReferences = (catalog: Catalog): CatalogIssue[] => {
  const metricIds = idsOf(catalog.metrics);
  const geographyIds = idsOf(catalog.geographies);
  const metricIdSet = new Set(metricIds);
  const geographyIdSet = new Set(geographyIds);

  return (catalog.series ?? []).flatMap((series, index) => {
    const metricIssue = checkRef({
      path: `series[${index}].metricId`,
      id: series.metricId,
      knownIds: metricIdSet,
      allowedValues: metricIds,
      code: 'unknown-series-metric',
      message: `series '${series.id}' references unknown metric '${series.metricId}'`,
    });

    const geographyId = series.spatialGrain?.geographyId;
    const geographyIssue = checkRef({
      path: `series[${index}].spatialGrain.geographyId`,
      id: geographyId,
      knownIds: geographyIdSet,
      allowedValues: geographyIds,
      code: 'unknown-series-geography',
      message: `series '${series.id}' references unknown geography '${geographyId}'`,
    });

    return [metricIssue, geographyIssue].filter(isDefined);
  });
};

/** `MapTypeCatalogEntry.supportedGeometries` data-adequacy vs. adapter capability mismatch. */
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
      message: `map type '${mapType.name}' declares geometries [${unsupported.join(', ')}] the active adapter cannot render`,
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
