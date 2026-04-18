# Architecture & Contributing Guide

## The #1 rule

**Components never consume `core` tokens directly. They only consume `semantic` tokens.**

This one rule drives the entire architecture. `core` holds raw primitives. `semantic` holds usage aliases that point to `core` via `{token.path}` references. Swapping modes (light/dark) means swapping which `semantic` values resolve to — `core` is never touched.

---

## Two-layer token structure

```
ThemeTokens
├── core     — raw CSS values: colors, spacing, typography, elevation, motion, etc.
└── semantic — usage aliases expressed as {core.path} references
```

`semantic` values almost always look like this:

```ts
action.primary.background.default: '{core.colors.brand.500}'
```

When a `semantic` token holds a raw value instead of a `{ref}`, it is a deliberate, documented exception.

---

## File map

```
src/
  Types.ts              — type contracts for ThemeTokens, CoreTokens, SemanticTokens, ThemeBundle
  baseTheme.ts          — concrete default values for both layers + darkAlternate override
  baseBundle.ts         — assembles baseTheme + darkAlternate into ThemeBundle (internal)
  createTheme.ts        — public API to build and extend ThemeBundle objects
  vars.ts               — static typed map of semantic tokens as CSS var() strings (build-time)
  css.ts                — re-exports token → CSS utilities; getThemeStylesContent()
  dtcg.ts               — W3C Design Tokens (DTCG) JSON export
  react.tsx             — ThemeProvider, ThemeHead, ThemeStyles, useColorMode, useTokens
  runtime.ts            — framework-agnostic mode manager (data attributes + localStorage)
  ssrScript.ts          — inline JS string for SSR flash prevention
  runtime-entry.ts      — sub-path entry for '@ttoss/theme2/runtime'

  roots/
    helpers.ts          — isTokenRef, extractRefPath, deepMerge, flattenObject, toFlatTokens
    tokenRegistry.ts    — single source of truth: token path prefix → CSS var prefix + DTCG type
    toCssVars.ts        — ThemeTokens → flat CSS custom properties record + full CSS string
    toVars.ts           — ThemeTokens → typed semantic tree with var() leaf values
    toDTCG.ts           — ThemeTokens → W3C DTCG JSON

  dataviz/              — optional dataviz token extension (separate token family)
```

---

## Data flow

```
baseTheme (ThemeTokens)          ← edit here to change default values
        │
        ▼
  createTheme({ overrides, alternate })
        │
        ▼
   ThemeBundle
   ├── baseMode: 'light' | 'dark'
   ├── base: ThemeTokens          ← the full token tree
   └── alternate?: ModeOverride   ← semantic-only remapping for the opposite mode
        │
        ├──▶ toCssVars()          → CSS string: --tt-* custom properties
        │                            injected by ThemeProvider / getThemeStylesContent()
        │
        ├──▶ buildVarsMap()       → typed semantic tree with 'var(--tt-*)' leaves
        │                            consumed at build-time to produce vars.ts
        │
        └──▶ toFlatTokens()      → flat record of all tokens resolved to raw values
                                     used by useResolvedTokens() (React Native, canvas, PDF)
```

---

## Token references

Token values use `{path}` syntax to reference other tokens:

```ts
'{core.colors.brand.500}'; // pure reference
'clamp({core.spacing.4}, 1cqi, {core.spacing.8})'; // embedded in expression
```

Key functions in `roots/helpers.ts`:

- `isTokenRef(value)` — checks if a value is a `{path}` reference
- `extractRefPath(ref)` — extracts `core.colors.brand.500` from `{core.colors.brand.500}`
- `toFlatTokens(theme)` — flattens + recursively resolves all refs to raw values; returns **both** `core.*` and `semantic.*` keys. Callers that need only semantic keys filter with `key.startsWith('semantic.')` at the call site. Do not introduce a `toFlatSemanticTokens` wrapper — core keys are required internally for ref resolution, the filter is a one-liner, and a wrapper would be a single-use abstraction.

---

## CSS variable naming

Path → CSS var name is defined in `roots/tokenRegistry.ts`.

Convention:

- **Core** tokens: `--tt-core-<family>-<subpath>`
- **Semantic** tokens: `--tt-<family>-<subpath>`

Examples:

