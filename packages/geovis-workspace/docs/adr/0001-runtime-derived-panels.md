# ADR-0001: Panels derive from the GeoVis runtime; config describes layout only

Status: proposed (2026-07-10)
Tags: workspace, runtime-binding, single-source-of-truth

## Context and Problem Statement

`GeovisWorkspaceConfig.rightSidebar.legendWithColor` asks the application to hand-author legend swatches (`items: { color, label }[]`) and sources for a map whose legend the GeoVis runtime already resolves — `resolveSpecFromMapType` computes classes and stops, and `@ttoss/geovis` ships `GeoVisLegend`/`GeoVisHoverTooltip` that render them from context. The same state has two owners, violating the strategy's "one source of truth" principle: change the metric and the map updates while the sidebar silently shows stale classes.

The problem is structural, not cosmetic: `GeoVisProvider` mounts inside the map slot (`GeovisWorkspace.tsx`), below the layout, so sidebar panels _cannot_ subscribe to runtime state at all. Warnings, policy violations, and selection are invisible to the shell by construction.

## Decision Drivers

- One source of truth (strategy §8): legend, warnings, and selection each need one owner — the runtime.
- PRD-003 requires panels that render the runtime: canvas, legend, hover tooltip, warnings, selected-feature inspection.
- A panel that reads runtime state stays correct regardless of who mutated the map — human control today, AI `dispatch()` later. This is the precondition for human/AI convergence (ADR-0004).
- `@ttoss/geovis` already ships presentational components bound to spec/context; re-describing their output as config is rework plus drift.

## Considered Options

1. Keep config-authored content and document that applications must keep it in sync — drift by construction; every application rebuilds the spec→UI mapping GeoVis already owns.
2. Config-authored content with a runtime-derived fallback when absent — two render paths, two owners, double test surface; drift survives.
3. Hoist `GeoVisProvider` above the layout; panels subscribe to the runtime; config keeps only layout concerns — chosen.

## Decision Outcome

`GeoVisProvider` wraps the whole workspace tree instead of the map slot, so every panel can consume `useGeoVis()` and the hover/click contexts. Default panels reuse the `@ttoss/geovis` UI components rather than re-implementing them. `GeovisWorkspaceConfig` narrows to what the runtime cannot know: which panels exist and where (ADR-0002), initial open state, and annotations such as a description or data-source links. Hand-authored legend content (`legendWithColor.legend.items`) is removed — the legend renders from the resolved spec.

### Consequences

- Good: panels can never disagree with the map; warnings, errors, and selection become displayable, unlocking the repair surface (ADR-0003).
- Good: depends only on `@ttoss/geovis` as shipped plus the R1 result taxonomy for warnings content — work can start in parallel with GeoVis R2.
- Bad: breaking `GeovisWorkspaceConfig` change (acceptable pre-1.0); applications lose the ability to show a legend that differs from the resolved spec — which is the point.

Anchors: `src/GeovisWorkspace.tsx`, `src/context/GeovisWorkspaceContext.ts`, [`../geovis/src/ui/`](../../../geovis/src/ui/)
