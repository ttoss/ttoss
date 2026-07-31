import { getCatalogJSONSchema } from 'src/introspection';
import {
  catalogSchema,
  datasetSchema,
  filterFieldSchema,
  geographySchema,
  joinSchema,
  mapTypeCatalogEntrySchema,
  metricSchema,
} from 'src/schema/catalog';

import { sampleCatalog } from '../fixtures/sampleCatalog';

/**
 * The `Catalog` interface's field set (`src/schema/types.ts`), maintained by
 * hand alongside the Zod schemas (D1). Kept here, separate from the schema
 * import, so a field added to one without the other fails this test — making
 * the manual-sync discipline explicit and testable rather than left to
 * reviewer attention alone.
 */
const CATALOG_KEYS = [
  'version',
  'domain',
  'datasets',
  'metrics',
  'geographies',
  'joins',
  'series',
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
  'categories',
  'formatter',
  'nullPolicy',
].sort();

const DATASET_KEYS = [
  'id',
  'label',
  'description',
  'aliases',
  'geographyIds',
  'metricIds',
  'source',
  'temporal',
  'spatial',
  'artifact',
  'columns',
  'sensible',
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
  'cameraFraming',
].sort();

const JOIN_KEYS = ['from', 'to', 'on', 'cardinality'].sort();

const FILTER_FIELD_KEYS = [
  'id',
  'label',
  'description',
  'aliases',
  'property',
  'kind',
  'sourceDatasetId',
  'sourceGeographyId',
  'metricId',
  'operators',
  'multiple',
  'domain',
  'sensible',
].sort();

const MAP_TYPE_CATALOG_ENTRY_KEYS = [
  'name',
  'supportedGeometries',
  'metricKinds',
].sort();

describe('Zod schema / Catalog type parity', () => {
  test('top-level Catalog properties match the schema', () => {
    expect(Object.keys(catalogSchema.shape).sort()).toEqual(CATALOG_KEYS);
  });

  test('Metric properties match the schema', () => {
    expect(Object.keys(metricSchema.shape).sort()).toEqual(METRIC_KEYS);
  });

  test('Dataset properties match the schema', () => {
    expect(Object.keys(datasetSchema.shape).sort()).toEqual(DATASET_KEYS);
  });

  test('Geography properties match the schema', () => {
    expect(Object.keys(geographySchema.shape).sort()).toEqual(GEOGRAPHY_KEYS);
  });

  test('Join properties match the schema', () => {
    expect(Object.keys(joinSchema.shape).sort()).toEqual(JOIN_KEYS);
  });

  test('FilterField properties match the schema', () => {
    expect(Object.keys(filterFieldSchema.shape).sort()).toEqual(
      FILTER_FIELD_KEYS
    );
  });

  test('MapTypeCatalogEntry properties match the schema', () => {
    expect(Object.keys(mapTypeCatalogEntrySchema.shape).sort()).toEqual(
      MAP_TYPE_CATALOG_ENTRY_KEYS
    );
  });
});

describe('catalog schema validation', () => {
  test('the sample catalog validates', () => {
    const parsed = catalogSchema.safeParse(sampleCatalog);
    expect(parsed.error).toBeUndefined();
    expect(parsed.success).toBe(true);
  });

  test('a catalog missing a required field fails validation, pointing at the missing field', () => {
    const { version: _version, ...withoutVersion } = sampleCatalog;
    const parsed = catalogSchema.safeParse(withoutVersion);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0].path).toEqual(['version']);
  });

  test('a catalog carrying an unknown top-level key fails validation', () => {
    const parsed = catalogSchema.safeParse({
      ...sampleCatalog,
      notACatalogField: true,
    });
    expect(parsed.success).toBe(false);
  });

  test('a geography with an unknown kind value fails validation', () => {
    const invalid = {
      ...sampleCatalog,
      geographies: [
        { ...sampleCatalog.geographies[0], kind: 'not-a-real-kind' },
        ...sampleCatalog.geographies.slice(1),
      ],
    };
    expect(catalogSchema.safeParse(invalid).success).toBe(false);
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
    expect(catalogSchema.safeParse(withoutKind).success).toBe(true);
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

  test('a filter declaring both sources, or neither, fails validation', () => {
    const [filter] = sampleCatalog.filters;

    expect(
      filterFieldSchema.safeParse({
        ...filter,
        sourceDatasetId: 'dataset-demografia-municipio',
      }).success
    ).toBe(false);

    expect(
      filterFieldSchema.safeParse({ ...filter, sourceGeographyId: undefined })
        .success
    ).toBe(false);
  });

  test('an operator meaningless for the kind fails validation', () => {
    const numeric = sampleCatalog.filters[2];
    const parsed = filterFieldSchema.safeParse({
      ...numeric,
      operators: ['gte', 'in'],
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0].path).toEqual(['operators', 1]);
  });

  test('`multiple` outside a categorical filter fails validation', () => {
    const numeric = sampleCatalog.filters[2];
    expect(
      filterFieldSchema.safeParse({ ...numeric, multiple: true }).success
    ).toBe(false);
  });

  test('a runtime domain is legal for every kind', () => {
    for (const filter of sampleCatalog.filters) {
      expect(
        filterFieldSchema.safeParse({ ...filter, domain: { mode: 'runtime' } })
          .success
      ).toBe(true);
    }
  });

  test('permissions is optional — a catalog omitting it still validates', () => {
    const { permissions: _permissions, ...withoutPermissions } = sampleCatalog;
    expect(catalogSchema.safeParse(withoutPermissions).success).toBe(true);
  });
});

