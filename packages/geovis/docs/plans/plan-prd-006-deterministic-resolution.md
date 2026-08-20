---
title: Plan · PRD-006 Deterministic Resolution
---

# Implementation Plan: PRD-006 Deterministic Resolution

Source: [PRD-006](../prds/prd-006-deterministic-resolution.md) · Basis: strategy §5.3, §12 (product-hub doc not present in this repo) · Package: `@ttoss/geovis-catalog` (same package as [PRD-004's plan](./plan-prd-004-trusted-catalog.md) and [PRD-005's plan](./plan-prd-005-constrained-intent.md), both of which must land first)

## Durable decisions

### D1 — Zod is the only schema-validation dependency

> **Superseded by PRD-004 plan's D14 (2026-07-30): Zod replaces Ajv as the schema source of truth.** Originally this decision named Ajv as the shared dependency; it now names Zod instead.

This plan authors no new schema (`TaskRule`/`ResolveResult` are plain TypeScript, not an AI-facing input contract). `resolve()` consumes `Catalog` and `AnalyticalIntent`, both already validated by the Zod pattern from PRD-004 plan's D14 and PRD-005 plan's D1. `@ttoss/geovis-catalog` keeps exactly one schema-validation dependency, `zod`, across all three plans.

### D2 — `resolveSpecFromMapType` is not exported from `@ttoss/geovis` today — needs an upstream export, not a deep import

