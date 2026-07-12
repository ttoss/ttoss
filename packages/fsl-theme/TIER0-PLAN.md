# Tier 0 — Refined Plan (stress-tested against the normative docs)

> This refines the Tier 0 list from `REVIEW.md` after stress-testing each item against the
> normative sources: `CONTRIBUTING.md` (ADRs, naming rules, token-change operations), the FSL
> Lexicon/Structural Language, `model.md`, `governance.md`, `theme-authoring.md`, and the family
> specs (`colors.md`, `borders.md`, `typography.md`, `elevation.md`, `z-index.md`).
>
> **Headline: the stress-test killed or reframed most of the original list.** Three of the five
> items proposed adding tokens the docs have _deliberately and explicitly decided against_. Per the
> repo's own divergence protocol ("code that diverges from obvious best practice is evidence of an
> unstated invariant — investigate before changing"), those are not gaps to fill — they are
> decisions to respect. What survives is smaller, sharper, and partly different from the original.

---

## Verdict on the original Tier 0 items

| Original item                          | Verdict                              | Why                                                                                               |
| :------------------------------------- | :----------------------------------- | :------------------------------------------------------------------------------------------------ |
| 1. Dataviz var-name contract           | **Survives — direction confirmed**   | Real bug; Option A (keep the channel segment) is correct _and cheaper_.                           |
| 2. Reconcile `status.na` + path drifts | **Survives — scoped**                | Real; but gated on a governance decision (below).                                                 |
| 3. Surface-strata **tokens**           | **Reframed — token option dropped**  | `colors.md` §Stacking + Rule #4 **forbid** color tokens for depth. Residual issue is narrower.    |
| 4a. `focus.ring.offset`                | **Demoted out of Tier 0**            | `borders.md:247` puts offset at the impl layer _by decision_, with an explicit "unless promoted." |
| 4b. `fontVariantNumeric` semantic      | **Reframed — a design question**     | Real gap (no semantic path to tabular figures), but needs a decision, not a mechanical add.       |
| 4c. elevation ↔ z-index mapping        | **Dropped from Tier 0**              | Deliberately distinct axes; nothing to add to the type contract. Belongs to Tier 2 validation.    |
| 5. Built-in themes                     | **Survives — decision made: remove** | `oca` is provably inaccessible; `corporate` is a base-clone; none is authored.                    |

**Net:** 2 survive as-is, 2 reframe into smaller items, 1 demotes, 1 drops — and **2 new items emerge**
(a governance decision and the theme brief). "Fewer tokens, stronger meaning" (`governance.md`) applies to
the plan itself.

---

## Decision 0 (blocking, cross-cutting) — governance stance for the zero-consumer window

Every rename below is, per `governance.md`, a **MAJOR** change that formally wants a deprecation window
(mark `@deprecated` → provide replacement → migrate → remove next major). But that window exists to
protect consumers, and there are **zero** in the monorepo. The package is published at `1.1.22` but
was a single "Init" commit; the risk of unknown external npm consumers is low.

**Decide first, because it governs _how_ every other item is executed:**

- **Recommended — (A) declare a pre-adoption window.** Hard-rename now, bump **MAJOR** (→ `2.0.0`) with a
  single changeset listing every renamed path. No `@deprecated` aliases, no soft-path cruft. This is the
  entire point of "do it while it's free."
- (B) Follow the deprecation window even now — carries dead aliases into a system with no consumers.

This decision belongs in an **ADR** (the CONTRIBUTING "Token change operations" table currently says
semantic renames follow the deprecation window — an ADR is required to override it for the window).

---

## The refined plan

### T0-1 — Dataviz variable-name contract · _Critical · confirmed_

**Fix direction: Option A — keep the channel segment.** Emit `--tt-dataviz-color-series-N`,
`--tt-dataviz-geo-state-selection`, etc. This is the only option consistent with the documented general
rule (`semantic.<family>.<sub> → --tt-<family>-<sub>`) and with the `colors` family, which keeps its
post-family segment (`--tt-colors-action-…`). Dataviz is the sole family that drops it today.

- Edit the five dataviz `cssPrefix` values in `tokenRegistry.ts:49-69` →
  `--tt-dataviz-color-`, `--tt-dataviz-geo-`, `--tt-dataviz-encoding-`, `--tt-dataviz-encoding-opacity-`
  (catch-all `semantic.dataviz.` stays `--tt-dataviz-`).
- The three copy-paste examples (`dataviz/index.ts:23`, `dataviz/useDatavizTokens.ts:21`, `README.md:365`)
  **already** say `--tt-dataviz-color-series-…` → **no edit needed** (they were right; the emitter was wrong).
