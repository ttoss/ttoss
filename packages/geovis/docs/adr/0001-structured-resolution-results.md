# ADR-0001: Structured, repairable result taxonomy for spec resolution

Status: proposed (2026-07-08)
Tags: validation, errors, repair-loop, ai-readiness

## Context and Problem Statement

`validateSpec` returns `{ valid: false, errors: string[] }` — prose messages meant for developers. Policy checks return a separate `PolicyViolation[]`, and `applyPatch` failures surface as runtime warnings. The GeoVis strategy requires failures to be structured and actionable so an invalid request becomes a repair loop instead of a dead end: an AI (or a UI) must be able to distinguish "this spec is malformed" from "this engine cannot do that" from "this reference points nowhere", and must receive the allowed alternatives when they are computable.

Prose strings cannot drive that loop. An LLM parsing English error text is exactly the kind of guessing the strategy exists to eliminate.

## Decision Drivers

- Repair, not dead ends: every failure should tell the caller what category it is and what would fix it.
- One reporting channel: validation, policies, patches, and future actions should not each invent an error shape.
- Evals need machine-readable outcomes to measure resolver success and repair success rates.
- kepler.gl shows the cost of the alternative: a saved config whose `dataId` does not match the loaded dataset is silently dropped, and its AI Assistant compensates for unparseable failures with a human confirmation step on every call.

## Considered Options

1. Keep `string[]` and let callers parse messages — fragile, untyped, blocks the repair loop.
2. Throw typed exceptions per failure category — loses the ability to report multiple issues at once and forces try/catch control flow into React providers.
3. Return a typed result object with a closed status taxonomy and machine-actionable details — chosen.

## Decision Outcome

Every resolution-affecting entry point (`validateSpec`, `runtime.update`, `runtime.applyPatch`, and the future action dispatch) returns a `GeoVisResult`: a discriminated union with `status: 'resolved'` carrying the resolved spec, or a failure status carrying a list of structured issues.

Failure statuses form a closed enum aligned with the strategy's taxonomy, scoped to what the library can know: `invalid` (schema/shape), `mismatch` (referential integrity — unknown `mapDataId`, source-scope conflicts), `unsupported` (capability not provided by the adapter — see ADR-0002), `insufficient-data` (join produced no usable binding), `needs-clarification` (multiple valid resolutions, caller must choose). Application-level statuses such as permission denial stay outside the library.

Each issue carries a machine code, the subject (`layer id`, `path`), a human message, and — when computable — a `repair` field listing allowed values or candidate fixes. Nothing renders on failure: a failed result never produces a mounted or guessed map.

### Consequences

- Good: the repair loop becomes possible; evals can count failure categories; policies and validation converge on one shape.
- Good: existing checks in `validateSpec.ts` already know their category — this is a reshaping, not a rewrite, which is why it goes first.
- Bad: `ValidationResult` changes shape (breaking for pre-1.0 consumers) and every future check must pick a code deliberately.

Anchors: `src/spec/validateSpec.ts`, `src/runtime/createRuntime.ts`