PRD-006 names `resolveSpecFromMapType` as the "encoding seed" this plan must reuse. Checking `@ttoss/geovis/src/index.ts` against `@ttoss/geovis/src/spec/mapTypeDefaults.ts` shows this function is **not** re-exported from the package's public barrel — only `SEQUENTIAL_PALETTES` from that module is. `@ttoss/geovis`'s `package.json` also only declares one export path (`"exports": { ".": "./src/index.ts" }`), so there is no supported deep-import route either (`@ttoss/geovis/dist/spec/mapTypeDefaults` doesn't exist, and reaching into `@ttoss/geovis/src/spec/mapTypeDefaults` directly would bypass the package boundary and its `publicContract.test.ts` guard entirely — the kind of coupling ADR-0002/ADR-0003 exist to prevent one layer up).

This plan therefore has a prerequisite one layer down, in `@ttoss/geovis` itself, before its own Phase 2 can start:

- Add `export { resolveSpecFromMapType } from './spec/mapTypeDefaults';` to `@ttoss/geovis/src/index.ts`.
- Extend `@ttoss/geovis/tests/unit/tests/publicContract.test.ts` with `expect(typeof geovis.resolveSpecFromMapType).toBe('function');`, per that package's own CLAUDE.md instruction ("update it deliberately when adding/removing exports").
- This is a small, additive, non-breaking change to `@ttoss/geovis` (new export, nothing removed) — no version-bump or ADR is needed by that package's own bar ("write an ADR only when a reasonable alternative was rejected and the chosen path has a visible cost"; exporting an already-stable internal function has neither).

Framed as a choice, the viable options were: (a) request/land this export in `@ttoss/geovis` first (chosen — keeps `@ttoss/geovis-catalog` on the supported public surface, consistent with how it already consumes `RepairOption`/`VisualizationSpec`/`MapDataRow`); (b) re-implement equivalent choropleth/dotDensity/proportionalCircles resolution logic inside `@ttoss/geovis-catalog` (rejected — duplicates and will drift from the real implementation, exactly the "two owners for one state" problem workspace ADR-0001 already named as a defect elsewhere in this product); (c) deep-import the internal module path (rejected — not exposed by `package.json#exports`, so it would only work by accident of the local-dev `src`-resolution convention and would break the moment `@ttoss/geovis` publishes `dist`-only consumption).

### D3 — `resolve()` needs a fourth input the PRD's own signature omits: the data itself

PRD-006's Outcome states `resolve(intent, catalog)` returns "a renderable spec" — but PRD-004 explicitly excludes runtime data fetching from the catalog ("Won't: … runtime data fetching"), and `resolveSpecFromMapType` (D2) only fills layers/legends from a `VisualizationSpec` whose `mapData[].data` **already holds real feature values** — it never fetches anything itself. Two deterministic functions cannot conjure data neither of them is allowed to fetch. This is the one gap in the PRD's own text that must be closed before this plan is buildable, and the fix is additive to the signature, not a redesign:

```ts
export const resolve = (
  intent: AnalyticalIntent,
  catalog: Catalog,
  data: MapDataRow[] // caller-supplied rows for the resolved dataset+metric+geography; @ttoss/geovis's existing MapDataRow shape, reused as-is
): ResolveResult => {
  /* ... */
};
```

The application remains the sole owner of data access (matching the strategy's "model never sees raw data" principle one level further: the _resolver_ doesn't see raw data either, until the caller who already has read access hands over exactly the rows the resolved intent asked for). `resolve()` stays a pure function: same `(intent, catalog, data)` in, same `ResolveResult` out, no I/O — which is what "deterministic" in the PRD's title actually requires; a version that fetched data itself could not make that claim.

### D4 — Task → map-type/legend/warning rules, encoded as a lookup table

PRD-006's Must item requires each analytical task to have "expected metric kind, geography, map type, legend, and warnings" and to be "encoded and testable" — PRD-005's seven when that item was written, nine after D9. A plain data table (not a class hierarchy — there is no per-task behavior beyond these fields) keeps the rules inspectable and matches the flat, declarative style `@ttoss/geovis`'s own `mapTypeDefaults/*.ts` modules already use:

```ts
interface TaskRule {
  task: AnalyticalTask;
  allowedMetricKinds: MetricKind[];
  /** Ordered preference, not a constant — the resolver picks the first entry the resolved geography's geometry supports (D9). */
  mapTypePreference: Array<'choropleth' | 'dotDensity' | 'proportionalCircles'>;
  legendHint: 'quantitative' | 'categorical' | 'proportional';
  warnOn: Array<'sparse-data' | 'missing-temporal-range' | 'small-sample'>;
  /** Only `normalized-comparison` sets this — see D9's denominator rule. */
  requiresDenominator?: boolean;
}
```

The full table, specified now rather than left to implementation time. Each value is traceable to a constraint already in `@ttoss/geovis-catalog`'s `metricKindSchema` (`'count' | 'rate' | 'ratio' | 'index' | 'density' | 'distance' | 'nominal'`), to `@ttoss/geovis`'s own `mapTypeDefaults/*.ts` (D2), or to a shape observed in a real production catalogue (D9). Nine tasks: PRD-005's original seven plus `composition` and `normalized-comparison`, both added by D9 on the evidence of that catalogue:

| Task                    | `mapTypePreference`                 | `legendHint`   | `allowedMetricKinds`                                     | `warnOn`                      |
| ----------------------- | ----------------------------------- | -------------- | -------------------------------------------------------- | ----------------------------- |
| `distribution`          | `choropleth`, `proportionalCircles` | `quantitative` | `count`, `rate`, `ratio`, `index`, `density`, `distance` | `sparse-data`                 |
| `comparison`            | `choropleth`, `proportionalCircles` | `quantitative` | `count`, `rate`, `ratio`, `index`, `density`, `distance` | `small-sample`                |
| `ranking`               | `proportionalCircles`, `choropleth` | `proportional` | `count`, `rate`, `ratio`, `index`, `density`, `distance` | `small-sample`                |
| `change-over-time`      | `choropleth`, `proportionalCircles` | `quantitative` | `count`, `rate`, `ratio`, `index`, `density`, `distance` | `missing-temporal-range`      |
| `outlier-detection`     | `choropleth`, `proportionalCircles` | `quantitative` | `count`, `rate`, `ratio`, `index`, `density`, `distance` | `small-sample`                |
| `feature-lookup`        | `dotDensity`, `choropleth`          | `categorical`  | `nominal`, `count`                                       | _(none)_                      |
| `coverage`              | `choropleth`, `dotDensity`          | `categorical`  | `nominal`, `count`                                       | `sparse-data`                 |
| `composition`           | `choropleth`, `dotDensity`          | `categorical`  | `nominal`                                                | `sparse-data`                 |
| `normalized-comparison` | `choropleth`, `proportionalCircles` | `quantitative` | `count`                                                  | `small-sample`, `sparse-data` |

```ts
const CONTINUOUS_KINDS: MetricKind[] = [
  'count',
  'rate',
  'ratio',
  'index',
  'density',
  'distance',
];

export const TASK_RULES: Record<AnalyticalTask, TaskRule> = {
  distribution: {
    task: 'distribution',
    mapTypePreference: ['choropleth', 'proportionalCircles'],
    legendHint: 'quantitative',
    allowedMetricKinds: CONTINUOUS_KINDS,
    warnOn: ['sparse-data'],
  },
  comparison: {
    task: 'comparison',
    mapTypePreference: ['choropleth', 'proportionalCircles'],
    legendHint: 'quantitative',
    allowedMetricKinds: CONTINUOUS_KINDS,
    warnOn: ['small-sample'],
  },
  ranking: {
    task: 'ranking',
    mapTypePreference: ['proportionalCircles', 'choropleth'],
    legendHint: 'proportional',
    allowedMetricKinds: CONTINUOUS_KINDS,
    warnOn: ['small-sample'],
  },
  'change-over-time': {
    task: 'change-over-time',
    mapTypePreference: ['choropleth', 'proportionalCircles'],
    legendHint: 'quantitative',
    allowedMetricKinds: CONTINUOUS_KINDS,
    warnOn: ['missing-temporal-range'],
  },
  'outlier-detection': {
    task: 'outlier-detection',
    mapTypePreference: ['choropleth', 'proportionalCircles'],
    legendHint: 'quantitative',
    allowedMetricKinds: CONTINUOUS_KINDS,
    warnOn: ['small-sample'],
  },
  'feature-lookup': {
    task: 'feature-lookup',
    mapTypePreference: ['dotDensity', 'choropleth'],
    legendHint: 'categorical',
    allowedMetricKinds: ['nominal', 'count'],
    warnOn: [],
  },
  coverage: {
    task: 'coverage',
    mapTypePreference: ['choropleth', 'dotDensity'],
    legendHint: 'categorical',
    allowedMetricKinds: ['nominal', 'count'],
    warnOn: ['sparse-data'],
  },
  composition: {
    task: 'composition',
    mapTypePreference: ['choropleth', 'dotDensity'],
    legendHint: 'categorical',
    allowedMetricKinds: ['nominal'],
    warnOn: ['sparse-data'],
  },
  'normalized-comparison': {
    task: 'normalized-comparison',
    mapTypePreference: ['choropleth', 'proportionalCircles'],
    legendHint: 'quantitative',
    allowedMetricKinds: ['count'],
    warnOn: ['small-sample', 'sparse-data'],
    requiresDenominator: true,
  },
};
```

The reasoning behind each column, grouped by why tasks land together rather than repeated per row:

- **`allowedMetricKinds` splits into two groups, and the split is what `legendHint` follows.** `distribution`/`comparison`/`ranking`/`change-over-time`/`outlier-detection`/`normalized-comparison` all need a magnitude to encode — as a Jenks-threshold color scale (`choropleth`, via `buildChoropleth`'s `isNumeric` branch) or as circle size (`proportionalCircles`'s `buildColorBy`/`sizeBy`, sqrt-area) — so they exclude `'nominal'` (a category has no magnitude to threshold or size by) and take `quantitative`/`proportional` legends. `feature-lookup`/`coverage`/`composition` are the opposite: they ask "what/where", not "how much", so `'nominal'` is the natural kind and the legend is `categorical`. `feature-lookup`/`coverage` also admit `'count'` (how many of this feature; whether this area has any at all), while `composition` is `'nominal'`-only — a composition _is_ the category breakdown, so a numeric metric would make the task meaningless rather than merely unusual. `normalized-comparison` is the tightest of all at `['count']`: it divides a numerator by a denominator, and only a count divided by a count yields an interpretable rate (dividing an already-normalized `rate`/`index` by anything is a modelling error the resolver should refuse, not render).
- **`mapTypePreference` is an ordered list, not a constant, because the same task legitimately resolves to different map types depending on the resolved geography's geometry** — the finding D9 draws from the real catalogue. `choropleth` resolves a polygon layer (`buildChoropleth`, `geometry: 'polygon'`) with a quantitative _or_ categorical color legend; that categorical branch is exactly what a `composition`/`coverage` task over polygon geography needs, and hard-coding those tasks to `dotDensity` (as this table's first revision did) would have made every polygon-geography categorical map unreachable. `dotDensity` (point layer, `resolveDotDensity`) is the same tasks' answer when the geography's grain _is_ the individual located feature. `ranking` leads with `proportionalCircles` because ranking is about relative magnitude _between_ features and circle size (`PROPORTIONAL_CIRCLES_DEFAULTS`, sqrt-area) is the encoding `@ttoss/geovis` already builds for that — burying a ranking signal in a color scale reads worse — but it falls back to `choropleth` when the geography has no point representation. Order is a tie-break only: entries whose geometry the resolved geography can't satisfy are filtered out first (D9), so a single-viable-option task never depends on the ordering at all.
- **`legendHint` is `mapTypePreference`'s legend counterpart, not an independent choice.** It stays fixed per task even though `mapTypePreference` varies, because the _semantic_ legend shape is a property of the question, not of the geometry that happens to answer it: a `composition` map is categorical whether it renders as a categorical choropleth or as colored dots. Note `resolveDotDensity` currently returns no legend at all — `legendHint` documents the shape the resolver must construct during Phase 2's `VisualizationSpec` assembly, not something `resolveDotDensity` produces on its own.
- **`warnOn` follows each task's specific failure mode, not a shared default.** `change-over-time` is the one task whose data literally has a missing dimension without a declared `Temporal.extent`/`periods[]` (PRD-004 plan D10) — hence `missing-temporal-range`, unique to it (and escalating to a hard failure under D9's `insufficient-temporal-coverage` rule when fewer than two periods exist). `ranking`/`comparison`/`outlier-detection` all become misleading with too few features (a ranking of 2 items, an outlier flagged among 3 points) — hence `small-sample`. `distribution`/`coverage`/`composition` become misleading the opposite way, when most of the _geography_ has no matching data at all (a distribution map that's 95% "no data" isn't showing a distribution) — hence `sparse-data`. `normalized-comparison` is the only task carrying both, because a rate fails in both directions at once: a tiny denominator manufactures extreme values (one kitchen in a 200-person municipality reads as 500 per 100k) and a missing denominator silently drops the area from the map entirely. `feature-lookup` gets no `warnOn`: a lookup returning few or even one result is the expected, correct outcome of a targeted query, not a data-quality problem to flag.

