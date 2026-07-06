# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from `packages/geovis/`:

```bash
pnpm run test                                        # jest --projects tests/unit
pnpm run test --testPathPatterns=proportionalCircles  # single file
pnpm run test --testNamePattern="sqrt transform"      # single test
pnpm run build                                        # tsdown → dist/
pnpm run type-check                                   # tsc --noEmit
```

From monorepo root, validate dependents/build after a complete change:

```bash
pnpm turbo run test --filter=...@ttoss/geovis
pnpm turbo run build --filter=...@ttoss/geovis
```

Coverage thresholds live in `tests/unit/jest.config.ts` (`coverageThreshold.global`) — **always update** after every code change session end that shifts coverage, setting values slightly below (0.01–0.1%) current coverage. Coverage must never decrease.

## Architecture

`@ttoss/geovis` is a schema-driven geovisualization library: a JSON `VisualizationSpec` describes sources/layers/legends, and an engine adapter (currently MapLibre only) translates that spec into imperative map calls. React components are a thin layer on top of a framework-agnostic runtime.

### Layering

```
spec/        — VisualizationSpec types, JSON schema, validation, mapType auto-configuration
runtime/     — createRuntime (engine-agnostic mediator) + EngineAdapter interface
adapters/    — concrete engine adapters (maplibre/ only today)
react/       — GeoVisProvider/GeoVisCanvas, contexts, hooks
ui/          — GeoVisLegend, GeoVisHoverTooltip, GeoVisMarker (presentational, read spec/context)
```

`createRuntime(adapter, spec)` is the core: it holds `currentSpec`, mounts/updates the adapter, and applies `SpecPatch` operations immutably (spread + replace, never mutate) so adapters/hooks can use reference equality for change detection. It is exported as public API (`export * from './runtime/createRuntime'`), so it must stay usable without a React tree.

`GeoVisProvider` wraps `createRuntime` for React: it resolves the adapter from `spec.engine`, keeps the runtime synced with spec prop changes, and exposes `useGeoVis()` (spec, `applyPatch`, `setView`, `policyViolations`, `runtime`). Hover and click state live in **separate contexts** (`GeoVisHoverContext`, `GeoVisClickContext`) specifically so high-frequency hover/click updates don't re-render every `useGeoVis()` consumer.

### `resolveSpecFromMapType` — mapType auto-configuration

Setting `spec.mapType` (`'choropleth'`, `'dotDensity'`, `'proportionalCircles'`) triggers zero-config layer/legend generation from `mapData`. This resolver runs in **two places** — `GeoVisProvider` and `createRuntime.update()` — because `createRuntime` is a standalone public export that can't assume the caller already resolved the spec. It's idempotent, so double-resolution is safe but intentional; don't try to dedupe it by hoisting resolution to one call site.

Each `mapType` has its own module under `spec/mapTypeDefaults/` (`choropleth.ts`, `dotDensity.ts`, `proportionalCircles.ts`) and its own legend-merge strategy:

- `mergeLegends` (choropleth, dotDensity) — falls back to positional merge when a user legend has no matching `id`, since there's only ever one resolved legend.
- `mergeLegendsByIdOnly` (proportionalCircles) — only merges on exact `id` match; otherwise appends the resolved size legend as a separate entry, since it's additive information, not a replacement for the user's color legend.

`mergeResolvedLayers` always returns a **new** layer object instead of mutating — `spec.layers` array/objects are often reused across `setSpec` calls, and in-place mutation would leak resolved fields into a later resolution of the same objects.

### `mapData` / feature-state joining

GeoJSON sources hold geometry only; `mapData` entries hold per-feature values joined at runtime via `setFeatureState` (see `adapters/maplibre/mapDataFeatureState.ts`). This keeps attribute updates cheap (no source re-parse) and decouples color/size from geometry.

For bivariate maps, `dimension: 'color' | 'size'` on a `MapData` entry plus a `stateKey` lets two datasets coexist on one source without collision. Resolution order for `resolveDimensionStateKey` (dimension match → legacy `mapDataId` → any entry for source → default `'value'`) matters when debugging why a color/size expression reads the wrong feature-state key — see README's "How `stateKey` resolution works" section for the full fallback chain and collision case.

### `SpecPatch` / `applyPatch`

`applyPatch` (via `useGeoVis` or `runtime.applyPatch`) mutates a live map without re-mounting — `target` is `'layer' | 'source' | 'mapData'` only; `view` and `style` changes require full `update(spec)` because they're excluded from `SpecPatchTarget` at the type level (compile-time error over silent runtime warning). Patch handling lives in `createRuntime.ts` (`applyLayerPatchToSpec`, `applySourcePatchToSpec`) and `spec/mapDataPatch.ts`.

### Proportional circles / `sizeBy`

`sizeBy.transform: 'sqrt'` maps both the input value and the interpolation stops to sqrt-space so circle **area** (not radius) is proportional to value, while radius output stays bounded to `[minRadius, maxRadius]` — see README's "Range × Transform reference" if touching this code, the linear-vs-sqrt distinction is easy to get backwards. Negative/non-numeric values are clamped to `0`/invisible rather than `NaN`, since area has no meaning for negative magnitudes.

## Testing

- Tests live in `tests/unit/tests/`, mirroring `src/` structure (`spec/mapTypeDefaults/`, `adapters/maplibre/`, `ui/`, etc.) — put new tests next to their existing sibling, not in `src/`.
- `maplibre-gl` is mocked globally via `tests/unit/__mocks__/maplibre-gl.ts` (wired through `moduleNameMapper` in `tests/unit/jest.config.ts`) — don't import the real library in tests.
- `tests/unit/tests/publicContract.test.ts` guards the package's public export surface (`src/index.ts`) — update it deliberately when adding/removing exports, not incidentally.

## Documentation

`README.md` is the authoritative spec reference (field tables for `VisualizationSpec`, `LegendSpec`, `VisualizationLayer`, `SizeBy`, etc.) with runnable examples for every feature, including mapType-specific merge behavior and edge cases (invalid `sizeBy.range`, negative values, URL-sourced `propertyName`). Check it before re-deriving behavior from source — it's kept current with each feature and documents intentional edge-case decisions, not just happy paths.
