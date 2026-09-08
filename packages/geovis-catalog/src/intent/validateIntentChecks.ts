import type {
  Catalog,
  Dataset,
  FilterField,
  Geography,
  Metric,
} from '../schema/types';
import type { IntentIssue } from './intentResult';
import type { AnalyticalIntent, IntentFilter } from './schema';
import { INTENT_SCHEMA_VERSION } from './schema';

/** D2/D4 step 1b — `schemaVersion` exact match against `INTENT_SCHEMA_VERSION`. */
export const checkSchemaVersion = (intent: AnalyticalIntent): IntentIssue[] => {
  if (intent.schemaVersion === INTENT_SCHEMA_VERSION) return [];

  return [
    {
      code: 'invalid-intent-schema-version',
      subject: { path: '/schemaVersion' },
      message: `schemaVersion must be ${INTENT_SCHEMA_VERSION}, got ${intent.schemaVersion}`,
      repair: [
        {
          kind: 'set-value',
          path: '/schemaVersion',
          value: INTENT_SCHEMA_VERSION,
          label: `Set schemaVersion to ${INTENT_SCHEMA_VERSION}`,
        },
      ],
    },
  ];
};

/** D4 step 2 — `metricId` must resolve to a `Catalog.metrics[].id`. */
export const checkMetric = (
  intent: AnalyticalIntent,
  catalog: Catalog
): { resolvedMetric: Metric | undefined; issues: IntentIssue[] } => {
  const resolvedMetric = catalog.metrics.find((metric) => {
    return metric.id === intent.metricId;
  });
  if (resolvedMetric) return { resolvedMetric, issues: [] };

  return {
    resolvedMetric: undefined,
    issues: [
      {
        code: 'unknown-metric',
        subject: { path: '/metricId', id: intent.metricId },
        message: `metricId '${intent.metricId}' is not in the catalog`,
        repair: [
          {
            kind: 'allowed-values',
            path: '/metricId',
            values: catalog.metrics.map((metric) => {
              return metric.id;
            }),
          },
        ],
      },
    ],
  };
};

/** D4 step 2b / D6 — `categoryId`, grounded against the resolved metric's `categories[]` when it is nominal. */
export const checkCategory = (
  intent: AnalyticalIntent,
  resolvedMetric: Metric | undefined
): IntentIssue[] => {
  if (!resolvedMetric || resolvedMetric.kind !== 'nominal') return [];

  const categories = resolvedMetric.categories ?? [];
  const categoryFound = categories.some((category) => {
    return category.id === intent.categoryId;
  });
  if (categoryFound) return [];

  return [
    {
      code: 'unknown-category',
      subject: { path: '/categoryId', id: intent.categoryId },
      message:
        intent.categoryId === undefined
          ? `metricId '${intent.metricId}' is nominal and requires a categoryId`
          : `categoryId '${intent.categoryId}' is not one of metric '${intent.metricId}''s categories`,
      repair: [
        {
          kind: 'allowed-values',
          path: '/categoryId',
          values: categories.map((category) => {
            return category.id;
          }),
        },
      ],
    },
  ];
};

/** D4 step 2c / D7 — `denominatorMetricId`, grounded like `metricId`, rejecting self-reference. */
export const checkDenominatorMetric = (
  intent: AnalyticalIntent,
  catalog: Catalog
): IntentIssue[] => {
  if (intent.denominatorMetricId === undefined) return [];

  const resolvedDenominator = catalog.metrics.find((metric) => {
    return metric.id === intent.denominatorMetricId;
  });
  const selfReference = intent.denominatorMetricId === intent.metricId;
  if (resolvedDenominator && !selfReference) return [];

  return [
    {
      code: 'unknown-denominator-metric',
      subject: { path: '/denominatorMetricId', id: intent.denominatorMetricId },
      message: selfReference
        ? 'denominatorMetricId must not equal metricId'
        : `denominatorMetricId '${intent.denominatorMetricId}' is not in the catalog`,
      repair: [
        {
          kind: 'allowed-values',
          path: '/denominatorMetricId',
          values: catalog.metrics
            .map((metric) => {
              return metric.id;
            })
            .filter((id) => {
              return id !== intent.metricId;
            }),
        },
      ],
    },
  ];
};

/** D4 step 3 — `geographyId` must resolve to a `Catalog.geographies[].id`. */
export const checkGeography = (
  intent: AnalyticalIntent,
  catalog: Catalog
): { resolvedGeography: Geography | undefined; issues: IntentIssue[] } => {
  const resolvedGeography = catalog.geographies.find((geography) => {
    return geography.id === intent.geographyId;
  });
  if (resolvedGeography) return { resolvedGeography, issues: [] };

  return {
    resolvedGeography: undefined,
    issues: [
      {
        code: 'unknown-geography',
        subject: { path: '/geographyId', id: intent.geographyId },
        message: `geographyId '${intent.geographyId}' is not in the catalog`,
        repair: [
          {
            kind: 'allowed-values',
            path: '/geographyId',
            values: catalog.geographies.map((geography) => {
              return geography.id;
            }),
          },
        ],
      },
    ],
  };
};

const checkSuppliedDataset = (
  intent: AnalyticalIntent,
  dataset: Dataset | undefined
): { resolvedDatasetId: string | undefined; issues: IntentIssue[] } => {
  const metricIds = dataset?.metricIds ?? [];
  const geographyIds = dataset?.geographyIds ?? [];
  const metricMatches = metricIds.includes(intent.metricId);
  const geographyMatches = geographyIds.includes(intent.geographyId);
  const issues: IntentIssue[] = [];

  if (!metricMatches) {
    issues.push({
      code: 'dataset-metric-mismatch',
      subject: { path: '/datasetId', id: intent.datasetId },
      message: `dataset '${intent.datasetId}' does not carry metricId '${intent.metricId}'`,
    });
  }
  if (!geographyMatches) {
    issues.push({
      code: 'dataset-geography-mismatch',
      subject: { path: '/datasetId', id: intent.datasetId },
      message: `dataset '${intent.datasetId}' does not carry geographyId '${intent.geographyId}'`,
    });
  }

  return {
    resolvedDatasetId:
      metricMatches && geographyMatches ? intent.datasetId : undefined,
    issues,
  };
};

