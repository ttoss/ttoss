import { getCatalogJSONSchema } from 'src/introspection';
import {
  catalogSchema,
  collectionSchema,
  datasetFieldSchema,
  datasetSchema,
  filterFieldSchema,
  geographySchema,
  joinSchema,
  mapTypeCatalogEntrySchema,
  metricSchema,
  temporalFieldsSchema,
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
  'collections',
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
  'title',
  'slug',
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
  'title',
  'slug',
  'description',
  'aliases',
  'geographyIds',
  'metricIds',
  'collectionId',
  'temporal',
  'spatial',
  'artifact',
  'columns',
  'fields',
  'generatedBy',
  'provenance',
  'access',
  'sensible',
].sort();

const DATASET_FIELD_KEYS = ['name', 'title', 'role', 'unit', 'sensible'].sort();

const COLLECTION_KEYS = [
  'id',
  'title',
  'slug',
  'description',
  'organization',
  'sourceUrl',
  'publicReferenceUrl',
  'aliases',
  'tags',
].sort();

const GEOGRAPHY_KEYS = [
  'id',
  'title',
  'slug',
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
  'title',
  'slug',
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

const TEMPORAL_FIELDS_KEYS = ['instant', 'start', 'end', 'recorded'].sort();

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

  test('DatasetField properties match the schema (D12, D16)', () => {
    expect(Object.keys(datasetFieldSchema.shape).sort()).toEqual(
      DATASET_FIELD_KEYS
    );
  });

  test('Collection properties match the schema (D13, D16)', () => {
    expect(Object.keys(collectionSchema.shape).sort()).toEqual(COLLECTION_KEYS);
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

  test('TemporalFields properties match the schema (D16)', () => {
    expect(Object.keys(temporalFieldsSchema.shape).sort()).toEqual(
      TEMPORAL_FIELDS_KEYS
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

  test('a dataset with a `collectionId` value validates (D13 provenance)', () => {
    const datasetWithCollection = sampleCatalog.datasets.find((dataset) => {
      return dataset.collectionId === 'ibge';
    });
    expect(datasetWithCollection).toBeDefined();
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

describe('Temporal.field / TemporalFields (D2, D16)', () => {
  test('a dataset can name the column carrying an instant temporal value', () => {
    const demografia = sampleCatalog.datasets.find((dataset) => {
      return dataset.id === 'dataset-demografia-municipio';
    });
    expect(demografia?.temporal?.field).toEqual({
      instant: 'ano_referencia',
    });
  });

  test('start and end together validate', () => {
    expect(
      temporalFieldsSchema.safeParse({
        start: 'dt_internacao',
        end: 'dt_alta',
      }).success
    ).toBe(true);
  });

  test('instant together with start/end fails validation', () => {
    expect(
      temporalFieldsSchema.safeParse({
        instant: 'data_referencia',
        start: 'dt_internacao',
        end: 'dt_alta',
      }).success
    ).toBe(false);
  });

  test('start without end (or vice versa) fails validation', () => {
    expect(
      temporalFieldsSchema.safeParse({ start: 'dt_internacao' }).success
    ).toBe(false);
    expect(temporalFieldsSchema.safeParse({ end: 'dt_alta' }).success).toBe(
      false
    );
  });

  test('an empty TemporalFields fails validation — at least one role must be named', () => {
    expect(temporalFieldsSchema.safeParse({}).success).toBe(false);
  });

  test('recorded may accompany instant, modeling bitemporal data', () => {
    expect(
      temporalFieldsSchema.safeParse({
        instant: 'data_referencia',
        recorded: 'dt_processamento',
      }).success
    ).toBe(true);
  });
});

describe('Temporal.updateFrequency / .timezone (D16)', () => {
  test('a dataset can declare its update cadence and timezone', () => {
    const demografia = sampleCatalog.datasets.find((dataset) => {
      return dataset.id === 'dataset-demografia-municipio';
    });
    expect(demografia?.temporal?.updateFrequency).toBe('annual');
    expect(demografia?.temporal?.timezone).toBe('America/Sao_Paulo');
  });
});

describe('Spatial.coverage / .precision / .srid (D16)', () => {
  test('a dataset can declare coverage, precision, and srid', () => {
    const demografia = sampleCatalog.datasets.find((dataset) => {
      return dataset.id === 'dataset-demografia-municipio';
    });
    expect(demografia?.spatial?.coverage).toBe('exhaustive');
    expect(demografia?.spatial?.precision).toBe('not_applicable');
    expect(demografia?.spatial?.srid).toBe(4674);
  });

  test('Spatial.field accepts a composite key as a string array', () => {
    const imoveis = sampleCatalog.datasets.find((dataset) => {
      return dataset.id === 'dataset-imoveis-rurais';
    });
    expect(imoveis?.spatial?.field).toEqual(['cod_uf', 'cod_imovel']);
  });
});

describe('id/slug/title convention (D16)', () => {
  test('a slug must be kebab-case', () => {
    const demografia = sampleCatalog.datasets.find((dataset) => {
      return dataset.id === 'dataset-demografia-municipio';
    });
    expect(
      datasetSchema.safeParse({ ...demografia, slug: 'not_kebab_case' }).success
    ).toBe(false);
    expect(
      datasetSchema.safeParse({ ...demografia, slug: 'Municipios-Contorno' })
        .success
    ).toBe(false);
    expect(
      datasetSchema.safeParse({ ...demografia, slug: 'municipios-contorno' })
        .success
    ).toBe(true);
  });

  test('slug is optional', () => {
    const demografia = sampleCatalog.datasets.find((dataset) => {
      return dataset.id === 'dataset-demografia-municipio';
    });
    const { slug: _slug, ...withoutSlug } = demografia!;
    expect(datasetSchema.safeParse(withoutSlug).success).toBe(true);
  });

  test('spatial.grain and Series.spatialGrain keep `label`, not `title`', () => {
    const demografia = sampleCatalog.datasets.find((dataset) => {
      return dataset.id === 'dataset-demografia-municipio';
    });
    const series = sampleCatalog.series?.[0];
    expect(demografia?.spatial?.extent?.[0].label).toBe('São Paulo');
    expect(series?.spatialGrain?.label).toBe('Município');
  });
});

describe('Collection (D13, D16)', () => {
  test('a catalog can declare a collections registry', () => {
    const ibge = sampleCatalog.collections?.find((collection) => {
      return collection.id === 'ibge';
    });
    expect(ibge).toMatchObject({
      id: 'ibge',
      title: 'IBGE',
      slug: 'ibge',
      organization: 'Instituto Brasileiro de Geografia e Estatística (IBGE)',
      tags: expect.arrayContaining(['ibge']),
    });
  });

  test('a collection requires only id, title and description', () => {
    expect(
      collectionSchema.safeParse({
        id: 'dados-primarios',
        title: 'Dados Primários',
        description: 'Datasets coletados diretamente pela equipe.',
      }).success
    ).toBe(true);
  });

  test('a collection missing description fails', () => {
    expect(
      collectionSchema.safeParse({ id: 'dados-primarios', title: 'X' }).success
    ).toBe(false);
  });

  test('a catalog omitting collections still validates', () => {
    const { collections: _collections, ...withoutCollections } = sampleCatalog;
    expect(catalogSchema.safeParse(withoutCollections).success).toBe(true);
  });
});

describe('Dataset.fields[] (D12, D16)', () => {
  const demografia = sampleCatalog.datasets.find((dataset) => {
    return dataset.id === 'dataset-demografia-municipio';
  });

  test('a dataset can declare per-column field metadata, including role and unit', () => {
    expect(demografia?.fields).toEqual(
      expect.arrayContaining([
        { name: 'populacao', title: 'População', role: 'identifier' },
        {
          name: 'densidade',
          title: 'Densidade Populacional',
          unit: 'hab/km²',
        },
      ])
    );
  });

  test('a dataset omitting fields still validates', () => {
    const { fields: _fields, ...withoutFields } = demografia!;
    expect(datasetSchema.safeParse(withoutFields).success).toBe(true);
  });

  test('a field with sensible: true requires a title', () => {
    expect(
      datasetFieldSchema.safeParse({ name: 'renda_domicilio', sensible: true })
        .success
    ).toBe(false);
    expect(
      datasetFieldSchema.safeParse({
        name: 'renda_domicilio',
        title: 'Renda Domiciliar',
        sensible: true,
      }).success
    ).toBe(true);
  });

  test('a field with sensible: false or omitted does not require a title', () => {
    expect(datasetFieldSchema.safeParse({ name: 'populacao' }).success).toBe(
      true
    );
    expect(
      datasetFieldSchema.safeParse({ name: 'populacao', sensible: false })
        .success
    ).toBe(true);
  });

  test('an unknown role fails validation', () => {
    expect(
      datasetFieldSchema.safeParse({ name: 'populacao', role: 'not-a-role' })
        .success
    ).toBe(false);
  });
});

describe('Dataset.generatedBy / .provenance / .access (D16)', () => {
  const demografia = sampleCatalog.datasets.find((dataset) => {
    return dataset.id === 'dataset-demografia-municipio';
  });

  test('a dataset can declare its generating script, provenance, and access classification', () => {
    expect(demografia?.generatedBy).toBe(
      'scripts/generate-demografia-municipio.mjs'
    );
    expect(demografia?.provenance).toEqual({
      url: 'https://servicodados.ibge.gov.br/api/v3/agregados/4709',
      notes: 'Censo 2022, agregado 4709.',
    });
    expect(demografia?.access).toEqual({
      level: 'public',
      containsPersonalData: false,
    });
  });

  test('access.level rejects a value outside public/restricted', () => {
    expect(
      datasetSchema.safeParse({
        ...demografia,
        access: { level: 'secret', containsPersonalData: false },
      }).success
    ).toBe(false);
  });

  test('all three fields are optional — a dataset omitting them still validates', () => {
    const {
      generatedBy: _generatedBy,
      provenance: _provenance,
      access: _access,
      ...withoutGovernance
    } = demografia!;
    expect(datasetSchema.safeParse(withoutGovernance).success).toBe(true);
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
      'Collection',
      'Dataset',
      'DatasetAccess',
      'DatasetField',
      'DatasetProvenance',
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
      'TemporalFields',
    ]);
    expect(jsonSchema.additionalProperties).toBe(false);
  });
});
