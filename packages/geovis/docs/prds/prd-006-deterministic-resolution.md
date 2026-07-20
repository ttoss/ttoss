---
title: PRD-006 · Deterministic Resolution
---

# PRD-006: Deterministic Resolution

Status: draft · Priority: **P7** (roadmap R4) · Capability: strategy §5.3 · Package: same layer as PRD-004

## Problem

The bridge from "what the user wants" to "a valid map" is where product, data, design, and engineering judgment lives — and today it exists only as the small `mapType` auto-configuration inside `@ttoss/geovis`. Without a resolver, that judgment is re-implemented (or guessed by a model) in every application.

## Outcome and success metrics

Intent becomes a valid map or a structured failure — never a guess.

- `resolve(intent, catalog)` returns a `GeoVisResult`: a renderable spec with warnings, or a failure with repair options.
- Resolver success rate and zero-guess rate measured in evals (PRD-007).
- Task rules (strategy §12) are encoded and testable: each analytical task has expected metric kind, geography, map type, legend, and warnings.

## Requirements

### Must

- Deterministic resolver deciding data binding, join, map type, legend, tooltip semantics, missing-data policy, and warnings.
- All failure paths through the PRD-001 taxonomy, including `needs-clarification` for ambiguous intents.
- Reuse `resolveSpecFromMapType` defaults as the encoding seed — the resolver extends existing judgment, not replaces it.

### Should

- Resolution trace (why each choice was made) exposed in the map's metadata — feeds the explain mode.

### Won't (non-goals)

- Non-deterministic (model-in-the-loop) resolution; per-application business rules.

## Dependencies

PRD-004 (catalog), PRD-005 (intent), PRD-001 (taxonomy).

## Open questions

- Extension points: can applications register additional task rules without forking the resolver?
- Client vs. server execution for large catalogs.
