---
title: PRD-004 · Trusted Catalog
---

# PRD-004: Trusted Catalog

Status: implemented ([plan](../plans/plan-prd-004-trusted-catalog.md)) · Priority: **P5** (roadmap R4) · Capability: strategy §5.2 · Package: @ttoss/geovis-catalog

## Problem

Nothing constrains what an AI may reference when generating a map. The strategy names the catalog as the main anti-hallucination layer — "if something is not in the catalog, AI cannot use it" — and it does not exist in any form.

## Outcome and success metrics

AI can only reference mappable reality.

- Hallucinated-ID rate approaches zero in generation evals (PRD-007).
- The catalog validates its own referential integrity (joins point to real datasets and geographies).
- Intent validation rejects any reference outside the catalog with a `mismatch` issue and candidate alternatives.

## Requirements

### Must

- Catalog contract covering metrics, datasets, geographies, joins, units, formatters, time ranges, filters, allowed map types, permissions, aliases, and descriptions (strategy §5.2) — typed and JSON-schema validated.
- Integrity validation reporting through the PRD-001 taxonomy.
- Introspection surface for AI tools and builders (curated metadata, never raw data).
- Package location: `@ttoss/geovis-catalog`, which also publishes the spatio-temporal dimension contract that the applications' own data dictionaries import, so the catalog and the dictionary cannot drift apart.
- Data binding: `Dataset.artifact` (where the bytes are) and `Dataset.columns` (which column carries each metric). Without both, a valid catalog is still unconsumable — join, spatial and time columns are named, the measure column is not.
- Nominal metrics: `kind: 'nominal'` with a closed `categories[]` (id, label, order, optional theme colour token). The spec's `CategoricalColorBy` has no catalog counterpart today, so a categorical choropleth cannot be expressed at all.
- `Geography.cameraFraming` (bbox, centre, zoom) as **resolver input, never a preset** — PRD-006 derives `viewPresets` from it, keeping `set-view-preset` bounded to declared positions instead of coordinates a model invents.
- `FilterField` is the single filter model: it declares the target property and the allowed `LayerFilterOperator`s, and compiles 1:1 to `VisualizationLayer.filter`.
- `mapTypes` documents **data adequacy** — which metric kinds make sense in which map type — not adapter support. `CapabilitySet` covers source types, layer geometries and data features but never map types, so `validateCatalog` accepts an optional `CapabilitySet` and reports the intersection.

### Should

- Helpers to assemble a catalog from warehouse metadata (input: [AI integration research](../research/ai-integration-readiness.md)). Not built — the Must items (contract, validation, introspection) are the entry gate for PRD-005/006 and shipped first; this helper has no dependent and is left for a later pass.

### Won't (non-goals)

- ETL, data pipelines, tile generation, runtime data fetching, or app business rules.

## Dependencies

PRD-001 (taxonomy for catalog-mismatch reporting). Feeds PRD-005 and PRD-006.

## Open questions

- ~~Catalog governance: who approves entries, and how permissions integrate with application auth.~~ Resolved as out of scope: `permissions` is an opaque, schema-reserved slot; the application enforces its own authorization logic. Governance process itself is an org/product question, not a package concern.
- Whether `Dataset.fields[].sensitive` should also drive the application's rendered payloads, which today are the gateway's responsibility in both pilot applications. The catalog uses the declaration only to govern its own disclosure — introspection payloads and filter domains.