- **Rewrite `toCssVars.test.ts:32-38`** — it currently asserts the drop as correct and comments the
  segment-kept form as "wrong." That premise is itself the bug (it conflated "keep `color`" with a
  match-ordering mistake). Invert the expectation.
- Fix `CONTRIBUTING.md:98` — doubly stale (`...color.sequential.0` → real `...color.scale.sequential.1`;
  correct emitted var `--tt-dataviz-color-scale-sequential-1`).
- **Add a build-time duplicate-var assertion** in the CSS emitter (guards the _whole_ registry, not just
  dataviz — first-match-wins with no dup detection is the root hazard). Verified: no active collisions
  today, but ≥3 one-rename-away pairs (`color.state.*`/`geo.state.*`, `encoding.opacity.*` bare names),
  all closed structurally by Option A + the assertion.

### T0-2 — Path / spelling drift reconciliation · _under Decision 0_

Pick one spelling per token while nothing consumes them. Batch:

- **`dataviz.color.status.na` → `notApplicable`** (emits `…-color-status-not-applicable`). Rename the
  _field_, not the docs: four doc locations and the code's own JSDoc (`dataviz/Types.ts:89`) already say
  `not-applicable`; `na` is the outlier.
- **`z-index.md` grammar `z.*` → `zIndex.*`** (real path is `semantic.zIndex.layer.*`; doc uses `z.layer.*`
  throughout: `:116,121-125,134-138,146`).
- **`quick-reference.md` dataviz paths** — `encoding.stroke.{solid,dashed,dotted}` → `{reference,forecast,uncertainty}`;
  add missing `.series.` in `shape`/`pattern`; `status.not-applicable` after T0-2.
- **`README.md:56`** — remove phantom `semantic.elevation.tonal.flat` (`tonal` has only `raised/overlay/blocking`).
- **JSDoc/typo cluster** — `colors.ts:183` `semantic.borders.*` → `border`; `elevation.ts:57,65` drop
  filler `typically`/`typical`; `core.space.*` → `core.spacing.*` in `spacing.ts:112-113,133`,
  `toCssVars.ts:65-66`, `helpers.ts:198-199,229`.
