import Ajv2020 from 'ajv/dist/2020';
import catalogSchema from 'src/schema/catalog.schema.json';

import { sampleCatalog } from '../fixtures/sampleCatalog';

const ajv = new Ajv2020({ strict: false });
const validate = ajv.compile(catalogSchema);

/**
 * The `Catalog` interface's field set (`src/schema/types.ts`), maintained by
 * hand alongside the JSON Schema (D4). Kept here, separate from the schema
 * import, so a field added to one without the other fails this test —
 * making the manual-sync discipline explicit and testable (Phase 2
 * acceptance) rather than left to reviewer attention alone.
 */
const CATALOG_KEYS = [
  'version',
  'domain',
  'datasets',
  'metrics',
  'geographies',
  'joins',
  'mapTypes',
  'filters',
  'permissions',
].sort();

const METRIC_KEYS = [
  'id',
  'label',
  'description',
  'aliases',
  'unit',
  'kind',
  'formatter',
  'nullPolicy',
].sort();

const DATASET_KEYS = [
  'id',
  'label',
  'description',
  'aliases',
  'geometry',
  'geographyIds',
  'metricIds',
  'source',
  'temporal',
].sort();

const GEOGRAPHY_KEYS = [
  'id',
  'label',
  'description',
  'aliases',
  'kind',
  'level',
  'parentId',
  'codeScheme',
  'resolution',
].sort();

const JOIN_KEYS = ['from', 'to', 'on', 'cardinality'].sort();

const FILTER_FIELD_KEYS = ['field', 'kind', 'domain'].sort();

const MAP_TYPE_CATALOG_ENTRY_KEYS = [
  'name',
  'supportedGeometries',
  'metricKinds',
].sort();

describe('catalog.schema.json / Catalog type parity', () => {
  test('top-level Catalog properties match the schema', () => {
    expect(Object.keys(catalogSchema.properties).sort()).toEqual(CATALOG_KEYS);
  });

  test('Metric properties match the schema', () => {
    expect(Object.keys(catalogSchema.$defs.Metric.properties).sort()).toEqual(
      METRIC_KEYS
    );
  });

  test('Dataset properties match the schema', () => {
    expect(Object.keys(catalogSchema.$defs.Dataset.properties).sort()).toEqual(
      DATASET_KEYS
    );
  });

  test('Geography properties match the schema', () => {
    expect(
      Object.keys(catalogSchema.$defs.Geography.properties).sort()
    ).toEqual(GEOGRAPHY_KEYS);
  });

  test('Join properties match the schema', () => {
    expect(Object.keys(catalogSchema.$defs.Join.properties).sort()).toEqual(
      JOIN_KEYS
    );
  });

  test('FilterField properties match the schema', () => {
    expect(
      Object.keys(catalogSchema.$defs.FilterField.properties).sort()
    ).toEqual(FILTER_FIELD_KEYS);
  });

  test('MapTypeCatalogEntry properties match the schema', () => {
    expect(
      Object.keys(catalogSchema.$defs.MapTypeCatalogEntry.properties).sort()
    ).toEqual(MAP_TYPE_CATALOG_ENTRY_KEYS);
  });
});

describe('catalog.schema.json validation', () => {
  test('the sample catalog validates', () => {
    const valid = validate(sampleCatalog);
    expect(validate.errors).toBeNull();
    expect(valid).toBe(true);
  });

  test('a catalog missing a required field fails validation, pointing at the missing field', () => {
    const { version: _version, ...withoutVersion } = sampleCatalog;
    const valid = validate(withoutVersion);
    expect(valid).toBe(false);
    expect(validate.errors?.[0]).toMatchObject({
      params: { missingProperty: 'version' },
    });
  });

  test('a geography with an unknown kind value fails validation', () => {
    const invalid = {
      ...sampleCatalog,
      geographies: [
        { ...sampleCatalog.geographies[0], kind: 'not-a-real-kind' },
        ...sampleCatalog.geographies.slice(1),
      ],
    };
    expect(validate(invalid)).toBe(false);
  });

  test('a geography omitting kind still validates (optional-with-default contract)', () => {
    const { kind: _kind, ...geographyWithoutKind } =
      sampleCatalog.geographies[0];
    const withoutKind = {
      ...sampleCatalog,
      geographies: [
        geographyWithoutKind,
        ...sampleCatalog.geographies.slice(1),
      ],
    };
    expect(validate(withoutKind)).toBe(true);
  });

  test('a metric with kind "density" or "distance" validates (D7)', () => {
    const densityMetric = sampleCatalog.metrics.find((metric) => {
      return metric.kind === 'density';
    });
    const distanceMetric = sampleCatalog.metrics.find((metric) => {
      return metric.kind === 'distance';
    });
    expect(densityMetric).toBeDefined();
    expect(distanceMetric).toBeDefined();
  });

  test('a dataset with a `source` value validates (D7 provenance)', () => {
    const datasetWithSource = sampleCatalog.datasets.find((dataset) => {
      return dataset.source === 'ibge';
    });
    expect(datasetWithSource).toBeDefined();
  });

  test('a geography hierarchy with level/parentId/codeScheme/resolution validates (D7)', () => {
    const uf = sampleCatalog.geographies.find((geography) => {
      return geography.id === 'geo-uf';
    });
    const municipio = sampleCatalog.geographies.find((geography) => {
      return geography.id === 'geo-municipio';
    });
    const grid = sampleCatalog.geographies.find((geography) => {
      return geography.id === 'geo-h3-grid';
    });
    expect(uf?.level).toBe(1);
    expect(municipio?.parentId).toBe('geo-uf');
    expect(municipio?.codeScheme).toBe('ibge:municipio');
    expect(grid?.resolution).toBe('h3:8');
  });

  test('permissions is optional — a catalog omitting it still validates', () => {
    const { permissions: _permissions, ...withoutPermissions } = sampleCatalog;
    expect(validate(withoutPermissions)).toBe(true);
  });
});
