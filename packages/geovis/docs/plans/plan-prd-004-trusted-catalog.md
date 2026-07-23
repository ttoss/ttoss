---
title: Plan · PRD-004 Trusted Catalog
---

# Implementation Plan: PRD-004 Trusted Catalog

Source: [PRD-004](../prds/prd-004-trusted-catalog.md) · Basis: strategy §5.2 (product-hub doc not present in this repo — see Verification) · Package: new `@ttoss/geovis-catalog`

This is the first of three plans (PRD-004 → PRD-005 → PRD-006) that all land in the same new package, `@ttoss/geovis-catalog`, per each PRD's own "Package: same layer as PRD-004" line. This plan bootstraps the package and ships the catalog contract and its integrity validation; PRD-005's plan adds the intent schema on top, and PRD-006's plan adds the resolver on top of both.

## Durable decisions

### D1 — Schema validation: Ajv + hand-authored JSON Schema

`@ttoss/geovis-catalog` is a machine-facing data contract package in the same product family as `@ttoss/geovis`. Following the established pattern from `@ttoss/geovis`'s own `VisualizationSpec`:

- `catalog.schema.json` — hand-authored JSON Schema (draft 2020-12), `$id`/`additionalProperties: false`, styled exactly like `spec/schema.json`.
- `Catalog` — a hand-written TypeScript interface in `types.ts`, kept in sync with the schema.
- `Ajv2020` (from `ajv/dist/2020`, the same import `@ttoss/geovis` already uses) compiles and validates at runtime.

Since the source of truth is JSON Schema from the start, `getCatalogJSONSchema()` (D6) returns the imported document directly — no derivation step needed. PRD-005's and PRD-006's plans adopt the same approach for consistency across the same package.

