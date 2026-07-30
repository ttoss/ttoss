# @ttoss/geovis-catalog

Trusted catalog contract for [`@ttoss/geovis`](../geovis) — the curated, machine-facing metadata an AI or a builder validates against before generating a map. Nothing in the catalog is raw data; it describes what is mappable (metrics, datasets, geographies, joins, map types) so a generation request can be rejected before it hallucinates a reference that doesn't exist.

## Installation

```bash
pnpm add @ttoss/geovis-catalog
```

## `validateCatalog`

Validates a raw value against the catalog schema and enforces referential integrity the schema alone can't express (unknown ids, duplicate ids, cyclic geography hierarchies). Returns a `CatalogResult`: `{ status: 'valid', catalog }` on success, or a failure status carrying every issue found in one pass.

Zod is the single source of truth for the contract: `validateCatalog` parses with it, and `getCatalogJSONSchema()` derives the JSON Schema document from the same schemas, so the published document can never drift from what is actually enforced. The schemas themselves are exported (`catalogSchema`, `metricSchema`, `datasetSchema`, …) so downstream packages compose them instead of re-declaring the shape.

```ts
import { validateCatalog } from '@ttoss/geovis-catalog';

const result = validateCatalog({
  version: '2026-Q3',
  datasets: [
    {
      id: 'dataset-demografia-municipio',
      label: 'Demografia Municipal',
      description: 'População e densidade populacional por município.',
      geographyIds: ['geo-municipio'],
      metricIds: ['metric-populacao'],
      source: 'ibge',
      spatial: {
        status: 'described',
        geometry: 'polygon',
        extent: [{ code: '35', label: 'São Paulo' }],
      },
      temporal: {
        status: 'described',
        grain: 'P1Y',
        extent: [{ start: '2010-01-01', end: '2022-12-31' }],
        history: 'snapshot',
      },
    },
  ],
  metrics: [
    {
      id: 'metric-populacao',
      label: 'População',
      description: 'População total residente.',
      kind: 'count',
      nullPolicy: 'zero',
    },
  ],
  geographies: [
    {
      id: 'geo-municipio',
      label: 'Município',
      description:
        'Municípios brasileiros, conforme a malha territorial do IBGE.',
      kind: 'administrative',
      codeScheme: 'ibge:municipio',
    },
  ],
  joins: [],
  series: [],
  mapTypes: [],
  filters: [],
});

if (result.status === 'valid') {
  // result.catalog is a fully-typed Catalog
} else {
  // result.issues[].code / .message / .repair
}
```

### `CatalogResultStatus` and `CatalogIssueCode`

| Status     | Codes                                                                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `invalid`  | `invalid-catalog-schema`, `duplicate-metric-id`, `duplicate-dataset-id`, `duplicate-geography-id`, `duplicate-filter-id`                                                                                                                         |
| `mismatch` | `unknown-join-dataset`, `unknown-join-geography`, `unknown-dataset-geography`, `unknown-dataset-metric`, `unknown-filter-dataset`, `unknown-filter-geography`, `unknown-filter-metric`, `unknown-parent-geography`, `cyclic-geography-hierarchy` |

`invalid` takes precedence over `mismatch` when a catalog has issues in both categories. `repair` (an `allowed-values` suggestion of the known ids) is attached wherever the correct set is already in hand — never for schema failures, duplicate ids, or cycles, since none of those has a single suggestable value.

## `getCatalogIntrospection` / `getCatalogJSONSchema`

```ts
import {
  getCatalogIntrospection,
  getCatalogJSONSchema,
} from '@ttoss/geovis-catalog';

// Curated metadata safe to hand to a model — permissions stripped.
const introspection = getCatalogIntrospection(catalog);

// The catalog's JSON Schema, usable directly as an LLM structured-output
// or function-calling `input_schema`. Derived from the Zod schemas.
const schema = getCatalogJSONSchema();
```

## Catalog contract

### `Metric`

| Field         | Type                                                                 | Required | Description                                           |
| ------------- | -------------------------------------------------------------------- | -------- | ----------------------------------------------------- |
| `id`          | `string`                                                             | ✓        | Unique identifier, referenced by `Dataset.metricIds`. |
| `label`       | `string`                                                             | ✓        | Human-readable name.                                  |
| `description` | `string`                                                             | ✓        | What the metric measures and how it's calculated.     |
| `aliases`     | `string[]`                                                           |          | Alternative names for search/discovery.               |
| `unit`        | `string`                                                             |          | Free-form measurement unit (`km`, `USD`, `hab/km²`).  |
| `kind`        | `'count' \| 'rate' \| 'ratio' \| 'index' \| 'density' \| 'distance'` | ✓        | Semantic category.                                    |
| `formatter`   | `'number' \| 'percent' \| 'currency' \| 'compact'`                   |          | Formatting hint.                                      |
| `nullPolicy`  | `'hide' \| 'zero' \| 'explain'`                                      | ✓        | How nulls should be treated when rendering.           |

