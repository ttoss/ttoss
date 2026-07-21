# ADR-0004: Workspace mutations compile to semantic actions

Status: proposed (2026-07-10)
Tags: workspace, actions, convergence, steering

## Context and Problem Statement

The only mutation path today is `setSelection` → `onSelectionChange` → the application rebuilds the entire `visualizationSpec` and the provider re-renders. That is regeneration, which the strategy names as the wrong default ("actions over regeneration"): full-spec rebuilds destroy view and selection continuity, and leave no log. PRD-003's convergence metric — a human click and an AI turn produce identical logs — is unreachable while the UI mutates through a side channel the AI cannot see.

## Decision Drivers

- Human/AI convergence (strategy §8): if the UI can change something, `dispatch()` must be able to express it — and the workspace proves it in both directions.
- The workspace is the first real consumer of the action vocabulary: a control that cannot express itself as an action is evidence the vocabulary (GeoVis [ADR-0003](../../../geovis/docs/adr/0003-semantic-action-surface.md)) is incomplete — caught in-house, before external AI integrations hit the same wall.
- Audit and undo need one action log covering both surfaces (PRD-002).

## Considered Options

1. Keep parent-rebuild via `onSelectionChange` — regeneration cost, no convergence, workspace selection state drifts from runtime state.
2. Workspace calls `applyPatch` with raw paths — moves the spec path grammar into UI code; the coupling GeoVis ADR-0003 rejects for AI is no better in a sidebar.
3. Controls compile interactions to semantic actions dispatched on the shared runtime — chosen.

## Decision Outcome

Menu groups bind to action templates in config: selecting a menu item compiles to a semantic action (e.g. `set-map-data`, `set-filter`) carrying the item's value. Panel controls (layer toggle, view preset, selection) dispatch directly. Rejected dispatches feed the ADR-0003 repair surface instead of failing silently. `onSelectionChange` remains as a notification of applied actions — an observer, no longer the mutation path — mirroring `SpecPatch`'s demotion to escape hatch. The action log becomes a workspace surface: an audit trail for humans and the undo substrate PRD-002 anticipates.

### Consequences

- Good: "every UI mutation is a logged semantic action" is structurally guaranteed rather than policed by review; the workspace doubles as the live test bench for the action vocabulary before R4 exposes it to generation.
- Bad: hard dependency on GeoVis ADR-0003 shipping (R2); the menu→action binding schema is new public config surface to design and version.

Anchors: `src/GeovisWorkspaceProvider.tsx`, `src/context/GeovisWorkspaceContext.ts`, [`../geovis/src/runtime/createRuntime.ts`](../../../geovis/src/runtime/createRuntime.ts)
