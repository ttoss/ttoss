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

  test('a catalog with no permissions and no sensible fields is unaffected', () => {
    const { permissions: _permissions, ...withoutPermissions } = sampleCatalog;
    const withoutSensibleFields = {
      ...withoutPermissions,
      datasets: withoutPermissions.datasets.map((dataset) => {
        if (dataset.fields === undefined) return dataset;
        return {
          ...dataset,
          fields: dataset.fields.filter((field) => {
            return field.sensible !== true;
          }),
        };
      }),
    };
    const introspection = getCatalogIntrospection(withoutSensibleFields);
    expect(introspection).not.toHaveProperty('permissions');
    expect(introspection).toEqual(withoutSensibleFields);
  });

  test('strips sensible Dataset.fields[] entries (D12), keeping non-sensitive fields', () => {
    const introspection = getCatalogIntrospection(sampleCatalog);
    const demografia = introspection.datasets.find((dataset) => {
      return dataset.id === 'dataset-demografia-municipio';
    });

    expect(demografia?.fields).toEqual(
      expect.arrayContaining([
        { name: 'populacao', title: 'População', role: 'identifier' },
      ])
    );
    expect(
      demografia?.fields?.some((field) => {
        return field.name === 'renda_domicilio';
      })
    ).toBe(false);
  });

  test('a dataset with no fields is unaffected', () => {
    const introspection = getCatalogIntrospection(sampleCatalog);
    const perfil = introspection.datasets.find((dataset) => {
      return dataset.id === 'dataset-perfil-socioeconomico';
    });
    const sourcePerfil = sampleCatalog.datasets.find((dataset) => {
      return dataset.id === 'dataset-perfil-socioeconomico';
    });

    expect(perfil).toEqual(sourcePerfil);
  });
});

describe('getCatalogJSONSchema', () => {
  test('derives a document that still validates the sample catalog against every required field', () => {
    const jsonSchema = getCatalogJSONSchema();
    expect(jsonSchema.required).toEqual(
      expect.arrayContaining(
        Object.keys(sampleCatalog).filter((key) => {
          // domain, collections, permissions, and series are optional fields
          return (
            key !== 'domain' &&
            key !== 'collections' &&
            key !== 'permissions' &&
            key !== 'series'
          );
        })
      )
    );
  });

  test('matches the committed schema shape (guards against accidental drift)', () => {
    expect(getCatalogJSONSchema()).toMatchSnapshot();
  });
});
