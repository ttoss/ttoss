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
- Package location: `@ttoss/geovis-catalog`.

### Should

- Helpers to assemble a catalog from warehouse metadata (input: [AI integration research](../research/ai-integration-readiness.md)). Not built — the Must items (contract, validation, introspection) are the entry gate for PRD-005/006 and shipped first; this helper has no dependent and is left for a later pass.

### Won't (non-goals)

- ETL, data pipelines, tile generation, runtime data fetching, or app business rules.

## Dependencies

PRD-001 (taxonomy for catalog-mismatch reporting). Feeds PRD-005 and PRD-006.

## Open questions

- ~~Catalog governance: who approves entries, and how permissions integrate with application auth.~~ Resolved as out of scope: `permissions` is an opaque, schema-reserved slot; the application enforces its own authorization logic. Governance process itself is an org/product question, not a package concern.
