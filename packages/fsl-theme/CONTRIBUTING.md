# Architecture & Contributing Guide

## Architecture — the rule

Components consume only `semantic` tokens. `semantic` values are `{core.path}` references; `core` holds raw primitives. Mode switches remap which `core` value each `semantic` token resolves to — `core` itself is never touched.

```
ThemeTokens
├── core     — raw primitives (immutable across modes)
└── semantic — {core.*} references (the public contract; remapped per mode)
```

```ts
action.primary.background.default: '{core.colors.brand.500}'
```

A `semantic` value holding a raw value (not a `{ref}`) is an audited exception — see [Token Model §8 — RawValue inventory](../../docs/website/docs/design/design-system/design-tokens/model.md#8-rawvalue-exceptions-are-rare-intentional-and-registered).

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
  themeBootstrap.ts     — read-only mode resolution (no DOM writes — see ADR-002)
  ssrScript.ts          — inline JS string for SSR flash prevention (see ADR-003)
  runtime-entry.ts      — sub-path entry for '@ttoss/fsl-theme/runtime'

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

`{path}` syntax is the only way `semantic` values point at `core`:

```ts
'{core.colors.brand.500}'; // pure reference
'clamp({core.spacing.4}, 1cqi, {core.spacing.8})'; // embedded in expression
```

Helpers in `roots/helpers.ts`: `isTokenRef`, `extractRefPath`, `toFlatTokens` (resolves all refs to raw values; returns both `core.*` and `semantic.*` keys — see ADR-007).

---

## CSS variable naming

`roots/tokenRegistry.ts` is the single source of truth. `toCssVars.ts` and `toDTCG.ts` derive their lookup tables from it. **Adding a new token family ⇒ add an entry, ordered most-specific prefix before least-specific sibling.**

| Path                      | CSS var                    |
| ------------------------- | -------------------------- |
| `core.<family>.<sub>`     | `--tt-core-<family>-<sub>` |
| `semantic.<family>.<sub>` | `--tt-<family>-<sub>`      |

Examples: `core.colors.brand.500` → `--tt-core-colors-brand-500`; `semantic.colors.action.primary.background.default` → `--tt-colors-action-primary-background-default`; `core.elevation.emphatic.2` → `--tt-core-elevation-emphatic-2`; `semantic.dataviz.color.scale.sequential.1` → `--tt-dataviz-color-scale-sequential-1`.

`toCssVars` behavior: `core` → raw value; `semantic` → `{ref}` replaced by `var(--tt-…)`, compound expressions handled inline.

---

## vars.ts — static typed map

`vars` is a typed mirror of `SemanticTokens` where every leaf is a `var(--tt-*)` string. Generated once at build-time from `baseBundle`; never changes at runtime. Var names are stable across themes — only the CSS custom property values change on theme/mode switch.

```ts
import { vars } from '@ttoss/fsl-theme/vars';
vars.colors.action.primary.background.default;
// → 'var(--tt-colors-action-primary-background-default)'
```

---

## createTheme — internals

`createTheme` calls `buildTheme` (internal): `deepMerge(base, overrides)` + `structuredClone` to break shared references. Result is a `ThemeBundle`. `alternate: null` opts out of the built-in `darkAlternate`. `extends` merges a parent `ThemeBundle` before `overrides` are applied. See README for usage examples.

---

## React integration — internal flow

`ThemeProvider`:

1. Creates a `ThemeRuntime` (mode resolution + localStorage persistence)
2. Resolves `SemanticTokens` for the current mode (`deepMerge(base.semantic, alternate.semantic)` — see ADR-006)
3. Calls `toFlatTokens` for the resolved-tokens context
4. Injects CSS via `getThemeStylesContent` into a `<style>` tag
5. Writes `data-tt-mode` on `<html>` (via `apply()` — see ADR-002)

User-facing hook contracts: see [README — Hooks](./README.md#hooks).

---

## SSR / flash prevention

User-facing integration: see [README — Next.js (SSR)](./README.md#nextjs-ssr). Internal mechanics: see ADR-002 (single DOM-write owner) and ADR-003 (script delivery).

> Import only from sub-paths defined in `package.json` exports. Reaching into `src/` directly is unsupported.

---

## Naming rules

Each family owns its semantic grammar — see `Types.ts` for the contract and the family doc (e.g. [`colors.md`](../../docs/website/docs/design/design-system/design-tokens/families/colors.md)) for the full path syntax.

Forbidden in `semantic` names across all families:

- component names (`cardBg`)
- mode names (`darkSurface`)
- raw values

---

## Semantic-leaf JSDoc

Every selectable `semantic` leaf carries JSDoc that closes a _selection_ decision the type alone cannot close. The package's discoverability surface for IDE hover and external LLM consumers lives entirely in these comments — there is no parallel manifest.

**Shape (basis form):**

```ts
/**
 * <one-line purpose>.
 * Use when <discriminator the reader is asking>.
 * Pair with <nearest sibling>; do not use for <its job>.   // omit if no sibling competes
 */
```

**Word-choice axes** (each must hold; failing one signals a wrong axis, not a wording fix):

- **Role, not rendering.** What the token _is for_ (`raised surface depth`), never what it _looks like_ (`soft grey shadow`). Renderings change per mode; the role is the invariant.
- **Discriminator, not symptom.** Cite the question the reader is asking _before_ deciding (`element accepts dropped items`), not what they would observe _after_ (`highlighted drag state`).
- **Nearest sibling only.** Disambiguate against the _one_ token most likely to be confused, not a list. No competing sibling → omit the line.
- **Vocabulary borrowed, not invented.** Use the terms the family spec ([`families/<family>.md`](../../docs/website/docs/design/design-system/design-tokens/families/)) already defines for that family's axes — `{ux}` and `{role}` for colors, `control`/`surface` for borders/radii/spacing, level numbers for elevation, and so on. Cross-family concepts use FSL Lexicon names (Entity Kind, Structural Role, Evaluation). Forbidden filler: `typically`, `recommended`, `general-purpose`, `flexible`, `in most cases`.
- **One decision per line.** Comma-clause exceptions ("…, except when…") are separate leaves — promote, don't bury.

**Audit before commit.** Could a sibling's JSDoc be swapped onto this leaf without losing accuracy? If yes, re-pick words until only this leaf could carry them.

**Spec disagreement is a stop signal.** If the family spec and the type contradict, surface as an unstated invariant — do not paper over in JSDoc.

---

## Tests

```bash
# from packages/fsl-theme/
pnpm run test

# specific file
pnpm run test --testPathPatterns=toCssVars
```

Test layout mirrors source: `tests/unit/tests/engine/`, `tests/unit/tests/theme/families/`, etc. `tests/unit/helpers/theme.ts` exports a minimal test theme factory used across all test files.

---

## Token change operations

Every change touches some subset of these axes. Pick the subset by change kind; mode-sensitivity is orthogonal. Run `pnpm run test` after; update `coverageThreshold` in `tests/unit/jest.config.ts` if coverage moves.

| Axis                                                    | Action                                                                                                                                                                                  |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type contract** (`Types.ts`)                          | Add the property. `optional?` unless every theme must provide it. Use named sub-interfaces for new sub-trees.                                                                           |
| **JSDoc** (semantic leaf)                               | New semantic leaf → add JSDoc per [Semantic-leaf JSDoc](#semantic-leaf-jsdoc). Renaming a leaf carries its JSDoc forward; restructuring re-evaluates against the _new_ nearest sibling. |
| **Default values** (`baseTheme.ts`)                     | Add the value. Mode-sensitive entries also go into `darkAlternate.semantic` (core never).                                                                                               |
| **CSS naming** (`tokenRegistry.ts`)                     | Add only if a new prefix is needed. More-specific prefixes ordered before less-specific siblings.                                                                                       |
| **Tests** (`tests/unit/tests/theme/families/*.test.ts`) | Family assertions. Add a Warning test for new ramps/groups with ordering or depth invariants.                                                                                           |
| **Family doc** (`docs/.../families/*.md`)               | Table + example. Use `elevation.md` as a structural template for new families.                                                                                                          |
| **CHANGELOG**                                           | Only on breaking changes. BREAKING entry with before/after token paths.                                                                                                                 |

**Change kinds** (the span over the axes above):

- **Additive within an existing path** (new color step, new spacing step) — Type + Values + Tests + Doc.
- **New sub-tree or new family** (`core.elevation.emphatic?`, dataviz) — add a CSS-naming entry; mark the sub-tree `optional?` so existing themes still satisfy `ThemeTokens`.
- **Breaking** (rename, restructure, remove) — all axes + CHANGELOG. Run `grep -r 'old.path'` first to assess blast radius (consumers may reference CSS vars directly). Semantic renames follow the deprecation window in [Governance — Deprecation](../../docs/website/docs/design/design-system/design-tokens/governance.md#deprecation): keep the old name `optional?` with `/** @deprecated Use newPath instead */`, add the new name as required in the same release, remove the old name only in the next major. Core-path renames change the emitted CSS var name — public breaking, no soft path.

---

## Decisions (ADRs)

Canonical trade-off record. Code references use `@adr ADR-NNN — <one-line reason>` in JSDoc, linking to the heading here.

**Citation scope** — a bare `ADR-NNN` always refers to an ADR in this package's CONTRIBUTING.md. Citing another package's ADR requires the package prefix — e.g. `fsl-ui ADR-010` — because `@ttoss/fsl-theme` and `@ttoss/fsl-ui` keep independent, homonymous ID ranges. IDs are never renumbered.

**Entry gate** — all three required: a reasonable alternative was rejected; the chosen path has a visible cost; a reviewer without context will propose the alternative. One or two → JSDoc on the symbol; when in doubt, prefer JSDoc.

**Style** — titles, `Decision` lines, and re-litigation answers follow [Basis Form](../copilot-instructions.md#writing--basis-form). A re-litigation answer longer than one line signals wrong level — raise the principle.

**Lifecycle** — IDs sequential, never reused; append only; never delete. Superseded entries: keep ID, add `Status: superseded-by:ADR-NNN`.

**Review** — search here before flagging. Matching ADR → closed, reference it; new evidence → propose `superseded-by`. No match: bug → fix directly; trade-off → draft ADR first; neither → JSDoc or leave it.

### ADR format (mandatory, fixed field order)

One line per bullet. No prose unless a single sentence is insufficient. Empty field → `—`.

```
### ADR-NNN: <Short title>

Status: accepted | superseded-by:ADR-MMM | deprecated  (YYYY-MM-DD)
Tags: <comma-separated keywords>

Decision: <one sentence — what was chosen>.
Rejected: <Alt A — one-line reason>; <Alt B — one-line reason>.
Cost: <the visible price we pay — one line>.
Anchors: `file.ts`, `docs/.../family.md#section`.

Re-litigation answers:
- <recurring question> → <one-line answer>.
```

### Records

_Append new entries below this line. Newest at the bottom._

### ADR-001: Semantic color grammar is a normative FSL projection, not a 1:1 mirror

Status: accepted (2026-05-07)
Tags: colors, semantic-grammar, fsl-projection, ux-axis

Decision: `semantic.colors.{ux}.{role}.{dimension}.{state}` is a normative FSL §17.1 projection: `ux` maps to 5 names (`action | input | navigation | feedback | informational`), `informational` collapsing `Collection | Overlay | Structure`; `Selection` → `input`; `Disclosure` → `navigation`; contract in `colors.md`.
Rejected: 1:1 mirror of all 9 Entity Kinds — triples surface today for hypothetical future divergence (violates model.md §6 "no parallel vocabulary"); rename `informational` to `surface` — `surface` is already a Structural Role in the FSL Lexicon, creates cross-dimension name collision.
Cost: token names ≠ FSL term names by construction; readers crossing from FSL docs to token docs need the projection table once.
Anchors: `src/Types.ts` → `SemanticColors`, `docs/website/docs/design/design-system/design-tokens/model.md#semantic-color-grammar--fsl-projection`, `docs/website/docs/design/design-system/design-tokens/families/colors.md#fsl-entity-kind-mapping`.

Re-litigation answers:

- "`informational` is not in the FSL Lexicon" → correct and intentional. `ux` is a projected axis, not the Entity Kind set.
- "The collapse loses the original Entity Kind" → Entity Kind lives on the component, not on the token. Tokens carry value, not identity.
- "What if Overlay needs to diverge from Collection later?" → add `semantic.colors.overlay.*` then; migration is local. Not a reason to triple the surface today.
- "Use `surface` instead of `informational`" → `surface` is a Structural Role (fsl-lexicon.md §2). Reusing it on the `ux` axis collides across FSL dimensions.
- "Why does the projection have a different name from FSL?" → because it is a projection. A 1:1 mirror would not be a projection — it would be a duplicate vocabulary.

### ADR-002: `apply()` is the single owner of all DOM writes

Status: accepted (2026-05-07)
Tags: runtime, dom, ssr

Decision: All DOM writes (`data-tt-theme`, `data-tt-mode`, `style.colorScheme`) flow through `apply()` in `createThemeRuntime`, called on init and on every state transition. `themeBootstrap.ts › resolveTheme` is read-only.
Rejected: split init writes (in `themeBootstrap`) from update writes (in `apply()`) — two owners, invisible coupling, drift on every new attribute.
Cost: the SSR template string in `ssrScript.ts` mirrors `apply()` (see ADR-003); a new attribute lands in two places, not one.
Anchors: `src/runtime.ts` › `apply`, `src/themeBootstrap.ts` › `resolveTheme`, `src/ssrScript.ts`.

Re-litigation answers:

- "Why doesn't `themeBootstrap` apply on init?" → splitting writers caused drift; `apply()` runs on init too.
- "Adding a new `data-tt-*` attribute — where?" → `apply()` only, then mirror into the `ssrScript.ts` template (ADR-003).

### ADR-003: SSR script is an explicit template string, not a serialized function

Status: accepted (2026-05-07)
Tags: runtime, ssr, build, coverage

Decision: `getThemeScriptContent` in `ssrScript.ts` returns a hand-written IIFE template string mirroring `resolveTheme + apply()`; `DEFAULT_STORAGE_KEY` exported from `runtime.ts` is shared by both files — never hardcoded.
Rejected: serialize a TS function via `Function.prototype.toString()` — bundler/transpiler-dependent (minify, sourcemaps, coverage instrumentation); blocked Istanbul coverage on the only interesting runtime path; self-containment was an invisible rule enforced only by a comment.
Cost: any DOM-write change in `apply()` (ADR-002) must also land in the template string. Co-located comment marks the exact spot.
Anchors: `src/ssrScript.ts` › `getThemeScriptContent`, `src/runtime.ts` › `apply`, `DEFAULT_STORAGE_KEY`.

Re-litigation answers:

- "Why duplicate `apply()`?" → the script must run before the bundle loads; no module system available inline.
- "Use `Function.prototype.toString`?" → reverted; bundler-fragile and uncoverable.
- "Hardcode `'tt-theme'` here?" → no. Import `DEFAULT_STORAGE_KEY`; divergence silently breaks persistence.

### ADR-004: `mediaQuery` is cached once per runtime, never re-queried

Status: accepted (2026-05-07)
Tags: runtime, color-scheme, testing

Decision: `window.matchMedia('(prefers-color-scheme: dark)')` is cached once per `createThemeRuntime` instance; all reads use `mediaQuery.matches`, listener managed by `syncMediaListener`.
Rejected: a `getSystemMode()` helper that calls `matchMedia` per read — produces a new throwaway `MediaQueryList` per call; tests using mocks that return distinct objects per call become unreliable.
Cost: the runtime instance owns the `MediaQueryList` for its lifetime; `destroy()` must remove the listener.
Anchors: `src/runtime.ts` › `createThemeRuntime`, `syncMediaListener`.

Re-litigation answers:

- "Why not call `matchMedia` each time?" → browsers mutate `.matches` on the existing object before dispatching `change`; re-querying is unnecessary and breaks mocks.

### ADR-005: `onSystemChange` carries no defensive guards

Status: accepted (2026-05-07)
Tags: runtime, invariants

Decision: The handler unconditionally updates `resolvedMode` and applies state — no `if (destroyed)` or `if (mode !== 'system')` checks.
Rejected: defensive guards.
Cost: none — guards are structurally unreachable: `destroy()` is synchronous; `setMode` re-syncs the listener on every mode change.
Anchors: `src/runtime.ts` › `onSystemChange`, `syncMediaListener`, `destroy`.

Re-litigation answers:

- "Race against `destroy()`?" → JS is single-threaded; the listener is removed before `destroy()` returns.
- "Stale handler when mode changes?" → `syncMediaListener` runs on every `setMode`; the check would be dead code.
- "The code has `if (destroyed) return` — doesn't that contradict this ADR?" → the guard exists for _mocked_ media queries in tests, which can invoke a captured handler after `destroy()`; real browsers never do. The ADR's claim stands for production paths; the guard is test-harness accommodation, not a defensive-programming pattern to extend.

### ADR-006: `resolveSemanticTokens` and `bundleToCssVars` both call `deepMerge` — no shared helper

Status: accepted (2026-05-07)
Tags: react, css-generation, deepmerge

Decision: Keep the two `deepMerge(base.semantic, alternate.semantic)` call sites separate — they differ in return type (`SemanticTokens` vs `ThemeTokens`) and mode-sensitivity.
Rejected: extract a shared `resolveSemanticForMode(bundle, mode)` helper — covers only the React path; `bundleToCssVars` still has to composite a full `ThemeTokens`, so the second call survives.
Cost: the literal expression appears in two files; readers may misread it as duplication.
Anchors: `src/react.tsx` › `resolveSemanticTokens`, `src/roots/toCssVars.ts` › `bundleToCssVars`.

Re-litigation answers:

- "Extract a shared helper?" → return types differ (`SemanticTokens` vs `ThemeTokens`); one is mode-sensitive, the other is not. The helper would not eliminate the second call.

### ADR-007: `toFlatTokens` returns both `core.*` and `semantic.*` keys; no semantic-only wrapper

Status: accepted (2026-05-07)
Tags: helpers, api-surface

Decision: `toFlatTokens` flattens and resolves all refs, returning both `core.*` and `semantic.*` keys. Callers needing only semantic keys filter `key.startsWith('semantic.')` at the call site.
Rejected: a `toFlatSemanticTokens` wrapper.
Cost: every semantic-only consumer carries a one-line filter.
Anchors: `src/roots/helpers.ts` › `toFlatTokens`.

Re-litigation answers:

- "Why not a wrapper?" → core keys are required internally for ref resolution; a wrapper over a one-line filter would be a single-use abstraction.

### ADR-008: `baseTheme.ts` is an explicit data declaration — no builders or recipes

Status: accepted (2026-05-08)
Tags: baseTheme, maintainability, data

Decision: `baseTheme.ts` is a data declaration; no builder, recipe, or generator creates any part of it.
Rejected: builder helpers (`buildRoleColors`, `interactive`) — force readers to trace callsites to read a single token value; `TokenRef` is `string`, so neither approach catches value-level typos.
Cost: ~1860 lines; apparent repetition is the explicit contract, not accidental.
Anchors: `src/baseTheme.ts`.

Re-litigation answers:

- "The file has too many lines / extract the repeated pattern" → it is a data file; line count is not complexity, and explicit repetition is the contract.
- "A builder eliminates the human error window" → the error window is value-level (`TokenRef` is `string`); shape validation by `ThemeTokens` is identical either way.

### ADR-009: Semantic hit tokens expose fine-pointer default only; coarse delivered via emitter + non-CSS bridges

Status: accepted (2026-05-08)
Tags: sizing, hit-targets, pointer, css-emitter, non-css-consumers

Decision: `semantic.sizing.hit.*` resolves to the fine-pointer ergonomic default; coarse delivery is an emitter + bridge concern, not a token-value concern.
Rejected: parallel `semantic.sizing.hit.coarse.*` tokens — components would need pointer-type conditional logic, defeating the ergonomic guarantee.
Cost: the type contract appears single-valued; coarse delivery via emitter + bridges is invisible to `tsc`.
Anchors: `src/roots/toCssVars.ts` › `buildCoarseHitVars`, `src/roots/toDTCG.ts` › `buildHitExtension`, `src/react.tsx` › `applyCoarseHitOverrides`.

Re-litigation answers:

- "`semantic.sizing.hit.*` lies about the coarse value" → the type states the ergonomic default; coarse is emitter scope, same axis as ADR-009's Decision.
- "JS can't read the coarse value" → `toDTCG` `$extensions` and `react.tsx` `applyCoarseHitOverrides` already provide it; parallel tokens would shift the burden to the component.
- "This is magic coupling" → the coupling is explicit: each delivery path has a named function, JSDoc, and a test.

### ADR-010: `CoreColorRef` is an open template literal, not generated from `baseTheme`

Status: accepted (2026-05-08)
Tags: types, CoreColorRef, palette, theme-extensibility

Decision: `CoreColorRef` is `TokenRef<'core.colors.${string}'>` — an open template literal, not a union derived from `typeof baseTheme.core.colors`.
Rejected: generate a closed `CoreColorRef` union from `baseTheme` — creates a Types.ts → baseTheme.ts import cycle (`baseTheme` uses `satisfies ThemeTokens` which imports Types.ts); breaks extensibility (derived themes add families and steps unknown to `baseTheme`); typo-safety gain is zero on top of what the semantic layer already enforces (legal `ux × role × dimension × state` combinations and contrast pairings).
Cost: a ref like `'{core.colors.brand.999}'` is accepted by `tsc` even if `brand.999` is absent from the theme; caught only at runtime by the resolver.
Anchors: `src/Types.ts` → `CoreColorRef`, `src/baseTheme.ts`, `docs/.../colors.md#hue-scales`.

Re-litigation answers:

- "Generate a closed union for autocomplete / typo-safety" → cycle + extensibility breakage; runtime resolution already surfaces missing refs.
- "Use `typeof baseTheme` without touching Types.ts" → consumers calling `createTheme` with a derived theme have no `baseTheme` — the closed union would reject their valid family names and steps.

### ADR-011: `outline.selected` lives inside `border.outline.*`; `focus.ring` stays a separate family

Status: accepted (2026-05-08)
Tags: borders, outline, selected, focus, shape-grouping

Decision: the selected-state line is `border.outline.selected` (sibling of `outline.surface` and `outline.control`); `focus.ring` remains a top-level `semantic.focus.*` family with a `color` field and an accessibility contract distinct from `border.*`.
Rejected: keep `border.selected` flat alongside `border.outline.*` — same `SemanticBorderOutline` shape and same CSS mechanism (`outline`) as the rest of `outline.*`, so the flat sibling hides the grouping; collapse `focus.ring` into `outline.focus` — drops the cross-cutting `color: TokenRef<'semantic.${string}'>` field, and `focus.ring` is implemented via CSS `outline` as an accessibility contract that must not layout-shift, not as an "outline-at-rest" variant (borders.md §Focus Implementation).
Cost: one extra path level for selected-state lines (`border.outline.selected` vs `border.selected`); the canonical set is now four `border.*` entries plus `focus.ring`, breaking strict symmetry with the previous five-entry list.
Anchors: `src/Types.ts` → `SemanticBorder`, `src/baseTheme.ts` › `semantic.border`, `docs/website/docs/design/design-system/design-tokens/families/borders.md#canonical-semantic-set`.

Re-litigation answers:

- "Why not flatten `outline.{surface,control}` to siblings of `selected` instead?" → `outline.*` is a grouping by CSS mechanism and shape; flattening loses the namespace that lets a component iterate `outline.{surface|control|selected}` uniformly.
- "Unify `focus.ring` under `outline.focus` for one shape" → `focus.ring.color` is part of the contract; `outline.{surface,control,selected}` intentionally have no `color` (color belongs to the color system per borders.md). Unifying either drops `color` from focus or adds it everywhere — both regressions.
- "Add `outline.selected.color`" → contradicts borders.md "Color expresses what the line means" / "Width and style express how strong the line is"; selected color is supplied by `semantic.colors.{ux}.{role}.border.selected`.

### ADR-012: Pre-adoption window — hard-rename now, no deprecation aliases

Status: accepted (2026-07-12)
Tags: governance, versioning, breaking-change, pre-adoption

Decision: while the package has zero consumers, contract renames/removals are applied as **direct breaking changes** — no `@deprecated` aliases, no soft path — landed under a single MAJOR bump via a `BREAKING CHANGE:` commit footer (lerna-lite computes the version). This overrides the deprecation window that `governance.md#deprecation` and the "Token change operations" table below otherwise require for semantic renames.
Rejected: follow the deprecation window even now — carries dead alias tokens and JSDoc into a system with no consumers, the exact cruft the window exists to avoid; hand-author a changeset file — the repo uses lerna-lite + Conventional Commits, not changesets.
Cost: the window is time-boxed and self-expiring — the moment the first consumer adopts `@ttoss/fsl-theme`, this ADR no longer applies and `governance.md`'s deprecation window is back in force for every subsequent rename. Residual risk: an unknown external npm consumer of `1.1.x` gets a hard break at `2.0.0` (low — single "Init" release, no repo consumers).
Anchors: `governance.md#deprecation`, `../../docs/website/docs/design/design-system/design-tokens/governance.md`, this file's "Token change operations" table.

Re-litigation answers:

- "Governance says renames need a deprecation window" → correct, and this ADR overrides it **only** for the pre-adoption window. Expiry is explicit: first consumer adoption.
- "Why MAJOR if there are no consumers?" → the published `1.1.x` line exists on npm; SemVer honesty for any external consumer requires MAJOR even when the in-repo blast radius is zero.
- "Where is the changeset?" → there is none; versioning is Conventional Commits + lerna-lite. Breaking changes ride a `BREAKING CHANGE:` footer that enumerates every renamed/removed path.

### ADR-013: `toDTCG` emits a resolved-scalar profile; `$type` omitted for opaque tokens

Status: accepted (2026-07-12)
Tags: dtcg, interchange, conformance, toDTCG

Decision: `toDTCG` emits a **conformant resolved-scalar** DTCG (2025.10) profile — `$value`s are fully resolved (no `{alias}`), composite shapes are emitted as their individual scalar leaves, and `$type` is **omitted** for opaque tokens (keywords, easing curves, border styles, SVG dash strings) rather than emitting an invalid type. There is no `'string'` DTCG type; the registry's `dtcgType` is now optional and absent for those entries.
Rejected: emit `$type: 'string'` (the prior behaviour) — `'string'` is not a DTCG type, so conformant importers (Style Dictionary, Tokens Studio) reject/ignore the token; deferred (not rejected) are three enhancements below.
Cost: the export is a flattened snapshot, not a themeable alias graph, and composites lose their grouped semantics — acceptable for a first conformant profile; see deferred items.
Anchors: `src/roots/toDTCG.ts` › `inferDtcgType`, `src/roots/tokenRegistry.ts` › `dtcgType?`, `tests/unit/tests/engine/output/toDTCG.test.ts`.

Deferred enhancements (tracked, not yet built — all are additive richness, not conformance fixes):

- **Composite objects** — emit `$type: "typography" | "shadow" | "border" | "transition"` with structured object `$value`s instead of scalar leaves. Requires grouping composite leaves in the tree builder.
- **Alias preservation** — emit `$value: "{core.colors.brand.500}"` (DTCG dot-path aliases) instead of resolved values, behind a `resolve: false` option, so the export round-trips as a graph.
- **`$description`** — populate from the semantic-leaf JSDoc (the package's richest asset). Requires a build-time JSDoc-extraction pipeline (ts-morph, as in `scripts/probe-jsdoc-propagation.ts`); `toDTCG` is a pure runtime function over `ThemeTokens` and has no access to the type-source comments.

Re-litigation answers:

- "A resolved snapshot isn't real DTCG" → resolved scalar tokens are fully conformant; aliases and composites are optional spec features, not requirements.
- "Why omit `$type` instead of picking one?" → opaque values (`tabular-nums`, `cubic-bezier(…)`, `solid`, dash-arrays) have no valid DTCG scalar type; `$type` is optional in the spec, so omission is correct and an invalid type is not.
- "Easing should be `cubicBezier`" → DTCG `cubicBezier` is a 4-number array; our easings are CSS strings (incl. named `ease`). Converting is part of the deferred composite/typed work, not this profile.

### ADR-014: Canonical bundles emit a `prefers-color-scheme` fallback block

Status: accepted (2026-07-14)
Tags: css-generation, dark-mode, no-js, progressive-enhancement

Decision: `bundleToCssVars` without `themeId` appends the alternate diff inside `@media (prefers-color-scheme: <alternateMode>)` scoped to `:root:not([data-tt-mode])`, gated by `systemModeFallback` (default `true`; `<ThemeProvider>`/`<ThemeHead>` derive it as `defaultMode === 'system'`), so the OS preference applies before JS runs (and when it never runs); the block self-disables the moment any runtime stamps `data-tt-mode`.
Rejected: JS-only dark mode (previous behaviour) — no-JS users and pre-`ThemeScript` paints never get dark; duplicating the full dark block under the media query — persisted user choice must always beat the OS preference, which requires the `:not([data-tt-mode])` guard, not duplication.
Cost: the emitted CSS grows by the diff-block size (+19 KB raw, <1 KB gzip); multi-theme (`themeId`) output intentionally has no fallback — scoping there is runtime-managed; direct `getThemeStylesContent` callers with a fixed light/dark default must pass `{ systemModeFallback: false }` themselves.
Anchors: `src/roots/toCssVars.ts` › `buildSystemModeFallbackBlock`, `tests/unit/tests/engine/output/toCssVars.test.ts` › "system-mode fallback block".

Re-litigation answers:

- "Why `:not([data-tt-mode])` instead of higher specificity?" → the fallback must lose to any explicit mode, including `data-tt-mode="light"` chosen by a dark-OS user.
- "Why not emit it for `themeId` bundles?" → scoped bundles exist for runtime-managed multi-theme hosts; an OS-level fallback would fight the host's explicit scoping.
- "Why gate on `defaultMode === 'system'`?" → a light-first app (`defaultMode="light"`, dark only via toggle) must not render dark for dark-OS users on first paint or without JS; the OS preference is only authoritative when the app declares it follows the OS.

### ADR-015: Text-contrast exemption is muted-only; filled negative uses `red.600`

Status: accepted (2026-07-14)
Tags: colors, contrast, accessibility, wcag

Decision: the text-vs-background AA Large (3:1) exemption applies only to `*.muted.*` contexts; `action.*` is held to AA Normal (4.5:1), and `red.600` (`#dc2626`, 4.83:1 with `neutral.0`) exists so `action.negative` filled surfaces pass.
Rejected: blanket `action.*` exemption as "large/bold text" (previous behaviour) — button labels render at `text.label` sizes (14–16px medium), which do not meet the WCAG large-text definition (≥ 24px, or ≥ 18.66px bold); keeping `red.500` as the filled bg — 3.76:1 with white text fails AA Normal in both modes.
Cost: one extra red step in the core palette; themes overriding the red scale must provide a 600-range step (or remap `action.negative`) to keep the guarantee.
Anchors: `src/baseTheme.ts` › `core.colors.red.600` + `semantic.colors.action.negative`, `tests/unit/tests/theme/families/colors.test.ts` › "Color contrast — text vs background", `docs/website/docs/design/design-system/design-tokens/families/colors.md#required-pairings`.

Re-litigation answers:

- "Buttons are bold-ish, treat them as large text" → `text.label.md` is 14–16px medium (500); WCAG large text starts at 18.66px **bold**. The exemption would be an audit failure.
- "Why keep `.muted.` at 3:1?" → muted is _defined_ as intentionally subdued; its contract is documented as AA Large in colors.md.

### ADR-016: Unregistered `semantic.*` paths drop the `semantic-` segment in CSS var names

Status: accepted (2026-07-14)
Tags: css-naming, extensions, tokenRegistry

Decision: `toCssVarName`'s unregistered-path fallback strips a leading `semantic.` so custom families follow the registered-family convention (`semantic.chart.grid` → `--tt-chart-grid`, like `semantic.colors.*` → `--tt-colors-*`); core paths keep their `core-` segment.
Rejected: keep the raw path (previous behaviour, `--tt-semantic-chart-grid`) — extensions would diverge from every built-in family's naming for no benefit; requiring a registry entry for every extension — theme-local families should not have to patch the package.
Cost: a custom semantic family named like a future registered family could collide earlier; `assertDistinctCssVars` catches collisions in dev.
Anchors: `src/roots/toCssVars.ts` › `toCssVarName`, `src/roots/tokenRegistry.ts`.

Re-litigation answers:

- "Is this a breaking rename?" → no shipped token uses the fallback path (all are registered); only hypothetical extension vars change, pre-adoption (ADR-012).

### ADR-017: Validation outcome is the `invalid` State, not the `negative` role

Status: accepted (2026-07-15)
Tags: colors, validation, states, fsl-ui, governance

Decision: validation failure is a **runtime State** — `input.{role}.{dimension}.invalid` — flipped by `isInvalid`/form libraries; the `negative` Evaluation role on a control is authorial valence and never expresses validation; adjacent display parts (validationMessage, icon) keep consuming `input.negative.*`.
Rejected: mapping `isInvalid` to the `negative` role on the control (this file's previous doctrine in `colors.ts`) — makes a runtime fact look like an authorial choice (`<TextField evaluation="negative">` is a category mistake) and collides with the industry-consensus boolean-state model (React Aria `isInvalid`, Spectrum `validationState`, MUI `error`); keeping the fsl-theme/fsl-ui doctrines split — `@ttoss/fsl-ui` already shipped `invalid` in `STATES` + `STATE_PRIORITY` and consumed `input.primary.*.invalid`, which resolved to `undefined` (invalid fields rendered visually silent).
Cost: a 12th input state in the contract; themes overriding `input.primary` should supply mode-safe `invalid` values (dark inherits light values unless overridden — see `darkAlternate`).
Anchors: `src/families/colors.ts` › `InputColorStates.invalid`, `src/baseTheme.ts` › `input.primary.*.invalid`, `packages/fsl-ui/src/semantics/taxonomy.ts` › `STATES`/`STATE_PRIORITY`, `fsl-lexicon.md` §7/§10.15.

Re-litigation answers:

- "States are not free-form (FSL §7) — why admit a new one?" → through governance, which is this ADR plus the Lexicon §7 entry; the state has runtime legality (only where validation semantics apply) like `visited`/`indeterminate`.
- "Why does validationMessage still use `negative`?" → it _displays_ valence about the outcome; the control _carries_ the state. Same split as Lexicon §10.9 (part vs slot).
- "`invalid` equals `negative` visually — parallel vocabulary?" → same value, different meaning axis (State vs Evaluation); divergence stays free (e.g. themes may tint invalid backgrounds without touching the negative role).

### ADR-018: Dark depth is carried by tonal surface colour, not shadow

Status: accepted (2026-07-18)
Tags: elevation, colors, dark-mode, craft, surface

Decision: populate the spec-sanctioned optional `semantic.elevation.tonal.{raised|overlay|blocking}` in `baseTheme` (light: neutral.0; dark alternate: neutral.800 → 700), and add core `neutral.600`/`neutral.800` so the dark canvas (neutral.900) can stratify in fine steps — a surface component reads `tonal` for its background and the paired `surface` recipe for its shadow.
Rejected: shadow-only depth (previous state) — `emphatic` recipes are near-black shadows that are invisible on the near-black dark canvas (elevation.md Rule 6), so raised surfaces read flat; reusing `informational.{secondary|muted}` as a surface ladder — those are emphasis variants whose value direction inverts between light and dark, so one token cannot mean "raised" in both modes.
Cost: two new core neutral steps (600/800) emit as CSS vars; `tonal` is now part of the default `vars` shape, so consumers can read `vars.elevation.tonal.*`.
Anchors: `src/baseTheme.ts` › `semantic.elevation.tonal` (base + `darkAlternate`), `src/baseTheme.ts` › `core.colors.neutral.600/800`, `docs/website/docs/design/design-system/design-tokens/families/elevation.md#surface--shadow`.

Re-litigation answers:

- "Is adding `tonal` a grammar extension needing governance?" → no — `SemanticElevation.tonal` is already declared optional in `families/elevation.ts` and sanctioned by elevation.md; this populates it, it does not invent it.
- "Why not a new `surface.{canvas|raised}` colour family?" → the tonal contract already expresses surface-colour-at-depth paired with the shadow recipe; a parallel family would duplicate it (model.md "no parallel vocabulary").

### ADR-019: Density is a theme projection; control geometry is not container-fluid

Status: **reverted (2026-07-19)** — the density projection shipped with **zero
real consumers**. Per the evidence rule (a token/axis is admitted only when a
runtime consumer dispatches on it), a whole third projection axis — `core.density`,
`roots/density.ts`, the `[data-tt-density]` emitter blocks, and
`DensityProvider`/`useDensity` — was speculative surface area. It was removed:
the only thing that ever exercised it was the Studio, and the Studio does not use
it. **Scope of the reversal:** only the _density axis_ is gone. ADR-019's other
ruling — **control geometry is not container-fluid** — stands, now carried
entirely by ADR-020 (`hit` is `rem`-anchored, so control height never rides `cqi`).
Reintroduce density only when a real app demands a switchable-density surface.
Originally: accepted (2026-07-18).
Tags: sizing, spacing, density, responsiveness, geometry, governance, reverted

Decision: introduce **density** (`compact | comfortable | spacious`, default `comfortable`) as a theme **projection axis** — a `data-tt-density` attribute that remaps the semantic geometry tokens (`sizing.hit.*`, `spacing.inset.control.*`, control type step) to different core steps, exactly as `data-tt-mode` remaps colour. Components are unchanged (they already read the semantic tokens). Two coupled geometry rulings: (1) **control geometry does not use the container-fluid engine** — `spacing.inset.control.*` must resolve from a non-`cqi` scale (rem-anchored), because a control must not grow taller because the window is wider; container-fluidity (`cqi`) stays for _layout_ spacing/sizing only. (2) **hit is a floor, not the visual size** (sizing.md): the visible control height comes from control inset + type; `hit.*` only guarantees the ergonomic minimum.
Rejected: a `size` prop on controls (arbitrary, breaks "no size" doctrine and meaning-first); a component-per-density (explosion — the Studio proved it does not scale, it hand-rolled 38 control selectors); making control insets `cqi`-fluid (the current state — a Button resolves to ~44px on a wide surface because `inset.control.sm = {core.spacing.3}` rides the fluid engine).
Cost: a third projection axis in the emitter/runtime (`data-tt-density` blocks + a provider), and control insets move off the shared `core.spacing` engine onto a non-fluid control-spacing scale; pointer-coarse overrides still win for touch a11y regardless of density.
Anchors: `src/baseTheme.ts` › `core.sizing.hit.*` / `semantic.spacing.inset.control.*`, `docs/website/docs/design/design-system/design-tokens/families/sizing.md`, `EVOLUTION.md` §3 (D2) — retired to git history 2026-08-06, read it with `git log --follow -- packages/fsl-ui/INTERNAL/EVOLUTION.md` — and `packages/fsl-ui/src/tokens/CONTRACT.md` §4.

Re-litigation answers:

- "Does density violate 'no size prop / density = a different component' (CONTRACT §4)?" → no — density is not a per-component prop, it is a theme projection (like mode); meaning is defined once and survives the projection. §4 is revised, not broken: authors still never pass a size; the theme owns the geometry.
- "Why can't controls be `cqi`-fluid like spacing?" → ergonomics. A hit target growing with container width is a usability regression; controls adapt to _user font_ (`rem`) and _density_, layout adapts to _container_ (`cqi`).
- "Is coarse still safe under `compact`?" → yes — `@media (any-pointer: coarse)` forces the touch floor irrespective of density; density only tunes fine-pointer geometry.
- "How is density scoped, given ADR-020 made `hit` a single value?" → moot — the density axis was **reverted (2026-07-19, see ADR-019)** for lack of a real consumer. ADR-020's `hit` collapse stands on its own; there is no `[data-tt-density]` axis to scope.

### ADR-020: `hit` is a single theme-defined floor, not a min/base/prominent scale

Status: accepted (2026-07-18)
Tags: sizing, geometry, ergonomics, evidence, governance

Decision: collapse `core.sizing.hit` and `semantic.sizing.hit` from a three-step ramp (`min` / `base` / `prominent`) to **one value per pointer profile** — `core.sizing.hit.{fine,coarse}` are scalars and `semantic.sizing.hit` is a single ref. `hit` is the theme's one ergonomic **floor** (min interactive target, enforced via `min-*`), never a visual size; the visible control height comes from its inset + type, with `hit` binding the minimum. To make the default control desktop-correct, `semantic.spacing.inset.control.*` is retuned tight (`{core.spacing.1|2|4}`) so block padding stays under the floor and `hit` binds — a Button now resolves to ~32–36px instead of the ~44–58px the old generous inset produced. Because `hit.fine` is `rem`-anchored (`clamp(px, rem, px)`, not `cqi`), the control height never grows with container width — satisfying ADR-019's "control geometry is not container-fluid" ruling for the vertical axis without moving inset off the shared spacing engine (the residual fluid drift at `core.spacing.1` is ±2px and never binds, since `hit` drives height).
Rejected: keeping the three-step ramp (evidence: across 17 fsl-ui controls only `hit.base` was ever consumed; `hit.min` and `hit.prominent` had **zero** usages — dead tokens that invited copy-paste error and implied a per-size vocabulary the doctrine forbids); removing `hit` entirely (loses the ergonomic/a11y floor and the automatic coarse-pointer touch override); an 18px minimum floor (below WCAG 2.2's 24px and the 44px touch floor; does not scale with user zoom); leaving `inset.control` generous (the actual cause of the oversized button — the floor was never the bottleneck).
Cost: the emitter (`buildCoarseHitVars`), runtime (`applyCoarseHitOverrides`), and DTCG (`buildHitExtension`) simplify from per-step iteration to a single token; every consumer moves from `vars.sizing.hit.base` to `vars.sizing.hit`; the sizing family type drops `CoreSizeHitScale`. The "standard step" column for sizing in CONTRACT §4 no longer applies (hit has no step). A future need for a distinct prominent/secondary interactive floor would reintroduce a scale — but per the evidence rule that is added only when a real consumer demands it.
Anchors: `src/families/sizing.ts` › `CoreSizeHit` / `SemanticSizing.hit`, `src/baseTheme.ts` › `core.sizing.hit` / `semantic.sizing.hit` / `semantic.spacing.inset.control`, `src/roots/toCssVars.ts` › `buildCoarseHitVars`, `src/roots/toDTCG.ts` › `buildHitExtension`, `src/react.tsx` › `applyCoarseHitOverrides`, `docs/website/docs/design/design-system/design-tokens/families/sizing.md`, `packages/fsl-ui/src/tokens/CONTRACT.md` §4.

Re-litigation answers:

- "Doesn't a single value lose expressiveness for CTAs vs dense list rows?" → no evidence it was used — `hit.prominent`/`hit.min` shipped with zero consumers. Emphasis is carried by colour, type, and inset, not by a larger hit floor. If a genuine need appears, reintroduce a scale then (evidence rule), not speculatively.
- "Does this reopen ADR-019?" → ADR-019's density projection was later **reverted (2026-07-19)** for lack of a consumer, but its "control geometry not container-fluid" ruling is unaffected and is now carried entirely here: ADR-020 refines the _shape_ of the `hit` token (scale → scalar) and fixes the inset tuning that was the real oversized-control cause; the vertical axis is genuinely non-fluid because the rem-anchored `hit` binds the height.
- "Why keep `inset.control` on the `cqi` spacing engine instead of a rem scale?" → the tight steps (`core.spacing.1|2`) drift only ±2px and never bind (the `hit` floor drives height), so the ergonomic guarantee is already met; moving inset onto a separate rem scale is a larger migration (it would break the `MUST_ALIAS` core-spacing invariant and its tests) deferred until evidence shows the ±2px horizontal drift matters.

### ADR-021: Action gets its own silhouette (`radii.action`, `text.action`); feedback valences are filled; `feedback.accent` is the informative valence

Status: accepted (2026-07-25)
Tags: radii, typography, colors, feedback, aesthetics, P3

Decision: three coupled additions from the P3 Slice 3 component-level review against the owner-chosen reference system (Adobe Spectrum 2, measured from `@react-spectrum/s2` rendered in-browser and `@adobe/spectrum-tokens` values):
(1) **`semantic.radii.action`** — command triggers (Button/ToggleButton) take their own radius, pill (`{core.radii.full}`) in the base theme, so CTAs read "press me" while fields/choice controls stay at `control` ("fill me in"); bruttal overrides it to `none` (sharp identity preserved).
(2) **`semantic.text.action`** (single `md` step, semibold) — CTA text splits from `label`, and `label.*` drops from `medium` to `regular`: the weight-contrast rhythm (controls quiet, commands assertive) replaces the flat 500-everywhere texture.
(3) **feedback valences become filled surfaces** — `positive`/`caution`/`negative` move from tinted (100-bg + 500-border + 900-text) to deep fills (`green.700`/`yellow.700`/`red.600`) with `neutral.0` text, mode-stable (no dark remap); `primary` becomes the filled neutral chip (`neutral.800` light / `neutral.500` dark — 700 camouflages against the raised stratum); and a new **`accent`** role joins the feedback context as the _informative_ valence ("in progress", "new") — `brand.500` filled, the canonical fill for ProgressBar/Meter over the `muted` rail.
Rejected: keeping one shared `control` radius (a per-component literal in fsl-ui would take the choice away from themes — bruttal must stay sharp); bolding `label` globally (S2's texture keeps controls at regular; only commands carry weight); tinted valences (read as outlined "traffic lights" next to reference systems — the filled language is what makes status chips look finished); adding `informative` as a sixth _valence_ name (the existing `accent` emphasis vocabulary already carries "noteworthy, judgement-free" — one word, not two).
Cost: two type additions (`SemanticRadii.action`, `SemanticText.action`, `FeedbackColorRoles.accent`); the border-contrast inventory gains the filled-feedback pattern (a) entries; `feedback.*.text.default` on the valences is now only valid **on the fill** — text about an outcome placed on a page surface must use `informational.{valence}.text` instead.
Anchors: `src/families/radii.ts`, `src/families/typography.ts`, `src/families/colors.ts` › `FeedbackColorRoles`, `src/baseTheme.ts` › `semantic.radii` / `semantic.text.action` / `semantic.colors.feedback`, `src/themes/bruttal.ts` › `radii.action`, `packages/fsl-ui/src/semantics/taxonomy.ts` › `ENTITY_EVALUATION.Feedback`, `packages/fsl-ui/src/tokens/CONTRACT.md` §1.

Re-litigation answers:

- "Why not a `size`/`shape` prop on Button instead of a token?" → shape is a theme decision, not an author decision — same doctrine as every other visual axis (CONTRACT §4).
- "Doesn't a pill CTA clash with 8px fields?" → that contrast is the point (and the reference system's signature): silhouette encodes role.
- "Why is the ProgressBar default `accent` and not `primary`?" → an activity indicator is informative by definition; `primary` remains the explicit monochrome variant.
- "Why does a Button resolve ~40px when ADR-020 tuned controls to ~32–36px?" → **addendum 2026-07-25:** the command silhouette gained `semantic.spacing.inset.action.block` (bounded 8–9px) on owner request, so a CTA lands at 40px on the desktop while fields and choice controls keep the tighter `inset.control` and stay on the 34px field row. ADR-020's mechanism is untouched: `hit` is still the floor, and the visible height still comes from inset + type — only the command's inset is now its own decision, exactly like its radius and its type step. The bounded (rather than stepped) shape mirrors `separation.interactive.min`: the engine's unit straddles the target, one step being too tight and two overshooting.
- "The utility trigger (`ActionButton`) is the same 16px type as the command — shouldn't it be a step smaller?" → **addendum 2026-07-25:** no. `text.action.md` and `text.label.md` deliberately resolve to the **same font size** (`scale.text.2`) and differ in **weight** alone (semibold vs regular). A utility trigger's dimensions are the _field row's_ — `sizing.hit` + `inset.control` + `text.label.md`, byte-identical to `TextField` and `Select` — because its job is to stand beside a field in a toolbar or filter bar. Stepping its type down would break that alignment to buy a distinction already carried four other ways (34px vs 40px height, regular vs semibold, 6/12 vs 9/24 inset, `control` vs `action` radius). The reference system draws the same line: its Button and ActionButton share one type size at a given t-shirt size and separate on weight. Enforced by `typography.test.ts` › "trigger contrast" and fsl-ui's "utility triggers share the field row" contract test. A caller who genuinely needs smaller trigger text asks for it at the call site; it is not baked into the silhouette.

### ADR-022: The control inset is outcome-bearing and fixed; control type stays fluid

Status: accepted (2026-07-29, owner decision)
Tags: spacing, typography, responsiveness, ADR-019, ADR-020

Decision: `semantic.spacing.inset.control.{sm|md|lg}` becomes a **fixed px contract** (`6px` / `12px` / `24px` in the base theme — the engine's own values at the desktop bound, so nothing changes visually at ≥1200px). The classification: a control's box is its inset + type with `hit` as the floor (ADR-020), so the inset is **outcome-bearing** — a fluid inset makes the box container-fluid, which is what ADR-019 rules against. This makes the ruling true **by mechanism** where it had been true by an argument that broke: ADR-020's justification read "the residual fluid drift at `core.spacing.1` is ±2px and never binds, since `hit` drives height" — measured false above ~900px, where content + inset (34px) exceeds the 32px floor, so the field row read 32 / 32.5 / 34 across the fine-pointer range (F-035) and twice triggered false regression investigations.

The second half of the same question is decided the **other way**: control **type** stays container-fluid (`text.label.md` rides `scale.text.2`, 14→16px). That fluidity is this system's own identity — `typography.md` and `spacing.md` make fluid-from-one-engine the families' design, and the reference system (S2, which has no fluid engine and steps its mobile type _up_ by pointer instead) is a reference, not an authority. F-021 closes as working-as-designed; its readmission criterion is measured evidence of illegibility at the 14px end or a coarse-pointer consumer demanding a step-up, which would be a new hook (`typography` has no pointer axis today), not a value tune.

Rejected: narrowing ADR-019's ruling in writing to "only the floor is not fluid" (option (b) — zero theme change, but it renames the defect instead of fixing it, and the system already states resolved-height guarantees in two places that are only true under a stable inset: `inset.action.block`'s "a CTA resolves ~40px … while controls stay ~32px" and ADR-020's "hit drives height"); a bounded `clamp` band like `inset.action.block`'s (the band cannot fix the mid-range — the engine's unit tops out at cqi ≥ 1200, so any band containing the natural range preserves exactly the 900px drift F-035 measured; `action.block`'s band works because its guarantee is only "desktop exact + phone floor", while this one is "stable across the fine-pointer range"); rem-anchoring like `hit` (an inset is not an ergonomic floor; px is what the reference's own insets use and what keeps the row arithmetic exact).

Cost: `ControlInsetSteps` is typed `RawValue` (a constant cannot be a `TokenRef` — every `core.spacing` step is fluid by design; registered in model.md §8); themes lose per-container fluidity on control insets and retune them as plain px; narrow fine-pointer windows keep the desktop _inset_ (the box still steps 34 → 32 at the narrow end, but through the fluid type meeting the `hit` floor rather than through an inset ramp — real phones are coarse-pointer, where the 48px floor dominates regardless); a command's inline padding (`inset.control.lg`, 24px) no longer narrows in mid containers.

Anchors: `src/baseTheme.ts` › `semantic.spacing.inset.control`, `src/families/spacing.ts` › `ControlInsetSteps`, `tests/unit/tests/theme/families/spacing.test.ts` › "control inset fixed contract" (Error #17, injection-verified) and `resolveMinPx` (the surface ≥ control comparison now crosses shapes, so it happens in resolved px at the engine floor), `tests/unit/tests/theme/global.test.ts` › raw-exception list, model.md §8 inventory, `families/spacing.md` contract table.

Re-litigation answers:

- "Why fixed instead of the `action.block` bounded-band shape?" → the band's guarantee is different. `action.block` promises "desktop resolves exactly 40px"; this token promises "the box does not move across the fine-pointer range" — and any band wide enough to contain the engine's natural values reproduces the 900px drift that was the defect.
- "Doesn't this break `spacing.md`'s fluid-from-one-engine identity?" → the identity governs **rhythm** (gaps, gutters, surface insets — all still fluid). The doc already carves out tokens whose _resolved outcome_ is a guarantee (`gutter.*` and `separation.interactive.min` must be bounded by validation; `action.block` is bounded for a named pixel outcome). This ADR classifies the control inset into that existing category; it invents no new one.
- "Why did the row's 'both bottom out at 32 at 390px' claim change?" → it did not — that end is the floor working. Measured after: the field reads 32 / 34 / 34 / 34 at 390/900/1280/1920. What changed is the _middle_: 900px read 32.5 before and reads 34 now, because the inset no longer rides the engine; the 390px step is the fluid type (kept fluid by this same ADR) dropping the content below the 32px floor, where `hit` binds exactly as ADR-020 describes.
- **Correction this ADR's re-measurement forced on ADR-022's own numbers.** ADR-022
  states the post-fix row as "32 / 34 / 34 / 34 at 390/900/1280/1920" with no
  container named, and that reads as universal when it cannot be: control type
  stayed fluid by the same ruling, so the row is inset + a container-fluid type.
  Re-measured 2026-07-30 — the Studio's Environments form (a narrower column
  inside a padded Surface) reads **32 / 32.67 / 34 / 34** at those viewports,
  while the Storybook story at its 1200px canvas still reads 32 / 34 / 34 / 34.
  Both are true; neither is "the" row height. What ADR-022 actually achieved,
  and what is worth asserting, is that the **inset** resolves 6/12/24px at every
  container width — verified again here. This is the failure mode CLAUDE.md names
  ("state the container that produced it, because a bare figure is wrong at every
  other width"), and it slipped into four files.

### ADR-023: A fixed semantic outcome is a core step, not a literal — `core.spacing.fixed.*`

Status: accepted (2026-07-30, owner review of #1181)
Tags: spacing, token model, ADR-022, model.md §1/§2/§8

Decision: the fixed control inset moves into the **core** layer as
`core.spacing.fixed.{1|2|4}` (`6px` / `12px` / `24px` in the base theme — the
engine's own desktop bound, unchanged numbers), and
`semantic.spacing.inset.control.{sm|md|lg}` becomes an ordinary
`CoreSpacingRef` pointing at it. ADR-022's ruling is **untouched**: the control
inset is outcome-bearing and its resolved value is fixed. What this ADR corrects
is the _mechanism_ ADR-022 reached for.

The defect, stated as the model states it: ADR-022 wrote `6px` directly into the
semantic layer and registered a `RawValue` exception whose necessity argument
read "a constant cannot be a `TokenRef` because every `core.spacing` step is
fluid by design". That sentence describes a **missing core step**, not a
technical impossibility — which is precisely what §8's necessity test asks
("the value cannot be expressed as a single `{token.path}` reference"). A
constant is expressible as a ref the moment core holds it, and core is the layer
whose job is holding values (§1). So the exception was granted on a circular
premise, and the consequence was a semantic token that stopped referencing core
at all (§2), the one shape the architecture has no room for.

**It was the only instance, and the discriminator is mechanical.** A scan of the
whole semantic layer found exactly three non-ref values that are not
compositions, and all three were `inset.control.*`; every other `RawValue`
(`gutter.*`, `separation.interactive.min`, `inset.action.block`,
`measure.reading`, `overlay.scrim`) is a `clamp()`/`rgba()`/`ch` composition —
genuinely inexpressible as one ref, which is what the exception exists for. So
the rule now written into model.md §8 and enforced without an exception list:
**a bare constant is never a lawful semantic value; a composition may be.**

Verified in Chromium against the pre-change baseline, the Studio's Environments
form at viewport 390 / 900 / 1280 / 1920: `--tt-spacing-inset-control-sm`,
the control's resolved `padding-top`, and the field row's height are
**byte-identical** across the two mechanisms (`6px` / `6px` / 32, 32.67, 34, 34).
The resolved tokens are byte-identical too (`6px` / `12px` / `24px` in both
bundles), and the full suite passed with **no test edited** — because the fixed-shape
guard (spacing Error #17) asserts the _resolved_ value and therefore always
guarded the outcome rather than the authoring literal — and the semantic-ref
guard's entire exception list turned out to be dead the moment the real offender
moved (`sizing.hit`/`sizing.measure` had already become refs or compositions),
so the guard now runs with no escape hatch, injection-verified against the exact
shape that shipped.

Cost: one new core group. It is not parallel vocabulary (§6): `fixed.N` and the
fluid step `N` answer different questions — "the value that must not move" vs
"N units of rhythm" — the same way `sizing` has always carried a fluid `ramp.*`
beside the rem-anchored `hit`. Themes retune the fixed steps as plain px, as
before; what moved is only _where_ they live. The `inset.surface ≥ inset.control`
comparison still crosses two shapes and still resolves in px at the engine floor
— that follows from ADR-022's ruling, not from this mechanism.

Anchors: `src/baseTheme.ts` › `core.spacing.fixed` and
`semantic.spacing.inset.control`, `src/families/spacing.ts` ›
`CoreFixedSpacingSteps` + `ControlInsetSteps`,
`tests/unit/tests/theme/global.test.ts` › "refs or compositions — never bare
constants" (injection-verified), model.md §8, `families/spacing.md` › Core set.

Re-litigation answers:

- "Does this reopen ADR-022?" → no. Its ruling (fixed, outcome-bearing) and its
  numbers survive unchanged; only the layer holding the number moves. ADR-022's
  own "Cost" line — "a constant cannot be a `TokenRef`" — is the sentence this
  ADR retires.
- "Why not keep the exception and document it better?" → because the exception
  was not true. Documenting it better would have made the circular premise
  harder to notice, and the escape hatch it required was already hiding two
  stale entries beside it.
- "Should the fixed steps derive from the engine's max so one edit moves both?"
  → rejected. Deriving them would make the fixed scale follow the engine, which
  is the fluidity ADR-022 removed; and a validated equality would forbid a theme
  from choosing a control inset the engine's bound does not happen to hit. The
  agreement between the two scales is a base-theme choice, and the docs say so.

### ADR-024: The border pairing is audited per mode, and the inventory is split by the rule that made it unreadable

Status: accepted (2026-07-31)
Tags: colors, contrast, validation, dark mode, F-027, F-036, ADR-015

Decision: the border-vs-background guard iterates every supported mode (not the
base bundle alone), and its known-violations list splits into two asserted sets —
**mirrored** (border resolves to its own background) and **soft** (border differs
and is still below AA Large by design) — with `disabled` contexts excluded
outright. A third guard pairs a part's ink against the surface it actually
renders on when that surface belongs to another role.

`colors.md` has always required that "any supported mode fails the same required
pairings" (Error #4). The text pairing implemented it; the border pairing did
not, and the dark alternate ran unaudited for as long as it has existed. It hid
one class of defect the whole time: the alternate remaps references by hand, so
it can remap a role's `background` subtree and leave its `border` subtree at base
values. That is not hypothetical — it is what the first run of this guard found
(see the ROADMAP entry for the four remaps it forced).

The split is what makes the per-mode inventory reviewable rather than a paste.
A single below-threshold list is ~95 names per mode, two thirds of which are
`border === background` and carry no judgement; the entries that do carry one
are invisible among them. Splitting also makes the guard **stronger**: a role
that stops mirroring its background but stays under 3:1 changes no ratio and was
previously undetectable, because both states satisfy "below AA Large" — the
single case where the old inventory could not tell a design from a regression.

Rejected: paste the dark contexts into the existing set — F-027's own objection,
a guard that documents nothing and freezes whatever dark happens to be; derive
the alternate's inventory from the base's — the alternate is authored by hand, so
a derived list asserts the wrong thing and hides exactly the divergences this
exists to catch; let `fsl-ui` own the cross-role assertion — it cannot resolve
colours in jsdom, and the theme owns both ends of the pairing.
Cost: four inventories instead of two, and a reviewer must read the two rules
before concluding that an absent context is unguarded rather than exempt.
Anchors: `tests/unit/tests/theme/families/colors.test.ts`,
`docs/.../families/colors.md#validation`, `docs/fsl-studio/FRICTION.md` F-027/F-036.

Re-litigation answers:

- "Why is `disabled` gone from the border inventory?" → WCAG 2.2 §1.4.3 exempts
  disabled UI, and the text pairing beside it always assumed that. The border
  pairing was enshrining ~14 contexts per bundle that no rule ever wanted.
- "Can the mirrored set be inferred instead of listed?" → no. Inferring it means
  a role silently gaining or losing its edge produces no delta in either
  direction, which is the regression the split exists to catch.
- "Why do the strata appear in the cross-role pairing and not one page token?" →
  because a raised or overlay surface is `background` + `elevation.tonal.*`, a
  composite no colour token names (`colors.md` › Stacking informational
  surfaces). Pairing against the page alone verifies the easiest of the three.
- "Does the alternate now need a full parallel inventory per bundle?" → no. Each
  variant declares an explicit delta over the base list, so a reviewer reads what
  differs, and the deltas are asserted in both directions like the lists are.

### ADR-025: The quiet destructive ink is a cross-cutting token, minted where model.md §6 says system-wide defaults live

Status: accepted (2026-08-04)
Tags: colors, cross-cutting, consequence, model §6, F-029, refines fsl-ui ADR-028

Decision: `semantic.consequence.destructive.ink` — a cross-cutting sibling of
`focus` and `overlay` — holds the foreground for a destructive part that paints
no surface of its own. The base theme aliases it to
`{semantic.colors.informational.negative.text.default}` (a semantic→semantic
reference, the same shape and the same "mode overrides remap it automatically"
rationale as `focus.ring.color`), so both modes and both bundles resolve today's
exact values. `@ttoss/fsl-ui`'s `resolveConsequenceInk` is the sole consumer and
owns the behavioural bounds (which rung, which states — its CONTRACT §3.3).

The day before, fsl-ui ADR-028 shipped the same behaviour by reading
`informational.negative.text.default` **directly from the component layer** — a
cross-ux read, licensed and guarded, but a precedent the entity→ux alignment
had never had. Re-reading the model showed the question was already answered:
§6 names the exact criterion ("a question the principal grammar cannot ask in a
single token — a system-wide default that no `{ux}` owns") and the F-029
analysis had already proven both halves — the grammar cannot combine valence
with emphasis, and in `action`/`feedback` the valence `text` is the label on a
fill, occupied. The structural twin is the focus ring: both render against the
stratum behind the component rather than a fill of their own (the ring floats
off the edge; the quiet rung's fill _is_ the stratum), which is what lets one
system-wide colour serve everything, and why `SemanticFocus.ring.color` is even
_typed_ `TokenRef<semantic.*>` for exactly this aliasing pattern.

§6's gate, answered: **necessity** — the F-029 record (measured, both modes,
both bundles); **JSDoc** — on the family and the token; **registration** — the
§6 canonical-examples list, `colors.md` § Cross-cutting, the quick reference,
and `TOKEN_PATH_REGISTRY` (`--tt-consequence-*`, DTCG `color`), whose coverage
test fails if the registry entry is missing. `committing` deliberately gets no
token: no visual projection exists and no consumer waits — evidence, not
symmetry.

What this buys over the direct read, stated as the trade it is: the entity→ux
alignment goes back to having **zero** exceptions (the licensed-crossing
apparatus in fsl-ui's contract test becomes ordinary cross-cutting consumption,
like the ring); the contrast inventory pairs **the token components actually
render** instead of its referent, so a theme that repoints the alias is audited
on what ships; and a theme gains the freedom to retune the quiet destructive
ink without touching validation messages — while the default alias keeps them
identical, which is the right default because both are the standalone negative
valence ink. The cost is one registered token (MINOR per governance.md) and a
required member on `ThemeTokens.semantic` — additive for every `overrides`/
`extends`-authored theme (bruttal included); a hypothetical complete-`base`
theme gains a one-line member, the same class of addition as `focus.ring.offset`
(F-020).

Rejected: keeping the component-layer read (works, guarded, but spends a
constitutional exception §6 exists to make unnecessary — and pins the ink to
the validation message's token in every theme, a coupling nothing demands);
`action.muted.text.destructive` (consequence is not a State — Lexicon §11.2
keeps the axes disjoint, and the state axis is runtime while consequence is
authorial); a `destructive` entry inside `semantic.colors.*` (§6 places
cross-cutting tokens as siblings, not inside the grammar they escape); a
`committing` twin (unconsumed vocabulary).

Anchors: `src/families/consequence.ts`, `src/baseTheme.ts` (the alias),
`src/roots/tokenRegistry.ts`, `colors.test.ts` → `quiet destructive control`
(pairs the token, both bundles, both modes), model.md §6, colors.md
§ Cross-cutting, fsl-ui `tokens/consequenceInk.ts` + CONTRACT §3.3.

Re-litigation answers:

- "Why does the alias point at `informational.negative.text` and not at a core
  red?" → so the standalone negative valence ink has one source by default:
  retune it and the validation message and the destructive ink move together,
  which is what a theme author expects. Repointing is the opt-out, not the
  default.
- "Why not let fsl-ui keep reading the informational token, since the values
  are identical?" → because _which token a component renders_ is the thing the
  inventory audits and the thing a theme retunes. A borrowed token couples two
  meanings behind one name; §6 exists so the system never has to choose between
  coupling and a grammar violation.
- "Does `neutral`/`committing` ever get a token?" → on evidence: a consumer
  with a visual projection that survives measurement. Symmetry is not evidence.

### ADR-026: The text pairing audits the ink a component actually renders; a mode only remaps

Status: accepted (2026-08-04)
Tags: colors, contrast, validation, modes, F-043, companion:ADR-024

Two decisions, found as one defect (F-043: an open menu's `secondary` trigger
rendering its label at 1.45:1 in dark for as long as the menu stays open).

**First: the text pairing pairs the effective ink.** `colors.md` pairing #1
already defined "corresponding" as _where the part renders, not who owns the
token_ — and the component contract renders an ink for **every** background
state, because call sites fall back (`resolveInteractiveStyle(...) ??
text.default`; the selection mark resolves `indeterminate → checked →
default`). The extractor paired same-state declarations only and skipped when
the ink side was absent, so it audited a pair nobody renders and skipped the
pair everyone does — the exact mirror of the deletion trap the fsl-ui CLAUDE.md
names, and ADR-024's border finding one dimension over. The extractor now walks
every declared `background.<state>` and pairs the declared state's ink or its
documented fallback chain. 192 previously unaudited pairs entered the suite;
seven failed, in three classes:

- `input.{negative,positive,muted}.text.indeterminate` (both modes): the mark's
  chain passes through `checked`, whose `neutral.0` belongs to the _filled_
  checked box — on the light indeterminate fill it lands at 1.4–1.9:1. Each
  role now declares the indeterminate ink in base (the valence's own dark
  step, hue kept), which both modes inherit.
- `action.secondary.text.active` (dark): the alternate inverts the engaged
  fill to light and had inverted the ink for `pressed` but not `active`.
- `informational.{valence}.background.selected` (dark): the alternate remaps
  the valence _text_ to light inks while `background.selected` inherited the
  base's light tint — ink and fill met at 1.0:1. The alternate now maps
  selected to the monochrome step the neutral roles already use, with the
  edge lightening to `.300` (the same move this alternate makes on negative's
  active/focused and accent's hover).

**Second: a mode only remaps.** The first fix for `text.active` was declared
in the dark alternate alone — and the suite went green while the screen did
not change, because `vars` mirrors the **base** shape: an alt-only leaf emits
a CSS custom property no component can reference. `model.md` § Modes already
states it ("semantic token names do not change; references may point to
different core tokens"); it is now enforced — `global.test.ts` fails any
bundle whose alternate declares a path the base does not, and the scan that
motivated it found exactly one violation in the whole theme: the fix itself.
`action.secondary.text.active` is therefore declared in base (`neutral.1000` —
the fill darkens a step on the press and the ink firms with it, and Warning #1
requires it to differ from `default`) and remapped in dark.

Verified: two seeded mutations (a removed indeterminate ink; the removed
`active` ink) each fail the suite in every affected bundle and mode; the
structural guard fails on the alt-only shape it was written for; and the open
menu's trigger label reads `rgb(22,22,22)` on `rgb(208,208,208)` in dark in
Chromium, where it read `rgb(248,248,248)` before.

Rejected: a lower floor for glyph-carried states (`checked`/`indeterminate`
render the selection mark, arguably non-text at 3:1) — the registry defines
the `text` dimension as "readable foreground, labels, and **text-like
icons**", pairing #1 exempts only `*.muted.*`, and a selected row _does_ put
running text on `background.checked`, so the stricter floor governs; reader-
aware pairing (skip combinations no component renders today) — the suite has
always audited the declared grammar, and a pair that fails only until someone
reads it is a landmine, not a saving.

Anchors: `colors.test.ts` (`extractTextBackgroundPairs`), `global.test.ts`
("the alternate only remaps"), `src/baseTheme.ts` (the seven values),
colors.md § Validation (the effective-pair bullet and the new mode error),
`docs/fsl-studio/FRICTION.md` F-043.

Re-litigation answers:

- "Why does `text.active` exist in base if light never needed it?" → because
  the leaf must exist for any mode to remap it — that is what "modes remap"
  means, and the guard now enforces it. Light gains a one-step firmer press
  ink it never had a complaint about; dark gains the legible label it owed.
- "Should the indeterminate mark really meet 4.5:1?" → the dimension's own
  definition folds text-like icons into `text`, and the fix costs one dark
  step per valence. If a future case genuinely needs the non-text floor, that
  is a registry discussion about a `glyph` dimension, not a threshold carve-out
  in the guard.

### ADR-027: A surface that occludes gets a cross-cutting boundary; the anchored inset is its own fixed step

Status: accepted (2026-08-04)
Tags: colors, spacing, cross-cutting, overlay, F-044, F-045, closes:F-044, closes:F-045

Two tokens, one root cause: **`elevation` is the only family that knows a
surface floats.** Every geometry and colour family treats "surface" as one
thing — `radii.surface`, `outline.surface`, `inset.surface`,
`informational.{role}.border` — while `elevation` alone distinguishes four
strata. So an occluding surface inherited the edge and the padding of an
embedded one, and the P3 Overlay round measured both.

**`semantic.overlay.outline`** — the boundary of a surface that covers content.
Cross-cutting per model.md §6, sibling of `scrim`, and the family is already
the right home: `scrim` is what an occluding surface puts _behind_ itself, this
is what it puts _around_ itself. The §6 gate: occlusion is neither a `role`
(emphasis/valence) nor a `state` (runtime), and it **crosses UX contexts** — a
Menu is `informational`, a Toast is `feedback`, and both cover content — so the
grammar cannot ask for it in a single token. Registration needed no registry
change: `semantic.overlay.` already maps to `--tt-overlay-` with DTCG `color`.

`colors.md` § Stacking already assigned the duty this meets: the surface
outline is the **secondary separator** and owes _"≥ 3:1 contrast against the
adjacent background … even when shadow is suppressed (high-contrast
preferences, print)"_. `{ux}.{role}.border.default` cannot carry it because it
carries the opposite duty — an embedded card's decorative edge and a divider,
where a hairline is deliberate and listed in the border pairing's accepted-soft
inventory. Measured, that hairline read **1.31:1 light / 1.67:1 dark** against
the page, so with shadows suppressed a menu was an unbounded rectangle.

The value is one token per mode, and that is a measurement rather than a
convenience: light `neutral.500`, dark `neutral.300` each clear 3:1 against
_every_ stratum an overlay can land on. A per-stratum family was the first
design and the measurement retired it — nothing needed per-stratum granularity.

**`semantic.spacing.inset.surface.xs`** — the anchored / row-framing step.
`inset.surface`'s tightest step was 16–24px and every anchored overlay read it:
a menu's gutter was 24px around fixed 32px rows (34% of the surface's height),
a tooltip's 24/36px for one line, against an 8px reference. No vocabulary grew
— `spacing.md` already lists `xs` and `gap.stack.xs` ships. **Fixed, not
fluid**, and that is ADR-022's own argument one scale out: the step's whole
outcome is its relationship to fixed-height children, and measured before the
change the gutter moved 16px → 24px across viewports while every row stayed
exactly 32.0px. It therefore joins `inset.control` in the fixed-px contract
rather than the fluid aliasing one — the guard was renamed to say so.

Guards: the cross-role inventory gains **"occluding boundary"** — a
cross-stratum pair, which is precisely why the same-role border extractor
structurally could not see the defect (it evaluates an edge against its own
role's fill and lists the result as accepted-soft: correct for what it audits,
blind to the pair that carries the signal). The ordering guard gains `xs < sm`,
compared at the engine's floor because the two sides now have different shapes.

Rejected: retuning `informational.primary.border.default` to clear 3:1 (one
token, but it darkens every card edge in the system to fix a different class's
problem — and it would make the accepted-soft inventory self-contradictory);
`elevation.edge.*` as a per-stratum companion to `tonal` (defensible, and the
measurement showed the granularity is unused — one value per mode covers every
stratum, so this would be membership guessing); making the overlays read
`elevation.tonal.*` for their fill (they should, and it is filed separately as
F-048 — but it reaches 1.67:1 at best in dark and nothing at all in light, so
it cannot close F-044 and it changes what `evaluation` means on Overlay);
retuning `inset.surface.sm` instead of adding `xs` (`Box`/`Surface` publish
`sm` as a caller-facing step — retuning it changes an API surface to fix a
different class).

Cost: two registered semantic tokens (MINOR per governance.md), one of them a
new required member on `SemanticOverlay` and one on the shared `InsetSteps` —
additive for every `overrides`/`extends`-authored theme, a one-line addition
for a hypothetical complete-`base` theme, the same class as `focus.ring.offset`
(F-020) and `consequence` (ADR-025).

Anchors: `src/families/overlay.ts`, `src/families/spacing.ts`,
`src/baseTheme.ts` (both values + the dark remap), `colors.test.ts`
("occluding boundary"), `spacing.test.ts` (the fixed-inset contract),
colors.md § Stacking + § Cross-cutting, model.md §6, spacing.md,
`docs/fsl-studio/FRICTION.md` F-044/F-045.

Re-litigation answers:

- "Why is the boundary not evaluation-driven?" → it says "your content resumes
  here", which is infrastructure, the same argument that gives the focus ring
  one colour. And nothing is lost: measured, all three informational roles
  resolved the _same_ border value in both modes, so `evaluation` never varied
  an overlay's edge.
- "Why does a Dialog still pad at `md`?" → it frames content, not rows. The
  discriminant for `xs` is whether the padding gutters children that carry
  their own inset, not whether the surface floats.
- "Is `xs` the same value as `inset.control.sm`?" → yes, deliberately: a gutter
  beside a control is the control's own step, which is what keeps the
  edge-to-text distance close to the reference's.

### ADR-028: A rail gets a cross-cutting address; `semantic.rail.track` replaces two borrows

Status: accepted (2026-08-05)
Tags: colors, cross-cutting, feedback, input, P3, F-050, F-051, closes:F-051

Decision: `semantic.rail.track` — the unfilled part of a `ProgressBar`/`Meter`/
`Slider` track — joins `focus`/`overlay`/`consequence` as a sibling
cross-cutting family (model.md §6). `ProgressBar` and `Meter` now read it
instead of `feedback.muted.background` (F-050's fix); `Slider` reads it
instead of `input.primary.background.disabled`, retiring the one borrow F-050
could not close because it belongs to a different entity.

**The §6 gate.** A rail is neither a `role` (emphasis/valence) nor a `state`
(runtime), and it crosses UX contexts exactly the way `overlay.outline` does:
`ProgressBar`/`Meter` are `Feedback`, `Slider` is `Input`, and all three need
the same neutral pill. The reference (`@adobe/spectrum-tokens@14.15.0`) agrees
by construction — `track-color` is its own token, aliased to a private grey
step rather than to any role's dimension — because a rail's mode behaviour is
its own: it **darkens** in dark (`rgb(218,218,218)` → `rgb(57,57,57)`) while
every `{ux}.{role}.border.*` in this system **lightens** on the same canvas.
No single existing token could serve both directions, which is the technical
necessity §6 (and §8's parallel `RawValue` gate) asks for before minting one.

**Values, measured.** Light: `core.colors.neutral.200` (`#e1e1e1`) — 7 units
per channel off the reference's `rgb(218,218,218)`, the closest step (the next
candidate, `neutral.300`, sits 10 off). This is the half F-050 left owing:
the borrowed `feedback.muted.background` sat at `neutral.100`, 1.14:1 against
the page against the reference's own 1.40:1; `neutral.200` moves the
separation to ~1.31:1, closer without reaching for a value the ramp does not
have. Dark: `core.colors.neutral.700` (`#3d3d3d`) — the same step F-050 already
found 4 units off the reference's `rgb(57,57,57)`, kept rather than replaced,
because F-050 had already found the right dark answer; only the light half and
the address needed fixing.

**Why the dark value coincides with `feedback.muted.background`'s, and that is
not a residual borrow.** `Slider`'s dark rail moves from
`input.primary.background.disabled` (`neutral.900`) to `neutral.700` — a real,
measured change, and the one that matters: an empty `Slider` rail no longer
means "disabled" in the token model. `ProgressBar`/`Meter`'s dark rail keeps
the same rendered value it had after F-050, because that value was already
right; what moved for them is the _address_ they read, not the pixel — the
component no longer names a `Feedback`-role token to get a value every rail
needs. `rail.test.ts` pins this precisely: the dedicated address differs from
`input.primary.background.disabled` in both modes (Slider's actual defect),
and from `feedback.muted.background` in light (the half that had a numeric gap
to close); it does not assert dark inequality against `feedback.muted.background`,
because asserting a coincidence would be pinning an artifact of ADR-033's
already-correct choice, not a defect.

**Reuse, not growth, at the component side.** `src/tokens/rail.ts` (fsl-ui)
renames its `FEEDBACK_RAIL_FILL` constant to `RAIL_FILL` — it is no longer
`Feedback`-specific — and `Slider` reads it instead of deriving its rail from
`c?.background?.disabled`. No new component-side vocabulary: one existing
constant now serves all three consumers, which is what "one silhouette, one
answer" (ADR-033) always implied once the colour half caught up to the
geometry half.

Guarded from both sides, same shape as `overlay.outline`'s guard in ADR-027:
`rail.test.ts` (this package) pins the resolved values and the two inequalities
above, in every mode of every bundle; fsl-ui's `rail.test.tsx` pins that each
component reads the shared constant by comparing the `var()` reference itself
— not the resolved colour — so a refactor that reached either old address by a
different path still fails even where the rendered pixel would not change.

Rejected: waiting past the version boundary, ADR-033's own recommendation when
F-051 was only analysis — no longer applicable once the owner asked for a
ruling on both F-051 and F-052 in the same pass (`docs/fsl-studio/FRICTION.md`);
a per-stratum `rail` family (`raised`/`overlay`/`blocking` companions) — a rail
does not stratify, only two modes, so a flat family is one value per mode, not
a ramp; retuning `feedback.muted.background`'s dark value instead of minting a
new address — it already sits 4 units off the reference and three other
consumers (`Badge`, `StatusLight`'s neutral chip, the row family) would move
with it for no reason tied to a rail.

Cost: one registered semantic token (MINOR per governance.md), a new required
member on the `ThemeTokens['semantic']` tree — additive for every
`overrides`/`extends`-authored theme, the same class `focus.ring.offset`
(F-020), `consequence` (ADR-025) and `overlay.outline` (ADR-027) already cost.

Anchors: `src/families/rail.ts`, `src/baseTheme.ts` (both values + the dark
remap), `src/roots/tokenRegistry.ts`, `tests/unit/tests/theme/families/rail.test.ts`,
model.md §6, `docs/fsl-studio/FRICTION.md` F-050/F-051, fsl-ui ADR-036.

Re-litigation answers:

- "Why not just retune `feedback.muted.background`'s light value?" → that
  token has three other readers (`Badge`, `StatusLight`, the row family) with
  no rail-shaped reason to move; a dedicated address changes exactly the one
  thing that needed to change.
- "Should this be `semantic.colors.rail.*` instead, inside the colour grammar?"
  → no — §6's own text places cross-cutting tokens as siblings of
  `semantic.colors.*`, not inside it, and `focus`/`overlay`/`consequence` are
  already there for the same reason: they answer a question the `{ux}.{role}`
  grammar cannot ask in one token.
- "Does `bruttal` need its own `rail` override?" → no, the same way it needs
  none for `overlay`/`focus`: it drifts brand colour, radii and elevation only
  (`themes/bruttal.ts`) and inherits every other family from the base via
  `deepMerge`.

### ADR-029: The standalone valence inks get a cross-cutting family; `consequence.destructive.ink` was a family of one

Status: accepted (2026-08-12)
Tags: colors, cross-cutting, valence, model §6, generalizes:ADR-025, fsl-ui InlineAlert

Decision: `semantic.valence.{positive,caution,negative}.ink` — a cross-cutting sibling of `focus`, `overlay`, `consequence` and `rail` — holds the foreground for a part that **reports** a valence while painting no surface of its own; each member aliases `{semantic.colors.informational.{valence}.text.default}`, so no core value is minted and both modes remap for free.
Rejected: a fourth one-off token per consumer — repeats ADR-025's shape for the third time and leaves the next valence to rediscover it; a tinted `feedback.{valence}` fill family — 4 roles × 3 dimensions × 2 modes to say what one ink says, and `colors.md` § Picking a role forbids the emphasis-plus-valence path it would need; letting the component read `informational.{valence}.text` directly — the licensed cross-ux crossing ADR-025 retired three days after shipping it; collapsing `consequence.destructive.ink` into `valence.negative.ink` — deletes the FSL §10.5 distinction to resolve a value coincidence.
Cost: a fourth cross-cutting family in a model that prizes a small registry, and `negative` now has two addresses resolving one value — a reviewer will read that as duplication until §10.5 is quoted.
Anchors: `src/families/valence.ts`, `src/baseTheme.ts`, `src/roots/tokenRegistry.ts`, `docs/.../design-tokens/model.md#6-no-parallel-vocabulary`, `docs/.../families/colors.md#cross-cutting-tokens-siblings-of-semanticcolors`.

**What problem exists.** A `Feedback` part that reports an outcome while painting nothing has no lawful ink. `colors.md` § Picking a role states the loudness ladder is a ladder only where the valence's `text` is a standalone ink — true in `input`/`informational`, false in `action`/`feedback`, where the valence ships filled and `text` is the label _on_ that fill. The consumer that forced it: `InlineAlert`, the `status.passive` counterpart of `Toast` (FSL Lexicon §3), whose surface is `feedback.muted` and whose valence therefore lives in a mark rather than in a fill. With no valence ink the four states differ only by glyph shape — two grey boxes — which fails the north star's "visually refined out of the box" before it reaches a reviewer.

**Why reuse is not enough.** Measured, not assumed: `action.negative.text` and `feedback.negative.text` are `#ffffff` in both modes (ADR-021 chose deep filled valences; the `text` dimension became the on-fill label). Combining valence with emphasis is the ❌ example in that same section. `informational.{valence}.text` holds the inks — but reaching for them from a `Feedback` component is the cross-ux read ADR-025 licensed and then retired, and `components.contract.test.tsx` now fails any component that reaches for `informational.negative` by hand.

**Why a family rather than a fifth sibling.** ADR-025's own §6 rationale — _"the grammar cannot combine valence with emphasis, and the filled valence contexts have no standalone ink"_ — is a statement about **valence**, not about **destructiveness**. It is true of `positive` and `caution` verbatim. That token was a family of one wherever a family was warranted; this ADR does not add a concept, it finishes one. The residual lesson of ADR-025 was "search the model for the mechanism that makes the exception unnecessary before licensing it"; the residual lesson here is one step earlier — when a cross-cutting token is minted for one member of a closed set, ask whether the set is the unit.

**Why `valence.negative.ink` ≠ `consequence.destructive.ink`, although they resolve alike.** FSL Lexicon §10.5 keeps `negative` (Evaluation — authorial valence, "what is being reported") apart from `destructive` (Consequence — effect on state, "what this interaction does"), and §10.15 mirrors the split one dimension over. The two tokens answer different questions and a theme may repoint one without the other: a product wanting "Delete" rows louder than error reports needs both addresses to exist. They coincide in this theme by choice. Collapsing them is the mirror of the static-ink proposal ADR-025 retracted — resolving a naming coincidence by deleting a distinction.

**Three members, not five.** `role` is a discriminated union of Emphasis and Valence, and the artefact that owns the classification settles it: **FSL Lexicon §5** lists `accent` in the Emphasis class and defines it as _"a deliberately differentiated emphasis … Not just 'more colorful'; accent is semantic divergence"_. A valence is a judgement about **outcome**; `accent` claims attention without claiming one, so there is nothing for a valence ink to say and it takes no member here.

**Corrected 2026-08-12, before this ADR was a day old.** The first draft called this an open disagreement between artefacts and cited `model.md` §11 as giving the **family doc** precedence. §11 says the opposite — it ranks the Lexicon **first**, `Types.ts` second, family docs **last** — and on this question all three agree: the Lexicon classes `accent` as Emphasis, `Types.ts` calls `feedback.accent` _"noteworthy but carries no judgement"_ (which is a statement that it is not a valence), and `colors.md` § Role Coverage lists it under Emphasis. The only divergence was a **comment** in fsl-ui's `taxonomy.ts` calling it "the informative valence", which §11 makes a defect in the lower-priority artefact rather than a live conflict; it is fixed. The conclusion did not move, but the justification was load-bearing and inverted: had the Lexicon gone the other way, the stated rule would have produced the wrong answer.

Measurement agrees with the doctrine, which is the second half of the package's own test. The only plausible ink for a coloured informative mark is `feedback.accent.background.default` (`brand.500`, mode-stable) — it measures 4.22:1 against the quiet ground in light and **2.26:1 in dark**, under the floor. `accent` does have a colour in `feedback`, but as a _voiced fill_ (the activity rail), never as a standalone ink.

**What impact exists.** Purely additive — one new semantic family, no existing token moved, no rendered pixel changed anywhere today. MINOR per `governance.md` § Versioning. `bruttal` needs no override, for the same reason it needs none for `overlay`/`focus`/`rail`.

**Measured, all 24 pairs, before deciding.** Each valence ink against every stratum a mark can land on (`INFORMATIONAL_STRATA`) plus the quiet Feedback surface it actually sits on (`feedback.muted.background.default` — `neutral.100` light, `neutral.700` dark):

| Surface (light)               | positive | caution | negative |
| ----------------------------- | -------: | ------: | -------: |
| `neutral.0` (page + 3 tonal)  |   9.11:1 |  8.67:1 |  10.02:1 |
| `neutral.100` (quiet surface) |   7.99:1 |  7.61:1 |   8.79:1 |

| Surface (dark)                         | positive | caution | negative |
| -------------------------------------- | -------: | ------: | -------: |
| `neutral.900` (page)                   |  12.89:1 | 13.73:1 |   9.53:1 |
| `neutral.800` (tonal raised)           |  10.78:1 | 11.48:1 |   7.97:1 |
| `neutral.700` (tonal overlay/blocking) |   7.74:1 |  8.24:1 |   5.72:1 |
| `neutral.700` (quiet surface)          |   7.74:1 |  8.24:1 |   5.72:1 |

Every pair clears **AA Normal (4.5:1)** — not merely the 3:1 non-text floor a glyph would owe — so the family is safe for a valence-inked line of copy, not only for a mark. Worst case is `negative` on the dark `neutral.700` step at 5.72:1, which is the figure ADR-025's inventory already reports, because that member _is_ that token. Only `positive` and `caution` are genuinely new pairs, and both are more legible than the member already in the suite.

**The dark alternate corroborates rather than obstructs.** It drops the light valence tint entirely — `informational.{positive,caution,negative}.background.default` all remap to `neutral.900` — and keeps only the border and the ink. The theme already commits to ink-plus-edge as the way a valence speaks on a quiet surface in that mode; this token gives that commitment an address instead of leaving each component to find it.

**§6's gate, answered.** **Necessity** — the measurement above plus the F-029 record it generalizes; the question crosses `ux` (a mark is `feedback`, a summary is `informational`, a message is `input`) so the per-context grammar cannot express it. **JSDoc** — on the family, on the per-valence interface, and on each `ink`. **Registration** — `TOKEN_PATH_REGISTRY` (`--tt-valence-*`, DTCG `color`, whose coverage test fails if the entry is missing), §6's canonical-examples list, `colors.md` § Cross-cutting, and the quick reference.

Guarded from both sides, the shape ADR-027/ADR-028 established: `valence.test.ts` pins the resolved values per mode per bundle and pins that `valence.negative.ink` and `consequence.destructive.ink` are separately declared addresses (asserting the coincidence is deliberate, never that one derives from the other); `colors.test.ts` gains the cross-role entry `passive status mark` — each ink against the strata plus the quiet Feedback surface, at AA Normal, per bundle and per mode.

Re-litigation answers:

- "This duplicates `consequence.destructive.ink`." → It generalizes it. `negative` coincides in value; the questions differ per FSL §10.5, and a theme may split them.
- "Then delete `consequence.destructive.ink` and point `resolveConsequenceInk` here." → That deletes the §10.5 distinction to save one alias; the ink a destructive _command_ borrows is not the ink an error _report_ carries, even when a theme paints them alike.
- "Why no `accent`/informative member?" → FSL Lexicon §5 puts `accent` in the Emphasis class, and §11 makes the Lexicon the authority on identity. Settled, not open; a coloured informative mark would fail the dark floor anyway (2.26:1).
- "ADR-021's title calls `feedback.accent` 'the informative valence'." → Loose wording in a title, kept because ADRs are append-only. The rung is Emphasis; what ADR-021 shipped — a filled informative surface — is unaffected, since that colour is a voice and not an ink.
- "Why not `semantic.colors.valence.*`, inside the colour grammar?" → §6 places cross-cutting tokens as siblings of `semantic.colors.*`, not inside it — same as `focus`/`overlay`/`consequence`/`rail`.
- "Should a filled surface use this ink?" → No. There the fill is the voice and `{ux}.{valence}.background` owns it; this ink is for a part that paints nothing.

### ADR-030: The quiet Feedback ground is the page's own colour, not a grey step

Status: accepted (2026-08-12)
Tags: colors, feedback, stacking, muted, fsl-ui ADR-043, closes:F-066

Decision: `semantic.colors.feedback.muted.background.default` remaps from `core.colors.neutral.100` to `core.colors.neutral.0` in the base and from `neutral.700` to `neutral.900` in the dark alternate — the page's own colour in each mode — so a quiet Feedback surface shares the page's background and pays its separation in the edge, which is what `colors.md` § Stacking requires of every contained surface.
Rejected: leaving it and letting the consumer paint the page colour itself — a component cannot reach `informational.*` from the Feedback row, and inventing a second "page" address is the extra colour bucket Rule #4 forbids; giving the consumer a lighter grey step — the same defect one shade weaker, and § Stacking bans paying separation in colour at all; a new `feedback.page` role — parallel vocabulary for a value `muted` already means.
Cost: a visible change for the one consumer that reads this token, and the dark border inventory reclassifies — `feedback.muted.default` leaves the soft list because its own edge now sits on the canvas instead of a near-identical grey, and `feedback.muted.focused` leaves it in the blue palette but stays in `bruttal`, whose brown ramp is flatter.
Anchors: `src/baseTheme.ts`, `src/families/colors.ts`, `tests/unit/tests/theme/families/colors.test.ts`, `docs/.../families/colors.md#stacking-informational-surfaces`, `docs/fsl-studio/FRICTION.md` F-066.

**What problem exists.** The owner's review of the first Feedback surface to use this token: _"esse cinza de fundo, me remete a muted, ou algo amador, não me remete a alto padrão de design"_. Literally correct — the surface was painting the `muted` rung as a grey **step**, and a flat grey box reads as disabled or placeholder. FSL Lexicon §10.6 keeps `muted` apart from `disabled` as _meaning_; nothing kept them apart visually.

**Why reuse is not enough, and why this is a defect rather than a taste.** Two written rules already said the value was wrong. `colors.md` defines the `muted` idiom as **"the surface's own colour"** — the Action ladder's third rung paints exactly that and carries no visible edge at rest. And § Stacking states that the page and every contained surface resolve the **same** background token, with differentiation paid in _"elevation first, border second, never in colour"_. A standing report in the flow is a contained surface. At `neutral.100` this token broke both.

**Why nobody noticed for so long.** It had no consumer for the arrangement that exposes it. The value was chosen when the token was a **chip** fill, where a grey step is right; chips then moved to `informational` (F-010/F-053) and the rail moved to `semantic.rail.track` (ADR-028). What remained read `feedback.muted.text` only — `ProgressBar`/`Meter`'s value label — so the background sat unread until `InlineAlert` painted a surface with it.

**What impact exists.** One reader of the background (fsl-ui `InlineAlert`); `ProgressBar`/`Meter` read the `text` dimension and are untouched. `rail.test.ts`'s inequality against this token still holds in light (`neutral.200` vs `neutral.0`). The "roles within a context are distinguishable" invariant still passes in both modes. The `feedback.muted.text ↔ background` pairing improves (the ink now sits on the page rather than on a grey step). Semantic mapping changed, meaning unchanged — MINOR per `governance.md` § Versioning.

**What it unlocks, and this is the half that makes it more than a value tune.** With the ground on the page, a valence **border** becomes Required Pairing #2 — a border against the adjacent surface, the pair the theme audits for every role — instead of the border-against-another-family's-fill pair F-050/F-055/F-057 each got wrong. That is what let fsl-ui ADR-043 move the valence onto the edge and reach the reference's own design. Measured against the page, every Feedback evaluation's own border clears the 3:1 floor in both modes; `colors.test.ts`'s border inventory reports the figures.

Re-litigation answers:

- "A quiet surface with the page's background is invisible." → It is, until it takes an edge. That is § Stacking's point: separation is the border's job, and every Feedback role ships one that clears 3:1 against the page.
- "Should `informational.muted` move too?" → No. That role is a _content_ surface with its own strata and existing consumers; this ADR is scoped to the token whose meaning is "quiet feedback" and whose only reader asked for the page.
- "Why not `neutral.50` — nearly the page, but not it?" → § Stacking forbids paying separation in colour at all, and a near-page grey is the same decision at lower contrast.
