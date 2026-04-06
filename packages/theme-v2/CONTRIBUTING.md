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
    helpers.ts          — isTokenRef, extractRefPath, deepMerge, flattenObject, flattenAndResolve
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
        └──▶ flattenAndResolve()  → flat record of all tokens resolved to raw values
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
- `flattenAndResolve(theme)` — flattens + recursively resolves all refs to raw values

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
3. Calls `flattenAndResolve` for the resolved-tokens context
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
ux        → action | input | navigation | feedback | content | guidance | discovery
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
