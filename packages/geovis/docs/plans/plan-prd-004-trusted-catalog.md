---
title: Plan · PRD-004 Trusted Catalog
---

# Implementation Plan: PRD-004 Trusted Catalog

Source: [PRD-004](../prds/prd-004-trusted-catalog.md) · Basis: strategy §5.2 (product-hub doc not present in this repo — see Verification) · Package: new `@ttoss/geovis-catalog`

This is the first of three plans (PRD-004 → PRD-005 → PRD-006) that all land in the same new package, `@ttoss/geovis-catalog`, per each PRD's own "Package: same layer as PRD-004" line. This plan bootstraps the package and ships the catalog contract and its integrity validation; PRD-005's plan adds the intent schema on top, and PRD-006's plan adds the resolver on top of both.

## Durable decisions

### D1 — Schema validation: Zod

> **Superseded by D14 (2026-07-30): Zod is the source of truth and Ajv is gone.** The reasoning below is kept because it records why the JSON Schema document remains a published artifact.

`@ttoss/geovis-catalog` is a machine-facing data contract package in the same product family as `@ttoss/geovis`. Following the established pattern from `@ttoss/geovis`'s own `VisualizationSpec`:

- `catalog.schema.json` — hand-authored JSON Schema (draft 2020-12), `$id`/`additionalProperties: false`, styled exactly like `spec/schema.json`.
- `Catalog` — a hand-written TypeScript interface in `types.ts`, kept in sync with the schema.
- `Ajv2020` (from `ajv/dist/2020`, the same import `@ttoss/geovis` already uses) compiles and validates at runtime.

Since the source of truth is JSON Schema from the start, `getCatalogJSONSchema()` (D6) returns the imported document directly — no derivation step needed. PRD-005's and PRD-006's plans adopt the same approach for consistency across the same package.

