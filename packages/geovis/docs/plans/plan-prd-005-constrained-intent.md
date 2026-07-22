---
title: Plan · PRD-005 Constrained Map Intent
---

# Implementation Plan: PRD-005 Constrained Map Intent

Source: [PRD-005](../prds/prd-005-constrained-intent.md) · Basis: strategy §5.1, §12 (product-hub doc not present in this repo) · Package: `@ttoss/geovis-catalog` (same package as [PRD-004's plan](./plan-prd-004-trusted-catalog.md), which must land first — this plan validates intents against the `Catalog`/`validateCatalog` surface it ships)

## Durable decisions

### D1 — Schema validation: Ajv + hand-authored JSON Schema, not Zod

Same choice as PRD-004 plan's D1, for the same reason: this is a machine-facing data contract in the `@ttoss/geovis` product family, and that family's established pattern (`spec/schema.json` + `Ajv2020` + hand-written `types.ts`, not Zod) is the closer precedent than the repo-wide `@ttoss/forms` rule, which is scoped to UI form validation. `AnalyticalIntent` is authored as `src/intent/intent.schema.json` + a hand-written `AnalyticalIntent` interface, validated with the same `Ajv2020` instance pattern `@ttoss/geovis-catalog` already set up for the catalog schema in PRD-004's plan — no second validation library, no `zod` dependency added by this plan either.

### D2 — Intent schema shape (JSON Schema)

Seeded directly from PRD-005's own field list (analytical task, metric, geography, time, filters, unresolved ambiguity) and the analytical task vocabulary named in the PRD text (strategy §12, quoted there): distribution, comparison, ranking, change-over-time, outlier-detection, feature-lookup, coverage.

```ts
// src/intent/taskVocabulary.ts
export const ANALYTICAL_TASKS = [
  'distribution',
  'comparison',
  'ranking',
  'change-over-time',
  'outlier-detection',
  'feature-lookup',
  'coverage',
] as const;

export type AnalyticalTask = (typeof ANALYTICAL_TASKS)[number];
```

`ANALYTICAL_TASKS` is a genuine (small) addition beyond `@ttoss/geovis`'s own style — that package expresses closed string unions as bare TS union types (e.g. `VisualizationSpec['mapType']`) with no matching runtime array, because nothing there needs to _iterate_ the union at runtime. This plan's Phase 1 acceptance criterion ("one test per task, and a completeness test that every task has a rule" — reused again in PRD-006's plan) does need to iterate it, so a `readonly` const array with the type derived via `(typeof X)[number]` is the standard TS idiom for keeping one source of truth between the runtime list and the type — not a Zod-specific concern, and not a deviation once introduced, since `@ttoss/geovis`'s own `SEQUENTIAL_PALETTES`-style exported const arrays already establish that this repo is comfortable with the pattern.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://ttoss.dev/geovis-catalog/intent.schema.json",
  "title": "AnalyticalIntent",
  "type": "object",
  "additionalProperties": false,
  "required": ["schemaVersion", "task", "metric", "geography"],
  "properties": {
    "schemaVersion": { "type": "number" },
    "task": {
      "type": "string",
      "enum": [
        "distribution",
        "comparison",
        "ranking",
        "change-over-time",
        "outlier-detection",
        "feature-lookup",
        "coverage"
      ]
    },
    "metric": { "type": "string" },
    "geography": { "type": "string" },
    "datasetId": { "type": "string" },
    "time": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "start": { "type": "string" },
        "end": { "type": "string" }
      }
    },
    "filters": { "type": "array", "items": { "$ref": "#/$defs/IntentFilter" } },
    "rationale": { "type": "string" }
  },
  "$defs": {
    "IntentFilter": {
      "type": "object",
      "additionalProperties": false,
      "required": ["field", "op", "value"],
      "properties": {
        "field": { "type": "string" },
        "op": {
          "type": "string",
          "enum": ["=", "!=", ">", "<", ">=", "<=", "in"]
        },
        "value": {
          "anyOf": [
            { "type": "string" },
            { "type": "number" },
            {
              "type": "array",
              "items": { "anyOf": [{ "type": "string" }, { "type": "number" }] }
            }
          ]
        }
      }
    }
  }
}
```

The matching hand-written interface, `src/intent/types.ts`:

```ts
export interface IntentFilter {
  field: string;
  op: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'in';
  value: string | number | Array<string | number>;
}