Checks that apply to _every_ task regardless of its rule — geometry-driven map-type filtering, grain mismatch, partial spatial extent — are deliberately **not** `warnOn` entries; they belong to the resolver itself and are specified in D9. Putting them in the table would have meant repeating the same tag on all nine rows, which is a default masquerading as a rule.

`TASK_RULES` is indexed by PRD-005 plan's `AnalyticalTask` union (backed by that plan's `ANALYTICAL_TASKS` const array), so a completeness test can iterate it directly. The specific `small-sample`/`sparse-data` _thresholds_ (how few is "too few") stay a Phase-3 implementation-time judgment call reviewed against the fixture catalog (Open questions) — this table fixes which warning applies to which task, not the numeric cutoff that trips it.

### D5 — Extension points: a registry, not a fork

Resolves PRD-006's first open question. `TASK_RULES` (D4) is the built-in, closed core; applications adjust it through a call-scoped config object rather than by forking the resolver:

```ts
export const resolve = (
  intent: AnalyticalIntent,
  catalog: Catalog,
  data: MapDataRow[],
  options?: {
    extraTaskRules?: Partial<Record<AnalyticalTask, TaskRule>>;
    /** Subset of the vocabulary this application accepts; an intent naming a task outside it fails with `unsupported-task`. */
    supportedTasks?: AnalyticalTask[];
  }
): ResolveResult => {
  /* both options apply to this call only — no global mutable registry, so concurrent resolve() calls with different options never interfere */
};
```

Extension has exactly three levels, and the boundary between them is deliberate. The worked examples below use the real `cozsolidarias` catalogue from D9, since abstract examples hide which level a given need actually falls into.

**Level 1 — override a built-in rule's values (`extraTaskRules`; no schema change, no coordination).** The whole `TaskRule` shape is overridable per task, per call. The most common real need is a different map-type preference: this app's `coverage` view is municipality-level, so it wants `choropleth` first even where a point representation also exists, and it prefers proportional circles for `distribution` when the geography is its kitchen grain:

```ts
const result = resolve(intent, catalog, rows, {
  extraTaskRules: {
    coverage: {
      ...TASK_RULES.coverage,
      mapTypePreference: ['choropleth'], // never fall back to dots for this app
    },
    distribution: {
      ...TASK_RULES.distribution,
      warnOn: ['sparse-data', 'small-sample'], // this catalogue has many low-count municipalities
    },
  },
});
```

Spreading the built-in entry (`...TASK_RULES.coverage`) rather than authoring a `TaskRule` from scratch is the intended idiom: a new required field added to `TaskRule` later then reaches every consumer's override automatically instead of breaking it. Overriding `allowedMetricKinds` to _widen_ it is allowed but is the one override with a real failure mode — adding `'nominal'` to `ranking` produces a size encoding over categories, which renders but means nothing; `README.md` says so at the call site (Phase 5).

**Level 2 — narrow the vocabulary (`supportedTasks`; no schema change).** An application that implements three of the nine tasks should reject the other six loudly instead of resolving maps it cannot present. Passing `supportedTasks` makes that a structured failure with a repair listing what _is_ supported, which is directly usable as the clarification prompt a model sees next:

```ts
resolve(intent, catalog, rows, {
  supportedTasks: ['distribution', 'normalized-comparison', 'composition'],
});
// intent.analyticalTask === 'ranking' →
// { status: 'mismatch', issues: [{ code: 'unsupported-task',
//     repair: [{ kind: 'allowed-values', values: ['distribution', 'normalized-comparison', 'composition'] }] }] }
```

This is narrowing, never widening, which is why it needs no schema change: every value in `supportedTasks` is already a member of `ANALYTICAL_TASKS`, so the closed vocabulary the whole strategy rests on stays closed. `unsupported-task` joins D9's `ResolveIssueCode` union.

**Level 3 — add a genuinely new task (a coordinated change across two plans, on purpose).** `extraTaskRules` is typed `Partial<Record<AnalyticalTask, TaskRule>>`, so it cannot introduce a task outside the union — and that restriction is the feature, not a limitation to work around. PRD-005's premise is that a model may only emit values the intent schema declares; a registry accepting arbitrary task strings would let an application reopen the vocabulary at runtime, at which point `getIntentJSONSchema()` no longer describes what `resolve()` accepts and the structured-output guarantee is gone. Adding a task is therefore three edits, in this order:

1. Append it to `ANALYTICAL_TASKS` in PRD-005 plan's D2 — this is what widens `AnalyticalTask`, the intent schema, and the derived JSON Schema together, so a model can legitimately emit it.
2. Add its `TASK_RULES` row here (D4), with a fixture per row per Phase 1's completeness test.
3. If it needs intent data no field carries yet, add that field in PRD-005's D2 as well — `normalized-comparison`'s `denominatorMetricId` (D9) is the worked example of exactly this, and of why the field belongs to the intent contract rather than to `options`.

`composition` and `normalized-comparison` (D9) went through these three steps rather than around them, which is the practical argument that the path is workable rather than a formality: two tasks that a real catalogue demanded were added without loosening the vocabulary for anyone. An application that cannot take that path — because it needs a task nobody else should see — is describing per-application business logic, which PRD-006's own Won't item assigns to the caller: compose the map from `resolveValidated`'s output (D8) plus its own `SpecPatch` calls, rather than teaching the shared resolver a private rule.

### D6 — Client vs. server execution

Resolves PRD-006's second open question. `resolve()` (D3) takes `data: MapDataRow[]` as a plain argument and does no I/O of its own — it is equally valid to call from a server (with `data` fetched from a warehouse) or a browser (with `data` already in memory), and large-catalog scaling is a `Catalog`-introspection concern PRD-004 already owns (paginating/filtering `getCatalogIntrospection`'s output), not something the resolver needs to special-case. No decision is needed beyond confirming the function stays side-effect-free — which D3 already establishes.