- **`spacing.md` mapping table** (`:114-179`) — regenerate from `baseTheme.ts` (systematically stale;
  ordering invariants still hold, so it's doc drift, not a functional bug).

### T0-3 — Surface strata · _reframed: NO new tokens_

The original "introduce first-class stratum background tokens (page/surface/raised/overlay)" **contradicts
the normative model** and must not be done: `colors.md` §"Stacking informational surfaces" (`:344-354`)
and Rule of Engagement #4 (`:363`) state that stacked surfaces are differentiated **elevation → border →
step-displacement, _never_ in colour**, and that page and card **may share the same
`informational.primary.background` value**. Adding `informational.*.surface.background` roles is exactly
the "invent extra colour roles to encode depth" the docs forbid.

What is actually real (small):

- **Clarify the JSDoc/docs** that `informational.primary.background.default` is _intentionally_ used for
  both the page and an elevated card, differentiated by elevation+border — today the JSDoc reads as a
  contradiction because it names both roles without the stacking context.
- **Resolve one open question and document the answer:** the step-displacement reinforcement
  (`colors.md:352`, "page = `neutral.1000`, surface = `neutral.900`") requires page and elevated surface
  to reference _different_ core steps — but both resolve to the same semantic token. Which two semantic
  tokens carry the two steps? Is there a page/app-background token, or is displacement always a
  theme-side remap of a single token (and if so, how does a card get a different value)? Decide and write
  it down. **No new color vocabulary** either way.

### T0-4a — `focus.ring.offset` · _demoted out of Tier 0_

`borders.md:247` states "`outline-offset` belongs to the implementation layer **unless the system later
promotes it into a token**," and the "Advanced CSS Capabilities (escape hatches, not token contracts)"
section lists `outline-offset` explicitly as out-of-contract. This is a **decision**, not an oversight —
so promoting it is a governance ADR, not a free type add. **Keep at the impl layer for now.** Revisit only
if a concrete component proves it cannot produce an accessible focus indicator without theme-controlled
offset.

### T0-4b — Tabular numerals path · _reframed: a design question (Medium)_

Real gap: `core.font.numeric.tabular` exists and is documented "for dashboards," but no semantic
`TextStyle` sets `fontVariantNumeric` (optional, unset in all 17 styles), and components may not consume
core — so a dashboard/table has **no semantic path to tabular figures**. This needs a decision, not a
mechanical add. Options: (a) declare `text.code.*` the intended home for tabular data (mono is inherently
tabular) and document it; (b) set `fontVariantNumeric: tabular` on the specific styles that carry numeric
UI (e.g. a `label`/`body` variant); (c) add a small dedicated numeric-text contract. Pick one; the "free
now" framing applies if it changes the semantic surface.

### T0-4c — elevation ↔ z-index · _dropped from Tier 0_

There is **no shared stratum type to add.** `elevation.surface` (depth/shadow: flat/raised/overlay/blocking)
and `zIndex.layer` (stacking: base/sticky/overlay/blocking/transient) are deliberately distinct axes —
both family docs separate them explicitly, and they intentionally do not map 1:1 (a raised card is
`zIndex.base`; a sticky bar is `zIndex.sticky` at any elevation). `FSL-LAYER-001` ("elevation and z-index
are semantically consistent") is a **co-occurrence validation rule** (reject "high shadow + base z-index"),
not a shared vocabulary. → The only real work is (i) an optional authoring cross-walk table (low value)
and (ii) executable `FSL-LAYER-001` enforcement, which is **Tier 2**. Remove from Tier 0.

### T0-5 — Built-in themes · _decision: remove `corporate`/`oca`/`ventures` now_

Verified in source:

- **`oca` ships broken.** `brand.500 = #6DB800` (bright lime); the inherited filled-brand pairs paint
  white text on it (`action.accent`, `input.primary.checked`, `informational.accent.selected`,
  `navigation.accent.*` in `baseTheme.ts`). White-on-`#6DB800` ≈ **2.5:1 — fails WCAG AA (4.5:1)**. The
  contrast suite never catches it because it runs only `default` + `bruttal`.
- **`corporate` is a base-clone.** `brand.500 = #0469E3` is **identical** to the base's `#0469e3`; only the
  50–900 steps are lightly retinted. It adds a brand name and no meaning.
- **`ventures`** is unauthored (`brand.500 = #1A3D8F` navy; pairs happen to pass, but no brief, no
  semantic/geometry/surface/dark work).
- All three are `semantic: { /* to do */ }` + `alternate: undefined` — the exact "palette-first"
  anti-pattern `theme-authoring.md` forbids. **Brand-only override is not accessible-for-free**: each
  filled-brand pair assumes a luminance band, which is precisely why `bruttal` hand-tuned its
  `brand.500` (`#6D5D4F`, ≈7.3:1) to obey the inherited pairs rather than override them.

**Action:** remove the three from `src/index.ts:19-22` and `README.md:15`; **MAJOR** bump + changeset
(technically a published-API removal; blast radius in-repo is zero). **Keep `bruttal`** (a real theme).
If product commits to any of the three later, "finishing" means the full derivation sequence (brief →
luminance-tuned ramp obeying inherited pairs → dark alternate → **add to the contrast suite** → docs
entry), not a hex edit.

**Corollary rule (adopt):** any exported theme MUST be a member of the parameterized contrast suite
(`colors.test.ts` `bundleEntries`). Shipping a theme that the suite doesn't check is how `oca` happened.

### T0-6 — Theme brief as typed `meta` · _new, enabling (promote from Tier 2)_

Add an optional `meta?: ThemeBrief` to `ThemeBundle` (`posture`/`density`/`accessibilityTarget`, …). It is
**purely additive and orthogonal to tokens** — DTCG/CSS emitters read `bundle.base`, so a `meta` sibling
never touches the token tree or interchange conformance, and optionality keeps existing `createTheme`
callers valid. This is the machine-readable home the brief lacks today, makes `FSL-DESIGN-001..003`
enforceable, and is the precondition for ever finishing a built-in theme properly. Small, and "free now."

---

## Suggested execution order

1. **Decision 0** (ADR: zero-consumer window → hard-rename + MAJOR). Unblocks everything else.
2. **T0-1** (dataviz vars + duplicate-var assertion) and **T0-2** (drift batch) — the two mechanical,
   high-certainty fixes; land them together under the MAJOR bump.
3. **T0-5** (remove the three themes) + **T0-6** (`meta` brief) + the contrast-suite-membership rule —
   one coherent "themes" change.
4. **T0-3** (surface-strata clarification + the one open question) and **T0-4b** (tabular path decision) —
   the two that need a design decision written down; no code until decided.
5. **T0-4a** and **T0-4c** — explicitly _not_ in Tier 0; recorded as deferred/ADR-gated.

Everything in steps 2–3 is genuinely "free now, breaking later" and should precede the first consumer.
Steps 4–5 are decisions, not diffs.

## What did _not_ survive, and why that matters

The reframings above are the point of this pass: `focus.ring.offset`, the elevation↔z-index type, and
surface-strata color tokens all _looked_ like obvious "small additions" and are all things the design has
already reasoned through and rejected in writing. Executing the original list verbatim would have added
vocabulary the system deliberately keeps out — the opposite of "fewer tokens, stronger meaning." The
relevant Tier 0 is the shorter one.