### `Temporal`

| Field     | Type                                                                   | Required | Description                                                                                 |
| --------- | ---------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `status`  | `'described' \| 'not_applicable' \| 'unknown'`                         | ✓        | Whether temporal grain/coverage is documented.                                              |
| `grain`   | ISO-8601 duration or keyword                                           |          | Time resolution: `P1Y`, `P1M`, `PT15M`, or `instant`, `irregular`, `continuous`, `unknown`. |
| `extent`  | `{ start?: string; end?: string }[]`                                   |          | Time intervals covered (ISO-8601 dates). Multiple intervals for non-contiguous coverage.    |
| `history` | `'snapshot' \| 'overwrite' \| 'append_only' \| 'revised' \| 'unknown'` |          | Update pattern: whether values change after collection.                                     |
| `periods` | `{ start: string; end: string; label?: string }[]`                     |          | Explicit periods, optional — overrides gaps or carries per-period metadata.                 |

### `Spatial`

| Field      | Type                                                         | Required | Description                                                       |
| ---------- | ------------------------------------------------------------ | -------- | ----------------------------------------------------------------- |
| `status`   | `'described' \| 'not_applicable' \| 'unknown'`               | ✓        | Whether spatial coverage is documented.                           |
| `geometry` | `'point' \| 'polygon' \| 'line' \| 'multipolygon' \| 'none'` |          | Primary geometry type of features.                                |
| `extent`   | `{ code: string; label?: string }[]`                         |          | Geographic regions/codes covered (e.g., IBGE municipality codes). |
| `grain`    | ISO-8601 duration or keyword                                 |          | Spatial resolution or grid tessellation.                          |
| `field`    | `string`                                                     |          | Dataset field name carrying spatial reference.                    |

### `Dataset`

| Field          | Type                                                                 | Required | Description                                                                          |
| -------------- | -------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `id`           | `string`                                                             | ✓        | Unique identifier, referenced by `Join.from`.                                        |
| `label`        | `string`                                                             | ✓        | Human-readable name.                                                                 |
| `description`  | `string`                                                             | ✓        | Data, collection methodology, and caveats.                                           |
| `aliases`      | `string[]`                                                           |          | Alternative names for search/discovery.                                              |
| `geographyIds` | `string[]`                                                           | ✓        | Geographies this dataset can be joined to — validated against `catalog.geographies`. |
| `metricIds`    | `string[]`                                                           | ✓        | Metrics this dataset carries — validated against `catalog.metrics`.                  |
| `source`       | `string`                                                             |          | Provenance, e.g. `'ibge'`, `'ipea'`, `'sicar'`.                                      |
| `spatial`      | `Spatial`                                                            |          | Spatial coverage, geometry, extent, and grain.                                       |
| `temporal`     | `Temporal`                                                           |          | Temporal coverage, grain, history, and period metadata.                              |
| `artifact`     | `{ url: string; format: 'csv' \| 'json' \| 'geojson' \| 'parquet' }` |          | Where the data lives and its format.                                                 |
| `columns`      | `Record<string, string>`                                             |          | Metric ID → dataset column name mapping.                                             |

### `Geography`

| Field         | Type                                              | Required | Description                                                                                                                                                                                                    |
| ------------- | ------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `string`                                          | ✓        | Unique identifier, referenced by `Dataset.geographyIds` and `Join.to`.                                                                                                                                         |
| `label`       | `string`                                          | ✓        | Human-readable name.                                                                                                                                                                                           |
| `description` | `string`                                          | ✓        | Geographic coverage and boundary source.                                                                                                                                                                       |
| `aliases`     | `string[]`                                        |          | Alternative names, e.g. `'município'` for `'municipality'`.                                                                                                                                                    |
| `kind`        | `'administrative' \| 'grid' \| 'poi' \| 'custom'` |          | Absent ⇒ `'administrative'`. Discriminates admin boundary (IBGE malha territorial) vs. spatial-index grid (H3/S2/geohash, IBGE grade estatística) vs. POI collection vs. custom parcel (SICAR rural property). |
| `level`       | `number`                                          |          | Ordinal depth in a nesting hierarchy — lower is coarser.                                                                                                                                                       |
| `parentId`    | `string`                                          |          | Geography id one level up — validated against `catalog.geographies`; cycles are rejected.                                                                                                                      |
| `codeScheme`  | `string`                                          |          | External code system feature ids follow, e.g. `'ibge:municipio'`, `'sicar:imovel'`, `'h3'`.                                                                                                                    |
| `resolution`  | `string`                                          |          | Tessellation resolution for `kind: 'grid'`, e.g. `'h3:8'`.                                                                                                                                                     |

