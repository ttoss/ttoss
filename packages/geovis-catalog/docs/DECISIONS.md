# PRD-004 Trusted Catalog — Durable Decisions (D1–D8)

Implementation decisions for the catalog contract, addressing the analysis from July 31, 2026.

## D1: Metric.kind + categories[] for Nominals

**Decision:** Metrics declare a `kind` (nominal, ordinal, quantitative). Nominal metrics **require** a `categories[]` whitelist.

**Implementation:**

- `Metric.kind: 'nominal' | 'ordinal' | 'quantitative'` (required)
- `Metric.categories?: string[]` (required when kind='nominal')
- Validation: nominals without categories are rejected

**Rationale:**

- PRD-006 (Resolver) references "metric kind" as a determinant for map type selection
- Intent validation (PRD-005) needs type constraints to validate against
- Nominal categorization enables whitelist validation of metric values
- Supports "show top 5 states by income" — resolver knows "state" is nominal

**Files:**

- `src/schema/catalog.ts` — `metricSchema` with kind enum and conditional categories
- `src/schema/types.ts` — `Metric` interface, `MetricKind` type
- `tests/unit/tests/schema.test.ts` — validation that nominals require categories

---

## D2: Dataset.columns[] with Types — Referential Integrity

**Decision:** Every dataset **declares its columns** with types, enabling metric→dataset→column validation.

**Implementation:**

- `Dataset.columns: Array<{ name, type, description?, ...}>` (required, minItems: 1)
- `ColumnType = 'string' | 'number' | 'date' | 'boolean' | 'geojson' | 'json'`
- Validation: `Metric.sourceColumn` must exist in `sourceDataset.columns`

**Rationale:**

- PRD-004 MUST: "catalog validates its own referential integrity"
- Without columns[], metrics can reference non-existent columns
- Enables early rejection in intent validation (PRD-005)
- Prevents runtime surprises in resolution (PRD-006)

**Files:**

- `src/schema/catalog.ts` — `datasetSchema`, `columnSchema`
- `src/schema/types.ts` — `Dataset`, `CatalogColumn` interfaces
- `src/validateCatalog.ts` — checks metric.sourceColumn exists in dataset.columns
- `tests/unit/tests/schema.test.ts` — validation of column references

---

## D3: Package @ttoss/geovis-catalog — Separate, Modular

**Decision:** Catalog is a **new, standalone package** (`@ttoss/geovis-catalog`), not an entry point in `@ttoss/geovis`.

**Implementation:**

- New package at `packages/geovis-catalog/`
- Exports: `validateCatalog`, types (`Catalog`, `Metric`, `Dataset`, etc.)
- No React, no UI dependencies
- Focused: schema + validation + introspection only

**Rationale:**

- Separates concerns: geovis (UI/rendering) vs. catalog (data schema/validation)
- R4 has 3 PRDs (004, 005, 006) — each logically distinct
- Catalog can evolve independently and be shared across contexts
- Aligns with "modular solutions" architectural pattern

**Files:**

- `package.json` — proper monorepo configuration
- `src/index.ts` — public API exports
- `README.md` — standalone package documentation

---

## D4: Governance — Metadata-only (v1)

**Decision:** Catalog includes **governance metadata** (owner, dataClassification, permissions); **enforcement deferred** to PRD-006 resolver.

**Implementation:**

- `Metric.owner?: string`, `createdAt?: string`
- `Dataset.dataClassification?: 'public' | 'internal' | 'confidential'`
- `permissions?: object` (schema-reserved, application-specific)
- No validation of permissions in catalog itself

**Rationale:**

- v1 avoids application-specific auth models
- Governance is organizational concern, not library concern
- Metadata enables intent validation (PRD-005) to check who can use what
- Resolver (PRD-006) enforces: "this metric is confidential, reject intent"
- Aligns with PRD-004's "Won't" list: application-level authorization out of scope

**Files:**

- `src/schema/catalog.ts` — optional governance fields
- `src/schema/types.ts` — governance properties on Metric, Dataset
- `README.md` — governance strategy documented

---

## D5: Geography Schema — geometryType + bounds + supportedMapTypes

**Decision:** Geography declares **geometry type**, **bounding box**, and **map type compatibility**.

**Implementation:**

- `Geography.geometryType: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon'` (required)
- `Geography.bounds?: [minLng, minLat, maxLng, maxLat]` (for zoom optimization)
- `Geography.supportedMapTypes: Array<'choropleth' | 'dotDensity' | 'proportionalCircles'>` (required, minItems: 1)
- `Geography.geoDataSourceId: string` (where geometries live)

**Rationale:**

- Resolver (PRD-006) needs geometry constraints to select map type
- Bounds enable auto-zoom behavior
- `supportedMapTypes` prevents invalid combinations (e.g., choropleth on Point data)
- Enables "Geographic Adequacy" validation in intent

**Files:**

