# Deep Review — `@ttoss/fsl-theme` and the Design Documentation

> Scope: `packages/fsl-theme/**` (source, types, tests, README, CONTRIBUTING, llms.txt) and
> `docs/website/docs/design/**` (FSL, design-tokens, components, theme-authoring), read against the
> blog posts that state the vision (_The Missing Layer_, _The Theme as a Perceptual Operating System_).
> Method: foundation study → 12-component contract stress-test → 5 parallel layer audits
> (families, engine, dataviz/themes/tests, state-of-the-art benchmark, docs) → adversarial spot-verification.
> Context that shapes every recommendation: **the package has zero consumers in the monorepo yet**, so
> contract and naming changes are still free. This window closes the moment the first app adopts it.

---

## Part I — Verdict

`@ttoss/fsl-theme` is an **unusually ambitious and, at the foundation, unusually well-built** design-token
system. Its semantic grounding (FSL), its per-UX-context state legality encoded in the type system, its
JSDoc-as-contract discipline, and its `llms.txt` agent guide are **ahead of the field** — no shipping token
system documents its naming with a formal projection, and very few ship a machine-oriented usage contract at all.

But the review surfaces one defining tension that should drive the whole polishing effort:

> **The specification describes a system several layers larger than the code that exists.**
> The docs describe a five-layer architecture and a "theme compiler that rejects invalid programs."
> Only two layers are implemented, and the compiler's validation is essentially a dev-only broken-reference warning.

For an AI-first repository — one whose own blog argues that "agents amplify the inconsistencies present in their
context window" — this gap is not cosmetic. Docs that describe unbuilt tooling **in the present tense** will be
trusted by agents and humans as shipped fact. Closing the spec↔reality gap is the single highest-leverage move,
and most of it is cheap precisely because there are no consumers yet.

The findings below are ranked by leverage in Part VII. Severities: **Critical** (breaks an advertised
capability or contract integrity), **High** (wrong/misleading to a first consumer), **Medium** (latent or
quality), **Low** (cosmetic/doc).

---

## Part II — Architecture reality check

The docs (`fsl/index.md`, `fsl-structural-language.md §2`) describe five layers:

| Layer                             | Artifact per docs                                                              | Reality                                                                                                                                                                                                         |
| :-------------------------------- | :----------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. FSL Lexicon                    | `fsl-lexicon.md`                                                               | **Exists** — mature, 9 dimensions, disjointness laws, disambiguations.                                                                                                                                          |
| 2. FSL Structural Language        | `fsl-structural-language.md`                                                   | **Exists** — canonical expression, legality-matrix _structure_ (values delegated to profiles).                                                                                                                  |
| 3. Component Semantics Projection | `component-model.md` + `taxonomy.ts` + `packages/ui2/src/tokens/projection.ts` | **Phantom.** `taxonomy.ts`, `projection.ts`, `packages/ui2/`, `ComponentMeta`, `ENTITY_COMPOSITION/STRUCTURE/TOKEN_MAPPING`, and the "contract tests" **do not exist** anywhere in the repo or its git history. |
| 4. Semantic Token Projection      | `@ttoss/fsl-theme`                                                             | **Exists** — this package. The only fully implemented layer.                                                                                                                                                    |
| 5. Deterministic Resolver         | "build-time/runtime tooling that validates and projects"                       | **Does not exist.** No resolver, normalizer, or legality engine.                                                                                                                                                |

And the vision's centerpiece — the **theme compiler** (blog: _"a compiler rejects invalid programs… reject
values that break contrast, colors that overload meaning, dark values that collapse surface hierarchy"_;
`theme-authoring.md` codifies this as 20 rules `FSL-DESIGN-001 … FSL-LAYER-001`) — is realized as:

- `validateRefs.ts` — **dev-only `console.warn`** for broken `{refs}`; never throws, no build gate,
  **no cycle detection** despite `model.md §Enforcement` promising "no circular references."