### `Join`

| Field         | Type                              | Required | Description                                                     |
| ------------- | --------------------------------- | -------- | --------------------------------------------------------------- |
| `from`        | `string`                          | ✓        | Dataset id — source of the join.                                |
| `to`          | `string`                          | ✓        | Geography id — target of the join.                              |
| `on`          | `{ left: string; right: string }` | ✓        | Field mapping: `left` in the dataset, `right` in the geography. |
| `cardinality` | `'1:1' \| '1:m' \| 'm:1'`         | ✓        | Join cardinality.                                               |

### `Dimension`

| Field         | Type                                       | Required | Description                                                |
| ------------- | ------------------------------------------ | -------- | ---------------------------------------------------------- |
| `id`          | `string`                                   | ✓        | Unique identifier, referenced by `Series.dimensions`.      |
| `label`       | `string`                                   | ✓        | Human-readable name.                                       |
| `description` | `string`                                   |          | What values of this dimension represent.                   |
| `kind`        | `'categorical' \| 'numeric' \| 'temporal'` | ✓        | Type of dimension values.                                  |
| `property`    | `string`                                   | ✓        | Dataset or geography field name carrying dimension values. |
| `aliases`     | `string[]`                                 |          | Alternative names for search/discovery.                    |

### `SpatialGrainRef`

| Field         | Type     | Required | Description                                                                                |
| ------------- | -------- | -------- | ------------------------------------------------------------------------------------------ |
| `geographyId` | `string` | ✓        | Geography id this spatial grain binds to — validated against `catalog.geographies`.        |
| `label`       | `string` |          | Human-readable name, overriding the geography's label when rendering this specific series. |

### `Series`

| Field           | Type              | Required | Description                                                                             |
| --------------- | ----------------- | -------- | --------------------------------------------------------------------------------------- |
| `id`            | `string`          | ✓        | Unique identifier.                                                                      |
| `metricId`      | `string`          | ✓        | Metric this series measures — validated against `catalog.metrics`.                      |
| `spatialGrain`  | `SpatialGrainRef` |          | Geography this series' data is aggregated to — validated against `catalog.geographies`. |
| `temporalGrain` | `TemporalGrain`   |          | Time resolution of this series: ISO-8601 duration (e.g. `P1Y`, `P1M`) or keyword.       |
| `dimensions`    | `Dimension[]`     |          | Optional slicing dimensions — metric broken down by region, age group, etc.             |

### `FilterField` / `MapTypeCatalogEntry`

| Field                                     | Type                                                    | Required | Description                                                        |
| ----------------------------------------- | ------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| `FilterField.id`                          | `string`                                                | ✓        | Unique identifier, referenced by intents and filter actions.       |
| `FilterField.label`                       | `string`                                                | ✓        | Human-readable name for the control.                               |
| `FilterField.description`                 | `string`                                                |          | Help text explaining what the filter narrows.                      |
| `FilterField.aliases`                     | `string[]`                                              |          | Alternative names for search/discovery.                            |
| `FilterField.property`                    | `string`                                                | ✓        | Feature property the predicate reads.                              |
| `FilterField.kind`                        | `'categorical' \| 'numeric' \| 'temporal'`              | ✓        | Constrains both `domain.mode` and `operators`.                     |
| `FilterField.sourceDatasetId`             | `string`                                                | ~        | Dataset carrying `property`. Exactly one source is required.       |
| `FilterField.sourceGeographyId`           | `string`                                                | ~        | Geography carrying `property`. Exactly one source is required.     |
| `FilterField.metricId`                    | `string`                                                |          | Measure being narrowed — supplies `unit` and `formatter`.          |
| `FilterField.operators`                   | `LayerFilterOperator[]`                                 | ✓        | Comparisons the control may emit, each mapping to a `LayerFilter`. |
| `FilterField.multiple`                    | `boolean`                                               |          | Whether several values may be selected. Categorical only.          |
| `FilterField.domain`                      | `FilterDomain`                                          | ✓        | Values or bounds the control offers.                               |
| `MapTypeCatalogEntry.name`                | `'choropleth' \| 'dotDensity' \| 'proportionalCircles'` | ✓        | Map type name.                                                     |
| `MapTypeCatalogEntry.supportedGeometries` | `Array<'point' \| 'polygon' \| 'line'>`                 | ✓        | Geometries this map type supports.                                 |
| `MapTypeCatalogEntry.metricKinds`         | `MetricKind[]`                                          | ✓        | Metric kinds this map type can visualize.                          |