`package.json` dependencies: `ajv@^8.18.0` (same version as `@ttoss/geovis`) and `@ttoss/geovis` (for `RepairOption` reuse now, and `VisualizationSpec`/`resolveSpecFromMapType` reuse in PRD-006's plan). No `ajv-formats`: confirmed by running the bare `Ajv2020({ strict: false })` `@ttoss/geovis` already depends on against a `format: 'date'` schema that Ajv silently ignores unknown formats without that plugin (`'not-a-date'` still validates) — adding the dependency to enforce it was considered and declined by the user, since `@ttoss/geovis` itself uses no `format` keyword anywhere; `Dataset.temporal.start`/`end` (D4) stay plain `type: "string"`.

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
  | 'invalid-catalog-schema' // invalid: fails the schema (Zod, D14)
  | 'duplicate-metric-id' // invalid: two metrics share an id
  | 'duplicate-dataset-id'
  | 'duplicate-geography-id'
  | 'unknown-join-dataset' // mismatch: join references a dataset id not in catalog.datasets
  | 'unknown-join-geography' // mismatch: join references a geography id not in catalog.geographies
  | 'unknown-dataset-geography' // mismatch: Dataset.geographyIds[] references a geography id not in catalog.geographies
  | 'unknown-dataset-metric' // mismatch: Dataset.metricIds[] references a metric id not in catalog.metrics
  | 'unknown-parent-geography' // mismatch: Geography.parentId references a geography id not in catalog.geographies
  | 'cyclic-geography-hierarchy' // mismatch: a Geography.parentId chain loops back on itself
  | 'unknown-column-metric' // mismatch: Dataset.columns (D9) key names a metric not in that dataset's metricIds
  | 'unknown-filter-source-dataset' // mismatch: FilterField.sourceDatasetId (D15) references a dataset id not in catalog.datasets
  | 'unknown-filter-source-geography' // mismatch: FilterField.sourceGeographyId (D15) references a geography id not in catalog.geographies
  | 'unknown-filter-metric' // mismatch: FilterField.metricId (D15) references a metric id not in catalog.metrics
  | 'incompatible-parent-codescheme'; // mismatch: a Geography.parentId link joins two codeScheme namespaces (D7) that don't match

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

> **Extended (2026-08-19):** the five codes above (`unknown-column-metric`, `unknown-filter-source-dataset`, `unknown-filter-source-geography`, `unknown-filter-metric`, `incompatible-parent-codescheme`) were added when D5 was revisited to cover referential integrity for the D9/D15 fields and to resolve D7's codeScheme-compatibility open question. See D5 for the checks that produce them.

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
    "version": { "type": "string", "minLength": 1 },
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
        "aliases": { "type": "array", "items": { "type": "string" } },
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
        "cardinality": { "type": "string", "enum": ["1:1", "1:m", "m:1"] }
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

export interface Metric {
  /** Unique identifier for the metric, referenced by Dataset.metricIds */
  id: string;
  /** Human-readable name */
  label: string;
  /** Detailed description of what the metric measures and how it is calculated */
  description: string;
  /** Alternative names for search/discovery */
  aliases?: string[];
  /** Measurement unit — free-form string (km, USD, hab/km²), not an enum */
  unit?: string;
  /** Semantic category: count, rate, ratio, index, density, or distance */
  kind: MetricKind;
  /** Hint for how to format values in the UI */
  formatter?: 'number' | 'percent' | 'currency' | 'compact';
  /** How null values should be treated when rendering */
  nullPolicy: 'hide' | 'zero' | 'explain';
}

export interface Dataset {
  /** Unique identifier for the dataset, referenced by Join.from */
  id: string;
  /** Human-readable name */
  label: string;
  /** Detailed description of the data, its collection methodology, and any caveats */
  description: string;
  /** Alternative names for search/discovery */
  aliases?: string[];
  /** Primary geometry type of the dataset features */
  geometry: 'point' | 'polygon' | 'line';
  /** IDs of geographies this dataset can be joined to */
  geographyIds: string[];
  /** IDs of metrics this dataset carries */
  metricIds: string[];
  /** Provenance/attribution — free-form, e.g. 'ibge', 'ipea', 'sicar' */
  source?: string;
  /** Temporal coverage interval (ISO 8601 dates) */
  temporal?: { start: string; end: string };
}

/**
 * How a geography's features are structured (D7).
 * Absent ⇒ treated as 'administrative' (the commonest case).
 */
export type GeographyKind = 'administrative' | 'grid' | 'poi' | 'custom';

/**
 * How a geography is defined (D7) and how it can be joined to datasets. The four kinds are:
 * administrative boundary (IBGE malha territorial), spatial-index grid (H3/S2/geohash, IBGE grade estatística), point-of-interest collection, or custom parcel (SICAR rural property)
 * grid resolution (H3/S2/geohash cell size, IBGE grade)
 * poi collection (e.g. IBGE malha de equipamentos urbanos).
 * custom parcel (SICAR rural property, arbitrary polygon, not part of any official hierarchy).
 */

export interface Geography {
  /** Unique identifier for the geography, referenced by Dataset.geographyIds and Join.to */
  id: string;
  /** Human-readable name */
  label: string;
  /** Description of the geographic coverage and the boundary source */
  description: string;
  /** Alternative names for search/discovery, e.g. 'município' for 'municipality' */
  aliases?: string[];
  /** Discriminates admin boundary vs. spatial-index grid vs. POI collection vs. custom parcel */
  kind?: GeographyKind;
  /** Ordinal depth in a nesting hierarchy — lower is coarser (0 = country, 1 = state, 2 = city) */
  level?: number;
  /** Geography id one level up that contains this one, enabling roll-up/drill-down */
  parentId?: string;
  /** External code system feature ids follow, e.g. 'ibge:municipio', 'sicar:imovel', 'h3' */
  codeScheme?: string;
  /** Tessellation resolution for `kind: 'grid'`, e.g. 'h3:8', '1km' */
  resolution?: string;
}

/**
 * A join between a dataset and a geography, with the field names to join on and the cardinality.
 * The `from` dataset must declare the `left` field, and the `to` geography must declare the `right` field.
 * Cardinality: 1:1 (one-to-one), 1:m (one dataset row → many geography features), m:1 (many dataset rows → one geography feature).
 */
export interface Join {
  /** Dataset id that is the source of the join */
  from: string;
  /** Geography id that is the target of the join */
  to: string;
  /** Field mapping: left = field in dataset, right = field in geography */
  on: { left: string; right: string };
  /** Cardinality: 1:1 (one-to-one), 1:m (one dataset row → many geography features), m:1 (many dataset rows → one geography feature) */
  cardinality: '1:1' | '1:m' | 'm:1';
}

export interface FilterField {
  /** Field name to filter on */
  field: string;
  /** Data type of the filter field — determines how the domain is interpreted */
  kind: 'categorical' | 'numeric' | 'temporal';
  /** Allowed domain values: string[] for categorical, { min; max } for numeric/temporal. Interpreted based on `kind`. */
  domain?: unknown;
}

export interface MapTypeCatalogEntry {
  /** Map type name */
  name: 'choropleth' | 'dotDensity' | 'proportionalCircles';
  /** Geometry types this map type supports */
  supportedGeometries: Array<'point' | 'polygon' | 'line'>;
  /** Metric kinds that can be visualized with this map type */
  metricKinds: MetricKind[];
}

export interface Catalog {
  /**
   * Opaque version identifier for this catalog instance — not the package's
   * schema version. Free-form, non-empty string: an organization may version
   * its own catalog by semver, a date/quarter ('2026-Q3'), or an incrementing
   * integer as a string. PRD-005's `IntentResult` records the `Catalog.version`
   * an intent was validated against, so this only needs to be stable and
   * comparable within one organization's catalog history, not globally.
   */
  version: string;
  /** Unique domain/namespace of the catalog, e.g. 'br' for Brazil */
  domain?: string;
  /** Data collections available in this catalog */
  datasets: Dataset[];
  /** Metrics (measures/indicators) available across datasets */
  metrics: Metric[];
  /** Geographic boundaries/indexes available for joining */
  geographies: Geography[];
  /** Declared join paths between datasets and geographies */
  joins: Join[];
  /** Map types supported by this catalog, with their geometry and metric constraints */
  mapTypes: MapTypeCatalogEntry[];
  /** User-facing filter controls for exploring the catalog */
  filters: FilterField[];
  /** Authz metadata — opaque to the schema, consumed by the application layer */
  permissions?: Record<string, unknown>;
}
```

A schema/type parity test (Phase 2) asserts every `Catalog` field the TypeScript interface declares has a matching JSON Schema property — the manual-sync discipline `@ttoss/geovis` accepts implicitly is made explicit and testable here from day one, rather than left to reviewer attention alone.

### D5 — Integrity validation scope

> **Updated (2026-08-19):** step 1 now runs Zod (D14) instead of Ajv; three referential checks were added for fields D9/D15 introduced after this decision was first written (`Dataset.columns`, `FilterField.sourceDatasetId`/`sourceGeographyId`, `FilterField.metricId`); and D7's "cross-`codeScheme` join validation" open question is resolved into an actual check. `Dataset.collectionId` → `Catalog.collections[]` (D13) is deliberately **not** added here — the base `Catalog` interface (D4) was never amended to declare a `collections` field, and adding that referential check would require designing that field first; left as a follow-on, not folded into this pass.

`validateCatalog(input: unknown): CatalogResult` runs, in order, mirroring `validateSpec.ts`'s own structure:

1. `catalogSchema.safeParse(input)` (D14) run against `input` → on failure, `invalid-catalog-schema`, mapping each Zod issue the way `validateSpec.ts` mapped Ajv errors before it: `issue.path.length ? '/' + issue.path.join('/') : '(root)'` → `subject.path` (the same JSON-Pointer-shaped string consumers already see — D14 promises no change here), `issue.message` → `message`.
2. id-uniqueness checks per collection → `duplicate-*-id`.
3. Cross-reference checks — every id or key one object declares as pointing at another collection must resolve there:
   - `join.from`/`join.to` → known dataset/geography id (`unknown-join-dataset`/`unknown-join-geography`); `join.cardinality` is one of the three allowed values (`'1:1' | '1:m' | 'm:1'`).
   - Every `Dataset.geographyIds[]` entry → known geography id (`unknown-dataset-geography`); every `Dataset.metricIds[]` entry → known metric id (`unknown-dataset-metric`). This closes a gap the original D5 draft left open: without it, a dataset could declare a `metricIds`/`geographyIds` entry that names nothing in the catalog and pass validation, directly contradicting PRD-004's own Outcome ("the catalog validates its own referential integrity").
   - Every `Geography.parentId`, when present, → a known geography id (`unknown-parent-geography`).
   - **New:** every key of a dataset's `columns` map (D9) → that same dataset's own `metricIds[]` (`unknown-column-metric`). A column bound to a metric the dataset never declared is the same defect class as `unknown-dataset-metric`, one level down (the binding, not the membership).
   - **New:** `FilterField.sourceDatasetId`, when present → known dataset id (`unknown-filter-source-dataset`); `FilterField.sourceGeographyId`, when present → known geography id (`unknown-filter-source-geography`). D15 requires exactly one of the two to be set; schema validation (step 1) already enforces that exclusivity, so this step only resolves whichever one is set.
   - **New:** `FilterField.metricId`, when present → known metric id (`unknown-filter-metric`).
4. Hierarchy integrity — walk each geography's `parentId` chain to its root:
   - a chain that revisits a geography already seen is `cyclic-geography-hierarchy` (`subject.id` names the geography where the cycle was detected). Cheap to check (bounded by catalog size, each geography visited once per its own chain) and worth doing at catalog-authoring time rather than only when a future consumer traverses the hierarchy and loops forever.
   - **New:** codeScheme compatibility — for each `parentId` link where both the geography and its parent declare `codeScheme` (D7), compare namespace prefixes (the substring before the first `:`, or the whole string when there's no `:` — so `'h3'` compares as `'h3'`, `'ibge:municipio'` compares as `'ibge'`). A mismatch (e.g. an `'ibge:*'` geography parented under a `'sicar:*'` one) is `incompatible-parent-codescheme` (`subject.id` names the child). Either side omitting `codeScheme` skips the check — this is a compatibility hint between two catalog authors' choices, not a requirement to declare a scheme at all. This resolves D7's "Cross-`codeScheme` join validation" open question (namespace-prefix comparison, chosen over exact-string match so `'ibge:uf'` parenting `'ibge:municipio'` — same organization, different granularity — is not flagged).

No `repair` is computed for `invalid-catalog-schema`, `duplicate-*-id`, `cyclic-geography-hierarchy`, or `incompatible-parent-codescheme`: in each case the correct fix ("correct the input", "choose an id not already taken", "break the cycle", "use a consistent codeScheme namespace") is not a value this check has in hand — for duplicates specifically, the only known values are the ones already taken, which would make `allowed-values` a self-defeating suggestion (mirroring ADR-0001's rule that repair values are never invented, extended here to never suggesting a value known to be wrong; for `incompatible-parent-codescheme` there is no menu of "the compatible schemes" to offer). `unknown-join-*`, `unknown-dataset-*`, `unknown-parent-geography`, `unknown-column-metric`, `unknown-filter-source-*`, and `unknown-filter-metric` issues do attach `repair: [{ kind: 'allowed-values', path: ..., values: <the known ids> }]`, since the correct set is already in hand there.

### D6 — Introspection surface

> **Updated (2026-08-19):** `getCatalogIntrospection` now takes an options parameter so callers can choose the with/without-`permissions` view explicitly, instead of `permissions` being unconditionally stripped. Sensitive-field stripping (D12) is unaffected — it stays unconditional, with no opt-out, because it is a leak-prevention guarantee rather than an org-authz convenience.

`getCatalogIntrospection(catalog: Catalog, options?: { includePermissions?: boolean })` returns the catalog with:

- every field a `Dataset.fields[]` entry declares `sensible: true` (D12) always stripped, regardless of `options` — this is the one leak-prevention guarantee the catalog itself enforces, and giving it an opt-out would let any caller bypass it by simply passing the flag, defeating the point.
- the `permissions` field stripped **unless** the caller explicitly passes `includePermissions: true`. Default is `false` (`options` itself is also optional), so today's callers — the AI/model-facing consumers this was originally written for — see identical behavior to the previous unconditional-strip contract with a no-arg call. A caller that legitimately needs org-authz metadata (e.g. an internal admin UI building a permissions editor, which is not a "raw data" or "personal data" consumer) opts in explicitly rather than the package guessing intent from caller identity it has no way to check.

The curated-metadata contract PRD-004's Must item requires ("never raw data") still holds either way: nothing in `Catalog` is raw data (no rows); `permissions` is org-authz metadata, not raw data, which is exactly why — unlike `sensible` fields — it is fine for it to be caller-selectable rather than always model-safe by construction.

`getCatalogJSONSchema()` is unchanged by this update: it still returns the schema derived via `z.toJSONSchema` (D14), with no `options` parameter — there is only one JSON Schema document, independent of any caller's permission view.

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

## Durable decisions — catalog v1.1 (2026-07-30)

Derived from walking the shipped contract against the two pilot applications (`cozsolidarias`, `imagemsp`). Each supersedes or extends a decision above; supersessions are listed at the end of this block.

### D8 — Two artifacts, one shared dimension contract

The data dictionary (`dataset_catalogue.json` — provenance, LGPD, checksums, column plumbing) and the visualization `Catalog` stay separate artifacts. `@ttoss/geovis-catalog` publishes the spatio-temporal dimension types (`Presence`, `Temporal`, `Spatial`, `Interval`, `CodedRef`, `TemporalGrain`, …) and both artifacts import them, so the pilots stop maintaining private copies: `cozsolidarias` reached `schema_version: 2.0.0` with the full dimension model while `imagemsp` is still on `1.0.0`, a divergence that opened within three weeks.

Merging the two was rejected — it would move LGPD flags, checksums and download URLs into the artifact handed to a model.

Exactly one field is re-bound at the seam. The dictionary types `spatial.grain` as `{ scheme, code, label? }` because it has no geography collection to point at; the visualization catalog re-binds it to a foreign key:

```ts
export type CatalogSpatialDescribed = Omit<SpatialDescribed, 'grain'> & {
  grain: { geographyId: string; label?: string };
};
```

`codeScheme`, `kind`, `level` and `resolution` therefore stay owned once, by `Geography` (D7). The seam is an explicit mapping function, never an inheritance rule.

### D9 — Data binding: `artifact` and `columns`

The shipped contract describes what exists but never says where the bytes are, nor which column carries a metric's values — `Join.on`, `spatial.field` and `temporal.field` name the join, spatial and time columns, and the measure column is named nowhere. No application can consume a catalog until both are closed:

```ts
/** Where the artifact lives. Named `artifact`, not `access` — the dictionary already uses `access` for its LGPD block. */
artifact?: { url: string; format: 'csv' | 'json' | 'geojson' | 'parquet' };
/** metricId → column carrying its values; keys validated against `metricIds`. */
columns?: Record<string, string>;
```

Keeping them separate mirrors both dictionaries: one location per dataset, many columns.

### D10 — Temporal and spatial dimensions

Adopts the model already running in `cozsolidarias` 2.0.0. Each dimension declares `status` (`described` / `not_applicable` / `unknown`) before anything else, which resolves the ambiguous root `null` — a boundary mesh genuinely has no time, while an undocumented kitchen registry does, and the two must drive opposite resolver behaviour. Coverage is `extent`: `Interval[]` for time (open ends allowed, extra intervals for campaigns), `CodedRef[]` for space, so a dataset covering four states declares them as codes instead of a bounding box that would wrongly include their neighbours.

`grain` is an ISO-8601 duration (`P1Y`, `P1M`, `P10Y`, `PT15M`) or one of `instant` / `irregular` / `continuous` / `unknown`, validated by regex. A calendar-unit enum was rejected: it cannot express decennial or sub-hourly resolution without a breaking change per case, it forces a non-ISO token for quarters, it has no room for non-durational grains, and naming a grain `monthly` invites exactly the confusion with update cadence that `frequency` exists to prevent — in production, two datasets share `P1M` with different frequencies.

Selectable periods are **derived** from `extent` × `grain`; an explicit `periods[]` exists only to override gaps or carry per-period maturity.

`History` is the five-value superset `snapshot | overwrite | append_only | revised | unknown`. Production's two values are preserved verbatim so the dictionary migrates without touching data, and `revised` is what tells the resolver that values may change under a pinned `Catalog.version`.

`spatial` is required and absorbs `geometry`, whose enum gains `none` and `multipolygon` — the shipped `point | polygon | line` is factually wrong for eight of the eleven production datasets.

### D11 — One catalog per language

`Catalog.domain.language` already declares which language a catalog is written in. v1 keeps `label`/`description` as single strings and ships one catalog per language rather than turning every string into a locale map. The additive path stays open: a parallel optional field can carry locale maps later without breaking readers.

### D12 — Field-level metadata, including sensitivity

> **Reconciled (2026-07-31): shipped leaner than originally planned.** `role` and `display` were dropped — no implemented consumer (inspector, hover tooltip) needs them yet, and adding them speculatively would be exactly the kind of unused surface D4's own governance decision already warns against. See `docs/DECISIONS.md`'s D12 for the as-shipped shape and its actual rationale (PRD-005's `IntentFilter.field` grounding, not the inspector/tooltip use case below).

`Dataset.fields[]` carries `name` and `sensitive`, so personal data is declared where it exists rather than tracked in a parallel document. (The original text below — `role`/`display`, workspace inspector/hover tooltip — described a broader shape than what shipped; kept for the historical rationale.)

`sensitive` is a **declaration, not an enforcement rule**. Both pilots prove a blanket "sensitive ⇒ hidden" rule would be wrong: `cozsolidarias` marks eight fields sensitive and intentionally exposes five of them (address, postcode, latitude, longitude) through its detail endpoint, while withholding e-mail, telephone and company registration. Exposure is a per-surface product decision, so the catalog records the fact and forces the decision to be explicit:

- `label` is **required** on any field with `sensible: true` (shipped name for `sensitive`, matching `FilterField.sensible`'s naming). Exposure then can never be the result of an omission.
- `getCatalogIntrospection` omits every `sensible: true` field from the introspection payload, because that payload is what reaches a model.
- A `FilterField` whose `property` is a sensitive field may not declare `domain.mode: 'values'` — enumerating the domain of a personal-data column would leak the values themselves, which is the one genuine catalog-to-model leak this contract can close.

The gateway remains the disclosure frontier for rendered payloads; the catalog governs only what it itself discloses.

### D13 — Collections replace free-form `source`

`Dataset.source?: string` (D7) becomes `collectionId?: string`, a foreign key into `Catalog.collections[]`. Both pilots already key each dataset to a single `collection_id`, so this absorbs an existing validated structure rather than inventing one. It also makes attribution computable: the legend's source note composes from `Collection.organization`, `publicReferenceUrl` and `temporal.extent` instead of the string hard-coded in `cozsolidarias`' `geovisScoreScales.ts`.

### D14 — Zod is the schema source of truth

Zod (`^4.4.3`, the version the rest of the monorepo already pins) replaces Ajv. `src/schema/catalog.ts` holds the schemas; `validateCatalog` parses with `catalogSchema.safeParse`; `getCatalogJSONSchema()` derives the draft 2020-12 document through `z.toJSONSchema`. `catalog.schema.json` and the `ajv` dependency are deleted.

This resolves the contradiction D1 created against the monorepo standard (`CLAUDE.md` mandates Zod for new schemas, and three packages already depend on it), and it removes the drift risk D1 accepted: the JSON Schema document is now derived from the validator rather than maintained beside it. `strictObject` reproduces the previous `additionalProperties: false`, and `subject.path` keeps the JSON-Pointer rendering the Ajv implementation reported, so consumers see no change.

It also unblocks D10. Grain and period tokens need regex validation coupled across fields — a period's format depends on its dataset's grain — which is a `superRefine` in Zod and would otherwise be imperative code duplicating the schema's intent.

The schemas are exported from the package index so PRD-005's intent schema and PRD-006's resolver compose them rather than re-declaring the shape.

### D15 — `FilterField` carries what a filter UI needs

The shipped `FilterField` was `{ field, kind, domain?: unknown }`. A component could learn a column name and a type from it, and nothing else: no label to render, no source to attribute it to, no options to offer, and an `unknown` domain no code could branch on. It described a filter without enabling one.

The refactored shape adds identity (`id`, `label`, `description`, `aliases`), location (`property` plus exactly one of `sourceDatasetId`/`sourceGeographyId`), the emitted predicate (`operators`, mapping 1:1 to `LayerFilter.operator`), and a **required** `domain` discriminated on `mode` — `values` for categorical options with labels and counts, `range` for numeric bounds, `interval` for temporal bounds, and `runtime` for a domain that exists but is only knowable from the data. Optional `metricId` inherits `unit` and `formatter` so display hints are not restated.

Coherence between kind, domain mode and operators is enforced in the schema rather than left to the resolver: `in` on a numeric filter, `multiple` outside a categorical one, and a `values` domain on a numeric field all fail validation. A control therefore cannot render a predicate `@ttoss/geovis` would refuse to compile — which is the F-item guarantee from the thick-boundary decision, moved from prose into the type.

Two functions ship with it. `getFilterControls(catalog)` resolves each filter's source and metric into a render-ready descriptor, including the widget to use (`select`, `multi-select`, `range-slider`, `date-range`) and a `requiresData` flag. `computeFilterDomain({ filter, rows })` derives a concrete domain for `runtime` filters from rows the application already holds — pure, fetching nothing, so PRD-004's "no runtime data fetching" non-goal holds while the practical need behind it is met.

Values that do not match a filter's `kind` are skipped rather than coerced, on the same principle as D5's refusal to invent repair values: a numeric column holding `'12'` as text is a data defect the catalog should surface, not hide.

### Superseded by this block

- D4's `Dataset.temporal: { start, end }` → D10's `Temporal`.
- D7's `Dataset.geometry` → D10's `spatial.geometry`.
- D7's `Dataset.source` → D13's `collectionId`.
- The carried-forward question on `temporal.start`/`end` date-format enforcement — grain and period tokens are regex-validated by D10, so it no longer applies.

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

**Demo:** the sample fixture validates to `{ status: 'valid' }`; a fixture with a duplicate metric id returns `{ status: 'invalid', issues: [{ code: 'duplicate-metric-id' }] }` with no `repair`; a fixture whose join references a non-existent geography returns `{ status: 'mismatch', issues: [{ code: 'unknown-join-geography', repair: [{ kind: 'allowed-values', values: [...] }] }] }`; a fixture whose `Dataset.metricIds` names a metric not in `catalog.metrics` returns `unknown-dataset-metric`; a fixture with `geoA.parentId = 'geoB'` and `geoB.parentId = 'geoA'` returns `{ status: 'mismatch', issues: [{ code: 'cyclic-geography-hierarchy' }] }` with no `repair`; a fixture whose `Dataset.columns` key names a metric outside that dataset's `metricIds` returns `unknown-column-metric`; a fixture whose `FilterField.sourceGeographyId` names a non-existent geography returns `unknown-filter-source-geography`; a fixture with an `'ibge:municipio'` geography parented under a `'sicar:imovel'` one returns `{ status: 'mismatch', issues: [{ code: 'incompatible-parent-codescheme' }] }` with no `repair`.
**Acceptance:** one fixture and one test per `CatalogIssueCode`, including the four added when this decision first extended referential scope (`unknown-dataset-geography`, `unknown-dataset-metric`, `unknown-parent-geography`, `cyclic-geography-hierarchy`) and the five added in the 2026-08-19 update (`unknown-column-metric`, `unknown-filter-source-dataset`, `unknown-filter-source-geography`, `unknown-filter-metric`, `incompatible-parent-codescheme`); `resolveOverallStatus`-equivalent precedence (`invalid` over `mismatch` when both present) tested; no `repair` computed for `invalid-catalog-schema`, `cyclic-geography-hierarchy`, or `incompatible-parent-codescheme`; a 3-deep valid `parentId` chain (no cycle) is confirmed to validate cleanly, so the cycle check doesn't false-positive on legitimate hierarchy depth; two geographies sharing the same codeScheme namespace prefix at different `level`s (e.g. `'ibge:uf'` parenting `'ibge:municipio'`) validate cleanly, so the codeScheme check doesn't false-positive on same-organization granularity changes; a Zod issue path with a nested array index (e.g. `datasets[2].metricIds[0]`) renders to the same `subject.path` shape the Ajv implementation produced.

### Phase 4 — Introspection surface and JSON Schema export

Implement `getCatalogIntrospection` and `getCatalogJSONSchema` (D6), both exported from `src/index.ts`.

**Demo:** `getCatalogIntrospection(catalogWithPermissions)` (no options) returns a catalog with no `permissions` key, matching today's behavior; `getCatalogIntrospection(catalogWithPermissions, { includePermissions: true })` returns `permissions` intact; `getCatalogIntrospection(catalogWithSensitiveField, { includePermissions: true })` still omits the `sensible: true` field — the option only affects `permissions`; `getCatalogJSONSchema()` returns an object deep-equal to the schema derived via `z.toJSONSchema` (D14).
**Acceptance:** test asserts `permissions` is absent by default and present only when `includePermissions: true` is passed; test asserts sensitive-field stripping is unaffected by `options` in either state; a snapshot test on `getCatalogJSONSchema()`'s output guards against accidental schema drift.

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
- ~~**Cross-`codeScheme` join validation** (D7)~~ — resolved by the 2026-08-19 D5 update: a `parentId` link between geographies whose `codeScheme` namespace prefixes differ is `incompatible-parent-codescheme`.
- ~~**`Dataset.temporal.start`/`end` date-format enforcement**~~ — superseded by D10, which regex-validates grain and period tokens.
- ~~**Schema source of truth**~~ — resolved by D14: Zod, with the JSON Schema document derived from it.
- **`Dataset.collectionId` referential check** (D13): `Dataset.collectionId` → `Catalog.collections[]` is not yet checked by `validateCatalog`, and `Catalog.collections[]` itself was never added to the D4 `Catalog` interface text in this plan. Both need doing together before this check can exist; deliberately left out of the 2026-08-19 D5 update to keep that update to referential checks the interface already supports.
- **Sensitivity beyond the catalog** (D12): `sensitive` governs what the catalog itself discloses (introspection payload, filter domains). Whether the same declaration should drive the application's own rendered payloads — today the gateway's job in both pilots — is a product decision this package does not make.

## Decisions confirmed with the user (2026-07-23)

A codebase review before implementation surfaced four points the plan had left implicit. Each was put to the user directly as a question — not assumed — before implementation started:

- **Referential scope (D5):** confirmed — extend `validateCatalog` to check `Dataset.geographyIds[]`/`metricIds[]` and `Geography.parentId` against declared collections (`unknown-dataset-geography`, `unknown-dataset-metric`, `unknown-parent-geography`), not just `Join.from`/`to`, since PRD-004's Outcome names general referential integrity.
- **`parentId` cycles (D5):** confirmed — check for cycles in v1 (`cyclic-geography-hierarchy`) rather than deferring to whenever a future consumer traverses the hierarchy and loops.
- **Date format enforcement:** declined — no `ajv-formats` dependency. Confirmed by running `@ttoss/geovis`'s own `Ajv2020({ strict: false })` against a `format: 'date'` schema that Ajv silently ignores unknown formats without that plugin (`'not-a-date'` still validates); `@ttoss/geovis` itself uses no `format` keyword anywhere, and the user chose not to add a dependency neither this package's closest sibling needs. `Dataset.temporal.start`/`end` (D4) stay plain `type: "string"`.
- **`Catalog.version` shape (D4):** confirmed — a non-empty free-form string, not a strict semver `pattern`, since PRD-005 uses `Catalog.version` as an opaque per-organization identifier recorded on `IntentResult`, not the package's own schema version.

## Verification against current codebase (2026-07-23)

- No `packages/geovis-catalog` directory exists yet — this plan starts from nothing, unlike PRD-001/002/003 whose plans re-derived against partially-built code.
- `packages/geovis/src/spec/validateSpec.ts` and `packages/geovis/src/spec/schema.json` confirm the established pattern in this product family: Ajv + hand-authored JSON Schema. `ajv@^8.18.0` (`Ajv2020` from `ajv/dist/2020`) is a plain `dependencies` entry in `packages/geovis/package.json` — `@ttoss/geovis-catalog` matches that by depending on `ajv` at runtime too.
- `packages/geovis/docs/ai-integration-readiness.md`'s `Catalog` interface (lines ~466–519) is the closest existing artifact to a catalog shape and was used as the seed for D4.
- `packages/geovis/src/spec/result.ts` confirms `GeoVisIssueCode` is a hardcoded closed union (not generic), which is why D3 mirrors rather than reuses it.
- `packages/geovis/src/spec/types.ts` (`MapDataRow.geometryId`, `MapData.joinKey`) confirms GeoVis already joins attribute rows to geometry by feature id — D7's `codeScheme` is the descriptive layer stating _what_ those ids are (IBGE/CAR/H3 codes), the compatibility hook the base D4 shape lacked. No `@ttoss/geovis` change is needed for D7; it is all `@ttoss/geovis-catalog`-local metadata.
- D7's field set was derived by walking each user-named domain (malhas de indexação espacial, fronteiras, limites administrativos, distâncias de infraestrutura, demografia, perfil socioeconômico, POI, id) and each source (IBGE, IPEA, SICAR) against the base D4 shape; only `Geography.kind`/`level`/`parentId`/`codeScheme`/`resolution`, `Metric.kind`'s `density`/`distance`, and `Dataset.source` were not already expressible — the mapping table in D7 records what each closes and what needed nothing.
- D6 (introspection surface) had lost its section body in an earlier plan-simplification pass while `getCatalogIntrospection`/`getCatalogJSONSchema` references to it remained (D1, Phase 4); restored here so the plan is internally consistent again.
- `docs/website/docs/product/geovis/` does not exist — the strategy document every PRD/ADR links to is missing from the repo. Flagged to the user; does not block this plan since the PRD text is self-contained.
