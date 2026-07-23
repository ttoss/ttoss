import {
  getCatalogIntrospection,
  getCatalogJSONSchema,
} from 'src/introspection';
import catalogSchema from 'src/schema/catalog.schema.json';

import { sampleCatalog } from '../fixtures/sampleCatalog';

describe('getCatalogIntrospection', () => {
  test('strips permissions even when present on input', () => {
    expect(sampleCatalog.permissions).toBeDefined();
    const introspection = getCatalogIntrospection(sampleCatalog);
    expect(introspection).not.toHaveProperty('permissions');
    expect(introspection.version).toBe(sampleCatalog.version);
    expect(introspection.metrics).toEqual(sampleCatalog.metrics);
  });

  test('a catalog with no permissions is unaffected', () => {
    const { permissions: _permissions, ...withoutPermissions } = sampleCatalog;
    const introspection = getCatalogIntrospection(withoutPermissions);
    expect(introspection).not.toHaveProperty('permissions');
    expect(introspection).toEqual(withoutPermissions);
  });
});

describe('getCatalogJSONSchema', () => {
  test('returns the imported catalog.schema.json document as-is', () => {
    expect(getCatalogJSONSchema()).toEqual(catalogSchema);
  });

  test('matches the committed schema shape (guards against accidental drift)', () => {
    expect(getCatalogJSONSchema()).toMatchSnapshot();
  });
});
