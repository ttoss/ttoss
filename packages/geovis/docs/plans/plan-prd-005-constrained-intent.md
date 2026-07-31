---
title: Plan · PRD-005 Constrained Map Intent
---

# Implementation Plan: PRD-005 Constrained Map Intent

Source: [PRD-005](../prds/prd-005-constrained-intent.md) · Basis: strategy §5.1, §12 (product-hub doc not present in this repo) · Package: `@ttoss/geovis-catalog` (same package as [PRD-004's plan](./plan-prd-004-trusted-catalog.md), which must land first — this plan validates intents against the `Catalog`/`validateCatalog` surface it ships)

## Durable decisions

### D1 — Schema validation: Zod

> **Superseded by PRD-004 plan's D14 (2026-07-30): Zod replaces Ajv as the schema source of truth.** Originally this decision mirrored PRD-004 plan's D1 (Ajv + hand-authored JSON Schema); it now follows D14 instead.

`AnalyticalIntent` is authored as a Zod schema in `src/intent/schema.ts`, validated with `intentSchema.safeParse` — the same pattern `@ttoss/geovis-catalog` uses for `Catalog` per PRD-004 plan's D14. No JSON Schema document and no `ajv` dependency are introduced for intent validation; `getCatalogJSONSchema()`-style derivation (via `z.toJSONSchema`) is available if a published schema document is ever needed, but nothing in PRD-005 requires one today.

### D2 — Intent schema shape (Zod)

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

`ANALYTICAL_TASKS` is a genuine (small) addition beyond `@ttoss/geovis`'s own style — that package expresses closed string unions as bare TS union types (e.g. `VisualizationSpec['mapType']`) with no matching runtime array, because nothing there needs to _iterate_ the union at runtime. This plan's Phase 1 acceptance criterion ("one test per task, and a completeness test that every task has a rule" — reused again in PRD-006's plan) does need to iterate it, so a `readonly` const array with the type derived via `(typeof X)[number]` keeps one source of truth between the runtime list and the type.

Per PRD-004 plan's D14, `@ttoss/geovis-catalog` authors every schema directly in Zod — `src/schema/catalog.ts` (`strictObject` + `.meta({ id })` + a `.check()` for cross-field rules, e.g. `metricSchema`'s `kind: 'nominal'` ⇒ non-empty `categories`) is the established pattern. `src/intent/schema.ts` follows it exactly: no hand-authored JSON Schema document is kept in this plan (or anywhere in the package) as a second, driftable copy of the same contract — `getIntentJSONSchema()` (D5) derives one from `intentSchema` via `z.toJSONSchema` on demand, the same way `getCatalogJSONSchema()` already does. The interface below is the `z.infer` shape that schema produces, shown for readability only — the schema itself, not this interface, is the source of truth:

```ts
export interface IntentFilter {
  field: string;
  op: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'in';
  value: string | number | Array<string | number>;
}

export interface AnalyticalIntent {
  schemaVersion: number;
  analyticalTask: AnalyticalTask;
  metricId: string; // metric id, validated against Catalog by validateIntent
  geographyId: string; // geography id, validated against Catalog
  datasetId?: string; // disambiguates when >1 dataset joins the same metric+geography
  categoryId?: string; // required when the resolved metric is 'nominal'; validated against that metric's categories (D6)
  time?: { start?: string; end?: string };
  filters?: IntentFilter[];
  rationale?: string; // matches the `rationale` field already established by @ttoss/geovis's action vocabulary (ADR-0003), for consistency across every AI-facing input shape
}
```

`task`/`metric`/`geography` are renamed to `analyticalTask`/`metricId`/`geographyId` from the original draft of this plan: `analyticalTask` matches the `AnalyticalTask` type name it holds (the earlier `task` read as generic and undersold that it's a closed, catalog-adjacent vocabulary, not a free label); `metricId`/`geographyId` match the `Id`-suffix convention `datasetId` (and now `categoryId`, D6) already use elsewhere on this same interface for "string that must resolve against a `Catalog` collection" — `metric`/`geography` without the suffix read ambiguously as if they might carry an inline object, which they never do.

`schemaVersion` stays a plain `number` in the schema (checked for exact match by a dedicated cross-field rule in `validateIntent`, not a schema-level literal) — mirroring `@ttoss/geovis`'s own `spec/schema.json` (`"schemaVersion": { "type": "number" }`) plus its separate `validateSchemaVersion` check against the exported `SPEC_SCHEMA_VERSION` constant. This plan adds the equivalent `INTENT_SCHEMA_VERSION = 1` constant and an `invalid-intent-schema-version` check with a `set-value` repair (`{ kind: 'set-value', value: INTENT_SCHEMA_VERSION, label: 'Set schemaVersion to 1' }`) — the same shape `@ttoss/geovis`'s own version-mismatch repair already uses. The check stays in `validateIntent` rather than folded into `intentSchema` itself (e.g. `z.literal(INTENT_SCHEMA_VERSION)`) because it needs to produce an `IntentIssue.repair` suggestion, which is a `validateIntent`-level concept — the schema's job is shape, not repair authoring.

This resolves PRD-005's second open question ("how intent versioning tracks catalog versioning") by decoupling them: intent carries its own `schemaVersion`; catalog compatibility is checked at validation time (D4) by comparing against the `Catalog.version` the intent was validated with, recorded on the result rather than embedded in the intent schema itself. The two versions are independent axes, not a single coupled counter.

**`time`'s shape re-evaluated against PRD-004 plan's D10 (Temporal), unchanged.** D10 gave `Dataset.temporal` a much richer model since this plan's `time` field was first drafted — `extent: Interval[]`, an optional `periods[]` (explicit `{ start, end, label }` entries, "derived from `extent` × `grain`… only to override gaps"), and `temporalGrain`. It's tempting to ground `AnalyticalIntent.time` against those the same way `metricId`/`geographyId`/`categoryId` are grounded against catalog collections — e.g. a `periodId` referencing one of `Dataset.temporal.periods[]`. That would be the wrong trade-off here: `periods[]` is optional and, per D10, exists only to override irregular gaps — most datasets carry only `extent` (a continuous bound) plus `temporalGrain`, with no enumerable period list to reference an id against. A `periodId` field would work for the minority of datasets that declare `periods[]` and silently be unusable for the rest. `time`'s job is also different in kind from `metricId`/`geographyId`: those pick one item out of a closed catalog list; `time` expresses an arbitrary range (the "change-over-time" task needs a start/end spanning possibly-partial periods, not a single named one). Free-form ISO date strings for `start`/`end` stay the right shape for that. What D10 does change is where range plausibility gets checked: whether `time.start`/`time.end` fall inside the resolved dataset's `Temporal.extent` is a resolver-time concern (PRD-006 has the resolved `datasetId` and can compare against its concrete `extent`/`periods[]`, e.g. an `out-of-range-time` warning) rather than a `validateIntent`-time one — `validateIntent`'s job (D4) is reference-grounding (does this id exist in the catalog), not range arithmetic against a specific dataset's temporal bounds. No schema or code change follows from this for PRD-005's plan; it's recorded here so the question doesn't get re-litigated, and it hands PRD-006's plan a concrete follow-up (see that plan's Phase 3 warnings).

### D3 — Multi-metric / bivariate intents: deferred to v1's single-metric scope

Resolves PRD-005's first open question. `AnalyticalIntent` in D2 has exactly one `metricId` field. Bivariate requests (the `dimension: 'color' | 'size'` pattern `@ttoss/geovis` already supports at the spec level) are **not** representable in v1's intent — PRD-006's resolver therefore only ever produces single-metric resolutions from this package. This is a scope cut, not a schema gap: adding a second optional `secondaryMetric` field later is additive (new optional property, old intents stay valid against `additionalProperties: false` since it would be added to the schema at the same time), so nothing here forecloses it.

### D4 — Validation against the catalog, extending the PRD-004 taxonomy

`validateIntent(intent: unknown, catalog: Catalog): IntentResult` runs: (1) `intentSchema.safeParse(intent)` (D1) → `invalid-intent-schema`, errors mapped the same way `validateCatalog` (PRD-004 plan D14) already does; (1b) `schemaVersion` exact-match check against `INTENT_SCHEMA_VERSION` → `invalid-intent-schema-version` (D2); (2) `intent.metricId` must resolve to a `Catalog.metrics[].id` → `unknown-metric` with `repair: [{ kind: 'allowed-values', values: catalog.metrics.map(m => m.id) }]`; (2b) once the metric resolves, `categoryId` grounding runs (D6) — `unknown-category` when the resolved metric is `'nominal'` and `categoryId` doesn't match one of its `categories[].id`; (3) `intent.geographyId` must resolve to a `Catalog.geographies[].id` → `unknown-geography`, same repair shape; (4) if `datasetId` given, it must exist and its `metricIds`/`geographyIds` must include the requested metric/geography → `dataset-metric-mismatch` / `dataset-geography-mismatch`; (5) if `datasetId` omitted, the metric+geography pair must resolve to exactly one dataset via `Catalog.joins` — zero matches is a `mismatch` (`no-joinable-dataset`), and **more than one match is `needs-clarification`** (`ambiguous-dataset`, `repair: [{ kind: 'allowed-values', values: <candidate dataset ids> }]`) rather than silently picking one — this is PRD-005's "ambiguity is representable" Must item, and it is what extends `CatalogResultStatus` from PRD-004's plan (D3 there) with `'needs-clarification'`, exactly as anticipated; (6) once a `datasetId` is resolved (step 4 or 5), every `intent.filters[].field` is resolved against that dataset's own field names — `Dataset.fields[].name` first (PRD-004 plan's D12), falling back to `Dataset.columns` values plus `Spatial.field`/`Temporal.field` for a catalog whose datasets predate `fields[]` — an unresolvable name is `unknown-filter-field` (`mismatch`, `repair: [{ kind: 'allowed-values', values: <known field/column names for this dataset> }]`); a resolved field carrying `DatasetField.sensible: true` is `sensitive-filter-field` (`mismatch`, no repair — the fix is "don't filter on this field", not a suggested alternative computed from the sensitive value itself).

Step 6 closes a gap the original PRD-005 plan left open: `IntentFilter.field` was validated by JSON Schema shape (a string) but never checked against the catalog, so a model-supplied field name that doesn't exist — or does exist but names a sensitive column — passed `validateIntent` silently. Grounding it the same way `metricId`/`geographyId` are grounded (steps 2–3) closes the gap symmetrically rather than leaving `filters[]` as the one ungrounded part of the intent.

```ts
export type IntentResultStatus = CatalogResultStatus | 'needs-clarification';
export type IntentIssueCode =
  | CatalogIssueCode
  | 'invalid-intent-schema'
  | 'invalid-intent-schema-version'
  | 'unknown-metric'
  | 'unknown-category'
  | 'unknown-geography'
  | 'dataset-metric-mismatch'
  | 'dataset-geography-mismatch'
  | 'no-joinable-dataset'
  | 'ambiguous-dataset'
  | 'unknown-filter-field'
  | 'sensitive-filter-field';

export type IntentResult =
  | {
      status: 'valid';
      intent: AnalyticalIntent;
      datasetId: string;
      catalogVersion: string;
    }
  | { status: IntentResultStatus; issues: CatalogIssue[] };
```

A `'valid'` result always resolves `datasetId` — whether it was supplied and confirmed (step 4) or inferred as the single joinable candidate (step 5) — so PRD-006's resolver never has to repeat this join-selection logic; it consumes an already-disambiguated intent. Filter-field grounding (step 6) runs after `datasetId` resolution specifically because it needs a single, concrete dataset to resolve field names against — it cannot run earlier, when the target dataset is still ambiguous.

### D5 — Structured-output / tool-schema compatibility

`getIntentJSONSchema()` derives the JSON Schema document from `intentSchema` via `z.toJSONSchema` (D2), matching PRD-004 plan's D6 (`getCatalogJSONSchema()`) — no hand-maintained `intent.schema.json` file is kept. Directly usable as an LLM structured-output or function-calling `input_schema`, per PRD-005's Must item and the pattern already documented in [`ai-integration-readiness.md`](../ai-integration-readiness.md)'s "Pattern 2: Structured Output" section. No NL parsing, prompt templates, or model-calling code is added anywhere in this package (PRD-005's Won't).

### D6 — `categoryId`: grounding a nominal metric's request in the catalog's closed category list

Closes PRD-005's Must item "Intent references a `categoryId` when the requested metric is nominal…", left unaddressed by the plan until now regardless of how D2 is written. `metricCategorySchema` (PRD-004 plan, `src/schema/catalog.ts`) already gives each nominal `Metric` a closed `categories: MetricCategory[]` whitelist (`id`, `label`, `order?`, `colorToken?`) — `categoryId` is how an intent selects one of those, instead of a free-text category value a model could invent.

`categoryId?: string` is optional at the schema level (D2) because whether it's *required* depends on the resolved metric's `kind`, which `intentSchema` cannot see — `AnalyticalIntent` only carries `metricId`, a bare string, until `validateIntent` resolves it against the catalog. So the check is domain validation, not shape validation, and lands in `validateIntent` immediately after `metricId` resolves (D4 step 2, as step 2b), before geography/dataset resolution — it depends only on the resolved `Metric`, nothing else:

- Resolved metric's `kind === 'nominal'` and `categoryId` is absent, or present but not found in that metric's `categories[].id` → `unknown-category` (`mismatch`, `repair: [{ kind: 'allowed-values', values: resolvedMetric.categories.map(c => c.id) }]`). Both "missing" and "not-in-list" collapse to one code, the same way `unknown-metric`/`unknown-geography` don't distinguish "empty string" from "wrong id" — the repair (the catalog's actual allowed values) is identical either way, so a second code would add a distinction with no actionable difference.
- Resolved metric's `kind !== 'nominal'` and `categoryId` is present → no check fires; a `categoryId` on a non-nominal request is inert, not an error (mirrors `metricCategorySchema`'s own catalog-side rule only rejecting `categories` on a non-nominal *metric definition* — the intent side doesn't need a symmetrical rejection, since an inert extra field costs nothing and rejecting it would make `categoryId` one more thing a caller has to conditionally omit).

`IntentIssueCode` gains `'unknown-category'` (`mismatch` family, alongside `unknown-metric`/`unknown-geography` — already reflected in D4's union).

## Phases

```mermaid
graph LR
  P1["1 · Intent schema + task vocabulary"] --> P2["2 · Catalog-bound validation"]
  P2 --> P3["3 · Ambiguity handling"]
  P3 --> P4["4 · JSON Schema export + docs"]
```

### Phase 1 — Intent schema and task vocabulary

Implement `ANALYTICAL_TASKS`/`AnalyticalTask` (D2) and the `intentSchema`/`AnalyticalIntent`/`IntentFilter` Zod schema and types (D2) in `src/intent/`, following `src/schema/catalog.ts`'s pattern directly — no separate JSON Schema document is authored. Fixture intents: one per `AnalyticalTask` value, plus one with every optional field populated and one minimal (`analyticalTask`+`metricId`+`geographyId` only).

**Demo:** validating `sampleIntent` with `intentSchema.safeParse` (D1) succeeds for all seven task fixtures; a fixture with an invalid `op` value fails validation.
**Acceptance:** one test per `AnalyticalTask` value confirming it round-trips; a schema/type parity test (same style as PRD-004 plan's Phase 2) confirms `intentSchema`'s `analyticalTask` enum matches `ANALYTICAL_TASKS` exactly; `rationale` and `filters` confirmed optional; public-contract test extended for the new exports.

### Phase 2 — Catalog-bound validation

Implement `validateIntent` steps 1, 1b, 2, 2b, 3, 4 (D4/D6, excluding ambiguity) in `src/intent/validateIntent.ts`, reusing PRD-004 plan's `sampleCatalog` fixture. `IntentResultStatus`/`IntentIssueCode`/`IntentResult` types added alongside, plus `INTENT_SCHEMA_VERSION` and its version-mismatch check (D2).

**Demo:** an intent naming a real metric/geography/dataset from the sample catalog validates; an intent naming a metric not in the catalog returns `{ status: 'mismatch', issues: [{ code: 'unknown-metric', repair: [...] }] }`; a `categoryId` naming a real but non-listed category for a nominal metric returns `{ status: 'mismatch', issues: [{ code: 'unknown-category', repair: [...] }] }`.
**Acceptance:** one fixture and test per new `IntentIssueCode` except `ambiguous-dataset`/`no-joinable-dataset` (Phase 3) — including `unknown-category`'s two triggering paths (`categoryId` absent, `categoryId` present but unlisted) and a fixture confirming a non-nominal metric with an extra `categoryId` still validates (D6's "inert, not an error" case); `datasetId`-supplied and `datasetId`-omitted-but-unambiguous paths both tested; a schema-version-mismatch fixture confirms the `set-value` repair suggests `INTENT_SCHEMA_VERSION`.

### Phase 3 — Ambiguity handling and filter-field grounding

Implement `validateIntent` step 5 (D4's join-selection and ambiguity detection) and step 6 (D4's filter-field grounding, which needs step 5's resolved `datasetId` and therefore lands in the same phase). Extend the sample catalog fixture with a second dataset that joins the same metricId+geographyId pair, to exercise the ambiguous case, and reuse PRD-004 plan's D12 `Dataset.fields[]` (including its one `sensible: true` entry) to exercise grounding and sensitivity rejection.

**Demo:** an intent with no `datasetId`, whose metric+geography joins to exactly one dataset, resolves with that `datasetId` filled in; the same intent against the two-dataset fixture returns `{ status: 'needs-clarification', issues: [{ code: 'ambiguous-dataset', repair: [{ kind: 'allowed-values', values: ['dataset-a', 'dataset-b'] }] }] }`; an intent whose `filters[0].field` names a real but non-catalog column returns `{ status: 'mismatch', issues: [{ code: 'unknown-filter-field', repair: [...] }] }`; the same shape naming the fixture's `sensible: true` field returns `{ status: 'mismatch', issues: [{ code: 'sensitive-filter-field' }] }` with no repair.
**Acceptance:** `no-joinable-dataset` and `ambiguous-dataset` each have a fixture and test; `CatalogResultStatus`'s extension to include `'needs-clarification'` (anticipated in PRD-004's plan D3) is exercised end-to-end here for the first time; `unknown-filter-field` and `sensitive-filter-field` each have a fixture and test; a fixture confirms a `filters[].field` matching `Dataset.columns`/`Spatial.field`/`Temporal.field` (no `fields[]` entry) still grounds successfully, for datasets predating D12.

### Phase 4 — JSON Schema export and docs

Implement `getIntentJSONSchema()` (D5). Update `README.md` with the intent contract's field tables (including `categoryId`, D6), the task vocabulary, `validateIntent` usage examples (valid, mismatch, ambiguous, unknown-category), and a structured-output example matching `ai-integration-readiness.md`'s Pattern 2. Update `coverageThreshold`.

**Demo:** README's structured-output example, copy-pasted, shows a JSON Schema whose `properties.analyticalTask.enum` lists all seven analytical tasks.
**Acceptance:** `pnpm turbo run test --filter=...@ttoss/geovis-catalog` and `pnpm turbo run build --filter=...@ttoss/geovis-catalog` green; coverage threshold updated; `pnpm run -w lint` clean.

## Sequencing notes

This plan cannot start until PRD-004's plan has shipped Phase 2 (`Catalog`/`catalogSchema`) and Phase 3 (`CatalogResult`/`CatalogIssue` taxonomy) — Phase 2 here imports both directly, and reuses the same Zod (`strictObject`/`.meta()`/`.check()`) pattern PRD-004 plan's D14 establishes. Phase 1 (intent schema alone) has no such dependency and could in principle run in parallel with PRD-004's later phases, but is sequenced after for a single implementer to avoid rebasing the fixture catalog mid-flight. Phase 2 depends on Phase 1. Phase 3 depends on Phase 2 (extends the same function). Phase 4 depends on Phase 3. Each phase is one PR.

This plan's outputs (`AnalyticalIntent`, `intentSchema`, `validateIntent`, `IntentResult`, the extended `IntentResultStatus`/`IntentIssueCode`) are what PRD-006's plan resolves into a `VisualizationSpec`.

## Open questions carried forward (not resolved by this plan)

- Whether a future `secondaryMetric` (bivariate) field lands is left for a later PRD revision — D3 only confirms it would be additive, not when or whether it ships.
- The strategy document (`docs/website/docs/product/geovis/strategy.md`) is absent from the repo (see PRD-004 plan's Verification section) — strategy §12's full task-vocabulary rationale is unavailable beyond what PRD-005's own text already states, which this plan used directly.

PRD-005's own two open questions (multi-metric/bivariate, intent-vs-catalog versioning) are resolved by D3 and D2 respectively, not carried forward as unresolved; the `time`-shape question raised during this revision is likewise closed by D2's re-evaluation paragraph (free-form range, no catalog-referenced `periodId`), and the `categoryId` Must item is closed by D6 — none of these reopen a "carried forward" item.

## Verification against current codebase (2026-07-31)

- Depends on `packages/geovis-catalog` existing with `Catalog`, `catalogSchema`, `CatalogResult`, `CatalogIssue`, `CatalogIssueCode`, `validateCatalog` exported
- `zod` (already a dependency of `@ttoss/geovis-catalog` per PRD-004 plan's D14) is reused as-is — this plan adds no new dependency.
- `Dataset.fields[]`/`DatasetField` (PRD-004 plan's D12, `src/schema/catalog.ts`) already ships with a `sensible`/`label` pair enforced by schema — D4's step 6 filter-field grounding consumes it directly, with no new catalog-side work needed.
- `metricCategorySchema`/`Metric.categories[]` (`src/schema/catalog.ts`) confirmed shipped — `id`, `label`, `order?`, `colorToken?`, required non-empty when `Metric.kind === 'nominal'` — D6's `categoryId` grounding consumes it directly, with no new catalog-side work needed.
- `Dataset.temporal` (PRD-004 plan's D10, `src/schema/catalog.ts`) confirmed to carry `extent`, optional `periods[]`, and `temporalGrain` — checked against D2's re-evaluation of `time`'s shape; `periods[]` being optional is exactly why `time` stays a free-form range rather than a `periodId` reference.
- `@ttoss/geovis`'s `ADR-0003` action vocabulary already uses an optional `rationale` field on every semantic action — D2 mirrors that field name/shape for consistency across the AI-facing surface, rather than inventing a differently-named equivalent.
- `packages/geovis/src/spec/types.ts`'s `SPEC_SCHEMA_VERSION` constant plus `validateSpec.checks.ts`'s `validateSchemaVersion` confirm the plain-`number`-plus-separate-check pattern D2 mirrors for `schemaVersion`/`INTENT_SCHEMA_VERSION`.