export interface AnalyticalIntent {
  schemaVersion: number;
  task: AnalyticalTask;
  metric: string; // metric id, validated against Catalog by validateIntent
  geography: string; // geography id, validated against Catalog
  datasetId?: string; // disambiguates when >1 dataset joins the same metric+geography
  time?: { start?: string; end?: string };
  filters?: IntentFilter[];
  rationale?: string; // matches the `rationale` field already established by @ttoss/geovis's action vocabulary (ADR-0003), for consistency across every AI-facing input shape
}
```

`schemaVersion` is a plain `number` in the schema (checked for exact match by a dedicated cross-field rule, not a JSON Schema `const`) — mirroring `@ttoss/geovis`'s own `spec/schema.json` (`"schemaVersion": { "type": "number" }`) plus its separate `validateSchemaVersion` check against the exported `SPEC_SCHEMA_VERSION` constant, rather than encoding the exact version as a schema-level literal. This plan adds the equivalent `INTENT_SCHEMA_VERSION = 1` constant and an `invalid-intent-schema-version` check with a `set-value` repair (`{ kind: 'set-value', value: INTENT_SCHEMA_VERSION, label: 'Set schemaVersion to 1' }`) — the same shape `@ttoss/geovis`'s own version-mismatch repair already uses — instead of a schema-level `enum`/`const` that would produce a less specific, unrepairable Ajv error.

This resolves PRD-005's second open question ("how intent versioning tracks catalog versioning") by decoupling them: intent carries its own `schemaVersion`; catalog compatibility is checked at validation time (D4) by comparing against the `Catalog.version` the intent was validated with, recorded on the result rather than embedded in the intent schema itself. The two versions are independent axes, not a single coupled counter.

### D3 — Multi-metric / bivariate intents: deferred to v1's single-metric scope

Resolves PRD-005's first open question. `AnalyticalIntent` in D2 has exactly one `metric` field. Bivariate requests (the `dimension: 'color' | 'size'` pattern `@ttoss/geovis` already supports at the spec level) are **not** representable in v1's intent — PRD-006's resolver therefore only ever produces single-metric resolutions from this package. This is a scope cut, not a schema gap: adding a second optional `secondaryMetric` field later is additive (new optional property, old intents stay valid against `additionalProperties: false` since it would be added to the schema at the same time), so nothing here forecloses it.

### D4 — Validation against the catalog, extending the PRD-004 taxonomy

`validateIntent(intent: unknown, catalog: Catalog): IntentResult` runs: (1) `Ajv2020`-compiled `intent.schema.json` against `intent` → `invalid-intent-schema`, errors mapped the same way `validateCatalog` (PRD-004 plan D5) already does; (1b) `schemaVersion` exact-match check against `INTENT_SCHEMA_VERSION` → `invalid-intent-schema-version` (D2); (2) `intent.metric` must resolve to a `Catalog.metrics[].id` → `unknown-metric` with `repair: [{ kind: 'allowed-values', values: catalog.metrics.map(m => m.id) }]`; (3) `intent.geography` must resolve to a `Catalog.geographies[].id` → `unknown-geography`, same repair shape; (4) if `datasetId` given, it must exist and its `metricIds`/`geographyIds` must include the requested metric/geography → `dataset-metric-mismatch` / `dataset-geography-mismatch`; (5) if `datasetId` omitted, the metric+geography pair must resolve to exactly one dataset via `Catalog.joins` — zero matches is a `mismatch` (`no-joinable-dataset`), and **more than one match is `needs-clarification`** (`ambiguous-dataset`, `repair: [{ kind: 'allowed-values', values: <candidate dataset ids> }]`) rather than silently picking one — this is PRD-005's "ambiguity is representable" Must item, and it is what extends `CatalogResultStatus` from PRD-004's plan (D3 there) with `'needs-clarification'`, exactly as anticipated.

```ts
export type IntentResultStatus = CatalogResultStatus | 'needs-clarification';
export type IntentIssueCode =
  | CatalogIssueCode
  | 'invalid-intent-schema'
  | 'invalid-intent-schema-version'
  | 'unknown-metric'
  | 'unknown-geography'
  | 'dataset-metric-mismatch'
  | 'dataset-geography-mismatch'
  | 'no-joinable-dataset'
  | 'ambiguous-dataset';

