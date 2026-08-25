import type { CapabilitySet } from '@ttoss/geovis';

import type { CatalogIssue } from './catalogResult';
import type { Catalog } from './schema/types';

/**
 * `FilterField` referential integrity. The schema already guarantees exactly
 * one of `sourceDatasetId`/`sourceGeographyId` is present and that the
 * kind/domain/operator combination is coherent; what it cannot see is whether
 * the ids resolve, which is what a UI needs before it can label a control.
 */
export const checkFilterReferences = (catalog: Catalog): CatalogIssue[] => {
  const issues: CatalogIssue[] = [];
  const datasetIds = catalog.datasets.map((d) => {
    return d.id;
  });
  const geographyIds = catalog.geographies.map((g) => {
    return g.id;
  });
  const metricIds = catalog.metrics.map((m) => {
    return m.id;
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

/** `Join.from`/`Join.to` referential integrity. */
export const checkJoinReferences = (catalog: Catalog): CatalogIssue[] => {
  const issues: CatalogIssue[] = [];
  const datasetIds = catalog.datasets.map((d) => {
    return d.id;
  });
  const geographyIds = catalog.geographies.map((g) => {
    return g.id;
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

/** `Dataset.geographyIds[]`/`metricIds[]` referential integrity. */
export const checkDatasetReferences = (catalog: Catalog): CatalogIssue[] => {
  const issues: CatalogIssue[] = [];
  const geographyIds = catalog.geographies.map((g) => {
    return g.id;
  });
  const metricIds = catalog.metrics.map((m) => {
    return m.id;
  });
  const collectionIds = (catalog.collections ?? []).map((c) => {
    return c.id;
  });
  const geographyIdSet = new Set(geographyIds);
  const metricIdSet = new Set(metricIds);
  const collectionIdSet = new Set(collectionIds);

  for (const [datasetIndex, dataset] of catalog.datasets.entries()) {
    if (
      dataset.collectionId !== undefined &&
      !collectionIdSet.has(dataset.collectionId)
    ) {
      issues.push({
        code: 'unknown-dataset-collection',
        subject: {
          path: `datasets[${datasetIndex}].collectionId`,
          id: dataset.collectionId,
        },
        message: `dataset '${dataset.id}' references unknown collection '${dataset.collectionId}'`,
        repair: [
          {
            kind: 'allowed-values',
            path: `datasets[${datasetIndex}].collectionId`,
            values: collectionIds,
          },
        ],
      });
    }

    for (const [geoIdx, geographyId] of dataset.geographyIds.entries()) {
      if (geographyIdSet.has(geographyId)) continue;
      issues.push({
        code: 'unknown-dataset-geography',
        subject: {
          path: `datasets[${datasetIndex}].geographyIds[${geoIdx}]`,
          id: geographyId,
        },
        message: `dataset '${dataset.id}' references unknown geography '${geographyId}'`,
        repair: [
          {
            kind: 'allowed-values',
            path: `datasets[${datasetIndex}].geographyIds[${geoIdx}]`,
            values: geographyIds,
          },
        ],
      });
    }

    for (const [metricIdx, metricId] of dataset.metricIds.entries()) {
      if (metricIdSet.has(metricId)) continue;
      issues.push({
        code: 'unknown-dataset-metric',
        subject: {
          path: `datasets[${datasetIndex}].metricIds[${metricIdx}]`,
          id: metricId,
        },
        message: `dataset '${dataset.id}' references unknown metric '${metricId}'`,
        repair: [
          {
            kind: 'allowed-values',
            path: `datasets[${datasetIndex}].metricIds[${metricIdx}]`,
            values: metricIds,
          },
        ],
      });
    }
  }

  return issues;
};

/** `Geography.parentId` referential integrity and cycle detection. */
export const checkGeographyHierarchy = (catalog: Catalog): CatalogIssue[] => {
  const issues: CatalogIssue[] = [];
  const geographyIds = catalog.geographies.map((g) => {
    return g.id;
  });
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
  const issues: CatalogIssue[] = [];
  const metricIds = catalog.metrics.map((m) => {
    return m.id;
  });
  const geographyIds = catalog.geographies.map((g) => {
    return g.id;
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