### D7 — Result shape and resolution trace

```ts
export type ResolveResultStatus = IntentResultStatus | 'insufficient-data';
// 'insufficient-data' is the one CatalogResultStatus-family member neither
// PRD-004 nor PRD-005's plans needed — it belongs here: a join and intent can
// be fully valid and still produce zero usable rows once `data` is filtered.
// The issue *codes* this layer adds are `ResolveIssueCode` (D9) — status
// categories and codes grow on independent axes, exactly as PRD-004's plan
// established for `CatalogResultStatus`/`CatalogIssueCode`.

export interface ResolutionTraceEntry {
  decision: string; // e.g. 'mapType', 'legend', 'joinedDataset'
  choice: string;
  reason: string;
}

export type ResolveResult =
  | {
      status: 'resolved';
      spec: VisualizationSpec;
      warnings: CatalogIssue[];
      trace: ResolutionTraceEntry[]; // Should item — see below for how this reaches the explain mode
    }
  | { status: ResolveResultStatus; issues: CatalogIssue[] };
```

The first revision of this plan attached `trace` under `spec.metadata`, claiming that fed "the explain mode (ADR-0004's context packet)". That claim doesn't hold up: `buildContextPacket()` in `packages/geovis/src/runtime/contextPacket.ts` derives `ContextPacket` from `spec.mapType`, `spec.sources`, `spec.layers`, `spec.legends`, and `spec.viewPresets` only — it never reads `spec.metadata`, so a `metadata.trace` field would sit there unread, not "feed" anything. Worse, `spec.metadata` (`Record<string, unknown>`) is not truly free-form scratch space either: `GeoVisProvider.checkPolicies` already reads specific reserved keys off it (`isPolicyInvalid`, `invalidReason`, `metricField`, `normalizedField`, …) for the cartography-policy feature, so adding another ad hoc key there recreates the same grab-bag-record pattern instead of using a real, typed channel.

`ContextPacket`'s own docstring says it "grows one field per PRD-002 phase" — but that growth happens inside `@ttoss/geovis`, and `@ttoss/geovis-catalog` depends on `@ttoss/geovis`, never the reverse; `buildContextPacket()` cannot know about a `@ttoss/geovis-catalog` type like `ResolutionTraceEntry` without an inverted, circular package dependency. So `trace` cannot literally live inside `ContextPacket` either, without an upstream `@ttoss/geovis` change this plan has no product mandate to request (unlike D2's `resolveSpecFromMapType` export, which PRD-006 explicitly names as a reuse target).

The fix: `trace` stays exactly where D3 already puts it — a field on `resolve()`'s own `ResolveResult`, nothing more — and this plan does not touch `VisualizationSpec`, `spec.metadata`, or `ContextPacket` at all. The application is the one that already holds both artifacts after generation (it called `resolve()` to get `ResolveResult`, then mounts `result.spec` and calls `runtime.getContextPacket()` for the same turn) and is the correct, and only, place to combine them for whatever it sends the model — e.g. `{ ...packet, resolutionTrace: result.trace }` — exactly the kind of per-application composition PRD-006's own Won't item ("per-application business rules") reserves to the caller, not the package. No new type is recreated to carry this composition; it is documentation guidance, not package surface.

### D8 — `validateIntent` + `resolve()`: the failure-union duplication is real, and administrable as planned

D7's `ResolveResultStatus = IntentResultStatus | 'insufficient-data'` means `ResolveResult`'s failure branch (`{ status: ResolveResultStatus; issues: CatalogIssue[] }`) has to carry every status `IntentResult` can already produce (`invalid`, `mismatch`, `needs-clarification`), because Phase 2's `resolve()` calls `validateIntent` internally and passes its failure straight through. A caller who already validated the intent — got `{ status: 'valid', ... }` back from its own `validateIntent` call, then calls `resolve()` on that same intent — still has to handle `invalid`/`mismatch`/`needs-clarification` at the `ResolveResult` call site, even though, on that call path, `resolve()`'s internal re-validation of an already-valid intent cannot produce them (the same intent, same catalog, same `validateIntent` — a pure function called twice on identical input gives identical output). That's real type noise, not a false alarm: TypeScript has no way to encode "this branch is unreachable _on this call path_" — the discriminated union has to stay wide enough for the general case (an intent nobody validated yet), so every `switch` over `ResolveResult.status` needs a case for statuses that, for the pre-validated caller, are dead code they're still required to write.

The union itself is not the defect — a discriminated union over "resolved | every way this can fail" is the correct shape for `resolve()`'s _general_ contract (intent unknown/unvalidated is exactly its most common real call pattern: one function, raw intent in, resolved spec or a structured reason out). The defect is that there is no _narrower_ contract for the caller who has already paid for validation and would like a smaller union back. Two ways to close that gap, in increasing order of cost:

- **Simpler (recommended for this plan): a second, narrower `resolve()` entry point that accepts the validated result, not just the raw intent.** Add an overload (or an exported `resolveValidated`) typed to accept only `Extract<IntentResult, { status: 'valid' }>`:

  ```ts
  export const resolveValidated = (
    validIntent: Extract<IntentResult, { status: 'valid' }>,
    catalog: Catalog,
    data: MapDataRow[],
    options?: ResolveOptions // same shape as resolve()'s, D5
  ):
    | {
        status: 'resolved';
        spec: VisualizationSpec;
        warnings: CatalogIssue[];
        trace: ResolutionTraceEntry[];
      }
    | { status: 'mismatch'; issues: CatalogIssue[] } // D9's task-independent checks + D5's `unsupported-task`
    | { status: 'insufficient-data'; issues: CatalogIssue[] } => {
    /* ... */
  };
  ```

  Because the input type statically rules out an invalid intent, the _return_ type can drop `IntentResultStatus`'s `invalid`/`needs-clarification` members entirely — `resolveValidated`'s failures are only ever this layer's own: `'insufficient-data'` (D7) and the `'mismatch'` carrying D9's task-independent checks. A caller who already validated gets a smaller union for free, with no runtime behavior change: `resolveValidated` is `resolve` minus the internal `validateIntent` call (which the type system now guarantees is redundant) plus the same task-rule lookup, spec assembly, and `resolveSpecFromMapType` call. `resolve(intent, catalog, data)` (the existing, wider signature) stays as the one-call convenience path for the common case of an unvalidated intent, calling `resolveValidated` internally once its own `validateIntent` step succeeds — so there is exactly one resolution implementation, not two. Low cost: one small additive export, no change to `ResolveResult`'s existing shape, nothing to migrate for existing callers of `resolve()`.

