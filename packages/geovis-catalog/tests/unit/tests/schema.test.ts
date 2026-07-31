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
      'CodedRef',
      'Dataset',
      'Dimension',
      'FilterField',
      'Geography',
      'Interval',
      'Join',
      'MapTypeCatalogEntry',
      'Metric',
      'Series',
      'Spatial',
      'SpatialGrain',
      'SpatialGrainRef',
      'Temporal',
    ]);
    expect(jsonSchema.additionalProperties).toBe(false);
  });
});
