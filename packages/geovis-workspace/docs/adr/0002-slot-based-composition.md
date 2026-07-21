# ADR-0002: Named slots with runtime-bound, overridable defaults

Status: proposed (2026-07-10)
Tags: workspace, composition, slots, embedding

## Context and Problem Statement

`Layout` hardcodes exactly two sidebars with fixed content: menu groups on the left, a legend on the right. PRD-003's exit criterion is that an application embeds the workspace without rebuilding common map UI — but real applications also need to add domain panels (a data table, a comparison view) or replace a default. With a fixed layout the only growth paths are per-variation config booleans or forking the shell, and kepler.gl's component-injection machinery exists precisely because its fixed shell forced that choice on consumers.

## Decision Drivers

- "Embed without rebuilding" must coexist with "extend without forking".
- Default panels (legend, warnings, inspector) must be replaceable without losing their runtime binding (ADR-0001).
- A closed, named surface is introspectable — the same discipline the action vocabulary applies to mutations (GeoVis [ADR-0003](../../../geovis/docs/adr/0003-semantic-action-surface.md)), applied to layout.

## Considered Options

1. Fixed layout plus config booleans per variation — combinatorial config growth; custom panels remain impossible.
2. Fully headless component kit (export panels, no shell) — every application rebuilds the layout, so there is no default surface; contradicts PRD-003's outcome.
3. A default layout exposing named slots, each pre-filled with a runtime-bound default panel, overridable or hideable per slot — chosen.

## Decision Outcome

The workspace defines a closed set of named slots — `map`, `legend`, `warnings`, `inspector`, `metadata`, `controls` — each pre-filled with a runtime-bound default from ADR-0001. An application overrides a slot with its own component (which gets runtime access through the same public contexts) or hides it; config arranges slots and initial state, content still comes from the runtime. Slot names are a public, versioned vocabulary: adding one is additive, renaming one is breaking.

### Consequences

- Good: the exit criterion is achievable without forks; default panels are testable in isolation; custom panels are first-class rather than escape hatches.
- Good: no dependency on GeoVis R2 — can proceed in parallel.
- Bad: the slot API is public surface to design and keep stable, and naming the closed set well is product work, not just engineering (the same cost GeoVis ADR-0003 accepts for actions).

Anchors: `src/components/Layout.tsx`, `src/GeovisWorkspace.tsx`