export type IntentResult =
  | {
      status: 'valid';
      intent: AnalyticalIntent;
      datasetId: string;
      catalogVersion: string;
    }
  | { status: IntentResultStatus; issues: CatalogIssue[] };
```

A `'valid'` result always resolves `datasetId` — whether it was supplied and confirmed (step 4) or inferred as the single joinable candidate (step 5) — so PRD-006's resolver never has to repeat this join-selection logic; it consumes an already-disambiguated intent.

### D5 — Structured-output / tool-schema compatibility

`getIntentJSONSchema()` returns the imported `intent.schema.json` document directly — no derivation step, matching PRD-004 plan's D6 (`getCatalogJSONSchema()`) now that the schema itself is authored as JSON Schema instead of a Zod object. Directly usable as an LLM structured-output or function-calling `input_schema`, per PRD-005's Must item and the pattern already documented in [`ai-integration-readiness.md`](../ai-integration-readiness.md)'s "Pattern 2: Structured Output" section. No NL parsing, prompt templates, or model-calling code is added anywhere in this package (PRD-005's Won't).

## Phases

```mermaid
graph LR
  P1["1 · Intent schema + task vocabulary"] --> P2["2 · Catalog-bound validation"]
  P2 --> P3["3 · Ambiguity handling"]
  P3 --> P4["4 · JSON Schema export + docs"]
