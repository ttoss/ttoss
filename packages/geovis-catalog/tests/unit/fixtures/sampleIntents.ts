import type { AnalyticalIntent, AnalyticalTask } from 'src/intent/schema';
import { INTENT_SCHEMA_VERSION } from 'src/intent/schema';

/**
 * One valid `AnalyticalIntent` per `AnalyticalTask` (PRD-005 plan Phase 1),
 * every reference grounded against `sampleCatalog` so the same fixtures
 * double as Phase 2/3 `validateIntent` happy-path cases.
 */
export const sampleIntentsByTask: Record<AnalyticalTask, AnalyticalIntent> = {
  distribution: {
    schemaVersion: INTENT_SCHEMA_VERSION,
    analyticalTask: 'distribution',
    metricId: 'metric-populacao',
    geographyId: 'geo-municipio',
    datasetId: 'dataset-demografia-municipio',
  },
  comparison: {
    schemaVersion: INTENT_SCHEMA_VERSION,
    analyticalTask: 'comparison',
    metricId: 'metric-densidade-populacional',
    geographyId: 'geo-municipio',
  },
  ranking: {
    schemaVersion: INTENT_SCHEMA_VERSION,
    analyticalTask: 'ranking',
    metricId: 'metric-populacao',
    geographyId: 'geo-h3-grid',
  },
  'change-over-time': {
    schemaVersion: INTENT_SCHEMA_VERSION,
    analyticalTask: 'change-over-time',
    metricId: 'metric-populacao',
    geographyId: 'geo-municipio',
    time: { start: '2010-01-01', end: '2022-12-31' },
  },
  'outlier-detection': {
    schemaVersion: INTENT_SCHEMA_VERSION,
    analyticalTask: 'outlier-detection',
    metricId: 'metric-distancia-hospital',
    geographyId: 'geo-poi-equipamentos',
  },
  'feature-lookup': {
    schemaVersion: INTENT_SCHEMA_VERSION,
    analyticalTask: 'feature-lookup',
    metricId: 'metric-populacao',
    geographyId: 'geo-poi-equipamentos',
  },
  coverage: {
    schemaVersion: INTENT_SCHEMA_VERSION,
    analyticalTask: 'coverage',
    metricId: 'metric-classe-uso-solo',
    geographyId: 'geo-h3-grid',
    categoryId: 'urbano',
  },
  composition: {
    schemaVersion: INTENT_SCHEMA_VERSION,
    analyticalTask: 'composition',
    metricId: 'metric-classe-uso-solo',
    geographyId: 'geo-h3-grid',
    categoryId: 'rural',
  },
  'normalized-comparison': {
    schemaVersion: INTENT_SCHEMA_VERSION,
    analyticalTask: 'normalized-comparison',
    metricId: 'metric-populacao',
    geographyId: 'geo-municipio',
    denominatorMetricId: 'metric-densidade-populacional',
  },
};

/** `analyticalTask`+`metricId`+`geographyId` only — every other field omitted. */
export const minimalIntent: AnalyticalIntent = {
  schemaVersion: INTENT_SCHEMA_VERSION,
  analyticalTask: 'distribution',
  metricId: 'metric-populacao',
  geographyId: 'geo-municipio',
};

/** Every optional field populated at once. */
export const maximalIntent: AnalyticalIntent = {
  schemaVersion: INTENT_SCHEMA_VERSION,
  analyticalTask: 'coverage',
  metricId: 'metric-classe-uso-solo',
  geographyId: 'geo-h3-grid',
  datasetId: 'dataset-uso-solo-h3',
  categoryId: 'urbano',
  denominatorMetricId: 'metric-populacao',
  time: { start: '2020-01-01', end: '2022-12-31T23:59:59Z' },
  filters: [{ field: 'filter-populacao', op: 'gte', value: 100 }],
  rationale: 'User asked which cells are predominantly urban.',
};
