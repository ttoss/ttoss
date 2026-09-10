import type { Catalog } from 'src/schema/types';

import { sampleCatalog } from './sampleCatalog';

/**
 * `sampleCatalog` (PRD-004 plan) plus one `sensible: true` `FilterField`
 * (PRD-005 plan Phase 3), kept in its own fixture rather than mutating the
 * shared one — `sampleCatalog` is also exercised by `validateCatalog`'s and
 * `getCatalogIntrospection`'s own test suites, including a committed
 * snapshot, and none of those need this addition.
 */
export const sampleCatalogWithSensibleFilter: Catalog = {
  ...sampleCatalog,
  filters: [
    ...sampleCatalog.filters,
    {
      id: 'filter-renda-domicilio',
      title: 'Renda domiciliar',
      property: 'renda_domicilio',
      kind: 'numeric',
      sourceDatasetId: 'dataset-demografia-municipio',
      operators: ['gte', 'lte'],
      domain: { mode: 'runtime' },
      sensible: true,
    },
  ],
};