```
core.colors.brand.500                             → --tt-core-colors-brand-500
core.spacing.4                                    → --tt-core-spacing-4
core.elevation.level.2                            → --tt-core-elevation-2
core.elevation.emphatic.2                         → --tt-core-elevation-emphatic-2
semantic.colors.action.primary.background.default → --tt-colors-action-primary-background-default
semantic.elevation.surface.raised                 → --tt-elevation-surface-raised
core.dataviz.color.blue.500                       → --tt-core-dataviz-color-blue-500
semantic.dataviz.color.sequential.0               → --tt-dataviz-sequential-0
```

`tokenRegistry.ts` is the single source of truth. `toCssVars.ts` and `toDTCG.ts` both
derive their lookup tables from it. **Adding a new token family = add an entry there,
ordered from most specific (longest prefix) to least specific.**

`toCssVars` behavior:

- `core` tokens → raw value assigned directly
- `semantic` tokens → `{ref}` replaced by `var(--tt-core-*)` / `var(--tt-*)`, compound expressions handled inline

---

## vars.ts — the static typed map

`vars` is a typed mirror of `SemanticTokens` where every leaf is a `var(--tt-*)` string.
It is generated once at build-time from `baseBundle` and never changes at runtime.

```ts
import { vars } from '@ttoss/theme2/vars';

vars.colors.action.primary.background.default;
// → 'var(--tt-colors-action-primary-background-default)'
```

The var names are stable across themes — only the CSS custom property values change when
a theme or mode switches. Components reference vars; `toCssVars` carries the values.

---

## createTheme — internals

`createTheme` calls `buildTheme` (internal): `deepMerge(base, overrides)` + `structuredClone` to break shared references. Result is a `ThemeBundle`. `alternate: null` opts out of the built-in `darkAlternate`. `extends` merges a parent `ThemeBundle` before `overrides` are applied. See README for usage examples.

---

## React integration

`ThemeProvider`:

1. Creates a `ThemeRuntime` (mode resolution + localStorage persistence)
2. Resolves `SemanticTokens` for the current mode (`deepMerge(base.semantic, alternate.semantic)`)
3. Calls `toFlatTokens` for the resolved-tokens context
4. Injects CSS via `getThemeStylesContent` into a `<style>` tag
5. Writes `data-tt-mode` on `<html>`

Hooks:

- `useColorMode()` → `{ mode, resolvedMode, setMode }`
- `useTokens()` → raw `SemanticTokens` for the current mode
- `useResolvedTokens()` → flat record of all tokens resolved to raw values (non-CSS environments)

---

## SSR / flash prevention

`ssrScript.ts` produces a small inline JS string that reads localStorage and sets `data-tt-mode` on `<html>` before the page paints. Inject it as the first `<script>` in `<head>` via `getThemeScriptContent` from `@ttoss/theme2/runtime`. See README for the full integration pattern.

> Import only from sub-paths defined in `package.json` exports. Reaching into `src/` directly is unsupported.

---

## Runtime architecture — decisions and invariants

This section documents deliberate design decisions in the runtime layer (`runtime.ts`, `themeBootstrap.ts`, `ssrScript.ts`). These decisions have been revisited and should not be reverted without understanding the reasoning.

### `apply()` is the single owner of all DOM writes

`apply()` inside `createThemeRuntime` is the only place that writes `data-tt-theme`, `data-tt-mode`, and `style.colorScheme`. It is called on init and on every subsequent state transition.

`themeBootstrap.ts` exports `resolveTheme`, which **only reads localStorage and resolves the mode** — it never writes the DOM. This separation exists because:

- A single DOM-write path eliminates the need to keep two implementations in sync.
- Previously, `applyTheme` (in `themeBootstrap.ts`) wrote the DOM during init AND `apply()` duplicated the same writes for updates — two owners, invisible coupling.

**Invariant**: if you need to write a new DOM attribute (e.g. `data-tt-contrast`), add it to `apply()` only. Then also add it to the template string in `ssrScript.ts` (see below).

### SSR script — unavoidable duplication, made explicit

`getThemeScriptContent` in `ssrScript.ts` returns a self-contained JavaScript IIFE string. This string replicates the logic of `resolveTheme` + `apply()` because it must run synchronously in the browser **before the app bundle loads** — no imports, no module system.

This is the only remaining duplication and it cannot be eliminated without changing the script delivery mechanism (e.g. build-time emission). It is made explicit and co-located: the template string is in the same file that documents it. The in-source comment marks the exact place to update if `apply()` grows.

**If you add a DOM attribute to `apply()`, you must also add it to the template string in `ssrScript.ts`.** The comment in both files marks the exact location.

