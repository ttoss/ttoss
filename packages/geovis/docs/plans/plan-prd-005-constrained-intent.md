---
title: Plan · PRD-005 Constrained Map Intent
---

# Implementation Plan: PRD-005 Constrained Map Intent

Source: [PRD-005](../prds/prd-005-constrained-intent.md) · Basis: strategy §5.1, §12 (product-hub doc not present in this repo) · Package: `@ttoss/geovis-catalog` (same package as [PRD-004's plan](./plan-prd-004-trusted-catalog.md), which must land first — this plan validates intents against the `Catalog`/`validateCatalog` surface it ships)

## Durable decisions

### D1 — Intent schema shape (Zod)

Seeded directly from PRD-005's own field list (analytical task, metric, geography, time, filters, unresolved ambiguity) and the analytical task vocabulary named in the PRD text (strategy §12, quoted there): distribution, comparison, ranking, change-over-time, outlier-detection, feature-lookup, coverage.

```ts
export const AnalyticalTask = z.enum([
  'distribution',
  'comparison',
  'ranking',
  'change-over-time',
  'outlier-detection',
  'feature-lookup',
  'coverage',
]);

const IntentFilter = z.object({
  field: z.string(),
  op: z.enum(['=', '!=', '>', '<', '>=', '<=', 'in']),
  value: z.union([
    z.string(),
    z.number(),
    z.array(z.union([z.string(), z.number()])),
  ]),
});

export const IntentSchema = z.object({
  schemaVersion: z.literal(1),
  task: AnalyticalTask,
  metric: z.string(), // metric id, validated against Catalog by validateIntent
  geography: z.string(), // geography id, validated against Catalog
  datasetId: z.string().optional(), // disambiguates when >1 dataset joins the same metric+geography
  time: z
    .object({ start: z.string().optional(), end: z.string().optional() })
    .optional(),
  filters: z.array(IntentFilter).optional(),
  rationale: z.string().optional(), // matches the `rationale` field already established by @ttoss/geovis's action vocabulary (ADR-0003), for consistency across every AI-facing input shape
});

export type AnalyticalIntent = z.infer<typeof IntentSchema>;
```

`schemaVersion: z.literal(1)` follows the same versioning device `@ttoss/geovis`'s spec (`SPEC_SCHEMA_VERSION`) and context packet (ADR-0004) already use — this resolves PRD-005's second open question ("how intent versioning tracks catalog versioning") by decoupling them: intent carries its own `schemaVersion`; catalog compatibility is checked at validation time (D2) by comparing against the `Catalog.version` the intent was validated with, recorded on the result rather than embedded in the intent schema itself. The two versions are independent axes, not a single coupled counter.

### D2 — Multi-metric / bivariate intents: deferred to v1's single-metric scope

Resolves PRD-005's first open question. `IntentSchema` in D1 has exactly one `metric` field. Bivariate requests (the `dimension: 'color' | 'size'` pattern `@ttoss/geovis` already supports at the spec level) are **not** representable in v1's intent — PRD-006's resolver therefore only ever produces single-metric resolutions from this package. This is a scope cut, not a schema gap: adding a second optional `secondaryMetric` field later is additive (new optional field, old intents stay valid), so nothing here forecloses it.

### D3 — Validation against the catalog, extending the PRD-004 taxonomy

`validateIntent(intent: unknown, catalog: Catalog): IntentResult` runs: (1) `IntentSchema.safeParse` → `invalid-intent-schema`; (2) `intent.metric` must resolve to a `Catalog.metrics[].id` → `unknown-metric` with `repair: [{ kind: 'allowed-values', values: catalog.metrics.map(m => m.id) }]`; (3) `intent.geography` must resolve to a `Catalog.geographies[].id` → `unknown-geography`, same repair shape; (4) if `datasetId` given, it must exist and its `metricIds`/`geographyIds` must include the requested metric/geography → `dataset-metric-mismatch` / `dataset-geography-mismatch`; (5) if `datasetId` omitted, the metric+geography pair must resolve to exactly one dataset via `Catalog.joins` — zero matches is a `mismatch` (`no-joinable-dataset`), and **more than one match is `needs-clarification`** (`ambiguous-dataset`, `repair: [{ kind: 'allowed-values', values: <candidate dataset ids> }]`) rather than silently picking one — this is PRD-005's "ambiguity is representable" Must item, and it is what extends `CatalogResultStatus` from PRD-004's plan (D2 there) with `'needs-clarification'`, exactly as anticipated.

```ts
export type IntentResultStatus = CatalogResultStatus | 'needs-clarification';
export type IntentIssueCode =
  | CatalogIssueCode
  | 'invalid-intent-schema'
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

### D4 — Structured-output / tool-schema compatibility

`getIntentJSONSchema()` exports `z.toJSONSchema(IntentSchema)`, mirroring D4/the JSON Schema export pattern from PRD-004's plan — directly usable as an LLM structured-output or function-calling `input_schema`, per PRD-005's Must item and the pattern already documented in [`ai-integration-readiness.md`](../ai-integration-readiness.md)'s "Pattern 2: Structured Output" section. No NL parsing, prompt templates, or model-calling code is added anywhere in this package (PRD-005's Won't).

## Phases

```mermaid
graph LR
  P1["1 · Intent schema + task vocabulary"] --> P2["2 · Catalog-bound validation"]
  P2 --> P3["3 · Ambiguity handling"]
  P3 --> P4["4 · JSON Schema export + docs"]
```

### Phase 1 — Intent schema and task vocabulary

Implement `AnalyticalTask` and `IntentSchema`/`AnalyticalIntent` (D1) in `src/intent/schema.ts`. Fixture intents: one per `AnalyticalTask` value, plus one with every optional field populated and one minimal (task+metric+geography only).

**Demo:** `IntentSchema.parse(sampleIntent)` succeeds for all seven task fixtures; a fixture with an invalid `op` value fails `safeParse`.
**Acceptance:** one test per `AnalyticalTask` value confirming it round-trips; `rationale` and `filters` confirmed optional; public-contract test extended for the new exports.

### Phase 2 — Catalog-bound validation

Implement `validateIntent` steps 1–4 (D3, excluding ambiguity) in `src/intent/validateIntent.ts`, reusing PRD-004 plan's `sampleCatalog` fixture. `IntentResultStatus`/`IntentIssueCode`/`IntentResult` types added alongside.

**Demo:** an intent naming a real metric/geography/dataset from the sample catalog validates; an intent naming a metric not in the catalog returns `{ status: 'mismatch', issues: [{ code: 'unknown-metric', repair: [...] }] }`.
**Acceptance:** one fixture and test per new `IntentIssueCode` except `ambiguous-dataset`/`no-joinable-dataset` (Phase 3); `datasetId`-supplied and `datasetId`-omitted-but-unambiguous paths both tested.

### Phase 3 — Ambiguity handling

Implement `validateIntent` step 5 (D3's join-selection and ambiguity detection). Extend the sample catalog fixture with a second dataset that joins the same metric+geography pair, to exercise the ambiguous case.

**Demo:** an intent with no `datasetId`, whose metric+geography joins to exactly one dataset, resolves with that `datasetId` filled in; the same intent against the two-dataset fixture returns `{ status: 'needs-clarification', issues: [{ code: 'ambiguous-dataset', repair: [{ kind: 'allowed-values', values: ['dataset-a', 'dataset-b'] }] }] }`.
**Acceptance:** `no-joinable-dataset` and `ambiguous-dataset` each have a fixture and test; `CatalogResultStatus`'s extension to include `'needs-clarification'` (anticipated in PRD-004's plan D2) is exercised end-to-end here for the first time.

### Phase 4 — JSON Schema export and docs

Implement `getIntentJSONSchema()` (D4). Update `README.md` with the intent contract's field tables, the task vocabulary, `validateIntent` usage examples (valid, mismatch, ambiguous), and a structured-output example matching `ai-integration-readiness.md`'s Pattern 2. Update `coverageThreshold`.

**Demo:** README's structured-output example, copy-pasted, produces a JSON Schema whose `properties.task.enum` lists all seven analytical tasks.
**Acceptance:** `pnpm turbo run test --filter=...@ttoss/geovis-catalog` and `pnpm turbo run build --filter=...@ttoss/geovis-catalog` green; coverage threshold updated; `pnpm run -w lint` clean.

## Sequencing notes

This plan cannot start until PRD-004's plan has shipped Phase 2 (`Catalog`/`CatalogSchema`) and Phase 3 (`CatalogResult`/`CatalogIssue` taxonomy) — Phase 2 here imports both directly. Phase 1 (intent schema alone) has no such dependency and could in principle run in parallel with PRD-004's later phases, but is sequenced after for a single implementer to avoid rebasing the fixture catalog mid-flight. Phase 2 depends on Phase 1. Phase 3 depends on Phase 2 (extends the same function). Phase 4 depends on Phase 3. Each phase is one PR.

This plan's outputs (`AnalyticalIntent`, `IntentSchema`, `validateIntent`, `IntentResult`, the extended `IntentResultStatus`/`IntentIssueCode`) are what PRD-006's plan resolves into a `VisualizationSpec`.

## Open questions carried forward (not resolved by this plan)

- Whether a future `secondaryMetric` (bivariate) field lands is left for a later PRD revision — D2 only confirms it would be additive, not when or whether it ships.
- The strategy document (`docs/website/docs/product/geovis/strategy.md`) is absent from the repo (see PRD-004 plan's Verification section) — strategy §12's full task-vocabulary rationale is unavailable beyond what PRD-005's own text already states, which this plan used directly.

## Verification against current codebase (2026-07-21)

- Depends on `packages/geovis-catalog` existing with `Catalog`, `CatalogSchema`, `CatalogResult`, `CatalogIssue`, `CatalogIssueCode`, `validateCatalog` exported — none of this exists until PRD-004's plan ships; this plan cannot be started in isolation.
- `zod@^4.4.3` (pinned in `@ttoss/forms`/`@ttoss/http-server-mcp`) provides `z.toJSONSchema` natively, consistent with D4 and PRD-004 plan's D3.
- `@ttoss/geovis`'s `ADR-0003` action vocabulary already uses an optional `rationale` field on every semantic action — D1 mirrors that field name/shape for consistency across the AI-facing surface, rather than inventing a differently-named equivalent.
