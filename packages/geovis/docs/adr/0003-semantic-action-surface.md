# ADR-0003: Semantic action surface above `SpecPatch`

Status: proposed (2026-07-08)
Tags: actions, steering, spec-patch, ai-readiness

## Context and Problem Statement

The only way to steer a live map today is `applyPatch` with raw path operations: `{ target: 'layer', op: 'replace', path: 'layers.district-fill.type', value: 'symbol' }`. The caller must know the spec's internal structure, path grammar, and which targets are patchable. For AI this is the failure mode the strategy names directly — the model is asked to produce implementation, not intent, and an invented path fails (or worse, half-applies) at runtime.

The strategy requires an AI operation surface: changing data, filters, layers, selection, or view should be a small semantic operation, validated before it touches the map, with human UI controls and AI converging on the same operations.

## Decision Drivers

- Actions over regeneration: steering an existing map must not require re-emitting the whole spec.
- Intent over implementation: the AI-facing vocabulary must name analytical operations, not spec paths.
- Human/AI convergence: `useBoundaryToggle` and future UI controls should dispatch the same operations an AI dispatches.
- kepler.gl validates the pattern and warns about the surface: its granular action system (`layerConfigChange`, `setFilter`, `updateMap`) proves that incremental actions enable precise steering and undo/redo — but that vocabulary mirrors engine internals, which is exactly what the strategy says not to hand to a model. Its AI Assistant already had to wrap those actions in a smaller set of function tools; GeoVis makes that smaller set the primary contract instead of an afterthought.

## Considered Options

1. Expose `SpecPatch` to AI with schema documentation — keeps the path grammar as the contract; hallucinated paths remain representable.
2. Regenerate the full spec per change — high token cost, destroys view/selection continuity, contradicts "patch > restart".
3. A closed vocabulary of typed semantic actions, compiled internally to `SpecPatch`/`update` — chosen.

## Decision Outcome

The runtime gains `dispatch(action): GeoVisResult` with a closed, typed action vocabulary at the analytical level — e.g. `set-map-data` (swap the joined dataset/dimension), `set-filter`, `toggle-layer`, `select-feature`, `set-view-preset`, extended per capability, each carrying an optional `rationale` for auditability. Actions that name analytical concepts unsupported by the current spec or adapter are rejected with structured results (ADR-0001) validated against the capability tree (ADR-0002) before anything is applied.

Internally each action compiles to existing mechanisms (`SpecPatch`, `setView`, `update`). `SpecPatch` remains public as the low-level escape hatch, mirroring `getNativeInstance()`: available, not primary. React hooks that mutate the map migrate to dispatching actions so a human click and an AI turn produce identical, loggable operations.

### Consequences

- Good: hallucination-resistant steering — invalid operations are unrepresentable or rejected pre-apply; the action log (with rationales) gives undo/redo and audit a natural substrate.
- Good: the action vocabulary doubles as the "allowed actions" list the context packet needs (ADR-0004).
- Bad: a second public mutation API to design, test, and keep in sync with the spec vocabulary; naming the closed set well is product work, not just engineering.

Anchors: `src/runtime/adapter.ts` (`SpecPatch`), `src/runtime/createRuntime.ts`, `src/react/hooks.ts`