```

### Phase 1 — Intent schema and task vocabulary

Implement `ANALYTICAL_TASKS`/`AnalyticalTask` (D2), `intent.schema.json`, and the `AnalyticalIntent`/`IntentFilter` interfaces (D2) in `src/intent/`. Fixture intents: one per `AnalyticalTask` value, plus one with every optional field populated and one minimal (task+metric+geography only).

**Demo:** validating `sampleIntent` against the compiled `intent.schema.json` succeeds for all seven task fixtures; a fixture with an invalid `op` value fails Ajv validation.
**Acceptance:** one test per `AnalyticalTask` value confirming it round-trips; a schema/type parity test (same style as PRD-004 plan's Phase 2) confirms `intent.schema.json`'s `task.enum` matches `ANALYTICAL_TASKS` exactly; `rationale` and `filters` confirmed optional; public-contract test extended for the new exports.

### Phase 2 — Catalog-bound validation

Implement `validateIntent` steps 1–4 (D4, excluding ambiguity) in `src/intent/validateIntent.ts`, reusing PRD-004 plan's `sampleCatalog` fixture. `IntentResultStatus`/`IntentIssueCode`/`IntentResult` types added alongside, plus `INTENT_SCHEMA_VERSION` and its version-mismatch check (D2).

**Demo:** an intent naming a real metric/geography/dataset from the sample catalog validates; an intent naming a metric not in the catalog returns `{ status: 'mismatch', issues: [{ code: 'unknown-metric', repair: [...] }] }`.
**Acceptance:** one fixture and test per new `IntentIssueCode` except `ambiguous-dataset`/`no-joinable-dataset` (Phase 3); `datasetId`-supplied and `datasetId`-omitted-but-unambiguous paths both tested; a schema-version-mismatch fixture confirms the `set-value` repair suggests `INTENT_SCHEMA_VERSION`.

### Phase 3 — Ambiguity handling

Implement `validateIntent` step 5 (D4's join-selection and ambiguity detection). Extend the sample catalog fixture with a second dataset that joins the same metric+geography pair, to exercise the ambiguous case.

**Demo:** an intent with no `datasetId`, whose metric+geography joins to exactly one dataset, resolves with that `datasetId` filled in; the same intent against the two-dataset fixture returns `{ status: 'needs-clarification', issues: [{ code: 'ambiguous-dataset', repair: [{ kind: 'allowed-values', values: ['dataset-a', 'dataset-b'] }] }] }`.
**Acceptance:** `no-joinable-dataset` and `ambiguous-dataset` each have a fixture and test; `CatalogResultStatus`'s extension to include `'needs-clarification'` (anticipated in PRD-004's plan D3) is exercised end-to-end here for the first time.

### Phase 4 — JSON Schema export and docs

Implement `getIntentJSONSchema()` (D5). Update `README.md` with the intent contract's field tables, the task vocabulary, `validateIntent` usage examples (valid, mismatch, ambiguous), and a structured-output example matching `ai-integration-readiness.md`'s Pattern 2. Update `coverageThreshold`.

**Demo:** README's structured-output example, copy-pasted, shows a JSON Schema whose `properties.task.enum` lists all seven analytical tasks.
**Acceptance:** `pnpm turbo run test --filter=...@ttoss/geovis-catalog` and `pnpm turbo run build --filter=...@ttoss/geovis-catalog` green; coverage threshold updated; `pnpm run -w lint` clean.

## Sequencing notes

This plan cannot start until PRD-004's plan has shipped Phase 2 (`Catalog`/`catalogSchema`) and Phase 3 (`CatalogResult`/`CatalogIssue` taxonomy) — Phase 2 here imports both directly, and reuses the same `Ajv2020` compile pattern PRD-004's plan establishes. Phase 1 (intent schema alone) has no such dependency and could in principle run in parallel with PRD-004's later phases, but is sequenced after for a single implementer to avoid rebasing the fixture catalog mid-flight. Phase 2 depends on Phase 1. Phase 3 depends on Phase 2 (extends the same function). Phase 4 depends on Phase 3. Each phase is one PR.

This plan's outputs (`AnalyticalIntent`, `intentSchema`, `validateIntent`, `IntentResult`, the extended `IntentResultStatus`/`IntentIssueCode`) are what PRD-006's plan resolves into a `VisualizationSpec`.

## Open questions carried forward (not resolved by this plan)

- Whether a future `secondaryMetric` (bivariate) field lands is left for a later PRD revision — D3 only confirms it would be additive, not when or whether it ships.
- The strategy document (`docs/website/docs/product/geovis/strategy.md`) is absent from the repo (see PRD-004 plan's Verification section) — strategy §12's full task-vocabulary rationale is unavailable beyond what PRD-005's own text already states, which this plan used directly.

## Verification against current codebase (2026-07-22)

- Depends on `packages/geovis-catalog` existing with `Catalog`, `catalogSchema`, `CatalogResult`, `CatalogIssue`, `CatalogIssueCode`, `validateCatalog` exported — none of this exists until PRD-004's plan ships; this plan cannot be started in isolation.
- `ajv@^8.18.0` (already a dependency of `@ttoss/geovis-catalog` per PRD-004 plan's D1) is reused as-is — this plan adds no new dependency.
- `@ttoss/geovis`'s `ADR-0003` action vocabulary already uses an optional `rationale` field on every semantic action — D2 mirrors that field name/shape for consistency across the AI-facing surface, rather than inventing a differently-named equivalent.
- `packages/geovis/src/spec/types.ts`'s `SPEC_SCHEMA_VERSION` constant plus `validateSpec.checks.ts`'s `validateSchemaVersion` confirm the plain-`number`-plus-separate-check pattern D2 mirrors for `schemaVersion`/`INTENT_SCHEMA_VERSION`.