- **More scalable, not adopted now: nest the sub-result instead of flattening its variants.** Rather than spreading `IntentResultStatus`'s members into `ResolveResultStatus`, wrap the whole failing `IntentResult` as one payload under a single top-level tag:

  ```ts
  export type ResolveResult =
    | {
        status: 'resolved';
        spec: VisualizationSpec;
        warnings: CatalogIssue[];
        trace: ResolutionTraceEntry[];
      }
    | {
        status: 'invalid-intent';
        intentResult: Exclude<IntentResult, { status: 'valid' }>;
      }
    | { status: 'insufficient-data'; issues: CatalogIssue[] };
  ```

  A consumer's exhaustive `switch` over `ResolveResult.status` now has exactly three cases, permanently — a fourth `IntentResultStatus` member added to PRD-005's plan later (the taxonomy is explicitly "additive" per D4 of that plan) never touches this file or any of its consumers again; only code that actually inspects `intentResult.status` needs updating, and that's PRD-005's own concern to expose consistently. The cost is one extra level of nesting for whoever _does_ want the specific reason (`result.intentResult.issues` instead of today's flat `result.issues`), and it's a breaking change to the shape D7 already documents — existing fixtures/tests written against the flat union move to the nested one. This is the shape to move to if/when more packages start consuming `ResolveResult` and re-deriving "is this actually an intent problem" logic independently (the flattened union invites exactly that duplication once there's more than one consumer); it is not adopted in this revision because nothing in this plan's Phases 2–5 yet has more than the one caller pattern D7 already covers, and the migration cost isn't justified pre-emptively.

Phase 2 implements the recommended (simpler) option: `resolveValidated` ships alongside `resolve()`, not instead of it.

### D9 — Task set and resolver checks grounded in a real production catalogue

D4's first revision picked its task rules from PRD-005's vocabulary alone. Checking them against a real, shipped data dictionary — `cozsolidarias`' `public/dataset_catalogue.json` (`schema_version: 2.0.0`, 11 datasets, the artifact PRD-004 plan's D8 names as one of the two that share the dimension contract) — surfaced one defect, two missing tasks, and three checks the catalogue makes computable. The evidence, then what follows from it:

| What the real catalogue contains           | Count                                                                                                                                               |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spatial.geometry` values in use           | `none` ×6, `multipolygon` ×3, `point` ×2 — **no plain `polygon` at all**                                                                            |
| `spatial.grain.code` values in use         | `municipality` ×5, `rural_property` ×2, `settlement` ×2, `kitchen` ×1, `state` ×1                                                                   |
| `temporal.status`                          | `unknown` ×3, `not_applicable` ×3, `described` ×5 — and **every** `described` one has exactly **one** interval                                      |
| Datasets named in prose as a _denominator_ | 2 (`municipios_populacao` "denominador da taxa de cozinhas por 100 mil habitantes"; `municipios_cadunico` "denominador das variantes de cobertura") |
| Fields flagged `sensitive: true`           | 8 of 29 on `cozinhas_geolocalizadas`, including `Latitude`/`Longitude`, which also carry `role: 'geometry'`                                         |
| Declared `spatial.extent` scopes           | `BR` for 9 datasets; `BR-SP`/`BR-MG`/`BR-RJ`/`BR-ES` for the 2 `assentamentos` ones                                                                 |

**1. `mapType` cannot be a constant per task — and `multipolygon` breaks the map-type gate outright.** All three polygon datasets declare `spatial.geometry: 'multipolygon'`, but `mapTypeCatalogEntrySchema.supportedGeometries` is typed `geometrySchema` = `'point' | 'polygon' | 'line'`, with no `multipolygon` member — while `spatialGeometrySchema` (what `Dataset.spatial.spatialGeometry` uses) _does_ have one. PRD-006's Must item "intersect the catalog's `mapTypes` (data adequacy) with the adapter's `CapabilitySet`" therefore rejects **every polygon dataset in this catalogue** as unsupported, since `'multipolygon'` can never appear in a `supportedGeometries` array. Two fixes exist; this plan takes the narrower one: the resolver **normalizes `'multipolygon'` → `'polygon'` before the intersection**, a one-line mapping in `src/resolve/geometry.ts` with an exhaustive test, treating the two as one renderable class (which they are — MapLibre fills both through the same layer type). Widening `geometrySchema` to include `'multipolygon'` was rejected: it would force every existing and future `MapTypeCatalogEntry` author to declare both members for what is a single rendering capability, and `'none'` (6 of 11 datasets) would still need special handling anyway. Separately, the geometry the resolver reads is the **resolved geography's**, never the metric's own dataset's: 6 of 11 datasets are `geometry: 'none'` attribute sidecars (`municipios_ivs`, `municipios_populacao`, …) that join to a geometry dataset — reading geometry off the metric's dataset would classify the single most common real shape as unmappable. A `mapTypePreference` entry whose (normalized) geometry the resolved geography cannot satisfy is filtered out; an empty result after filtering is `unsupported-map-type-geometry`, a code PRD-004 plan's taxonomy already defines, so no new code is needed for it.

**2. Two tasks are missing from PRD-005's seven, both load-bearing in the real catalogue.** `composition` — the categorical breakdown across a geography — is what `assentamentos_atributos.status` (`AT`/`CA`/`PE`), `cozinhas_geolocalizadas."Público Atendido"` and `caf_areas.ds_condicao_dominio` (proprietário/comodatário/posseiro) all express, and none of PRD-005's seven cover it: `feature-lookup` answers "which one is this", `coverage` answers "is there any here", but neither answers "what is the mix". `normalized-comparison` — a count over a declared denominator — is the catalogue's most explicit signal of all: two of its eleven datasets exist _only_ to serve as denominators, named as such in their own descriptions, and the app's headline view (kitchens per 100k inhabitants) is unrepresentable without it. Both are additive to `ANALYTICAL_TASKS` in PRD-005's plan (that plan's D2 vocabulary grows from seven to nine entries) and get the D4 rows above. `normalized-comparison` also needs an intent field PRD-005 doesn't have yet — `denominatorMetricId?: string`, grounded against `Catalog.metrics[].id` exactly like `metricId`, and required (`missing-denominator`) when `TASK_RULES[task].requiresDenominator` is set. That is a PRD-005-plan schema change this plan depends on, recorded here and in that plan's D2 rather than smuggled in as a resolver-local concept.

Deliberately **not** added, despite the catalogue inviting them: a `correlation` task (kitchens against `municipios_ivs`' 12 index columns is the obvious next question, and `@ttoss/geovis` already renders bivariate maps via `MapData.dimension: 'color' | 'size'`) and a `co-location` task (the app's real "Assentamentos e cozinhas" overlay mode). Both need two visual encodings from two datasets in one map, which PRD-005's plan D3 explicitly cut from v1's single-metric intent. Adding them here would silently reintroduce the bivariate scope that decision closed. `normalized-comparison` is _not_ a smuggled bivariate task: a rate is one number per feature and one legend, so it stays inside D3's single-metric-output boundary even though it reads two metric ids.

**3. Three resolver checks the catalogue makes computable, all task-independent.** Each emits a `CatalogIssue` with a new code, so this plan extends the taxonomy the same additive way its predecessors did:

```ts
export type ResolveIssueCode =
  | IntentIssueCode // PRD-005 plan D4
  | 'grain-mismatch'
  | 'partial-spatial-extent'
  | 'insufficient-temporal-coverage'
  | 'missing-denominator';
```

- **`grain-mismatch` (failure, not a warning).** Five distinct `spatial.grain.code` values across eleven datasets means a grain mismatch is the norm, not the exception: `caf_producao` is grained at `rural_property` **and carries multiple rows per `nr_caf`** (its own description says "cada imóvel pode ter múltiplas linhas, uma por produto"), so a municipality-grained map fed those rows sums the same property once per product and silently reports inflated income. Comparing the resolved dataset's `Spatial.spatialGrain` against the resolved `Geography` catches this before any row is read. It is a failure rather than a warning precisely because the wrong answer is plausible-looking — a warning next to a confidently-wrong choropleth is worse than no map. Aggregation is the caller's job (PRD-006's own Won't reserves per-application business rules), so the repair is "pre-aggregate to the requested grain and call again", not something `resolve()` performs.
- **`partial-spatial-extent` (warning).** `assentamentos` declares `BR-SP`/`BR-MG`/`BR-RJ`/`BR-ES` while every other dataset declares `BR`, so an intent asking for national geography against it renders 23 states of "no data" that are not missing data at all — they are outside the dataset's declared reach. This is distinct from `sparse-data` (values genuinely absent within covered territory) and is knowable from the catalogue alone. Blocked today by a schema gap: `codedRefSchema` is `{ code, label? }` with **no `scheme`**, while the real artifact writes `{ scheme: 'iso3166-1', code: 'BR' }` and `{ scheme: 'iso3166-2', code: 'BR-SP' }` — without `scheme` the check cannot tell a country code from a subdivision code, so it cannot decide containment. Adding `scheme` to `codedRefSchema` (matching `spatialGrainSchema`, which already has one) is a small additive PRD-004-side change this check needs; until it lands, the check degrades to exact-code equality and stays silent rather than guessing.
- **`insufficient-temporal-coverage` (failure).** Not one dataset in this catalogue could answer a `change-over-time` intent: three are `temporal.status: 'unknown'`, three `not_applicable`, and all five `described` ones carry exactly one interval (a 2022 census snapshot, a 2010 IVS snapshot, a single 2026-06 month). `change-over-time` needs at least two comparable periods, so `missing-temporal-range` (D4's soft `warnOn` tag) is the right signal for a _thin_ temporal declaration but the wrong one for this: a change map built from one period is not a degraded change map, it is a different map wearing the wrong label. Fewer than two resolvable periods for a `change-over-time` intent is therefore a failure with `repair: [{ kind: 'allowed-values', values: <tasks satisfiable with one period> }]`.

**One thing the catalogue confirms rather than changes:** its 8 `sensitive: true` fields include `Latitude`/`Longitude`, which also carry `role: 'geometry'`. PRD-005 plan's D4 step 6 blocks `sensitive` fields from `IntentFilter.field` while the resolver still reads geometry from those same columns to place points — and that is correct, not contradictory: filtering _by_ a sensitive column exposes individuals (a filter on `Endereço` is a search for a person's address), whereas rendering an aggregate point layer from coordinates is the map's whole purpose. The two concerns stay separate, and no change follows.

## Phases

```mermaid
graph LR
  P0["0 · Upstream: export resolveSpecFromMapType"] --> P1["1 · Task rule table + geometry gate"]
  P1 --> P2["2 · Deterministic resolve()"]
  P2 --> P3["3 · Warnings, catalogue checks, insufficient-data"]
  P3 --> P4["4 · Resolution trace"]
  P4 --> P5["5 · Extension points + docs"]
```

### Phase 0 — Upstream: export `resolveSpecFromMapType` from `@ttoss/geovis`

Land D2 in `@ttoss/geovis`: add the barrel export, extend `publicContract.test.ts`. This is a `@ttoss/geovis` change, not a `@ttoss/geovis-catalog` change, and is its own PR against that package following its own workflow (`pnpm run test`, `pnpm turbo run test --filter=...@ttoss/geovis`, `pnpm turbo run build --filter=...@ttoss/geovis`, coverage threshold, README) before this plan's Phase 2 can depend on it.

**Demo:** `import { resolveSpecFromMapType } from '@ttoss/geovis'` compiles and resolves at runtime from an external package.
**Acceptance:** `publicContract.test.ts` asserts the new export; no other `@ttoss/geovis` behavior changes; `@ttoss/geovis`'s own test/build/coverage workflow stays green.

### Phase 1 — Task rule table and the geometry gate

Implement `TaskRule`/`TASK_RULES` (D4) in `src/resolve/taskRules.ts` with the table's nine entries verbatim — D4 fixes the values, this phase is transcription plus fixture verification, not a design decision. Also implement D9's geometry normalization (`'multipolygon'` → `'polygon'`) and the `mapTypePreference` filter in `src/resolve/geometry.ts`, since every later phase's map-type choice depends on it. Extend PRD-004 plan's `sampleCatalog` fixture with the two shapes the real catalogue proved are the common case and the fixture didn't cover: a `multipolygon` geography, and a `geometry: 'none'` attribute-only dataset joining to it.

**Demo:** `TASK_RULES.ranking.mapTypePreference[0] === 'proportionalCircles'`; `TASK_RULES['feature-lookup'].warnOn` is `[]`; `TASK_RULES.composition.allowedMetricKinds` is `['nominal']`; a table-completeness test iterates `ANALYTICAL_TASKS` (PRD-005 plan D2) and asserts every one of the nine values has an entry; a `composition` intent over the fixture's `multipolygon` geography resolves `mapType: 'choropleth'` while the same task over a `point` geography resolves `'dotDensity'`.
**Acceptance:** one test per task confirming its rule's `mapTypePreference`/`legendHint`/`allowedMetricKinds` match D4's table exactly, and that every `mapTypePreference` member and `legendHint` is one of `@ttoss/geovis`'s valid enum values (compile-time via shared types, runtime via a fixture-backed test); a fixture per task confirms every metric kind in `allowedMetricKinds` resolves against at least one sample-catalog metric of that kind (`nominal`-allowing tasks against the fixture's nominal metric, PRD-005 plan D6); an exhaustive test over `spatialGeometrySchema`'s five members pins the normalization mapping, including that `'none'` never satisfies any `mapTypePreference` entry; a geography whose geometry satisfies no preference entry yields `unsupported-map-type-geometry`.

### Phase 2 — Deterministic `resolve()`, happy path

Implement `resolveValidated(validIntent, catalog, data, options?)` (D8) in `src/resolve/resolve.ts` as the actual resolution logic: looks up the task rule, picks the map type via Phase 1's geometry gate (reading the **resolved geography's** geometry, not the metric dataset's — D9), builds a minimal `VisualizationSpec` (`mapType`, one `mapData` entry from `data`, engine defaulted to `maplibre`), and calls `resolveSpecFromMapType` (now reused directly from `@ttoss/geovis`, per Phase 0) to fill layers/legends — this is the "encoding seed" reuse PRD-006's Must item names explicitly. Then implement `resolve(intent, catalog, data, options?)` (D3) as the thin wrapper: calls `validateIntent` (reusing PRD-005 plan's function); on a non-`'valid'` result, returns that `IntentResult` unchanged (no duplicate validation logic); on `'valid'`, delegates to `resolveValidated`. `resolveValidated`'s narrower input type (`Extract<IntentResult, { status: 'valid' }>`) statically excludes `invalid`/`needs-clarification` from its own return type (D8).

**Demo:** a valid `distribution` intent against the sample catalog and a small `data` fixture produces `{ status: 'resolved', spec }` whose `spec.mapType === 'choropleth'` and whose legend matches `TASK_RULES.distribution.legendHint`, via both `resolve()` and `resolveValidated()` (the latter called directly with `validateIntent`'s own `'valid'` result); a `normalized-comparison` intent carrying `denominatorMetricId` resolves to a rate-valued `mapData` entry.
**Acceptance:** one end-to-end fixture per task (nine total) producing a `resolved` result with the geometry-gated `mapType`; every `IntentResult` failure status from PRD-005's plan (`invalid`, `mismatch`, `needs-clarification`) is confirmed to pass through `resolve()` unchanged, proving no duplicate validation; a `normalized-comparison` intent without `denominatorMetricId` returns `missing-denominator` (D9); a type-level test (e.g. a `// @ts-expect-error` fixture) confirms `resolveValidated` rejects an `IntentResult` typed as anything other than `{ status: 'valid' }`.

### Phase 3 — Warnings, catalogue-derived checks, and `insufficient-data`

Implement `warnOn` rule application (D4), D9's three task-independent checks (`grain-mismatch`, `partial-spatial-extent`, `insufficient-temporal-coverage`), and the `insufficient-data` status (D7) for the case where `data` is empty or every row fails the join key. Fix the `warnOn` thresholds here (the remaining open question) against the extended fixture catalog.

**Demo:** a `coverage`-task intent with a `data` array of one row (below the `sparse-data` threshold) resolves with `status: 'resolved'` but a non-empty `warnings` array; a `data` array with zero matching rows for the resolved geography returns `{ status: 'insufficient-data', issues: [...] }`; an intent whose resolved dataset is grained finer than the requested geography (the real `caf_producao`-at-`rural_property` vs municipality shape) returns `{ status: 'mismatch', issues: [{ code: 'grain-mismatch' }] }` **without** a spec, rather than a silently double-counted choropleth; a `change-over-time` intent against a single-interval dataset returns `insufficient-temporal-coverage` with a repair listing the tasks one period can answer.
**Acceptance:** one fixture and test per `warnOn` category actually populated in D4's table; one fixture and test per D9 check, each asserting the failure/warning classification D9 specifies (grain and temporal are failures with no `spec`; partial extent is a warning alongside a rendered `spec`); `insufficient-data` never coexists with a `spec` (matches ADR-0001's "nothing renders on failure" contract, reused here at the resolver layer); `partial-spatial-extent`'s degraded exact-code-equality path is tested and documented as such until `codedRefSchema` gains `scheme` (D9).

