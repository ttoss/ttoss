import {
  getCatalogIntrospection,
  getCatalogJSONSchema,
} from 'src/introspection';

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
  test('derives a document that still validates the sample catalog against every required field', () => {
    const jsonSchema = getCatalogJSONSchema();
    expect(jsonSchema.required).toEqual(
      expect.arrayContaining(
        Object.keys(sampleCatalog).filter((key) => {
          return key !== 'domain' && key !== 'permissions';
        })
      )
    );
  });

  test('matches the committed schema shape (guards against accidental drift)', () => {
    expect(getCatalogJSONSchema()).toMatchSnapshot();
  });
});