### Building filter UI

`FilterDomain` is a discriminated union on `mode`, which is what tells a component which widget to build:

| Mode         | Shape                                    | Applies to  |
| ------------ | ---------------------------------------- | ----------- |
| `'values'`   | `{ values: { value, label, count? }[] }` | categorical |
| `'range'`    | `{ min, max, step? }`                    | numeric     |
| `'interval'` | `{ start, end }`                         | temporal    |
| `'runtime'`  | —                                        | any kind    |

`getFilterControls(catalog)` projects `catalog.filters` into render-ready descriptors, resolving each filter's source and its metric's display hints so a component never has to walk the catalog itself:

```tsx
import { computeFilterDomain, getFilterControls } from '@ttoss/geovis-catalog';

const controls = getFilterControls(catalog);
// [{ id: 'filter-populacao', label: 'População', control: 'range-slider',
//    source: { kind: 'dataset', id: '…', label: 'Demografia Municipal' },
//    domain: { mode: 'range', min: 0, max: 12000000, step: 1000 },
//    unit: 'habitantes', formatter: 'compact', requiresData: false }, …]

const Filters = () => {
  return controls.map((control) => {
    switch (control.control) {
      case 'multi-select':
        return <MultiSelect key={control.id} {...control} />;
      case 'range-slider':
        return <RangeSlider key={control.id} {...control} />;
      // 'select' | 'date-range'
    }
  });
};
```

`requiresData` is `true` when the catalog declares `mode: 'runtime'` — the bounds or options exist but are only knowable from the data. Compute them from rows the application already holds:

```ts
const domain = computeFilterDomain({ filter, rows });
// { mode: 'range', min: 0.4, max: 87.2 }
```

`computeFilterDomain` is pure: it reads the rows passed to it and fetches nothing, so data access stays on the application's side. Values that do not match the filter's `kind` are skipped rather than coerced — a numeric column holding `'12'` as text is a data problem, not something the catalog should silently parse.

`operators` map 1:1 to `LayerFilter.operator` in `@ttoss/geovis`, and the schema rejects combinations that carry no meaning (`in` on a numeric filter, `multiple` outside a categorical one, a `values` domain on a numeric field), so a control never renders a predicate the runtime cannot compile.

### `Catalog`

| Field         | Type                      | Required | Description                                                                                                                                                            |
| ------------- | ------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`     | `string` (non-empty)      | ✓        | Opaque, per-organization catalog version — not this package's schema version. Any non-empty string (semver, a date/quarter like `'2026-Q3'`, an incrementing integer). |
| `domain`      | `string`                  |          | Namespace of the catalog, e.g. `'br'`.                                                                                                                                 |
| `datasets`    | `Dataset[]`               | ✓        |                                                                                                                                                                        |
| `metrics`     | `Metric[]`                | ✓        |                                                                                                                                                                        |
| `geographies` | `Geography[]`             | ✓        |                                                                                                                                                                        |
| `joins`       | `Join[]`                  | ✓        |                                                                                                                                                                        |
| `series`      | `Series[]`                |          | Timeseries with explicit spatio-temporal grain and optional dimensions — aggregated metric slices.                                                                     |
| `mapTypes`    | `MapTypeCatalogEntry[]`   | ✓        |                                                                                                                                                                        |
| `filters`     | `FilterField[]`           | ✓        |                                                                                                                                                                        |
| `permissions` | `Record<string, unknown>` |          | Opaque authz metadata, consumed by the application layer — stripped by `getCatalogIntrospection`.                                                                      |

## Status

PRD-004 (this package's bootstrap, catalog contract, and integrity validation) is implemented. PRD-005 (constrained map intent) and PRD-006 (deterministic resolution) build on top of it — see [`../geovis/docs/plans/`](../geovis/docs/plans/).
