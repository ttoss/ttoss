# PRD-004 Trusted Catalog — Durable Decisions (D1–D8)

Implementation decisions for the catalog contract. This document was originally
drafted from a standalone analysis of PRD-004 before the package's actual
implementation was located on this branch; it has since been corrected to
describe what `src/schema/catalog.ts` and `src/schema/types.ts` actually
enforce, plus a small set of genuine PRD-004 "Must" gaps that were closed as
part of that reconciliation (`nominal` metric kind + `categories[]`,
`Geography.cameraFraming`, `Temporal.field`, and the `validateCatalog`
`capabilities` cross-check). It intentionally does not renumber or remove the
package's own D8/D10 spatio-temporal-dimension comments in the schema
(`Spatial`, `Temporal`, `Series`, `SpatialGrain`) — those are a separate,
already-implemented decision set this document doesn't re-describe.

## D1: Metric.kind + categories[] for Nominals

**Decision:** Metrics declare a `kind`: `'count' | 'rate' | 'ratio' | 'index' | 'density' | 'distance' | 'nominal'`. A `'nominal'` metric **requires** a non-empty `categories[]` whitelist; every other kind must _not_ declare `categories`.

**Implementation:**

- `metricKindSchema` — the seven-value enum above.
- `metricCategorySchema` (`MetricCategory`) — `{ id, label, order?, colorToken? }`. `colorToken` is a `@ttoss/ui`/`@ttoss/theme` token, never a raw color, so a categorical choropleth stays on-theme.
- `metricSchema.check()` enforces the pairing both ways: nominal without categories fails, categories on a non-nominal kind fails.

**Rationale:**

- PRD-004's own Must list calls this out explicitly: "Nominal metrics: `kind: 'nominal'` with a closed `categories[]` ... The spec's `CategoricalColorBy` has no catalog counterpart today, so a categorical choropleth cannot be expressed at all." This was the one Must-have with no implementation before this pass.
- A closed whitelist lets intent validation (PRD-005) reject a category value that doesn't exist, the same way `Dataset.metricIds`/`geographyIds` reject unknown ids today.

**Files:**

- `src/schema/catalog.ts` — `metricKindSchema`, `metricCategorySchema`, `metricSchema`
- `src/schema/types.ts` — `MetricKind`, `MetricCategory`, `Metric`
- `tests/unit/tests/schema.test.ts` — `describe('nominal metrics and categories (D1)')`

---

## D2: Data Binding — artifact, columns, and named dimension fields

**Decision:** A dataset names where its bytes live (`artifact`), which column carries each metric (`columns`), which column carries its spatial reference (`Spatial.field`), and which column carries its temporal reference (`Temporal.field`).

**Implementation:**

- `Dataset.artifact?: { url: string; format: 'csv' | 'json' | 'geojson' | 'parquet' }`
- `Dataset.columns?: Record<string, string>` — metric id → dataset column name.
- `Spatial.field?: string` (already implemented) and `Temporal.field?: string` (added in this pass, mirroring `Spatial.field`) — the join columns were already named via `Join.on.left`/`.right`, but the time column had no equivalent until now.

**Rationale:**

- PRD-004 Must: "Without both [`artifact` and `columns`], a valid catalog is still unconsumable — join, spatial and time columns are named, the measure column is not." Read literally at the time this was written, join and spatial columns were nameable but the _time_ column was not — `Temporal.field` closes exactly that gap.

**Files:**

- `src/schema/catalog.ts` — `datasetSchema`, `spatialSchema.field`, `temporalSchema.field`
- `src/schema/types.ts` — `Dataset`, `Spatial`, `Temporal`
- `tests/unit/tests/schema.test.ts` — `describe('Temporal.field (D2)')`

---

## D3: Package @ttoss/geovis-catalog — Separate, Modular

**Decision:** The catalog is a standalone package (`@ttoss/geovis-catalog`), not an entry point in `@ttoss/geovis`.

**Implementation:**