`package.json` dependencies: `ajv@^8.18.0` (same version as `@ttoss/geovis`) and `@ttoss/geovis` (for `RepairOption` reuse now, and `VisualizationSpec`/`resolveSpecFromMapType` reuse in PRD-006's plan).

### D2 — Package bootstrap

New package `packages/geovis-catalog`, non-React, modeled on `@ttoss/logger` (the repo's minimal non-UI package): `package.json` with `exports: { ".": "./src/index.ts" }`, `scripts.build = tsdown`, `scripts.test = jest --projects tests/unit`, `type-check` script, `tsdown.config.ts` using `tsdownConfig({ format: ['esm'] })` from `@ttoss/config`, `tests/unit/jest.config.ts` + `tests/tsconfig.json` mirroring `geovis-workspace`'s unit setup (no React/jsdom environment needed — this package has no components), root `tsconfig.json`, `README.md`, `CHANGELOG.md`. No Storybook stories and no `i18n` script: the package has no user-facing text — every string it produces is a machine `code`, translated downstream by `@ttoss/geovis-workspace` (ADR-0003), exactly like `@ttoss/geovis`'s own issue codes today. `tsdown`'s config must tell rolldown to bundle `catalog.schema.json` as a JSON asset (`resolve.json` behavior already default in the tsdown/rolldown toolchain `@ttoss/geovis` uses for its own `schema.json` import — confirm during Phase 1 rather than assume, since `@ttoss/geovis`'s `tsdown.config.ts` takes no extra JSON option and the import already works there today).

### D3 — Result taxonomy: mirrored, not literally reused

`@ttoss/geovis`'s `GeoVisIssue`/`GeoVisResult` (ADR-0001) hardcode a closed `GeoVisIssueCode` union scoped to spec/runtime concerns (`unknown-map-data-id`, `unsupported-layer-type`, …) — none of which describe catalog failures (unknown metric, unknown geography, no join path, ambiguous intent). Generalizing `@ttoss/geovis`'s public type to be generic over the code union is a breaking, cross-package change that no PRD requests. This plan instead defines a **structurally identical, independently-closed** taxonomy local to `@ttoss/geovis-catalog`:

```ts
export type CatalogResultStatus = 'mismatch' | 'invalid';
// 'needs-clarification' is added by PRD-005's plan when intent validation lands;
// the union stays open to that addition by design, matching ADR-0001's own
// "insufficient-data"/"needs-clarification" reserved-but-unused precedent.

export type CatalogIssueCode =
  | 'invalid-catalog-schema' // invalid: fails the JSON Schema (Ajv)
  | 'duplicate-metric-id' // invalid: two metrics share an id
  | 'duplicate-dataset-id'
  | 'duplicate-geography-id'
  | 'unknown-join-dataset' // mismatch: join references a dataset id not in catalog.datasets
  | 'unknown-join-geography' // mismatch: join references a geography id not in catalog.geographies
  | 'unresolvable-join-field'; // mismatch: join.on references a field the dataset/geography doesn't declare

export interface CatalogIssue {
  code: CatalogIssueCode;
  subject: { path: string; id?: string };
  message: string;
  repair?: RepairOption[]; // reused as-is from @ttoss/geovis — already code-agnostic
}

export type CatalogResult =
  | { status: 'valid'; catalog: Catalog }
  | { status: CatalogResultStatus; issues: CatalogIssue[] };
```

"Reporting through the PRD-001 taxonomy" (both PRD-004 and PRD-005's own words) is satisfied by shape-and-vocabulary parity — the same discriminated-union/status/code/subject/message/repair contract — not by importing a union that would have to grow unrelated entries.

### D4 — Catalog schema shape (JSON Schema)

Seeded directly from PRD-004's own field enumeration (metrics, datasets, geographies, joins, units, formatters, time ranges, filters, allowed map types, permissions, aliases, descriptions) and the `Catalog` interface already sketched in [`docs/ai-integration-readiness.md`](../ai-integration-readiness.md) — reused as the shape seed, not redesigned. It also carries the minimal domain/source-compatibility fields decided in **D7** (`Geography.kind`/`level`/`parentId`/`codeScheme`/`resolution`, `Metric.kind`'s `density`/`distance`, `Dataset.source`) inline, all additive and optional so the base contract stays minimal; D7 holds the rationale and the field→domain→source mapping. Authored as `src/schema/catalog.schema.json`, styled like `@ttoss/geovis`'s `spec/schema.json` (`$schema: "https://json-schema.org/draft/2020-12/schema"`, `$id`, `additionalProperties: false`, `$defs` for the repeated sub-shapes):

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://ttoss.dev/geovis-catalog/catalog.schema.json",
  "title": "Catalog",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "version",
    "datasets",
    "metrics",
    "geographies",
    "joins",
    "mapTypes",
    "filters"
  ],
  "properties": {
    "version": { "type": "string" },
    "domain": { "type": "string" },
    "datasets": { "type": "array", "items": { "$ref": "#/$defs/Dataset" } },
    "metrics": { "type": "array", "items": { "$ref": "#/$defs/Metric" } },
    "geographies": {
      "type": "array",
      "items": { "$ref": "#/$defs/Geography" }
    },
    "joins": { "type": "array", "items": { "$ref": "#/$defs/Join" } },
    "mapTypes": {
      "type": "array",
      "items": { "$ref": "#/$defs/MapTypeCatalogEntry" }
    },
    "filters": { "type": "array", "items": { "$ref": "#/$defs/FilterField" } },
    "permissions": { "type": "object" }
  },
  "$defs": {
    "Metric": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "label", "description", "kind", "nullPolicy"],
      "properties": {
        "id": { "type": "string" },
        "label": { "type": "string" },
        "description": { "type": "string" },
        "aliases": { "type": "array", "items": { "type": "string" } },
        "unit": { "type": "string" },
        "kind": {
          "type": "string",
          "enum": ["count", "rate", "ratio", "index", "density", "distance"]
        },
        "formatter": {
          "type": "string",
          "enum": ["number", "percent", "currency", "compact"]
        },
        "nullPolicy": { "type": "string", "enum": ["hide", "zero", "explain"] }
      }
    },
    "Dataset": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "label",
        "description",
        "geometry",
        "geographyIds",
        "metricIds"
      ],
      "properties": {
        "id": { "type": "string" },
        "label": { "type": "string" },
        "description": { "type": "string" },
        "geometry": { "type": "string", "enum": ["point", "polygon", "line"] },
        "geographyIds": { "type": "array", "items": { "type": "string" } },
        "metricIds": { "type": "array", "items": { "type": "string" } },
        "source": { "type": "string" },
        "temporal": {
          "type": "object",
          "additionalProperties": false,
          "required": ["start", "end"],
          "properties": {
            "start": { "type": "string" },
            "end": { "type": "string" }
          }
        }
      }
    },
    "Geography": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "label", "description"],
      "properties": {
        "id": { "type": "string" },
        "label": { "type": "string" },
        "description": { "type": "string" },
        "aliases": { "type": "array", "items": { "type": "string" } },
        "kind": {
          "type": "string",
          "enum": ["administrative", "grid", "poi", "custom"]
        },
        "level": { "type": "number" },
        "parentId": { "type": "string" },
        "codeScheme": { "type": "string" },
        "resolution": { "type": "string" }
      }
    },
    "Join": {
      "type": "object",
      "additionalProperties": false,
      "required": ["from", "to", "on", "cardinality"],
      "properties": {
        "from": { "type": "string" },
        "to": { "type": "string" },
        "on": {
          "type": "object",
          "additionalProperties": false,
          "required": ["left", "right"],
          "properties": {
            "left": { "type": "string" },
            "right": { "type": "string" }
          }
        },
        "cardinality": { "type": "string", "enum": ["1:1", "1:m"] }
      }
    },
    "FilterField": {
      "type": "object",
      "additionalProperties": false,
      "required": ["field", "kind"],
      "properties": {
        "field": { "type": "string" },
        "kind": {
          "type": "string",
          "enum": ["categorical", "numeric", "temporal"]
        },
        "domain": {}
      }
    },
    "MapTypeCatalogEntry": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "supportedGeometries", "metricKinds"],
      "properties": {
        "name": {
          "type": "string",
          "enum": ["choropleth", "dotDensity", "proportionalCircles"]
        },
        "supportedGeometries": {
          "type": "array",
          "items": { "type": "string", "enum": ["point", "polygon", "line"] }
        },
        "metricKinds": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["count", "rate", "ratio", "index", "density", "distance"]
          }
        }
      }
    }
  }
}
```

`permissions` stays an untyped, unconstrained object (`{ "type": "object" }`, no `properties`) in v1: PRD-004's own open question ("governance: who approves entries, how permissions integrate with application auth") is explicitly product/org work, not a schema-shape blocker — the schema reserves the slot, this plan does not design an authz engine. The matching hand-written interface, in `src/schema/types.ts`:

```ts
export type MetricKind =
  | 'count'
  | 'rate' // e.g. "per capita" or "per household"
  | 'ratio' // e.g. "male/female" or "urban/rural"
  | 'index' // e.g. "HDI" or "Gini"
  | 'density' // e.g. "population per km²"
  | 'distance';

