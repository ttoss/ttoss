// Public contract smoke tests — verifies the package index exports the expected symbols.
import type {
  Catalog,
  CatalogIssue,
  CatalogIssueCode,
  CatalogResult,
  Dataset,
  FilterField,
  Geography,
  GeographyKind,
  Join,
  MapTypeCatalogEntry,
  Metric,
  MetricKind,
} from 'src/index';
import * as geovisCatalog from 'src/index';

test('package exports expected public symbols', () => {
  expect(typeof geovisCatalog.validateCatalog).toBe('function');
  expect(typeof geovisCatalog.getCatalogIntrospection).toBe('function');
  expect(typeof geovisCatalog.getCatalogJSONSchema).toBe('function');
  expect(typeof geovisCatalog.CATALOG_ISSUE_CODE_STATUS).toBe('object');
  expect(typeof geovisCatalog.resolveCatalogOverallStatus).toBe('function');
});

test('Catalog and its sub-shapes are part of the public contract', () => {
  const metric: Metric = {
    id: 'metric-populacao',
    label: 'População',
    description: 'População total residente.',
    kind: 'count' satisfies MetricKind,
    nullPolicy: 'zero',
  };

  const geography: Geography = {
    id: 'geo-municipio',
    label: 'Município',
    description: 'Municípios brasileiros.',
    kind: 'administrative' satisfies GeographyKind,
    level: 2,
    parentId: 'geo-uf',
    codeScheme: 'ibge:municipio',
  };

  const dataset: Dataset = {
    id: 'dataset-demografia',
    label: 'Demografia',
    description: 'Dados demográficos.',
    geometry: 'polygon',
    geographyIds: [geography.id],
    metricIds: [metric.id],
    source: 'ibge',
  };

  const join: Join = {
    from: dataset.id,
    to: geography.id,
    on: { left: 'codigo_municipio', right: 'id' },
    cardinality: '1:1',
  };

  const filterField: FilterField = {
    field: 'regiao',
    kind: 'categorical',
    domain: ['Norte', 'Sul'],
  };

  const mapTypeEntry: MapTypeCatalogEntry = {
    name: 'choropleth',
    supportedGeometries: ['polygon'],
    metricKinds: [metric.kind],
  };

  const catalog: Catalog = {
    version: '1.0.0',
    datasets: [dataset],
    metrics: [metric],
    geographies: [geography],
    joins: [join],
    mapTypes: [mapTypeEntry],
    filters: [filterField],
  };

  const result: CatalogResult = { status: 'valid', catalog };
  expect(result.status).toBe('valid');
});

test('CatalogResult taxonomy types are part of the public contract', () => {
  const issue: CatalogIssue = {
    code: 'unknown-join-geography' satisfies CatalogIssueCode,
    subject: { path: 'joins[0].to', id: 'does-not-exist' },
    message: "join references unknown geography 'does-not-exist'",
    repair: [
      { kind: 'allowed-values', path: 'joins[0].to', values: ['geo-uf'] },
    ],
  };

  const result: CatalogResult = { status: 'mismatch', issues: [issue] };

  expect(result.status).toBe('mismatch');
  if (result.status !== 'valid') {
    expect(result.issues[0].code).toBe('unknown-join-geography');
  }
});