describe('nominal metrics and categories (D1)', () => {
  const nominalMetric = sampleCatalog.metrics.find((metric) => {
    return metric.kind === 'nominal';
  });

  test('the sample catalog carries a nominal metric with a non-empty categories whitelist', () => {
    expect(nominalMetric).toBeDefined();
    expect(nominalMetric?.categories?.length).toBeGreaterThan(0);
  });

  test('a nominal metric without categories fails validation', () => {
    const { categories: _categories, ...withoutCategories } = nominalMetric!;
    expect(metricSchema.safeParse(withoutCategories).success).toBe(false);
  });

  test('a nominal metric with an empty categories array fails validation', () => {
    expect(
      metricSchema.safeParse({ ...nominalMetric, categories: [] }).success
    ).toBe(false);
  });

  test('categories on a non-nominal metric fails validation', () => {
    const countMetric = sampleCatalog.metrics.find((metric) => {
      return metric.kind === 'count';
    });
    expect(
      metricSchema.safeParse({
        ...countMetric,
        categories: nominalMetric?.categories,
      }).success
    ).toBe(false);
  });
});

describe('Geography.cameraFraming (D5)', () => {
  test('a geography with cameraFraming validates', () => {
    const uf = sampleCatalog.geographies.find((geography) => {
      return geography.id === 'geo-uf';
    });
    expect(uf?.cameraFraming?.bbox).toHaveLength(4);
  });

  test('cameraFraming.bbox requires exactly four numbers', () => {
    const uf = sampleCatalog.geographies.find((geography) => {
      return geography.id === 'geo-uf';
    });
    expect(
      geographySchema.safeParse({
        ...uf,
        cameraFraming: { ...uf?.cameraFraming, bbox: [-74, -34, -28.8] },
      }).success
    ).toBe(false);
  });
});

describe('Temporal.field (D2)', () => {
  test('a dataset can name the column carrying temporal values', () => {
    const demografia = sampleCatalog.datasets.find((dataset) => {
      return dataset.id === 'dataset-demografia-municipio';
    });
    expect(demografia?.temporal?.field).toBe('ano_referencia');
  });
});

describe('getCatalogJSONSchema', () => {
  test('derives a draft 2020-12 document with the sub-shapes in $defs', () => {
    const jsonSchema = getCatalogJSONSchema();

    expect(jsonSchema.$schema).toBe(
      'https://json-schema.org/draft/2020-12/schema'
    );
    expect(jsonSchema.$id).toBe(
      'https://ttoss.dev/geovis-catalog/catalog.schema.json'
    );
    expect(Object.keys(jsonSchema.$defs as object).sort()).toEqual([
      'CameraFraming',
      'CodedRef',
      'Dataset',
      'Dimension',
      'FilterField',
      'Geography',
      'Interval',
      'Join',
      'MapTypeCatalogEntry',
      'Metric',
      'MetricCategory',
      'Series',
      'Spatial',
      'SpatialGrain',
      'SpatialGrainRef',
      'Temporal',
    ]);
    expect(jsonSchema.additionalProperties).toBe(false);
  });
});