The previous approach serialized a TypeScript function via `.toString()`. This was replaced by the explicit template string because:

- `.toString()` output depends on the bundler/transpiler (minification, sourcemaps, coverage instrumentation can break it).
- It prevented Istanbul from covering `applyTheme` — requiring `/* istanbul ignore next */` on the only interesting runtime function.
- The self-containment constraint (`no external references`) was an invisible rule enforced only by a comment, not by the type system.

### `mediaQuery` — single `MediaQueryList`, never re-queried

`window.matchMedia('(prefers-color-scheme: dark)')` is called once per runtime instance and the result is stored in `mediaQuery`. All subsequent reads use `mediaQuery.matches` — never `window.matchMedia(...)` again.

This is correct because browsers mutate `.matches` on the existing `MediaQueryList` object before dispatching the `change` event. Re-calling `window.matchMedia()` on each check would create a new throwaway object per call and would break if the mock in tests returns different objects per call.

**Do not replace `mediaQuery.matches` with a `getSystemMode()` helper that calls `window.matchMedia()` internally.** This was tried and reverted — it creates a new `MediaQueryList` per invocation and makes tests unreliable.

### `onSystemChange` has no guards — this is intentional

```typescript
const onSystemChange = (): void => {
  resolvedMode = mediaQuery.matches ? 'dark' : 'light';
  applyState({ persist: false });
};
```

There are no `if (destroyed)` or `if (mode !== 'system')` guards here, and that is correct:

- `destroyed`: `destroy()` calls `syncMediaListener(false)` synchronously before returning. JS is single-threaded; the handler cannot fire after the listener is removed.
- `mode !== 'system'`: `syncMediaListener` is called on every `setMode`. When mode leaves `'system'`, the listener is removed immediately. The check would be unreachable.

Adding these guards back would imply the runtime can be in an inconsistent state — which it structurally cannot. They are dead code.

### `DEFAULT_STORAGE_KEY` — never hardcode `'tt-theme'`

The default localStorage key is defined once in `runtime.ts` as `DEFAULT_STORAGE_KEY`. Both `runtime.ts` and `ssrScript.ts` use this constant. Do not hardcode `'tt-theme'` anywhere else — a divergence would cause the SSR script and the runtime to read from different keys, silently breaking persistence.

### `resolveSemanticTokens` and `bundleToCssVars` both call `deepMerge(base.semantic, alternate.semantic)` — intentionally

`react.tsx` has a private `resolveSemanticTokens(bundle, resolvedMode)` that returns `SemanticTokens` for the active mode at runtime. `toCssVars.ts › bundleToCssVars` builds an `alternateTheme: ThemeTokens` using the same `deepMerge(base.semantic, alternate.semantic)` call for CSS generation.

They look similar but serve distinct purposes:

- `resolveSemanticTokens` is **mode-sensitive**: it checks `resolvedMode === bundle.baseMode` and returns `base.semantic` unchanged for the base mode. Return type is `SemanticTokens`.
- `bundleToCssVars` is **mode-agnostic**: it always constructs the full alternate `ThemeTokens` (core + merged semantic) regardless of the current user mode, because it needs to emit CSS for both modes upfront. Return type is `ThemeTokens`.

A shared `resolveSemanticForMode` helper would only encapsulate the `react.tsx` path and would not reduce the `toCssVars.ts` code, which has to composite `ThemeTokens` — not `SemanticTokens`. The `deepMerge` call is a correct primitive used independently in two different contexts; this is not duplication.

---

## Token change operations

Every operation must pass `pnpm run test` after completion. Update `coverageThreshold` in `tests/unit/jest.config.ts` whenever coverage changes.

The governance rules and naming invariants are documented in [Governance](../../docs/website/docs/design/01-design-system/02-design-tokens/governance.md) and the [Token Model](../../docs/website/docs/design/01-design-system/02-design-tokens/model.md). This section covers the **operational checklist** for each type of change.

---

### A — Add a leaf to an existing family

_New value in a family whose type already has a slot for it (e.g., new color scale step, new semantic motion spec, new spacing step)._

1. **`Types.ts`** — add the property; mark `optional?` unless every theme must provide it
2. **`baseTheme.ts`** — add the value (and to `darkAlternate` if the token is mode-sensitive)
3. **`tokenRegistry.ts`** — no change if an existing prefix already covers the path
4. **Tests** — add an assertion in the relevant `tests/unit/tests/theme/families/*.test.ts`
5. **Family doc** — update the table and example