- Family unit tests that assert _some_ ordering/pair invariants (good, but incidental — see Part III).
- `validation.md` — a full spec of a 3-level validator (structural / semantic-contract / cross-family, with a
  severity model, semantic-diff, and collision detection) written in the present tense ("must guarantee…") that
  is **almost entirely unimplemented**.

The theme **brief** (`posture/density/accessibilityTarget` YAML) that `theme-authoring.md` says every theme
"must start with" exists only as documentation prose — `createTheme()` accepts no brief, nothing stores or
checks one, and none of the four shipped themes carries one.

---

## Part III — Findings by area

### A. DTCG export — the interchange format is non-conformant

- **[Critical] `$type: "string"` is emitted for whole families and is not a valid W3C DTCG type.**
  `tokenRegistry.ts` assigns `dtcgType: 'string'` to `semantic.dataviz.encoding.*`, `semantic.dataviz.*`,
  `core.dataviz.*`, and `toDTCG.ts:80` returns `'string'` as the default. DTCG 2025.10 (first _stable_ release,
  Oct 2025) defines only `color, dimension, fontFamily, fontWeight, duration, cubicBezier, number` plus the
  composite types. Every `semantic.text.*`, `semantic.border.*`, `semantic.focus.*`, easing token, and
  `core.font.optical/numeric` receives an invented type. A conformant importer (Style Dictionary, Tokens Studio)
  rejects or ignores these — which defeats the export's stated purpose (`toDTCG.ts:158` advertises tool interchange).
  _Note: the internal `toDTCG.test.ts` passes (900/900) because it checks tree shape and ref-resolvability, **not**
  W3C conformance — which is exactly why the non-conformance shipped unnoticed._
  **Fix:** omit `$type` for untyped values (or map easing → `cubicBezier`); delete `'string'` from the registry.