### Phase 4 — Resolution trace

Implement `ResolutionTraceEntry`/`trace` (D7) directly on `ResolveResult` — no `spec` or `ContextPacket` involvement — populated with one entry per decision `resolve()` makes: task-rule lookup, dataset join selection (surfacing PRD-005's `datasetId` resolution when it was inferred rather than supplied), map-type choice, legend choice. Add the composition example from D7 (`{ ...packet, resolutionTrace: result.trace }`) to `README.md`'s `resolve()` section so applications see the intended combination point without this package needing to implement it.

**Demo:** `result.trace` for a `distribution` intent lists at least a `'mapType'` and a `'joinedDataset'` entry, each with a human-readable `reason`; a small runnable README snippet shows `runtime.getContextPacket()`'s output merged with `result.trace`.
**Acceptance:** every Phase 2 fixture's resolved result has a non-empty `trace`; trace entries never reference raw `data` values (decisions/metadata only, consistent with the packet's own metadata-only rule from `@ttoss/geovis` ADR-0004, even though `trace` itself never enters the packet type); a test confirms `resolve()`'s output has no `metadata` side-effect on `spec` (guards against the trace-placement mistake this phase's plan previously made).

### Phase 5 — Extension points and docs

Implement `options.extraTaskRules` and `options.supportedTasks` (D5). Update `README.md` with `resolve()`'s full signature, one worked example per task, all three of D5's extension levels (value override, vocabulary narrowing, and the three-step recipe for adding a task), the `allowedMetricKinds`-widening caveat, and a note on client/server neutrality (D6). Update `coverageThreshold`.

