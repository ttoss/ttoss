# @ttoss/geovis-catalog

Trusted catalog contract for [`@ttoss/geovis`](/docs/modules/packages/geovis/) — the curated, machine-facing metadata an AI or a builder validates against before generating a map. Nothing in the catalog is raw data; it describes what is mappable (metrics, datasets, geographies, joins, map types) so a generation request can be rejected before it hallucinates a reference that doesn't exist.

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
  collections: [
    {
      id: 'ibge',
      title: 'IBGE',
      slug: 'ibge',
      description:
        'Datasets geográficos e demográficos do Instituto Brasileiro de Geografia e Estatística.',
      organization: 'Instituto Brasileiro de Geografia e Estatística (IBGE)',
      sourceUrl: 'https://www.ibge.gov.br',
      publicReferenceUrl: 'https://servicodados.ibge.gov.br',
    },
  ],
  datasets: [
    {
      id: 'dataset-demografia-municipio',
      title: 'Demografia Municipal',
      slug: 'demografia-municipal',
      description: 'População e densidade populacional por município.',
      geographyIds: ['geo-municipio'],
      metricIds: ['metric-populacao'],
      collectionId: 'ibge',
      spatial: {
        dimensionStatus: 'described',
        spatialGeometry: 'polygon',
        extent: [{ code: '35', label: 'São Paulo' }],
      },
      temporal: {
        dimensionStatus: 'described',
        temporalGrain: 'P1Y',
        extent: [{ start: '2010-01-01', end: '2022-12-31' }],
        temporalHistory: 'snapshot',
        updateFrequency: 'annual',
      },
    },
  ],
  metrics: [
    {
      id: 'metric-populacao',
      title: 'População',
      description: 'População total residente.',
      kind: 'count',
      nullPolicy: 'zero',
    },
  ],
  geographies: [
    {
      id: 'geo-municipio',
      title: 'Município',
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

`MapTypeCatalogEntry.supportedGeometries` documents _data adequacy_ only — that a metric kind makes sense on that geometry, nothing about which engine adapter is active. Pass the adapter's `CapabilitySet` (`adapter.getCapabilities()` from `@ttoss/geovis`) to additionally reject a map type the catalog calls data-adequate but the active adapter cannot render:

```ts
const result = validateCatalog(catalog, {
  capabilities: adapter.getCapabilities(),
});
// mismatch, 'unsupported-map-type-geometry', if a mapType's supportedGeometries
// aren't a subset of capabilities.layerGeometries
```

### `CatalogResultStatus` and `CatalogIssueCode`

| Status     | Codes                                                                                                                                                                                                                                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `invalid`  | `invalid-catalog-schema`, `duplicate-metric-id`, `duplicate-dataset-id`, `duplicate-geography-id`, `duplicate-filter-id`, `duplicate-collection-id`, `duplicate-dataset-field-name`                                                                                                                             |
| `mismatch` | `unknown-join-dataset`, `unknown-join-geography`, `unknown-dataset-geography`, `unknown-dataset-metric`, `unknown-dataset-collection`, `unknown-filter-dataset`, `unknown-filter-geography`, `unknown-filter-metric`, `unknown-parent-geography`, `cyclic-geography-hierarchy`, `unsupported-map-type-geometry` |

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

## `id` / `slug` / `title` naming convention (D16)

Every named entity (`Metric`, `MetricCategory`, `Dataset`, `DatasetField`, `Geography`, `Collection`, `Dimension`, `FilterField`) follows the same three-field convention, absorbed from the pilot applications' own data dictionaries:

- **`id`** — the programmatic key, referenced by every foreign key in the catalog (`Dataset.metricIds`, `Join.from`, …). Free-form.
- **`title`** — the human-readable name. Was `label` before D16; renamed so `label` reads unambiguously wherever it still appears (see below).
- **`slug`** _(optional)_ — the kebab-case, URL-safe identifier, e.g. `'municipios-contorno'`. Validated against `^[a-z0-9]+(-[a-z0-9]+)*$`. Distinct from `id` — a dictionary's `id` is often `snake_case` (`municipios_contorno`), its `slug` is the display/URL form.

**`label` stays `label` in exactly one place: `SpatialGrain.label` / `SpatialGrainRef.label`.** Those aren't standalone entities with an `id` — they're a business-facing override name for one specific grain reference (e.g. `'cozinha'` on a `scheme: 'custom'` grain), so renaming them would collide with the entity-naming rationale above rather than serve it. Inline value objects with no `id` (`CodedRef`, `Interval`, `TemporalFields`, `DatasetProvenance`, `DatasetAccess`) are unaffected either way — they never had a `label`/`title` field to begin with.

`DatasetField` is identified by `name` (the column name), not `id` — it gets `title` (renamed from `label`) but no `slug`, since `name` already serves as its slug-equivalent and dictionary field entries carry no separate slug.

## Catalog contract

### `Metric`

| Field         | Type                                                                              | Required | Description                                                                               |
| ------------- | --------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `id`          | `string`                                                                          | ✓        | Unique identifier, referenced by `Dataset.metricIds`.                                     |
| `title`       | `string`                                                                          | ✓        | Human-readable name.                                                                      |
| `slug`        | `string` (kebab-case)                                                             |          | URL-safe identifier (D16).                                                                |
| `description` | `string`                                                                          | ✓        | What the metric measures and how it's calculated.                                         |
| `aliases`     | `string[]`                                                                        |          | Alternative names for search/discovery.                                                   |
| `unit`        | `string`                                                                          |          | Free-form measurement unit (`km`, `USD`, `hab/km²`).                                      |
| `kind`        | `'count' \| 'rate' \| 'ratio' \| 'index' \| 'density' \| 'distance' \| 'nominal'` | ✓        | Semantic category.                                                                        |
| `categories`  | `MetricCategory[]`                                                                | ~        | Closed value whitelist. Required (non-empty) when `kind: 'nominal'`, forbidden otherwise. |
| `formatter`   | `'number' \| 'percent' \| 'currency' \| 'compact'`                                |          | Formatting hint.                                                                          |
| `nullPolicy`  | `'hide' \| 'zero' \| 'explain'`                                                   | ✓        | How nulls should be treated when rendering.                                               |

#### `MetricCategory` — nominal metric values (D1)

A `kind: 'nominal'` metric (e.g. a land-use classification) has no numeric ordering, so it declares its legal values instead of a range. This is what gives a categorical choropleth a catalog counterpart:

```ts
{
  id: 'metric-classe-uso-solo',
  title: 'Classe de Uso do Solo',
  description: 'Classificação categórica do uso predominante do solo.',
  kind: 'nominal',
  categories: [
    { id: 'urbano', title: 'Urbano', order: 1, colorToken: 'display.categorical.1' },
    { id: 'rural', title: 'Rural', order: 2, colorToken: 'display.categorical.2' },
  ],
  nullPolicy: 'hide',
}
```

| Field        | Type                  | Required | Description                                                                                   |
| ------------ | --------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `id`         | `string`              | ✓        | Value the underlying column carries.                                                          |
| `title`      | `string`              | ✓        | Human-readable name.                                                                          |
| `slug`       | `string` (kebab-case) |          | URL-safe identifier (D16).                                                                    |
| `order`      | `number`              |          | Legend/UI ordering, independent of `id`'s alphabetical sort.                                  |
| `colorToken` | `string`              |          | A `@ttoss/ui`/`@ttoss/theme` token — never a raw color — for a themed categorical choropleth. |

### `Temporal`

| Field             | Type                                                                                                                                | Required | Description                                                                                                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dimensionStatus` | `'described' \| 'not_applicable' \| 'unknown'`                                                                                      | ✓        | Whether temporal grain/coverage is documented.                                                                                                                                              |
| `temporalGrain`   | ISO-8601 duration or keyword                                                                                                        |          | Time resolution of ONE record: `P1Y`, `P1M`, `PT15M`, or `instant`, `irregular`, `continuous`, `unknown`.                                                                                   |
| `extent`          | `{ start?: string; end?: string }[]`                                                                                                |          | Time intervals covered (ISO-8601 dates). Multiple intervals for non-contiguous coverage.                                                                                                    |
| `updateFrequency` | `'real_time' \| 'daily' \| 'weekly' \| 'monthly' \| 'quarterly' \| 'annual' \| 'irregular' \| 'on_demand' \| 'static' \| 'unknown'` |          | Cadence with which NEW data arrives (D16). Renamed from `frequency` to read unambiguously beside `temporalGrain` — independent of it: a daily-grain dataset can still be published monthly. |
| `temporalHistory` | `'snapshot' \| 'overwrite' \| 'append_only' \| 'revised' \| 'unknown'`                                                              |          | Update pattern: whether values change after collection.                                                                                                                                     |
| `periods`         | `{ start: string; end: string; label?: string }[]`                                                                                  |          | Explicit periods, optional — overrides gaps or carries per-period metadata.                                                                                                                 |
| `anchor`          | `string`                                                                                                                            |          | Anchor for non-calendar periods (D16), e.g. a fiscal/harvest year starting in July (`'--07-01'`).                                                                                           |
| `field`           | `TemporalFields`                                                                                                                    |          | Column(s) carrying the temporal value (D16) — see below.                                                                                                                                    |
| `timezone`        | `string`                                                                                                                            |          | IANA timezone (e.g. `'America/Sao_Paulo'`) the dimension is read in (D16). Omit for date-only/naive values.                                                                                 |

#### `TemporalFields` — column(s) carrying temporal values (D16)

Replaces the single `field: string` (D2). `instant` (event time) and the `start`/`end` pair (a record spanning an interval, e.g. an admission) are **mutually exclusive** — declare one or the other, never both. `recorded` (system/ingestion time) may accompany either, modeling **bitemporal** data (fact time vs. entry-into-the-base time).

```ts
// event time
{ instant: 'data_cadastro' }
// interval + bitemporal
{ start: 'dt_internacao', end: 'dt_alta', recorded: 'dt_processamento' }
```

| Field      | Type     | Description                                     |
| ---------- | -------- | ----------------------------------------------- |
| `instant`  | `string` | Column of a single-instant reading.             |
| `start`    | `string` | Start of the record's validity interval.        |
| `end`      | `string` | End of the record's validity interval.          |
| `recorded` | `string` | When the record entered the base (system time). |

`validateCatalog`'s schema rejects `instant` combined with `start`/`end`, `start` without `end` (or vice versa), and an entirely empty `TemporalFields` — at least one role must be named.

### `Spatial`

| Field             | Type                                                                                                                                 | Required | Description                                                                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dimensionStatus` | `'described' \| 'not_applicable' \| 'unknown'`                                                                                       | ✓        | Whether spatial coverage is documented.                                                                                                                                                                                                                |
| `spatialGeometry` | `'point' \| 'polygon' \| 'line' \| 'multipolygon' \| 'none'`                                                                         |          | Primary geometry type of features.                                                                                                                                                                                                                     |
| `extent`          | `{ code: string; label?: string }[]`                                                                                                 |          | Geographic regions/codes covered (e.g., IBGE municipality codes).                                                                                                                                                                                      |
| `coverage`        | `'exhaustive' \| 'partial' \| 'sample' \| 'unknown'`                                                                                 |          | How completely `extent` is populated with data (D16) — independent of `extent` and `spatialGrain`. E.g. a dataset can cover Brazil (`extent`) while only 60% of municipalities have a row (`coverage: 'partial'`).                                     |
| `spatialGrain`    | `{ scheme: string; code: string; label?: string }`                                                                                   |          | Code scheme + field/code carrying the spatial grain (D8 seam, `SpatialGrain`).                                                                                                                                                                         |
| `precision`       | `'rooftop' \| 'parcel' \| 'street' \| 'postal_centroid' \| 'locality_centroid' \| 'admin_centroid' \| 'not_applicable' \| 'unknown'` |          | Positional precision, relevant to point/geocoded data only (D16). Two `spatialGeometry: 'point'` datasets can carry wildly different precision (exact rooftop vs. a city centroid) — treating them the same silently corrupts distance-based analysis. |
| `srid`            | `number`                                                                                                                             |          | Coordinate reference system SRID (D16), e.g. `4326` (WGS84), `4674` (SIRGAS2000/IBGE). Omit when `spatialGeometry` is `'none'`.                                                                                                                        |
| `field`           | `string \| string[]`                                                                                                                 |          | Column(s) carrying the spatial reference (D16) — an array for a composite key.                                                                                                                                                                         |

### `Collection` — institutional data source (D13, D16)

A named registry of institutional sources, referenced by `Dataset.collectionId` instead of a free-form `source` string. Attribution (organization, public reference, source URL) is declared once per collection and composed for every dataset that points to it, instead of being duplicated — or hard-coded downstream — per dataset.

```ts
{
  id: 'ibge',
  title: 'IBGE',
  slug: 'ibge',
  description: 'Datasets geográficos e demográficos do Instituto Brasileiro de Geografia e Estatística.',
  organization: 'Instituto Brasileiro de Geografia e Estatística (IBGE)',
  sourceUrl: 'https://www.ibge.gov.br',
  publicReferenceUrl: 'https://servicodados.ibge.gov.br',
  tags: ['ibge', 'geografia', 'demografia', 'dados-publicos'],
}
```

| Field                | Type                  | Required | Description                                                                                                                |
| -------------------- | --------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `id`                 | `string`              | ✓        | Unique identifier, referenced by `Dataset.collectionId`.                                                                   |
| `title`              | `string`              | ✓        | Human-readable name.                                                                                                       |
| `slug`               | `string` (kebab-case) |          | URL-safe identifier (D16).                                                                                                 |
| `description`        | `string`              | ✓        | What the collection is and what it covers.                                                                                 |
| `organization`       | `string`              |          | Publishing organization, e.g. `'Instituto Brasileiro de Geografia e Estatística (IBGE)'`.                                  |
| `sourceUrl`          | `string`              |          | The organization's own site.                                                                                               |
| `publicReferenceUrl` | `string`              |          | A public API or reference endpoint for the collection's data.                                                              |
| `aliases`            | `string[]`            |          | Alternative _names_ for the same collection, for search/discovery.                                                         |
| `tags`               | `string[]`            |          | Free-form facet labels for search/discovery grouping (D16) — distinct from `aliases`: a tag categorizes, an alias renames. |

`validateCatalog` rejects a duplicate `Collection.id` (`duplicate-collection-id`) and a `Dataset.collectionId` naming nothing in `catalog.collections` (`unknown-dataset-collection`), the same way it already does for `geographyIds`/`metricIds`.

### `Dataset`

| Field          | Type                                                                                 | Required | Description                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | `string`                                                                             | ✓        | Unique identifier, referenced by `Join.from`.                                                                                                                                                  |
| `title`        | `string`                                                                             | ✓        | Human-readable name.                                                                                                                                                                           |
| `slug`         | `string` (kebab-case)                                                                |          | URL-safe identifier (D16).                                                                                                                                                                     |
| `description`  | `string`                                                                             | ✓        | Data, collection methodology, and caveats.                                                                                                                                                     |
| `aliases`      | `string[]`                                                                           |          | Alternative names for search/discovery.                                                                                                                                                        |
| `geographyIds` | `string[]`                                                                           | ✓        | Geographies this dataset can be joined to — validated against `catalog.geographies`.                                                                                                           |
| `metricIds`    | `string[]`                                                                           | ✓        | Metrics this dataset carries — validated against `catalog.metrics`.                                                                                                                            |
| `collectionId` | `string`                                                                             |          | Institutional source — foreign key into `catalog.collections` (D13).                                                                                                                           |
| `spatial`      | `Spatial`                                                                            |          | Spatial coverage, geometry, extent, and grain.                                                                                                                                                 |
| `temporal`     | `Temporal`                                                                           |          | Temporal coverage, grain, history, and period metadata.                                                                                                                                        |
| `artifact`     | `{ url: string; format: 'csv' \| 'json' \| 'geojson' \| 'parquet' }`                 |          | Where the app reads/serves the dataset's bytes from.                                                                                                                                           |
| `columns`      | `Record<string, string>`                                                             |          | Metric ID → dataset column name mapping.                                                                                                                                                       |
| `fields`       | `DatasetField[]`                                                                     |          | Per-column metadata, including per-field sensitivity (D12) and role (D16).                                                                                                                     |
| `generatedBy`  | `string`                                                                             |          | Process/script that produced a derived dataset (D16), e.g. `'scripts/generate-municipios-populacao.mjs'`.                                                                                      |
| `provenance`   | `{ url?: string; notes?: string }`                                                   |          | Per-dataset acquisition detail (D16), finer-grained than `Collection.sourceUrl`/`.publicReferenceUrl` — the specific endpoint/extraction this dataset's numbers came from, plus human caveats. |
| `access`       | `{ level: 'public' \| 'restricted'; containsPersonalData: boolean; notes?: string }` |          | Structured LGPD/governance classification (D16), alongside the coarser `sensible` flag.                                                                                                        |
| `sensible`     | `boolean`                                                                            |          | Flags the whole dataset as carrying sensitive data. A declaration, not enforcement — the catalog only uses it to govern its own disclosure.                                                    |

`artifact.url`, `provenance.url`, and `Collection.sourceUrl`/`.publicReferenceUrl` answer three different questions, kept deliberately distinct rather than collapsed into one `url` field: `artifact.url` is where **this app** reads the bytes (a local path or a served URL), `provenance.url` is the **specific endpoint or extraction** this dataset's numbers came from (may differ from `artifact.url` after a manual download/transform), and `Collection.sourceUrl`/`.publicReferenceUrl` are the **organization's** own site/portal, shared across every dataset in that collection.

#### `DatasetField` — per-column metadata (D12, D16)

| Field      | Type                                   | Required | Description                                                                                                                           |
| ---------- | -------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `name`     | `string`                               | ✓        | Column name — what `IntentFilter.field` (PRD-005) resolves against.                                                                   |
| `title`    | `string`                               |          | Human-readable name. Required when `sensible: true` — exposure can never be the result of an omission.                                |
| `role`     | `'identifier' \| 'geometry' \| 'join'` |          | Structural role of the column (D16) — a join/geometry/identifier column means something different to a consumer than a plain measure. |
| `unit`     | `string`                               |          | Free-form measurement unit for this column (D16), mirroring `Metric.unit` for a field that isn't itself a declared `Metric`.          |
| `sensible` | `boolean`                              |          | Flags this specific column as sensitive, finer-grained than `Dataset.sensible`'s whole-dataset flag.                                  |

`getCatalogIntrospection` omits every field declared `sensible: true` from the payload it returns — the same principle applied to `Catalog.permissions`, but per-column: a model reading the introspection never learns a sensitive column exists, let alone its name or title. Two fields on the same dataset cannot share a `name` — `validateCatalog` rejects it as `duplicate-dataset-field-name`.

### `Geography`

| Field           | Type                                              | Required | Description                                                                                                                                                                                                    |
| --------------- | ------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | `string`                                          | ✓        | Unique identifier, referenced by `Dataset.geographyIds` and `Join.to`.                                                                                                                                         |
| `title`         | `string`                                          | ✓        | Human-readable name.                                                                                                                                                                                           |
| `slug`          | `string` (kebab-case)                             |          | URL-safe identifier (D16).                                                                                                                                                                                     |
| `description`   | `string`                                          | ✓        | Geographic coverage and boundary source.                                                                                                                                                                       |
| `aliases`       | `string[]`                                        |          | Alternative names, e.g. `'município'` for `'municipality'`.                                                                                                                                                    |
| `kind`          | `'administrative' \| 'grid' \| 'poi' \| 'custom'` |          | Absent ⇒ `'administrative'`. Discriminates admin boundary (IBGE malha territorial) vs. spatial-index grid (H3/S2/geohash, IBGE grade estatística) vs. POI collection vs. custom parcel (SICAR rural property). |
| `level`         | `number`                                          |          | Ordinal depth in a nesting hierarchy — lower is coarser.                                                                                                                                                       |
| `parentId`      | `string`                                          |          | Geography id one level up — validated against `catalog.geographies`; cycles are rejected.                                                                                                                      |
| `codeScheme`    | `string`                                          |          | External code system feature ids follow, e.g. `'ibge:municipio'`, `'sicar:imovel'`, `'h3'`.                                                                                                                    |
| `resolution`    | `string`                                          |          | Tessellation resolution for `kind: 'grid'`, e.g. `'h3:8'`.                                                                                                                                                     |
| `cameraFraming` | `CameraFraming`                                   |          | Neutral bbox/centre/zoom framing of this geography's extent (D5).                                                                                                                                              |

#### `CameraFraming` — resolver input, never a preset (D5)

| Field          | Type                               | Required | Description                                                                |
| -------------- | ---------------------------------- | -------- | -------------------------------------------------------------------------- |
| `bbox`         | `[number, number, number, number]` | ✓        | `[minLng, minLat, maxLng, maxLat]` bounding box of the geography's extent. |
| `cameraCenter` | `[number, number]`                 |          | `[lng, lat]` centroid, if known.                                           |
| `cameraZoom`   | `number`                           |          | A reasonable zoom level for viewing the whole extent.                      |

`cameraFraming` is deliberately _not_ a `viewPreset` — PRD-006's resolver derives bounded `viewPresets` from it, so a `set-view-preset` action can only ever land on a position the catalog actually describes, not coordinates a model invents.

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
| `title`       | `string`                                   | ✓        | Human-readable name.                                       |
| `slug`        | `string` (kebab-case)                      |          | URL-safe identifier (D16).                                 |
| `description` | `string`                                   |          | What values of this dimension represent.                   |
| `kind`        | `'categorical' \| 'numeric' \| 'temporal'` | ✓        | Type of dimension values.                                  |
| `property`    | `string`                                   | ✓        | Dataset or geography field name carrying dimension values. |
| `aliases`     | `string[]`                                 |          | Alternative names for search/discovery.                    |

### `SpatialGrainRef`

| Field         | Type     | Required | Description                                                                                                                                                                         |
| ------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `geographyId` | `string` | ✓        | Geography id this spatial grain binds to — validated against `catalog.geographies`.                                                                                                 |
| `label`       | `string` |          | Human-readable name, overriding the geography's title when rendering this specific series. Kept as `label` — see [naming convention](#id--slug--title-naming-convention-d16) above. |

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
| `FilterField.title`                       | `string`                                                | ✓        | Human-readable name for the control.                               |
| `FilterField.slug`                        | `string` (kebab-case)                                   |          | URL-safe identifier (D16).                                         |
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

The catalog's own `FilterField.domain` (`FilterDomain`) is always `{ mode: 'runtime' }` — the catalog only declares that a domain exists; it is computed by the application from the data it holds, not pre-declared. `computeFilterDomain` returns a separate, richer shape — `ComputedFilterDomain` — which a component actually renders from:

| Mode         | Shape                                    | Applies to  |
| ------------ | ---------------------------------------- | ----------- |
| `'values'`   | `{ values: { value, label, count? }[] }` | categorical |
| `'range'`    | `{ min, max }`                           | numeric     |
| `'interval'` | `{ start, end }`                         | temporal    |

`ComputedFilterDomain` is never written back onto `FilterField.domain` — it stays a UI-side value the application holds alongside the filter, keeping the catalog's declarative contract (`{ mode: 'runtime' }`) separate from the computed value.

`getFilterControls(catalog)` projects `catalog.filters` into render-ready descriptors, resolving each filter's source and its metric's display hints so a component never has to walk the catalog itself. Its output shape keeps `label` (not `title`) — it's a UI-facing render descriptor, not a catalog entity, so it stays outside the [naming convention](#id--slug--title-naming-convention-d16) above:

```tsx
import { computeFilterDomain, getFilterControls } from '@ttoss/geovis-catalog';

const controls = getFilterControls(catalog);
// [{ id: 'filter-populacao', label: 'População', control: 'range-slider',
//    source: { kind: 'dataset', id: '…', label: 'Demografia Municipal' },
//    domain: { mode: 'runtime' },
//    unit: 'habitantes', formatter: 'compact', requiresData: true }, …]

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

`requiresData` is always `true` today, since the catalog always declares `mode: 'runtime'` — the bounds or options exist but are only knowable from the data. Compute them from rows the application already holds:

```ts
const domain = computeFilterDomain({ filter, rows });
// { mode: 'range', min: 0.4, max: 87.2 }
```

`computeFilterDomain` is pure: it reads the rows passed to it and fetches nothing, so data access stays on the application's side. Values that do not match the filter's `kind` are skipped rather than coerced — a numeric column holding `'12'` as text is a data problem, not something the catalog should silently parse.

`operators` map 1:1 to `LayerFilter.operator` in `@ttoss/geovis`, and the schema rejects combinations that carry no meaning (`in` on a numeric filter, `multiple` outside a categorical one), so a control never renders a predicate the runtime cannot compile.

### `Catalog`

| Field         | Type                      | Required | Description                                                                                                                                                            |
| ------------- | ------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`     | `string` (non-empty)      | ✓        | Opaque, per-organization catalog version — not this package's schema version. Any non-empty string (semver, a date/quarter like `'2026-Q3'`, an incrementing integer). |
| `domain`      | `string`                  |          | Namespace of the catalog, e.g. `'br'`.                                                                                                                                 |
| `collections` | `Collection[]`            |          | Institutional data sources, referenced by `Dataset.collectionId` (D13).                                                                                                |
| `datasets`    | `Dataset[]`               | ✓        |                                                                                                                                                                        |
| `metrics`     | `Metric[]`                | ✓        |                                                                                                                                                                        |
| `geographies` | `Geography[]`             | ✓        |                                                                                                                                                                        |
| `joins`       | `Join[]`                  | ✓        |                                                                                                                                                                        |
| `series`      | `Series[]`                |          | Timeseries with explicit spatio-temporal grain and optional dimensions — aggregated metric slices.                                                                     |
| `mapTypes`    | `MapTypeCatalogEntry[]`   | ✓        |                                                                                                                                                                        |
| `filters`     | `FilterField[]`           | ✓        |                                                                                                                                                                        |
| `permissions` | `Record<string, unknown>` |          | Opaque authz metadata, consumed by the application layer — stripped by `getCatalogIntrospection`.                                                                      |

Deliberately **not** absorbed from the data dictionaries' own top-level `catalog` envelope (`schema_version`, `id`, `title`, `description`, `language`, `status`, `created_at`, `updated_at`, `typing_reference`, `quality_notes`) — those describe the _dictionary document itself_ (a separate artifact, D8), not something a map-generation consumer needs. See `docs/DECISIONS.md` (D16) for the full list of what was and wasn't absorbed, and why.

## Status

PRD-004 (this package's bootstrap, catalog contract, and integrity validation) is implemented. PRD-005 (constrained map intent) and PRD-006 (deterministic resolution) build on top of it.