/**

 */
export interface Metric {
  id: string;
  label: string;
  description: string;
  aliases?: string[];
  /** e.g. 'km', 'm²', 'USD' — free-form, not an enum as new units are added. */
  unit?: string;
  /**
   * Permits new comparations when analyzing data.
   */
  kind: MetricKind;
  /**
   * Output visualization formatting hint for the metric, e.g. "percent" for a 0–1 ratio, "currency" for a monetary value, "compact" for large numbers (1,000,000 → 1M). Optional: if absent, the consuming app chooses a default formatter based on the unit or kind.
   */
  formatter?: 'number' | 'percent' | 'currency' | 'compact';
  /** How to treat nulls in the dataset when visualizing this metric. Optional: if absent, the consuming app chooses a default null policy based on the kind. 'explain' means show a textual explanation. */
  nullPolicy: 'hide' | 'zero' | 'explain';
}

export interface Dataset {
  id: string;
  label: string;
  description: string;
  aliases?: string[];
  /** Current geometry of the dataset  */
  geometry: 'point' | 'polygon' | 'line';
  /** IDs of geographies this dataset can be joined to */
  geographyIds: string[];
  /** IDs of metrics this dataset carries */
  metricIds: string[];
  /** Provenance/attribution, e.g. 'ibge' | 'ipea' | 'sicar' — free-form. */
  source?: string;
  /** Optional temporal interval of the dataset, e.g. for a census extract. */
  temporal?: { start: string; end: string };
}