**Demo:** calling `resolve(intent, catalog, data, { extraTaskRules: { ranking: { ...TASK_RULES.ranking, mapTypePreference: ['choropleth'] } } })` produces a choropleth instead of the built-in proportional-circles default for that one call, while a concurrent call without `options` still gets the built-in rule; a call with `supportedTasks: ['distribution']` and a `ranking` intent returns `unsupported-task` with the allowed list as its repair.
**Acceptance:** override is call-scoped (a second `resolve()` call without `options` is unaffected by a prior call's override — test asserts no shared mutable state); `supportedTasks` rejects exactly the tasks outside the list and admits every task inside it; a type-level test confirms `extraTaskRules` cannot name a task outside `AnalyticalTask` (D5's level-3 boundary, the closed vocabulary the strategy depends on); `pnpm turbo run test --filter=...@ttoss/geovis-catalog` and `pnpm turbo run build --filter=...@ttoss/geovis-catalog` green; `pnpm run -w lint` clean.

## Sequencing notes

Phase 0 is a new entry gate this revision adds: it touches `@ttoss/geovis`, not `@ttoss/geovis-catalog`, and nothing in Phase 2 onward can call `resolveSpecFromMapType` from outside that package until it ships. This plan otherwise cannot start until PRD-004's plan ships `Catalog`/`validateCatalog` and PRD-005's plan ships `AnalyticalIntent`/`validateIntent` — Phase 2 here calls `validateIntent` directly and Phase 1's task-rule review uses both prior plans' fixtures. D9 adds two upstream items to that gate, both in PRD-005's plan and both needed before this plan's Phase 1: `ANALYTICAL_TASKS` must grow to nine entries (`composition`, `normalized-comparison`), and `AnalyticalIntent` must gain `denominatorMetricId`. A third, in PRD-004's plan, is needed only by Phase 3 and only to lift a degraded check rather than to unblock one — `codedRefSchema` gaining `scheme`, without which `partial-spatial-extent` falls back to exact-code equality. Phase 1 has no runtime dependency on Phase 2 (or on Phase 0) and could be drafted in parallel, but is sequenced here for a single implementer. Phase 2 depends on Phase 0, Phase 1, and both prior plans (needs `validateIntent`/`Catalog`/`resolveSpecFromMapType`). Phase 3 depends on Phase 2. Phase 4 depends on Phase 2 (could run parallel to Phase 3 — both extend `resolve()`'s output independently — but is sequenced after Phase 3 here since the warnings and trace tests share the same fixture set and are easiest to review together). Phase 5 depends on Phases 1–4. Each phase is one PR.

