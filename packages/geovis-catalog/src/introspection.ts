import { z } from 'zod';

import { catalogSchema } from './schema/catalog';
import type { Catalog } from './schema/types';

/**
 * Returns `catalog` with `permissions` stripped — the curated-metadata
 * contract PRD-004 requires ("never raw data"). Nothing in `Catalog` is raw
 * data (no rows), but `permissions` is the one field that could carry
 * org-internal detail not meant for a model, so introspection omits it by
 * construction rather than trusting every future catalog author to keep it
 * model-safe.
 */
export const getCatalogIntrospection = (
  catalog: Catalog
): Omit<Catalog, 'permissions'> => {
  const { permissions: _permissions, ...introspection } = catalog;
  return introspection;
};

/**
 * Returns the catalog's JSON Schema, directly usable as an LLM structured-
 * output or function-calling `input_schema`. Derived from the Zod schemas
 * (D1), which are the single source of truth, so the document can never
 * drift from what `validateCatalog` actually enforces.
 */
export const getCatalogJSONSchema = (): Record<string, unknown> => {
  return z.toJSONSchema(catalogSchema, { target: 'draft-2020-12' });
};