/** How a geography's features are structured (D7). Absent ⇒ 'administrative'. */
export type GeographyKind = 'administrative' | 'grid' | 'poi' | 'custom';

/**
 * How a geography is defined (D7) and how it can be joined to datasets. The four kinds are:
 * administrative boundary (IBGE malha territorial), spatial-index grid (H3/S2/geohash, IBGE grade estatística), point-of-interest collection, or custom parcel (SICAR rural property)
 * grid resolution (H3/S2/geohash cell size, IBGE grade)
 * poi collection (e.g. IBGE malha de equipamentos urbanos).
 * custom parcel (SICAR rural property, arbitrary polygon, not part of any official hierarchy).
 */

export interface Geography {
  id: string;
  label: string;
  description: string;
  /** Optional alternative names for the geography, e.g. 'município' for 'municipality'. */
  aliases?: string[];
  /** Discriminates admin boundary vs. spatial-index grid vs. POI collection vs. custom parcel. */
  kind?: GeographyKind;
  /** Ordinal depth in a nesting hierarchy — lower is coarser. Example: 0 for country, 1 for state, 2 for city. */
  level?: number;
  /** Geography id one level up that contains this one, enabling roll-up/drill-down. */
  parentId?: string;
  /** External code system feature ids follow, e.g. 'ibge:municipio', 'sicar:imovel', 'h3'. */
  codeScheme?: string;
  /** Tessellation resolution for `kind: 'grid'`, e.g. 'h3:8', '1km'. */
  resolution?: string;
}

/**
 * A join between a dataset and a geography, with the field names to join on and the cardinality.
 * The `from` dataset must declare the `left` field, and the `to` geography must declare the `right` field.
 * Cardinality is either 1:1 or 1:m (dataset row to geography feature).
 */
export interface Join {
  from: string; // dataset id
  to: string; // geography id
  on: { left: string; right: string };
  cardinality: '1:1' | '1:m';
}

export interface FilterField {
  field: string;
  kind: 'categorical' | 'numeric' | 'temporal';
  domain?: unknown;
}

export interface MapTypeCatalogEntry {
  name: 'choropleth' | 'dotDensity' | 'proportionalCircles';
  supportedGeometries: Array<'point' | 'polygon' | 'line'>;
  metricKinds: MetricKind[];
}

