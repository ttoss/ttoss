---
title: PRD-005 · Constrained Intent
---

# PRD-005: Constrained Map Intent

Status: draft · Priority: **P6** (roadmap R4) · Capability: strategy §5.1 · Package: same layer as PRD-004

## Problem

Without an intent artifact, a model asked to "show income by county" must emit a full `VisualizationSpec` — layers, legends, paint — which is the implementation-generation failure mode the strategy exists to eliminate. The AI-facing input must be smaller than the spec and grounded in the catalog.

## Outcome and success metrics

AI expresses what the map should answer, never how to draw it.

- Intent schema is compact (small, typed, bounded token footprint) and versioned.
- Schema-validity rate of model-emitted intents measured in evals (PRD-007).
- Ambiguity is representable: an underspecified request produces a `needs-clarification` result, not a guess.

## Requirements

### Must

- Intent schema capturing analytical task, metric, geography, time, filters, and unresolved ambiguity (strategy §5.1) — Zod schema with derived JSON Schema (repo forms rule: Zod).
- Validation of intents against a catalog, reporting through the PRD-001 taxonomy.
- Analytical task vocabulary from strategy §12 (distribution, comparison, ranking, change over time, outlier detection, feature lookup, coverage).
- Structured-output-friendly design: the JSON Schema usable directly as an LLM tool input schema.

### Won't (non-goals)

- Natural-language parsing inside the package (the model's job) or prompt libraries.

## Dependencies

PRD-004 (intents are validated against the catalog).

## Open questions

- Whether intent supports multi-metric/bivariate requests in v1 or defers them.
- How intent versioning tracks catalog versioning.