- `src/schema/catalog.ts` — `geographySchema` with geometry and mapType constraints
- `src/schema/types.ts` — `Geography`, `GeometryType`, `MapType` types
- `src/validateCatalog.ts` — validates supportedMapTypes is non-empty

---

## D6: Units in Catalog, Formatters Application-level

**Decision:** **Units** (symbol, decimals, conversion base) live in catalog; **formatters** (locale-specific patterns) live in the application via `@ttoss/react-i18n`.

**Implementation:**

- `CatalogUnit { id, name, symbol, decimals?, conversionBase?, ... }`
- `Metric.unit?: CatalogUnit` (reference, not inline)
- Catalog **never** declares locale-specific patterns ("$1.234,56" vs "$1,234.56")
- Application uses unit metadata to build locale-aware display

**Rationale:**

- Catalog is domain-neutral, doesn't know about locales
- Avoids catalog explosion: 1 unit × N locales = N entries
- I18n is application concern (already handled by `@ttoss/react-i18n`)
- Separates data declaration (catalog) from presentation (app)

**Files:**

- `src/schema/catalog.ts` — `unitSchema` (symbol, decimals, no format patterns)
- `src/schema/types.ts` — `CatalogUnit` interface
- `README.md` — explains unit/formatter separation
- `src/introspection.ts` — includes unit metadata in AI context packet

---

## D7: Explicit Joins Registry — Not Implicit ForeignKeys

**Decision:** All joins between datasets are **explicit entries** in a `catalog.joins` registry, validated end-to-end.

**Implementation:**

- `CatalogJoin { id, name, leftDatasetId, leftColumn, rightDatasetId, rightColumn, joinType }`
- `Catalog.joins: CatalogJoin[]` (required, not optional)
- Validation: both sides exist, columns exist in respective datasets, no cycles
- Repair suggestions: list valid datasets/columns when references are unknown

**Rationale:**

- Resolver (PRD-006) must know exact join semantics for data binding
- Intent validation (PRD-005) can reject joins that don't exist
- Explicit > implicit: no surprises from FK interpretation
- Registry makes joins first-class citizens, auditable and discoverable

**Files:**

- `src/schema/catalog.ts` — `joinSchema` with explicit references
- `src/schema/types.ts` — `CatalogJoin`, `JoinType` types
- `src/validateCatalog.ts` — validates both sides of every join
- `tests/unit/tests/schema.test.ts` — join validation tests

---

## D8: Catalog Versioning — Intent Schema Compatibility

**Decision:** Catalog has a `version` field. Intents carry `schemaVersion` matching the catalog version when created. Resolver validates compatibility.

**Implementation:**

- `Catalog.version: string` (e.g., "2026-Q3")
- Intent (PRD-005): `Intent.schemaVersion: string` (set at creation time)
- Resolver (PRD-006): checks `intent.schemaVersion === catalog.version`
  - If mismatch: return `{ status: 'invalid', code: 'catalog-version-mismatch', repair: { setTo: current_version } }`

**Rationale:**

- Evals (PRD-007) measure "intent validity as catalog evolves"
- Enables version-migration tracking: "which intents are stale?"
- Prevents silent misalignment: catalog evolved, intent references removed metrics
- Provides audit trail: "this intent was valid in v2026-Q2, not in v2026-Q3"

**Files:**

- `src/schema/catalog.ts` — `version: string` (required) in Catalog
- `src/schema/types.ts` — `Catalog.version` property
- `README.md` — explains version tracking and intent compatibility
- `docs/prds/prd-004-trusted-catalog.md` — links to PRD-005/006 for version checking

---

## Summary: D1–D8 Implementation Status

| #   | Decision                      | Implemented | Files                                                         |
| --- | ----------------------------- | ----------- | ------------------------------------------------------------- |
| 1   | Metric.kind + categories[]    | ✅          | schema/catalog.ts, schema/types.ts, tests                     |
| 2   | Dataset.columns[] validation  | ✅          | schema/catalog.ts, schema/types.ts, validateCatalog.ts, tests |
| 3   | Package @ttoss/geovis-catalog | ✅          | package.json, src/index.ts, README.md                         |
| 4   | Governance metadata-only      | ✅          | schema/catalog.ts, schema/types.ts, README.md                 |
| 5   | Geography schema complete     | ✅          | schema/catalog.ts, schema/types.ts, validateCatalog.ts        |
| 6   | Units/Formatters separated    | ✅          | schema/catalog.ts, schema/types.ts, introspection.ts          |
| 7   | Explicit joins registry       | ✅          | schema/catalog.ts, schema/types.ts, validateCatalog.ts, tests |
| 8   | Catalog versioning            | ✅          | schema/catalog.ts, schema/types.ts, README.md                 |

All decisions are **fully implemented and tested** in the `feat/prd-004-trusted-catalog` branch.

---

**Date:** 2026-07-31  
**Author:** Claude Code  
**Status:** Complete