export interface Catalog {
  version: string;
  /** Unique domain/namespace of the catalog, e.g. 'br' for Brazil. */
  domain?: string;
  datasets: Dataset[];
  metrics: Metric[];
  geographies: Geography[];
  joins: Join[];
  mapTypes: MapTypeCatalogEntry[];
  filters: FilterField[];
  permissions?: Record<string, unknown>;
}
```

A schema/type parity test (Phase 2) asserts every `Catalog` field the TypeScript interface declares has a matching JSON Schema property — the manual-sync discipline `@ttoss/geovis` accepts implicitly is made explicit and testable here from day one, rather than left to reviewer attention alone.

### D5 — Integrity validation scope

`validateCatalog(input: unknown): CatalogResult` runs, in order, mirroring `validateSpec.ts`'s own structure: (1) `Ajv2020.compile(catalogSchema)` run against `input` → `invalid-catalog-schema`, mapping each Ajv error the same way `validateSpec.ts` already does (`e.instancePath || '(root)'` → `subject.path`, `${path} ${e.message}` → `message`); (2) id-uniqueness checks per collection → `duplicate-*-id`; (3) referential checks — every `join.from`/`join.to` resolves to a known dataset/geography id, every `join.on.left`/`right` names a field the referenced dataset/geography actually declares (datasets/geographies carry no explicit field list in D4's shape beyond `metricIds`/`geographyIds`, so `unresolvable-join-field` is scoped to what's checkable: the join's endpoints exist and the cardinality is one of the two allowed values — full column-level validation against a live warehouse is explicitly the Should-item helper's job, not this Must). No `repair` is computed for `invalid-catalog-schema` (the fix is "correct the input", not a suggerable value); `duplicate-*-id` and `unknown-join-*` issues attach `repair: [{ kind: 'allowed-values', path: ..., values: <the known ids> }]` since the correct set is already in hand — mirroring ADR-0001's own rule that repair values are never invented.

### D6 — Introspection surface

`getCatalogIntrospection(catalog: Catalog)` returns the catalog with any `permissions` field stripped — the curated-metadata contract PRD-004's Must item requires ("never raw data") applies here too: nothing in `Catalog` is raw data (no rows), but `permissions` is the one field that could carry org-internal detail not meant for a model, so introspection omits it by construction rather than trusting every future catalog author to keep it model-safe. `getCatalogJSONSchema()` returns the imported `catalog.schema.json` document as-is — no derivation step, since D1 made the schema itself the source of truth.

### D7 — Domain and source compatibility (minimal geography/metric/dataset extensions)

PRD-004's literal field enumeration (D4) describes an abstract catalog but says nothing about the concrete geospatial domains real GeoVis-consuming applications work in, nor the Brazilian public-data sources they must join against (IBGE, IPEA, SICAR). Walking those domains against the base D4 shape surfaces four things the base contract genuinely cannot express (below); everything else on the user's list is already expressible (the minimality table further down proves it). Every field this decision adds is **optional and additive** (no change to any existing `required` list), so a minimal abstract catalog is unaffected while a Brazilian-source catalog becomes expressible and, crucially, **joinable**.

The four structural gaps and their minimal closure:

1. **A flat `Geography` cannot say what kind of geography it is.** The user's domains explicitly separate _malhas de indexação espacial_ (H3/S2/geohash, IBGE grade estatística), _limites administrativos / fronteiras_ (IBGE malhas territoriais), and _pontos de interesse_. These resolve differently (a grid cell tessellation is not an administrative boundary is not a POI cloud). Added: `Geography.kind: 'administrative' | 'grid' | 'poi' | 'custom'` (optional, absence ⇒ `administrative`, the commonest case, so minimal catalogs stay minimal). `custom` is where SICAR rural parcels (`imóveis` — arbitrary polygons, not part of any official hierarchy) land.

2. **A flat `Geography` cannot express hierarchy.** IBGE territory is strictly nested (país → UF → mesorregião → microrregião → município → distrito → setor censitário), and _demografia_/_perfil socioeconômico_ analyses roll up and drill down that hierarchy constantly. Added: `Geography.level?: number` (ordinal depth, coarser = lower) and `Geography.parentId?: string` (the containing geography one level up). Together they make roll-up/drill-down traversable without hard-coding IBGE's levels into the package.

3. **Nothing declares the external code system feature ids follow — the single most important compatibility hook, and the "id" item on the user's list.** IBGE data is keyed by canonical codes (código de município de 7 dígitos, UF de 2 dígitos, setor censitário de 15 dígitos); IPEA territorial series map onto those same IBGE codes; SICAR uses CAR `código do imóvel`; H3/S2/geohash cells are keyed by their index string. GeoVis already joins data rows to geometry by `geometryId` (`MapDataRow.geometryId` → `feature.id`/`properties[joinKey]`), but nothing says _what those ids are_. Added: `Geography.codeScheme?: string` (free-form, e.g. `'ibge:municipio'`, `'ibge:uf'`, `'ibge:setor-censitario'`, `'sicar:imovel'`, `'h3'`, `'s2'`, `'geohash'`). Free-form string, not an enum, because coding systems are open-ended and application-specific — closing the enum would defeat the compatibility goal. This is what lets a consuming app (or the AI) know an IBGE census extract keyed by 7-digit codes joins _this_ geography and not another.

4. **No metric kind fits distance or density.** _Distâncias de aparelhos urbanos e infraestrutura_ is a continuous length measure; _demografia_ leans on population density (per km²). Neither is a `count`/`rate`/`ratio`/`index`. Added to `Metric.kind`: `'distance'` and `'density'`. (This enum also appears on `MapTypeCatalogEntry.metricKinds`; both were extended in lockstep in D4. The extension ripples — additively — to PRD-006 plan's `MetricKind`/`TaskRule.allowedMetricKinds`; noted there is no need to reopen those plans, since adding enum members is backward-compatible.)

One more field earns inclusion on trust grounds rather than domain-expressibility: `Dataset.source?: string` (`'ibge'` | `'ipea'` | `'sicar'` | free-form) records provenance. A _Trusted_ Catalog that cannot say where a dataset came from is weaker for exactly the attribution/audit reason the PRD's title implies; provenance sits naturally at dataset granularity (one dataset, one source) rather than on the reusable `Metric`. Grid resolution rounds out the grid case: `Geography.resolution?: string` (only meaningful for `kind: 'grid'`, e.g. `'h3:8'`, `'1km'` for the IBGE grade) so a malha de indexação declares its cell size.

**What was deliberately _not_ added, to prove minimality** — every remaining domain/source on the user's list is already expressible with the base D4 shape:

| User's domain / source                           | Covered by                                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Fronteiras / limites administrativos             | `Geography.kind: 'administrative'` + polygon `Dataset.geometry` + `level`/`parentId`     |
| Malhas de indexação espacial (H3/S2/IBGE grade)  | `Geography.kind: 'grid'` + `resolution` + `codeScheme`                                   |
| Distâncias de aparelhos urbanos / infraestrutura | `Metric.kind: 'distance'` + point/line `Dataset.geometry`                                |
| Demografia                                       | `Metric.kind: 'count' \| 'density'`                                                      |
| Perfil socioeconômico (IPEA)                     | existing `Metric.kind: 'index' \| 'ratio'` + `Dataset.source: 'ipea'` — **no new field** |
| Pontos de interesse                              | `Geography.kind: 'poi'` + point `Dataset.geometry` + existing categorical `FilterField`  |
| id (código IBGE / CAR / índice de célula)        | `Geography.codeScheme` + existing join mechanism                                         |

So of the eight domains named, only three forced a genuinely new field (`kind`, `codeScheme`, `Metric.kind` extension); hierarchy (`level`/`parentId`), `resolution`, and `source` are the small supporting cast. Nothing here is a Brazil-specific field — `codeScheme` and `source` are free-form strings, so the same catalog shape serves US Census (`codeScheme: 'fips:county'`), Eurostat NUTS, etc.; the IBGE/IPEA/SICAR requirement is met by _values_, not by hard-coded Brazilian _fields_. This keeps the package domain-neutral while satisfying the concrete compatibility goal.

### Phase 1 — Package bootstrap

Create `packages/geovis-catalog` with the scaffold in D2: `package.json` (with the `ajv`/`@ttoss/geovis` dependencies from D1), `tsdown.config.ts`, `tsconfig.json`, `tests/tsconfig.json`, `tests/unit/jest.config.ts`, empty `src/index.ts`, `README.md` stub, `CHANGELOG.md`. Add the package to root `pnpm-workspace.yaml` coverage (already matched by the `packages/*` glob — no change needed there) and confirm `pnpm install` links it. Confirm a trivial `.json` import builds cleanly through `tsdown` before Phase 2 needs it for real (D2's caveat).

**Demo:** `pnpm turbo run build --filter=@ttoss/geovis-catalog` and `pnpm turbo run test --filter=@ttoss/geovis-catalog` both succeed against an empty package.
**Acceptance:** package builds, tests run (zero tests, zero failures), `pnpm run -w lint` passes with the new package present.

### Phase 2 — Catalog schema and types

Implement `catalog.schema.json` and the `Catalog`/`Metric`/`Dataset`/`Geography`/`Join`/`FilterField`/`MapTypeCatalogEntry` interfaces (D4, including the D7 fields) in `src/schema/`, exported from `src/index.ts`. One fixture catalog (`tests/unit/fixtures/sampleCatalog.ts`) covering every field, used by this phase's and later phases' tests — modeled on real Brazilian-source shapes so the D7 compatibility claims are concrete, not asserted: an IBGE administrative hierarchy (`kind: 'administrative'`, `codeScheme: 'ibge:uf'` at `level` 1 → `codeScheme: 'ibge:municipio'` at a deeper `level` with `parentId` pointing at the UF), an H3 grid geography (`kind: 'grid'`, `codeScheme: 'h3'`, `resolution: 'h3:8'`), a SICAR parcel geography (`kind: 'custom'`, `codeScheme: 'sicar:imovel'`), a demografia dataset with a `density` metric and `source: 'ibge'`, an infrastructure dataset with a `distance` metric, and an IPEA socioeconomic dataset (`source: 'ipea'`) using existing `index`/`ratio` kinds.

**Demo:** `new Ajv2020({ strict: false }).compile(catalogSchema)(sampleCatalog)` succeeds; a deliberately malformed fixture (missing required field) fails with an Ajv error pointing at the missing field; a geography with an unknown `kind` value fails validation.
**Acceptance:** one test per field group (metrics, datasets, geographies, joins, mapTypes, filters, permissions-optionality) plus the D7 fields (`kind`/`level`/`parentId`/`codeScheme`/`resolution`, `Metric.kind: 'density' | 'distance'`, `Dataset.source`); a test confirms a `Geography` omitting `kind` still validates (optional-with-default contract); `Catalog` type exported from `src/index.ts`; a schema/type parity test asserts the JSON Schema and the hand-written interface declare the same field set (D4/D7); public-contract test (mirroring `@ttoss/geovis`'s `publicContract.test.ts` pattern) locks the export surface.

### Phase 3 — Integrity validation and the catalog result taxonomy

Implement `CatalogResult`/`CatalogIssue`/`CatalogIssueCode` (D3) and `validateCatalog` (D5) in `src/validateCatalog.ts`.

**Demo:** the sample fixture validates to `{ status: 'valid' }`; a fixture with a duplicate metric id returns `{ status: 'invalid', issues: [{ code: 'duplicate-metric-id', repair: [...] }] }`; a fixture whose join references a non-existent geography returns `{ status: 'mismatch', issues: [{ code: 'unknown-join-geography', repair: [{ kind: 'allowed-values', values: [...] }] }] }`.
**Acceptance:** one fixture and one test per `CatalogIssueCode`; `resolveOverallStatus`-equivalent precedence (`invalid` over `mismatch` when both present) tested; no `repair` computed for `invalid-catalog-schema`.

### Phase 4 — Introspection surface and JSON Schema export

Implement `getCatalogIntrospection` and `getCatalogJSONSchema` (D6), both exported from `src/index.ts`.

**Demo:** `getCatalogIntrospection(catalogWithPermissions)` returns a catalog with no `permissions` key; `getCatalogJSONSchema()` returns an object reference-equal (or deep-equal) to the imported `catalog.schema.json`.
**Acceptance:** test asserts `permissions` is absent from introspection output even when present on input; a snapshot test on `getCatalogJSONSchema()`'s output guards against accidental schema drift.

### Phase 5 — Docs and package workflow close-out

Write `README.md` (catalog contract field tables, `validateCatalog` usage, `getCatalogIntrospection`/`getCatalogJSONSchema` examples — following `@ttoss/geovis`'s README as the reference style for field-table documentation). Set `tests/unit/jest.config.ts` `coverageThreshold` to the final measured coverage (0.01–0.1% below actual).

**Demo:** README's examples are copy-pasteable and run against the fixture catalog.
**Acceptance:** `pnpm turbo run test --filter=...@ttoss/geovis-catalog` and `pnpm turbo run build --filter=...@ttoss/geovis-catalog` green; coverage threshold set; `pnpm run -w lint` clean.

## Sequencing notes

Phase 1 is the entry gate — nothing else can be written until the package exists. Phase 2 depends only on Phase 1. Phase 3 depends on Phase 2's types and fixture. Phase 4 depends on Phase 2 (schema) but not Phase 3 — could run in parallel with it if split across two people; kept sequential here since one person authoring both keeps the fixture reuse simple. Phase 5 runs last per the standard package workflow (tests → dependents → build → coverage → README). Each phase is one PR.

This plan's package (`@ttoss/geovis-catalog`) and its exports (`Catalog`, `catalogSchema`, `CatalogResult`, `validateCatalog`, `getCatalogIntrospection`, `getCatalogJSONSchema`) are the foundation PRD-005's plan builds the intent schema on top of, and PRD-006's plan builds the resolver on top of both.

## Open questions carried forward (not resolved by this plan)

- **Catalog governance** (PRD-004's own open question): who approves catalog entries and how `permissions` integrates with application auth is explicitly out of scope — the application is responsible for enforcing its own authorization logic.
- **`codeScheme` as a controlled vocabulary** (D7): v1 leaves `codeScheme`/`Dataset.source` as free-form strings for maximum compatibility. Whether a later version ships a registry of well-known values (`ibge:municipio`, `sicar:imovel`, …) with validation/repair — so a typo like `ibge:municipios` becomes an `allowed-values` repair — is deferred; the string field is forward-compatible with that addition.
- **Cross-`codeScheme` join validation** (D7): declaring `codeScheme` opens a future integrity check ("a join between two geographies of incompatible code schemes is a `mismatch`"). D5's join check stays id/field-level in v1; this is a Should-item extension, not a Must.

## Verification against current codebase (2026-07-22)

- No `packages/geovis-catalog` directory exists yet — this plan starts from nothing, unlike PRD-001/002/003 whose plans re-derived against partially-built code.
- `packages/geovis/src/spec/validateSpec.ts` and `packages/geovis/src/spec/schema.json` confirm the established pattern in this product family: Ajv + hand-authored JSON Schema. `ajv@^8.18.0` (`Ajv2020` from `ajv/dist/2020`) is a plain `dependencies` entry in `packages/geovis/package.json` — `@ttoss/geovis-catalog` matches that by depending on `ajv` at runtime too.
- `packages/geovis/docs/ai-integration-readiness.md`'s `Catalog` interface (lines ~466–519) is the closest existing artifact to a catalog shape and was used as the seed for D4.
- `packages/geovis/src/spec/result.ts` confirms `GeoVisIssueCode` is a hardcoded closed union (not generic), which is why D3 mirrors rather than reuses it.
- `packages/geovis/src/spec/types.ts` (`MapDataRow.geometryId`, `MapData.joinKey`) confirms GeoVis already joins attribute rows to geometry by feature id — D7's `codeScheme` is the descriptive layer stating _what_ those ids are (IBGE/CAR/H3 codes), the compatibility hook the base D4 shape lacked. No `@ttoss/geovis` change is needed for D7; it is all `@ttoss/geovis-catalog`-local metadata.
- D7's field set was derived by walking each user-named domain (malhas de indexação espacial, fronteiras, limites administrativos, distâncias de infraestrutura, demografia, perfil socioeconômico, POI, id) and each source (IBGE, IPEA, SICAR) against the base D4 shape; only `Geography.kind`/`level`/`parentId`/`codeScheme`/`resolution`, `Metric.kind`'s `density`/`distance`, and `Dataset.source` were not already expressible — the mapping table in D7 records what each closes and what needed nothing.
- D6 (introspection surface) had lost its section body in an earlier plan-simplification pass while `getCatalogIntrospection`/`getCatalogJSONSchema` references to it remained (D1, Phase 4); restored here so the plan is internally consistent again.
- `docs/website/docs/product/geovis/` does not exist — the strategy document every PRD/ADR links to is missing from the repo. Flagged to the user; does not block this plan since the PRD text is self-contained.