---

### B — Expand a family with a new optional sub-tree

_New structural node that does not exist yet (e.g., `core.elevation.emphatic?`, `semantic.elevation.tonal?`, `viewport.width.full`, a new semantic group)._

1. **`Types.ts`** — add an `optional?` interface property; use a named sub-interface so the contract is explicit and extensible
2. **`baseTheme.ts`** — add the values; update `darkAlternate` if the expansion is mode-sensitive
3. **`tokenRegistry.ts`** — add a new entry **if the sub-tree needs a distinct CSS var prefix**, ordered before any less-specific sibling prefix
4. **Tests** — add family assertions; add a Warning test if the new ramp or group has ordering/depth invariants
5. **Family doc** — document the new sub-tree with its own table and update the Example block

**`optional?` vs required:** use `optional?` whenever existing themes may legitimately omit the sub-tree without breaking meaning. Only mark required when the sub-tree is fundamental to all themes (rare for expansions).

---

### C — Rename, restructure, or remove (breaking change)

_Token name changes, path restructuring, or removal. Core path renames change the emitted CSS var name — that is always a public breaking change. Semantic name renames are a contract violation unless handled under deprecation._

**Before starting:** run `grep -r 'old.path'` across the monorepo to assess blast radius. Check whether any consumer outside `theme-v2` uses the CSS variable directly.

**Checklist:**

1. **`Types.ts`** — update the interface; for semantic renames, add `/** @deprecated Use newPath instead */` to the old property and keep it `optional?` for the deprecation window
2. **`baseTheme.ts`** — update all key definitions and all `'{old.path}'` refs in values
3. **`tokenRegistry.ts`** — update the path entry (the emitted CSS var name changes)
4. **`toCssVars.test.ts`** and family tests — update all assertions referencing old paths
5. **`jest.config.ts`** — update coverage threshold
6. **Family doc** — update; note the old name in a migration callout if needed
7. **`CHANGELOG.md`** — add a BREAKING entry with before/after token paths

**Semantic token renames** must follow the deprecation window (see [Governance — Deprecation](../../docs/website/docs/design/01-design-system/02-design-tokens/governance.md#deprecation)):

- keep the old name as `optional?` with `@deprecated` and a replacement pointer
- add the new name as required in the same release
- remove the old name only in the next major version

---

### D — Add a new token family

_A net-new token family with its own core and/or semantic layer (e.g., dataviz, a new spatial system, a new motion sub-system)._

1. **`Types.ts`** — define `CoreXxx` and `SemanticXxx` interfaces; add to `ThemeTokens.core` and `ThemeTokens.semantic` as `optional?` if the family is an extension
2. **`baseTheme.ts`** — add to both `core` and `semantic` blocks; add mode-sensitive entries to `darkAlternate` if needed
3. **`tokenRegistry.ts`** — add path entries, more-specific prefixes before less-specific siblings
4. **Tests** — create `tests/unit/tests/theme/families/xxx.test.ts`; include at minimum the same structural checks as other family tests (refs resolve, semantic tokens are refs, ordering invariants if any)
5. **Docs** — create `docs/website/docs/design/01-design-system/02-design-tokens/02-families/xxx.md`; use `elevation.md` as a structural template

If the family is optional (an extension like dataviz), mark it `optional?` in `ThemeTokens` so existing single-family themes still pass `satisfies ThemeTokens`.

---

## Semantic token naming grammar

Each family has its own grammar. The color family (`semantic.colors.*`) follows a strict four-level path:

`{ux}.{role}.{dimension}.{state}`

```
ux        → action | input | navigation | feedback | informational
role      → primary | secondary | negative | caution | positive | ...
dimension → background | border | text
state     → default | hover | active | focused | disabled | selected | ...
```

Other families have shallower paths (`elevation.surface.{stratum}`, `spacing.gap.{axis}.{step}`, etc.) — see `Types.ts` for each family's contract.

Never use: component names (`cardBg`), mode names (`darkSurface`), raw values in semantic.

---

## Tests

```bash
# from packages/theme-v2/
pnpm run test

# specific file
pnpm run test --testPathPatterns=toCssVars
```

Test layout mirrors source: `tests/unit/tests/engine/`, `tests/unit/tests/theme/families/`, etc.
`tests/unit/helpers/theme.ts` exports a minimal test theme factory used across all test files.