- `packages/geovis-catalog/` with its own `package.json`, exporting `validateCatalog`, every schema (`catalogSchema`, `metricSchema`, …), and every `z.infer` type.
- Depends on `@ttoss/geovis` only for `LayerFilterOperator`, `CapabilitySet`, and `RepairOption` types — no React, no UI, no rendering.

**Rationale:**

- Separates concerns: `@ttoss/geovis` is rendering/runtime, `@ttoss/geovis-catalog` is contract/validation — each can evolve and version independently.
- Aligns with the "modular solutions" architectural pattern the rest of the monorepo follows.

**Files:** `package.json`, `src/index.ts`, `README.md`

---

## D4: Governance — Opaque, Metadata-only

**Decision:** The catalog carries an opaque `permissions` bag at the top level, plus a boolean `sensible` flag on `Dataset` and `FilterField`. Enforcement of both is entirely the application's responsibility.

**Implementation:**

- `Catalog.permissions?: Record<string, unknown>` — schema-reserved, application-defined shape. `getCatalogIntrospection()` strips it before anything is handed to a model.
- `Dataset.sensible?: boolean` / `FilterField.sensible?: boolean` — flags a field the application may want to redact from its own rendered payloads; the catalog only uses the flag to govern its _own_ disclosure (introspection payloads, filter domains), per PRD-004's open question resolution.

**Rationale:**

- PRD-004's own resolved open question: "Governance: ... Resolved as out of scope: `permissions` is an opaque, schema-reserved slot; the application enforces its own authorization logic."
- `sensible` answers the PRD's second open question directly: the catalog declares it, the gateway/application decides what to do with it.

**Files:** `src/schema/catalog.ts` (`catalogSchema.permissions`, `datasetSchema.sensible`, `filterFieldSchema.sensible`), `src/introspection.ts`

---

## D5: Geography.cameraFraming — Resolver Input, Never a Preset

**Decision:** A `Geography` may declare `cameraFraming`: a bounding box, optional centre, and optional zoom describing its extent.

**Implementation:**

- `cameraFramingSchema` (`CameraFraming`) — `{ bbox: [number,number,number,number]; center?: [number,number]; zoom?: number }`, added to `geographySchema`.

**Rationale:**

- PRD-004 Must, verbatim: "`Geography.cameraFraming` (bbox, centre, zoom) as **resolver input, never a preset** — PRD-006 derives `viewPresets` from it, keeping `set-view-preset` bounded to declared positions instead of coordinates a model invents." This was undeclared in the schema before this pass.
- Keeping it a plain bbox/centre/zoom (not a `ViewState`/preset object) is deliberate: PRD-006's resolver is the only thing allowed to turn this into an actual `viewPreset` the runtime can act on.

**Files:** `src/schema/catalog.ts` (`cameraFramingSchema`, `geographySchema.cameraFraming`), `src/schema/types.ts` (`CameraFraming`), `tests/unit/tests/schema.test.ts` — `describe('Geography.cameraFraming (D5)')`

---

## D6: Units and Formatters

**Decision:** `Metric.unit` is a free-form string (`'%'`, `'km'`, `'hab/km²'`); `Metric.formatter` is a closed hint (`'number' | 'percent' | 'currency' | 'compact'`). Locale-specific rendering (decimal separators, date formats) is never declared by the catalog — it's resolved by the application via `@ttoss/react-i18n`.

**Rationale:**

- The catalog is domain-neutral and locale-agnostic by design; a unit × locale cross-product would explode the schema for no benefit, since `@ttoss/react-i18n` already owns locale-aware formatting everywhere else in this monorepo.
- `formatter` stays a coarse _hint_ (which family of formatting applies), not a format string — the actual pattern is an application/locale concern.

**Files:** `src/schema/catalog.ts` (`metricSchema.unit`, `.formatter`), `README.md`

---

## D7: Explicit Joins Registry

**Decision:** Every join from a dataset to a geography is an explicit entry in `catalog.joins`, validated end-to-end.

**Implementation:**