const checkInferredDataset = (
  intent: AnalyticalIntent,
  catalog: Catalog
): { resolvedDatasetId: string | undefined; issues: IntentIssue[] } => {
  const candidates = catalog.datasets.filter((dataset) => {
    return (
      dataset.metricIds.includes(intent.metricId) &&
      dataset.geographyIds.includes(intent.geographyId)
    );
  });

  if (candidates.length === 1) {
    return { resolvedDatasetId: candidates[0].id, issues: [] };
  }

  if (candidates.length === 0) {
    return {
      resolvedDatasetId: undefined,
      issues: [
        {
          code: 'no-matching-dataset',
          subject: { path: '(root)' },
          message: `no dataset carries both metricId '${intent.metricId}' and geographyId '${intent.geographyId}'`,
        },
      ],
    };
  }

  return {
    resolvedDatasetId: undefined,
    issues: [
      {
        code: 'ambiguous-dataset',
        subject: { path: '(root)' },
        message: `metricId '${intent.metricId}' + geographyId '${intent.geographyId}' matches more than one dataset`,
        repair: [
          {
            kind: 'allowed-values',
            path: '/datasetId',
            values: candidates.map((dataset) => {
              return dataset.id;
            }),
          },
        ],
      },
    ],
  };
};

/**
 * D4 steps 4/5, D9 — dataset resolution. Only meaningful once `metricId` and
 * `geographyId` have themselves resolved (`canResolve`); a
 * `datasetId`-supplied intent is confirmed (step 4), an omitted one is
 * inferred via the `metricIds`/`geographyIds` intersection (step 5).
 */
export const checkDataset = (
  intent: AnalyticalIntent,
  catalog: Catalog,
  canResolve: boolean
): { resolvedDatasetId: string | undefined; issues: IntentIssue[] } => {
  if (!canResolve) return { resolvedDatasetId: undefined, issues: [] };

  if (intent.datasetId !== undefined) {
    const dataset = catalog.datasets.find((candidate) => {
      return candidate.id === intent.datasetId;
    });
    return checkSuppliedDataset(intent, dataset);
  }

  return checkInferredDataset(intent, catalog);
};

const checkFilterScopeAndSensitivity = (
  filter: IntentFilter,
  index: number,
  catalog: Catalog,
  resolvedDatasetId: string,
  intent: AnalyticalIntent
): { resolvedFilterField: FilterField | undefined; issues: IntentIssue[] } => {
  const resolvedFilterField = catalog.filters.find((candidate) => {
    return candidate.id === filter.field;
  });
  const inScope =
    resolvedFilterField !== undefined &&
    (resolvedFilterField.sourceDatasetId === resolvedDatasetId ||
      resolvedFilterField.sourceGeographyId === intent.geographyId);

  if (!inScope) {
    const scopedCandidates = catalog.filters
      .filter((candidate) => {
        return (
          candidate.sourceDatasetId === resolvedDatasetId ||
          candidate.sourceGeographyId === intent.geographyId
        );
      })
      .map((candidate) => {
        return candidate.id;
      });
    return {
      resolvedFilterField: undefined,
      issues: [
        {
          code: 'unknown-filter-field',
          subject: { path: `/filters/${index}/field`, id: filter.field },
          message: `filters[${index}].field '${filter.field}' does not resolve to a Catalog.filters[] entry scoped to this dataset/geography`,
          repair: [
            {
              kind: 'allowed-values',
              path: `/filters/${index}/field`,
              values: scopedCandidates,
            },
          ],
        },
      ],
    };
  }

  if (resolvedFilterField.sensible === true) {
    return {
      resolvedFilterField,
      issues: [
        {
          code: 'sensitive-filter-field',
          subject: { path: `/filters/${index}/field`, id: filter.field },
          message: `filters[${index}].field '${filter.field}' is sensible: true — don't filter on it`,
        },
      ],
    };
  }

  return { resolvedFilterField, issues: [] };
};

/**
 * D4 steps 6/6b, D9/D10 — filter-field grounding against `Catalog.filters[]`
 * (scope-checked against the resolved dataset/geography), then operator
 * restriction to the resolved `FilterField.operators` subset. Only runs
 * once a single dataset has resolved.
 */
export const checkFilters = (
  intent: AnalyticalIntent,
  catalog: Catalog,
  resolvedDatasetId: string | undefined
): IntentIssue[] => {
  if (resolvedDatasetId === undefined || intent.filters === undefined) {
    return [];
  }

  return intent.filters.flatMap((filter, index) => {
    const { resolvedFilterField, issues } = checkFilterScopeAndSensitivity(
      filter,
      index,
      catalog,
      resolvedDatasetId,
      intent
    );
    if (issues.length > 0 || !resolvedFilterField) return issues;
    if (resolvedFilterField.operators.includes(filter.op)) return [];

    return [
      {
        code: 'unsupported-filter-operator' as const,
        subject: { path: `/filters/${index}/op`, id: filter.op },
        message: `filters[${index}].op '${filter.op}' is not among filter '${filter.field}''s allowed operators`,
        repair: [
          {
            kind: 'allowed-values' as const,
            path: `/filters/${index}/op`,
            values: resolvedFilterField.operators,
          },
        ],
      },
    ];
  });
};
