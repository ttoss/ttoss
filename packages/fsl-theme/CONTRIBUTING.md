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
Anchors: `src/baseTheme.ts` › `core.sizing.hit.*` / `semantic.spacing.inset.control.*`, `docs/website/docs/design/design-system/design-tokens/families/sizing.md`, `packages/fsl-ui/INTERNAL/EVOLUTION.md` §3 (D2), `packages/fsl-ui/src/tokens/CONTRACT.md` §4.

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