- **[High] Composite DTCG types are emitted with raw CSS-string `$value`s.** `elevation.*` gets
  `$type: "shadow"` but `$value: "0 1px 2px rgba(…)"` (string, not the DTCG shadow object); `dimension` is
  `"16px"`/`clamp(…)` not `{value,unit}`; `duration` is a string. The `$type` promises a structure the `$value`
  contradicts. `toDTCG` also **fully resolves** every value (`toFlatTokens`), discarding the `{alias}` syntax
  DTCG treats as first-class — so the export is a flattened snapshot, not a themeable graph.
  **Fix:** emit true composite objects and preserve `{alias}` `$value`s (offer a `resolve: true` opt-in for the
  flattened variant); emit `$description` from the JSDoc (the package's richest asset).

### B. Engine correctness

- **[Medium] "No circular references" is never enforced.** `validateRefs` only checks that a `{ref}` _target
  exists_; a cycle's target does exist, so it stays silent. `toFlatTokens` guards against infinite loops at
  runtime (`helpers.ts:180-193`) but by default leaves a cyclic ref as its raw `{path}` string, and `createTheme`
  never runs it in `strict` mode (`createTheme.ts:32-39`). A cycle ships as an unresolved `{…}` literal in CSS/DTCG.
  **Fix:** run a cycle check (or `toFlatTokens(merged, {strict:true})`) in `buildTheme`'s dev block.

- **[Medium] `isTokenRef` misclassifies multi-ref values.** `helpers.ts:8-15` returns `true` for `"{a} {b}"`
  (starts `{`, ends `}`), so `toFlatTokens` takes the pure-ref branch, `extractRefPath` yields the bogus path
  `"a} {b"`, and the value is returned unresolved. `toCssVars` does **not** share the bug (it keys on
  `includes('{')`), so the two resolution paths diverge — a shorthand like `"{core.spacing.2} {core.spacing.4}"`
  would resolve in CSS but break in `toDTCG`/`useResolvedTokens`. Latent today (no such value exists).
  **Fix:** gate the pure-ref branch on "starts `{`, ends `}`, **and** contains exactly one `{`."

- **[Medium] Nested compound refs don't fully resolve.** `resolveRef` only recurses on _pure_ refs; a compound
  target (`A = "clamp({B},…)"`, `B = "clamp({C},…)"`) leaves `{C}` unresolved. Latent.
  **Fix:** re-run `resolveInline` on the result while it still contains `{`.

- **[Medium] `deepMerge` has no prototype-pollution guard.** `helpers.ts:59-82` assigns `result[key] = …` over
  `Object.keys(overrides)`; a `__proto__`/`constructor` key (e.g. from a `JSON.parse`d override) reaches the
  setter. `createTheme({overrides})` is public API with no "trusted input only" contract.
  **Fix:** skip `__proto__`/`constructor`/`prototype`, or accumulate into `Object.create(null)`.

- **[Medium] Dataviz CSS-var namespace collapse.** `semantic.dataviz.color.`, `.encoding.`, and `.geo.` all map
  to the single prefix `--tt-dataviz-` (`tokenRegistry.ts:49-69`), stripping the discriminating segment. No
  _active_ collision today, but adding e.g. `encoding.state.*` would silently overwrite a `color.state.*` var
  (`toCssVarName` is first-match-wins with no duplicate detection). This is the root cause of the Critical dataviz
  finding in §D. **Fix:** keep one path segment in the prefix (`--tt-dataviz-color-`, `--tt-dataviz-geo-`), or add
  a build-time duplicate-var assertion.

### C. SSR / React integration

- **[High] `<style precedence="default">` has no `href` (`react.tsx:386`).** React 19's hoist-and-dedupe for
  `<style>` is keyed on `href` + `precedence`; without an `href` there is no dedup key, so the documented
  SSR pattern (`<ThemeHead>` in `<head>` **+** `<ThemeProvider theme>` in `<body>`, both shown in the JSDoc at
  `react.tsx:717-735`) emits the full `:root{…}` block twice. **Fix:** add a stable `href`
  (e.g. `` `tt-theme-${themeId ?? 'root'}` ``) and document the `ThemeHead`+`ThemeProvider` interaction.

- **[High] React 18 is a supported peer but the auto-inject path relies on React-19-only style semantics.**
  `package.json` declares `react: ">=18"`; on React 18 the `precedence` prop is an unknown attribute (dev warning)
  and the `<style>` renders inline where the provider sits, not hoisted. The primary advertised feature silently
  degrades on a supported major, with no version guard or fallback. Tests exercise only React 19; there is no
  `renderToString` (SSR) test. **Fix:** raise the auto-inject peer to `>=19`, or document that React 18 users must
  use `<ThemeStyles>`/`<ThemeHead>` explicitly; add an SSR test.

- **[Medium] Hydration mismatch for `useColorMode`/`useResolvedTokens` when `mode="system"`.** The SSR `useState`
  initializer always resolves `system → "light"` (`react.tsx:266-269`); the real mode is only picked up
  post-mount. The pre-paint script fixes the _visual_ flash, but any JS that conditionally renders on
  `resolvedMode` (a sun/moon icon) renders `light` on server + first client render, then flips.
  **Fix:** read the pre-set `data-tt-mode` attribute in the initializer, or document that `resolvedMode` is not
  authoritative until mount.

- **[Low] `react.tsx` has no `'use client'` directive** despite hooks/`localStorage`; Next.js App Router users
  must wrap it. Worth a doc note.

### D. Dataviz

- **[Critical] The documented consumption variable `--tt-dataviz-color-series-*` does not exist.** The emitted
  name is `--tt-dataviz-series-*` (the `color` segment is stripped by the namespace collapse in §B). Yet three
  copy-paste examples tell consumers to read `var(--tt-dataviz-color-series-${i+1})`: `dataviz/index.ts:23`,
  `dataviz/useDatavizTokens.ts:21`, and `README.md:365`. **Every first consumer who copies the example gets an
  undefined variable.** **Fix:** correct the examples to `--tt-dataviz-series-${i}` (or add a `color` segment to
  the registry prefix, per §B — the better fix, since it also closes the collision risk).

- **[High] Documented path `dataviz.color.status.not-applicable` is unreachable; the field is `na`.** Four doc
  locations (`dataviz-colors.md:133,214,286,332`) and even the code's own JSDoc (`dataviz/Types.ts:89`) say
  `not-applicable`, but the interface field is `na` (`Types.ts:142`, `baseTheme.ts:93` → `--tt-dataviz-status-na`).
  **Fix:** rename the field to `notApplicable` (matches docs and reads better) or amend docs+JSDoc to `na` — before consumers arrive.

- **[Medium] The default `series.*` palette is not colorblind-distinguishable.** series 3 = red `#ef4444` and
  series 5 = green `#22c55e` are a textbook red-green CVD confusion pair _as distinct categorical roles_. The docs
  never claim the palette itself is CVD-safe — they require a paired encoding channel (shape/pattern), which the
  tests enforce — so the _architecture_ is sound, but a naïve color-only consumer gets an inaccessible chart, and
  no test checks palette distinguishability. **Fix:** adopt a CVD-safe categorical ramp (Okabe-Ito / ColorBrewer
  qualitative) for `series.*`, or state explicitly that `series.*` requires a second channel.

### E. Built-in themes

- **[High] `corporate`, `oca`, and `ventures` are palette-only overrides — the exact "palette-first" anti-pattern
  the docs forbid.** All three are identical 29-line files overriding only `core.colors.brand.*`, with
  `semantic: { /* to do */ }` and `alternate: undefined`. `theme-authoring.md` lists "Palette-first theme" as
  anti-pattern #1 and gates built-in acceptance on a scorecard (≥4 on every axis) and checklist these cannot pass.
  They are nonetheless public exports (`src/index.ts:19-22`). **Fix:** complete them per the derivation sequence,
  or remove them from the public API until they are real themes.

- **[Medium] No built-in theme carries a machine-readable brief.** `FSL-DESIGN-001/002/003` require posture,
  density, and accessibility target; none exists as data, type, or structured comment. **Fix:** attach a typed
  `meta`/brief to each bundle so those rules become enforceable rather than aspirational.

- **[Medium] The four shipped themes are undocumented; the one documented theme doesn't ship.**
  `docs/.../built-in-themes/` contains only `default.md` (an "Enterprise Neutral" archetype that isn't one of the
  four export names). `bruttal`/`corporate`/`oca`/`ventures` appear nowhere in the design docs.

  _Strength worth preserving:_ `bruttal` **is** a real theme, not a palette swap — it drifts geometry
  (`radii → none`), surface model (`elevation → level.0`, dark `emphatic.0`), and documents a contrast-tuned
  `brand.500`. And the default `darkAlternate` is a genuine semantic remap with per-state contrast annotations,
  not an inversion.

### F. Tests

- **[High] Of the 20 `FSL-*` theme-authoring rules, none are enforced _as such_; only a subset get incidental
  coverage via family tests.** Enforced well: `FSL-COLOR-001/003` (pairs + contrast, `colors.test.ts:316-374,495-536`).
  Partial: `FSL-GEO-001/002/003` (spacing/hit ordering), `FSL-FOCUS-001`. **Not enforced:** `FSL-DESIGN-001..003`
  (no brief), `FSL-SURFACE-002` (dark ≠ inversion), `FSL-COLOR-002` (signal exclusivity), `FSL-ATTENTION-001`,
  `FSL-LAYER-001` (elevation ↔ z-index cross-consistency — the two families are tested independently, never
  together). **Fix:** treat as the backlog it is; the doc concedes "should eventually be enforced."

- **[Medium] `corporate`/`oca`/`ventures` are never contrast-checked.** The parameterized color/contrast suite
  runs only `default` + `bruttal` (`colors.test.ts:115-118`); the brand themes appear only in structural tests.
  Their brand-hue overrides have never been validated for AA text/background contrast in either mode.
  **Fix:** add them to `bundleEntries` — this will likely surface real failures given the unfinished palettes.

  _Strength:_ the family validation tests are rigorous and traceable (each cites the doc `#validation` section it
  enforces); the border-contrast test uses an explicit known-violations inventory with add/resolve diffing rather
  than a driftable numeric baseline; `global.test.ts` verifies every emitted token path matches a registry prefix.

### G. Family docs ↔ code drift

- **[High] `spacing.md`'s "default mapping" table and JS example are systematically stale** vs `baseTheme.ts`
  (`inset.control` doc `2/3/4` → actual `3/4/6`; `gap.stack` doc `2/3/4/6/8` → actual `2/4/6/8/12`; both gutters
  and `separation` differ). Ordering invariants still hold, so it's doc drift, not a functional bug — but it's the
  normative table a reader trusts. `baseTheme.ts:1236` even carries a retuning rationale the doc predates.
  **Fix:** regenerate the table from `baseTheme.ts`.

- **[Medium] `z-index.md` documents the family key as `z.*`; the real path is `zIndex.*`.** Grammar, canonical
  set, and JS example all use `z.layer.*`; the type is `semantic.zIndex.layer.*`.

- **[Low] Cluster of small drifts:** `colors.ts:183` JSDoc says `semantic.borders.*` (plural; family is singular
  `border`); `elevation.ts:57,65` use the forbidden filler word `typically`/`typical`; `sizing.md`'s example
  core-hit values diverge from `baseTheme` (labeled "Example," so illustrative only); JSDoc path typo
  `core.space.*` → `core.spacing.*` in `spacing.ts:112-113,133` (echoed in `toCssVars.ts`, `helpers.ts`).

- **[Info] Ordering invariants all verified holding** (spacing, radii, elevation light+dark, zIndex, border,
  opacity), and **`model.md §8` RawValue inventory is exact** — all five semantic non-ref values are registered,
  no stale rows.

### H. Documentation integrity

- **[High] Phantom present-tense references (contract-integrity hazard).** `component-model.md:29-33,64` describes
  `ENTITY_TOKEN_MAPPING` in `packages/ui2/src/tokens/projection.ts` as "the single source of truth consumed by the
  resolver and enforced by contract tests," with a GitHub blob link that 404s, and `ComponentMeta` as the "current
  runtime surface" — none of it exists. `fsl/index.md:25-27`, `fsl-structural-language.md:69`, and
  `fsl-lexicon.md:285` (`@ttoss/ui2`) do the same. **Fix:** rewrite these as explicitly aspirational (the way
  `fsl-structural-language.md §14` and `theme-authoring.md:952` correctly hedge) and drop dead links, or build the
  artifacts. For an AI-first repo this is the doc-tree's most important defect.

- **[Medium] Stale package name `@ttoss/theme2`** in `theme-provider.md:5` (which is also a 5-line stub) and
  `CONTRIBUTING.md:36,109`. The package is `@ttoss/fsl-theme`.

- **[High] `README.md:56` lists a phantom token `semantic.elevation.tonal.flat`** — the code's `tonal` has only
  `raised/overlay/blocking`. `llms.txt` and `elevation.md` are correct; README is the outlier.

- **[Medium] `quick-reference.md` dataviz paths are wrong** in four places (`encoding.stroke.{solid,dashed,dotted}`
  → actually `{reference,forecast,uncertainty}`; missing `.series.` in `shape`/`pattern`; `status.not-applicable`
  → `na`). The family docs are right; the cheatsheet drifted.

- **[High] `families/_families_.yml` is a misconfigured sidebar** — Docusaurus reads only `_category_.yml`, so
  this file is silently ignored and the 11 family docs (which also lack `sidebar_position`) fall back to
  alphabetical order. **Fix:** rename to `_category_.yml`.

- **[Medium] Duplication against the repo's "less is more" standard.** README §"Pick a token in 60s" and
  `quick-reference.md` are two maintained copies of one cheatsheet (and have **already diverged** — the elevation
  and dataviz drift above lives in one but not the other). The blog's perceptual-OS narrative restates
  `theme-authoring.md`'s normative operating model. **Fix:** keep one canonical cheatsheet and link to it.

- **[Medium] Orphans/navigation:** `theme-authoring.md` is missing from the `design-system/index.md` Document Map
  (which claims to list "all foundational design-system documents"); `built-in-themes/`, `style-references/*`,
  `getting-started.md`, and `ui-components/index.md` are outside the Map, and the last two are empty
  "under construction" stubs that are live nav entries.

- **[Info] `llms.txt` is the cleanest artifact audited** — no drift across 10+ spot-checked claims; it even
  correctly omits the phantom `tonal.flat` that README includes. (One asymmetry: `baseTheme` is exported and
  listed in `llms.txt` but missing from the README entry-points table.)

---

## Part IV — Modeling gaps (from the 12-component contract stress-test)

Expressing button, input+validation, alert, card, modal, tabs, toast, table, nav, badge, skeleton, and inline
link using **only** the semantic contract: control-level UI is ~fully expressible (button/alert/tabs/toast/badge
≈ 100%, input ≈ 95%) — a genuinely strong result. Gaps cluster in **surfaces and cross-family agreement**:

- **[High] Surface strata are not first-class colors.** `informational.{role}` encodes _emphasis_
  (primary/secondary/accent/muted), not _stratum_ (page vs card vs raised vs overlay background). The canonical
  "gray page, white cards" and dark-mode "lifted surfaces" pattern — which `theme-authoring.md` itself demands as
  "a layer change = background shift + border/elevation" — has no clean token: `informational.primary.background`
  is documented as **both** "page background" **and** "the card the user is reading." `elevation.tonal.*` partially
  covers it but is optional, core-ref'd, framed as dark-mode shadow compensation, and has no `page`/`flat` member.
  M3 solves this with `surface-container-{low,high}`. This is the largest modeling gap found, and it is cheapest
  to fix now.

- **[Medium] `focus.ring` has no `offset`.** The contract is `{width, style, color}`; the JSDoc example hardcodes
  `outline-offset: 2px`. Focus appearance (WCAG 2.2) depends on offset; themes cannot vary it.

- **[Medium] Tabular numerals are semantically unreachable.** `core.font.numeric.tabular` exists, but no semantic
  text style exposes it (`TextStyle.fontVariantNumeric` is optional and unset in all 17 styles). A
  dashboard/table — the stated target audience — must consume core (forbidden) or restyle `body`.

- **[Medium] Elevation strata ≠ z-index strata.** `zIndex.layer = {base,sticky,overlay,blocking,transient}`;
  `elevation.surface = {flat,raised,overlay,blocking}`. `sticky`/`transient` have no elevation mapping, yet
  `FSL-LAYER-001` demands the two "agree." No shared stratum vocabulary or mapping table.

- **[Low] Placeholder color, inline-prose-link role, and `core.sizing.ramp.layout` consumer** are underspecified;
  no inverse-surface concept (dark hero in light mode). Scrollbar/`::selection`/gradient tokens are acceptable
  scope cuts — but they deserve an explicit **non-goals** list so their absence reads as intentional.

---

## Part V — State-of-the-art benchmark (July 2026)

| Axis                                                                  | Verdict                                   | One-line                                                                                                                                                                                                                                                                                                     |
| :-------------------------------------------------------------------- | :---------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color grammar (state enumeration)                                     | at-parity, deliberately contrarian        | Enumerating state in tokens (vs M3 opacity state-layers) is a defensible bet — it buys contrast-guaranteed disabled/hover colors an opacity overlay can't — but costs authoring surface. Mitigated by optional leaves + type-level illegality + codegen (avoids the Salesforce Lightning "token explosion"). |
| Contrast / pair tooling                                               | **behind (specified, not built)**         | The system's central promise — "validate the pair, not the swatch," `FSL-COLOR-003` — has **no contrast computation anywhere in `src`**. Leonardo/Radix/M3 ship this.                                                                                                                                        |
| DTCG conformance                                                      | **behind**                                | See §A: invented `$type:"string"`, composites emitted as strings, aliases discarded.                                                                                                                                                                                                                         |
| CSS delivery                                                          | at-parity, ahead on breadth               | Ahead: automated `@media` coarse-pointer + reduced-motion blocks, `cqi` fluid tokens, React 19 hoisting. Behind: no `light-dark()` (Baseline 2024, would halve mode CSS), no `@property` registration.                                                                                                       |
| Theming ergonomics                                                    | behind on components, at-parity on values | No component recipe layer (by design — lives in `@ttoss/ui`), **no density API** (density is a manual convention), no first-class high-contrast or named-modes (binary light/dark by explicit design).                                                                                                       |
| Typography                                                            | at-parity, leaning ahead                  | Role-based like M3 + `code`; `cqi` fluid is _more_ advanced than the usual `vw` clamp; optical-sizing/numeric refinements most systems omit.                                                                                                                                                                 |
| **Novelty (FSL, type-level legality, JSDoc-as-contract, `llms.txt`)** | **ahead — the differentiator**            | No shipping system grounds naming in a formal projection with disjointness rules, enforces per-context state legality at `tsc` time, or ships a mature AI-consumer contract.                                                                                                                                 |

**Top adoptions from the field** (ranked): (1) build the specified pair-contrast validator (WCAG 2.x **+** APCA,
both modes, in the dev gate) — highest impact, the central promise is unenforced; (2) true DTCG composites +
preserved aliases; (3) a `createTheme({ density })` API; (4) a `light-dark()` emit mode; (5) turn the `llms.txt`
co-occurrence rules into executable ESLint rules; (6) an optional M3-style state-layer primitive as an opt-in
alternative to per-state enumeration; (7) `@property` registration for animatable tokens; (8) a tokens MCP server.

---

## Part VI — What is genuinely excellent (protect these)

1. **FSL semantic foundation** — a formal lexicon + structural language with disjointness laws and projection
   discipline. More rigorous than any shipping token system's naming rationale.
2. **Per-UX-context state legality in the type system** — `FeedbackColorStates` cannot be `hover`, `action` has no
   `positive/caution`, validation failure is a _role swap_ not an `invalid` state. Enforced at `tsc` time.
3. **JSDoc-as-contract** — every semantic leaf carries a role/discriminator/nearest-sibling comment that surfaces
   in IDE hover and Storybook autodocs, audited by `probe-jsdoc-propagation.ts`.
4. **`llms.txt`** — a mature, non-drifted AI-consumer contract; squarely ahead of the 2025-26 "tokens AI can read" trend.
5. **Engine discipline** — single-source `TOKEN_PATH_REGISTRY` driving both CSS and DTCG; `apply()`-single-owner
   with an SSR template that faithfully mirrors it (ADR-002/003); alternate-mode CSS diff that emits only changed
   vars and makes "core is immutable across modes" explicit in code; reduced-motion/coarse-hit vars _derived_ from
   theme structure, not hardcoded.
6. **The ADR system** with re-litigation answers — an exceptional practice that pre-empts churn.

---

## Part VII — Prioritized roadmap (ranked by leverage)

The ordering exploits the zero-consumer window: contract/naming fixes first (free now, breaking later),
then integrity, then the capability that makes the whole thesis real.

### Tier 0 — Free now, breaking after first adoption (do immediately)

1. **Fix the dataviz var-name contract** (§B + §D Critical): keep the `color`/`encoding`/`geo` segment in the CSS
   prefix so `--tt-dataviz-color-series-*` matches the docs and collisions become impossible; fix the three
   copy-paste examples. Add a build-time duplicate-var assertion.
2. **Reconcile `status.na` ↔ `not-applicable`** and the other doc↔code path drifts (§D, §G, §H grammar-drift) —
   pick one spelling per token while nothing consumes them.
3. **Decide the surface-strata model** (§IV High): introduce first-class stratum background tokens
   (page/surface/raised/overlay) or a documented rule mapping `informational.*` to strata. This is the biggest
   modeling decision and the cheapest to make now.
4. **Add `focus.ring.offset`, expose `fontVariantNumeric` on a semantic text style, and define the
   elevation ↔ z-index stratum mapping** (§IV) — small type additions that are breaking-ish later.
5. **Resolve the built-in-theme story** (§E High): finish `corporate/oca/ventures` per the derivation sequence, or
   stop exporting them. Don't ship the "palette-first" anti-pattern the docs forbid.

### Tier 1 — Contract integrity (the AI-first repo's credibility)

6. **Purge or clearly quarantine the phantom layers** (§H, Part II): rewrite every present-tense reference to
   `taxonomy.ts` / `projection.ts` / `@ttoss/ui2` / the Deterministic Resolver / "contract tests" as explicitly
   aspirational, and fix `@ttoss/theme2` → `@ttoss/fsl-theme`. An agent must not read the docs and believe layer 3
   or 5 exists.
7. **Fix DTCG conformance** (§A): remove `$type:"string"`, emit real composites, preserve aliases, emit
   `$description`. Add a conformance test (the current test proves tree validity, not W3C conformance).
8. **Fix the React SSR contract** (§C): add a stable `href` to the hoisted `<style>`, decide the React 18 story
   (raise peer or document the fallback), and add a `renderToString` test.
9. **Documentation hygiene:** rename `_families_.yml` → `_category_.yml`; regenerate `spacing.md` from
   `baseTheme.ts`; collapse the README/quick-reference cheatsheet duplication to one canonical copy; add
   `theme-authoring.md` and the four themes to the navigation/Document Map; write a short **non-goals** list.

### Tier 2 — Make the thesis real (the compiler that rejects invalid programs)

10. **Build the pair-contrast validator** (§V, benchmark #1): compute WCAG (and ideally APCA) ratios for the
    mandated pairings across **both modes**, run it in the same dev gate as `validateRefs`, fail the build on
    violations, and add `corporate/oca/ventures` to the checked bundles. This single step converts the system's
    headline promise from prose into enforcement — and will surface real failures in the unfinished themes.
11. **Enforce the reachable `FSL-*` rules** (§F): cycle detection, elevation↔z-index consistency, signal
    exclusivity, dark≠inversion, and the `FSL-DESIGN-001..003` brief (which first requires a machine-readable
    theme brief — a small typed `meta` on each bundle).
12. **Harden the engine** (§B): the `isTokenRef` multi-ref gate, nested compound-ref resolution, and the
    `deepMerge` prototype-pollution guard — cheap, and they close the divergence between the CSS and
    flat-token resolution paths.

### Tier 3 — Leadership (widen the lead, after parity)

13. Optional M3-style **state-layer primitive** as an opt-in alternative to per-state enumeration; a
    **`createTheme({ density })`** API; a **`light-dark()`** emit mode and **`@property`** registration; and,
    to extend the AI-consumer lead, **executable ESLint rules generated from `llms.txt`** and a **tokens MCP
    server**. Generate `llms.txt` from `Types.ts` + JSDoc so it can never drift.

---

## One-paragraph summary

The foundation is excellent and, in its semantic rigor and AI-consumer orientation, ahead of the field. The work
now is not invention but **honesty and enforcement**: shrink the documentation to describe only what exists (or
clearly mark the rest aspirational), fix the handful of real contract bugs (dataviz var names, DTCG conformance,
React SSR `href`) while doing so is still free, resolve the surface-strata modeling gap, and then build the one
thing that turns the entire vision from prose into a system — the validator that "rejects invalid programs,"
starting with pair-contrast. Do Tier 0 before the first consumer lands; everything else follows.