- `joinSchema` (`Join`): `{ from: string; to: string; on: { left: string; right: string }; cardinality: '1:1' | '1:m' | 'm:1' }`.
- `validateCatalog`'s `checkJoinReferences` confirms `from`/`to` resolve to a real dataset/geography; `checkGeographyHierarchy` additionally catches cycles in `Geography.parentId` chains that joins could otherwise traverse forever.

**Rationale:**

- PRD-004's own Outcome: "the catalog validates its own referential integrity (joins point to real datasets and geographies)."
- Explicit `on.left`/`on.right` field names, rather than an implicit foreign-key convention, make the join auditable without inspecting the underlying data.

**Files:** `src/schema/catalog.ts` (`joinSchema`), `src/validateCatalog.ts` (`checkJoinReferences`, `checkGeographyHierarchy`), `tests/unit/tests/validateCatalog.test.ts`

---

## D8: Catalog Versioning

**Decision:** `Catalog.version` is a required, non-empty, opaque string — the organization's own catalog version, not this package's schema version.

**Implementation:**

- `catalogSchema.version: z.string().min(1)`. Any non-empty string works: semver, a date/quarter (`'2026-Q3'`), an incrementing integer.

**Rationale:**

- Lets a downstream consumer (PRD-005's Intent, PRD-006's resolver) carry a `schemaVersion` and detect drift against a specific catalog snapshot, without this package prescribing a versioning scheme.

**Files:** `src/schema/catalog.ts` (`catalogSchema.version`), `README.md`

---

## `MapTypeCatalogEntry` and adapter capabilities

Not one of D1–D8, but closes another explicit PRD-004 Must and is small enough to note here: `mapTypes` documents **data adequacy** (which metric kinds make sense on which geometry), never adapter support — those are different questions, and conflating them was the risk PRD-004 called out: "`CapabilitySet` covers source types, layer geometries and data features but never map types, so `validateCatalog` accepts an optional `CapabilitySet` and reports the intersection."

`validateCatalog(input, { capabilities })` now accepts the active engine adapter's `CapabilitySet` (from `@ttoss/geovis`, e.g. `adapter.getCapabilities()`) and reports `unsupported-map-type-geometry` (a `mismatch`) for any `MapTypeCatalogEntry.supportedGeometries` not covered by `capabilities.layerGeometries`. Omitting `capabilities` skips the check entirely — a catalog can be authored and validated in isolation, before any adapter is chosen.

**Files:** `src/validateCatalog.ts` (`checkMapTypeCapabilities`), `src/catalogResult.ts` (`unsupported-map-type-geometry`), `tests/unit/tests/validateCatalog.test.ts`

---

## Summary: D1–D8 Implementation Status

| #   | Decision                                                         | Implemented | Files                                        |
| --- | ---------------------------------------------------------------- | ----------- | -------------------------------------------- |
| 1   | Metric.kind (incl. nominal) + categories[]                       | ✅          | schema/catalog.ts, schema/types.ts, tests    |
| 2   | Data binding: artifact, columns, temporal/spatial `field`        | ✅          | schema/catalog.ts, schema/types.ts, tests    |
| 3   | Package @ttoss/geovis-catalog                                    | ✅          | package.json, src/index.ts, README.md        |
| 4   | Governance: opaque permissions + sensible flag                   | ✅          | schema/catalog.ts, introspection.ts          |
| 5   | Geography.cameraFraming                                          | ✅          | schema/catalog.ts, schema/types.ts, tests    |
| 6   | Units (string) / formatters (hint) — app-level locale formatting | ✅          | schema/catalog.ts, README.md                 |
| 7   | Explicit joins registry                                          | ✅          | schema/catalog.ts, validateCatalog.ts, tests |
| 8   | Catalog versioning                                               | ✅          | schema/catalog.ts, README.md                 |

All eight are implemented and covered by tests in `tests/unit/tests/` at 100% statement/branch/function/line coverage for `src/`.

---

**Date:** 2026-07-31
**Status:** Complete — corrected against the actual implementation and extended with the `nominal`/`categories`, `cameraFraming`, `Temporal.field`, and `capabilities` additions.