R4's exit criterion ("an AI can only reference catalog entries; the resolver produces a valid map or a structured failure — never a guess") is met once this plan's Phase 3 ships: Phases 4–5 are the Should item and hardening, not gating.

## Open questions carried forward (not resolved by this plan)

- `TASK_RULES`'s `allowedMetricKinds`/`mapTypePreference`/`legendHint`/`warnOn` values are now fixed in D4's table, not left to implementation-time judgment. What remains open is the numeric _threshold_ each `warnOn` category trips at (how few features counts as `small-sample`, what fraction of "no data" counts as `sparse-data`) — a Phase-3 implementation-time judgment call, reviewed against the fixture catalog rather than fixed in this planning document.
- Whether `correlation`/`co-location` (bivariate) tasks ever join the vocabulary depends on PRD-005 plan's D3 being revisited — D9 records that the real catalogue invites them (`municipios_ivs`' 12 index columns against kitchen counts) and that this plan deliberately declines to add them while D3's single-metric cut stands.
- Whether aggregation belongs anywhere in this package is left closed-for-now by D9's `grain-mismatch` being a failure with a "pre-aggregate and call again" repair. If several applications end up writing the same municipality roll-up, that's the signal to revisit — a shared aggregation helper would be a new PRD, not a resolver feature, since PRD-006's Won't reserves per-application business rules to the caller.
- The strategy document (`docs/website/docs/product/geovis/strategy.md`) is absent from the repo (see PRD-004 plan's Verification section) — strategy §5.3 and §12's full rationale for task-rule specifics is unavailable beyond what PRD-006's own text states.
- PRD-007 (Evaluation Suite) is the consumer that will exercise `resolve()`'s resolver-success and zero-guess-rate metrics; this plan does not build any eval harness itself (out of scope per PRD-006's own Won't and PRD-007's separate PRD).
- Whether `@ttoss/geovis` maintainers want `resolveSpecFromMapType` exported under its current name/signature or a renamed/wrapped form is a Phase-0 review question for that package's own owners, not decided unilaterally by this plan.

## Verification against current codebase (2026-07-31)

- Depends on `packages/geovis-catalog` shipping both prior plans' exports (`Catalog`, `CatalogIssue`, `validateCatalog`, `AnalyticalIntent`, `IntentResult`, `validateIntent`) — none of this exists until those plans land.
- `cozsolidarias`' `public/dataset_catalogue.json` (`schema_version: 2.0.0`, 11 datasets) read directly for D9. Confirmed: `spatial.geometry` is `multipolygon` on all 3 polygon datasets and `none` on 6 of 11; 5 distinct `spatial.grain.code` values; no dataset carries more than one `temporal.extent` interval; 8 of 29 `cozinhas_geolocalizadas` fields are `sensitive: true`, two of them also `role: 'geometry'`; `assentamentos` declares 4 state-level extents against 9 datasets' national one.
- `packages/geovis-catalog/src/schema/catalog.ts`'s `geometrySchema` (`point | polygon | line`, used by `mapTypeCatalogEntrySchema.supportedGeometries`) confirmed to lack the `multipolygon` member that `spatialGeometrySchema` has — this is the blocking mismatch behind D9's normalization rule, not a hypothetical.
- `packages/geovis-catalog/src/schema/catalog.ts`'s `codedRefSchema` confirmed to be `{ code, label? }` with no `scheme`, while the real artifact writes `{ scheme: 'iso3166-1', code: 'BR' }` — the gap that degrades D9's `partial-spatial-extent` check to exact-code equality.
- `packages/geovis/src/spec/mapTypeDefaults/choropleth.ts`'s `buildChoropleth` confirmed to branch on `isNumeric` and build a `CategoricalColorBy` from `CATEGORICAL_PALETTE` otherwise — this is why D4's `composition`/`coverage` tasks can prefer `choropleth` on polygon geography instead of being forced to `dotDensity`.
- `packages/geovis/src/spec/mapTypeDefaults/dotDensity.ts`'s `resolveDotDensity` confirmed to return `legends: []` — D4's `legendHint` documents a legend the resolver must construct, not one this function supplies.
- `packages/geovis/src/index.ts` confirmed **not** to export `resolveSpecFromMapType` (only `SEQUENTIAL_PALETTES` from `./spec/mapTypeDefaults/palettes` is re-exported) — this is the finding behind D2/Phase 0, corrected from the prior revision of this plan, which assumed the function was already publicly reusable.
- `packages/geovis/src/spec/mapTypeDefaults.ts`'s `resolveSpecFromMapType(spec: VisualizationSpec): VisualizationSpec` confirmed as a pure function operating on a spec whose `mapData[].data` already holds real values — it does not fetch data, which is why D3 adds a `data` parameter to this plan's `resolve()` rather than matching PRD-006's literal two-argument text.
- `packages/geovis/src/spec/types.ts`'s `MapData.data: MapDataRow[]` confirmed present for D3's `data` parameter; no `@ttoss/geovis` type changes are required by this plan beyond D2's export.
- `packages/geovis/src/runtime/contextPacket.ts`'s `buildContextPacket()` confirmed to read only `spec.mapType`/`sources`/`layers`/`legends`/`viewPresets` — never `spec.metadata` — which is why D7 no longer routes `trace` through `spec.metadata` (a prior revision of this plan claimed that "fed" `ContextPacket`; it does not, since nothing in `buildContextPacket()` looks at `metadata`).
- `packages/geovis/src/react/GeoVisProvider.tsx`'s `checkPolicies` confirmed to already read specific reserved keys off `spec.metadata` (`isPolicyInvalid`, `invalidReason`, `metricField`, `normalizedField`, …) for the cartography-policy feature — `spec.metadata` is not neutral free-form scratch space, reinforcing D7's decision to keep `trace` off it entirely rather than add another ad hoc key.
- `packages/geovis/tests/unit/tests/publicContract.test.ts` confirmed as the existing guard Phase 0 must extend, per that package's own CLAUDE.md instruction.
