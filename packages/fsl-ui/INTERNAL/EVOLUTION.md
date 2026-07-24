# fsl-ui / fsl-theme — Evolution & Revision Plan

> **Status:** ✅ CLOSED (2026-07-22) — exit criteria met (§5); kept as the
> historical record of the presentational-layer initiative and the density
> revert. Live planning happens only in `ROADMAP.md` §Program.
> Approved 2026-07-18 · **Owner:** @enniolopes
> **Scope:** `packages/fsl-ui`, `packages/fsl-theme`, their docs and ADRs.
> **Companion:** `packages/fsl-ui/INTERNAL/ROADMAP.md` (Waves A–D). This plan
> is the "production-readiness" initiative that follows Wave 2: it closes the
> gap between "a catalog of semantic controls" and "a UI kit you can build a
> real product with, with ~zero hand-rolled CSS".
>
> Diagnostic instrument: **FSL Studio** (`docs/fsl-studio`). It exists to run
> the packages in practice; its `studio.css` size is the metric. The Studio
> may be rebuilt from scratch (Workstream E) once the layer is complete.

## 1. Why — the root cause

The Studio, the first real consumer, needed **827 lines of `studio.css`** with
38 hand-rolled control selectors and hardcoded literals. Audit facts (measured,
not assumed): **zero** token redefinitions, **zero** `!important` against the
library, **zero** `[data-scope]`/`react-aria` overrides. So the app is **not
fighting the components** — the components style themselves correctly. The CSS
exists to fill a **vacuum**. That vacuum has three layers:

1. **No presentational/layout layer.** fsl-ui shipped 34 interactive controls
   and nothing for composition — no `Box`/`Grid`/`Container`. Every shell,
   layout, and structural arrangement has no library answer → raw CSS.
   (`Stack`/`Surface`/`Text`/`Heading` added mid-session are the _start_ of this
   layer, still incomplete.)

2. **The doctrine forbids variation AND escape simultaneously.** CONTRACT §4:
   _"no `size` prop; a component that needs a different density is a different
   component."_ CONTRACT §7: the only escape is host-owned geometry knobs
   (`--fsl-*` widths). So a dense/small/ghost button cannot be expressed —
   no `size`, no `style`, and the "denser component" was never built → CSS.
   This is the origin of the 38 re-implemented control selectors.

3. **Single-density geometry, tuned generous.** `hit.*` is correctly an
   _ergonomic floor, not a visual size_ (sizing.md), but the default control
   geometry is desktop-hostile: `Button` sets `paddingBlock =
inset.control.sm = {core.spacing.3}` = **12–18px per side**, so a button
   resolves to **~44px** tall — the floor isn't even the bottleneck, the inset
   is. There is no theme-owned lever to make the desktop compact, and control
   geometry adapts only via `rem` (user font), never via a density axis.
   `sizing.md` (`hit.fine.base = clamp(36px,2.5rem,48px)`) and `baseTheme`
   (`clamp(32px,2rem,40px)`) have also **diverged**.

**One sentence:** fsl-ui is a catalog of single-density semantic controls with
a purity doctrine that bans both variation and escape, shipped without the
composition layer or a density system — so real apps hand-roll everything
between and around the controls, and cannot get a compact control without
leaving the system.

## 2. Principles preserved (non-negotiable)

The revision **adds** capability; it does **not** weaken these:

- **Meaning-first** — Entity determines tokens; author chooses meaning, theme
  chooses appearance.
- **No arbitrary values in consumers** — no raw hex/px; everything from tokens.
- **Semantic contract** — legality matrices, `data-scope`/`data-part`, a11y by
  default.
- **Theme owns geometry & responsiveness** — the engine (`clamp`+`cqi`, ramps,
  `hit.*`) lives in tokens, never in component code.
- **AI-first** — `llms.txt`/CONTRACT, first-pass-correct.

The unlock: **composition and density are added as _projections_** (like
light/dark mode), not as free `style` nor as a component-per-variant explosion.
This _strengthens_ "meaning defined once survives every projection".

## 3. Key architectural decisions (to be ratified as ADRs)

### D1 — `Box` is the sanctioned, token-constrained escape hatch (ratified: ADR-009)

Supersedes "no style at all". `Box` (and the layout primitives) expose **typed
props that accept only token keys** — `padding="md"` (spacing scale),
`background="muted"` (informational color), `radius="surface"`,
`maxWidth="reading"` (sizing) — never a free `style`/`className`. Expressive
enough to compose any app layout; constrained enough that no arbitrary value can
enter. The old `--fsl-*` host knobs (§7) remain for host-owned geometry on
composites. **Done in WS-A** (ratified as fsl-ui ADR-009): `Box`, `Grid`,
`Container` shipped alongside `Stack`/`Surface`; `Text`/`Heading` gained
`align` + tabular `numeric`.

### D1.5 — `hit` collapses to a single theme-defined floor (ADR-020)

Refines D2's geometry. `sizing.hit` was a three-step ramp (`min`/`base`/
`prominent`) but only `hit.base` was ever consumed (17 controls; `min`/
`prominent` = 0 usages — dead). It collapses to **one value per pointer
profile** (`hit.fine` / `hit.coarse`), the theme's single ergonomic floor. The
oversized-button root cause was **not** `hit` but the generous
`inset.control` block padding riding the fluid engine; the fix is a tight
`inset.control` (`{core.spacing.1|2|4}`) so the `rem`-anchored `hit` floor
binds and drives height (Button ~32–36px, was ~44–58px). Because `hit` is
`rem`-based (not `cqi`), control _height_ is now non-fluid — satisfying
ADR-019's "control geometry not container-fluid" for the vertical axis without
a separate rem inset scale. **Done in WS-C.**

### D2 — Density is a theme projection axis, not a prop or a component

> **Reverted (2026-07-19).** The density projection shipped with **zero real
> consumers** — the Studio, the only proving ground, never used it. Per the
> evidence rule it was removed (fsl-theme ADR-019 reverted; `core.density`,
> `roots/density.ts`, the `[data-tt-density]` emitter blocks, and
> `DensityProvider`/`useDensity` deleted). CONTRACT §4 "density = a different
> component" is therefore **not** superseded — it stands as written. The rest of
> this section is kept as the historical record of the attempt. `hit`'s collapse
> to a single floor (D1.5 / ADR-020) is independent and stays.

Supersedes CONTRACT §4 "density = different component". A new axis
`data-tt-density ∈ {compact, comfortable, spacious}` (default `comfortable`),
set once via a provider exactly like color-mode. It is a **fsl-theme** feature:
the semantic geometry tokens (`sizing.hit.*`, `spacing.inset.control.*`, and the
control type step) **remap to different core steps per density**. Components do
**not** change — they already read the semantic tokens, so they inherit density
for free. This keeps "theme owns geometry" and "no size prop" intact while
giving the desktop-compact lever the doctrine currently forbids.

- **Pointer safety is orthogonal and wins:** `@media (any-pointer: coarse)`
  still forces touch ergonomics regardless of density (a11y floor never
  violated). Density tunes the **fine-pointer** geometry only.
- **Reconciled geometry targets** (fine pointer; coarse always ≥ 44–48px):

  | token / density        | compact                    | comfortable (default)   | spacious                   |
  | ---------------------- | -------------------------- | ----------------------- | -------------------------- |
  | `hit` floor            | `clamp(28px,1.75rem,32px)` | `clamp(32px,2rem,36px)` | `clamp(36px,2.25rem,44px)` |
  | control `paddingBlock` | `{core.spacing.1}`         | `{core.spacing.2}`      | `{core.spacing.3}`         |
  | ⇒ resolved button ≈    | ~30px                      | ~34–36px                | ~40–44px                   |

  (`comfortable` is shipped today via the single `hit` + tight `inset.control`
  of D1.5/ADR-020; the `compact`/`spacious` remap columns are the pending
  density-projection runtime.)

  This fixes the "~44px" default (comfortable ≈ 34–36px on desktop) and
  reconciles the sizing.md ⇄ baseTheme divergence in one pass.

## 4. Workstreams

Each item lands with the package DoD (meta/contract/a11y/behavior tests, 100%
coverage, JSDoc, `llms.txt`/CONTRACT update) and, where architectural, an ADR.

- **WS-C — Base geometry + density projection (fsl-theme). FOUNDATION.**
  - ✅ **Done:** collapsed `hit` to a single theme-defined floor (D1.5 /
    ADR-020); reconciled `hit.fine` (doc ⇄ base); re-tuned `inset.control` so
    `comfortable` is desktop-correct (Button ~32–36px); documented the
    responsiveness split (controls: `rem`; layout: `cqi`); updated `sizing.md`,
    CONTRACT §4, `llms.txt`, tests.
  - ↩️ **Reverted (2026-07-19):** the `data-tt-density` projection was
    implemented but shipped with no consumer, so it was removed (fsl-theme
    ADR-019 reverted). `hit`'s single-floor collapse (above) is unaffected.
- **WS-A — Presentational layer (fsl-ui). ✅ DONE.** `Box` (D1 / ADR-009),
  `Grid` (2D), `Container`; `Text`/`Heading` gained `align` + tabular `numeric`
  (a free `weight` prop was rejected — weight belongs to the type step;
  uppercase eyebrows read as `label-sm`/`muted`). `Stack`/`Surface` kept. All
  token-constrained, no raw values, 100% coverage.
- **WS-B — Control density adoption (fsl-ui). ↩️ REVERTED with WS-C.** The
  projection needed no per-control wiring, but it was removed for lack of a
  consumer (see D2). Nothing in fsl-ui changed as a result — controls read
  `spacing.inset.control.*` directly.
- **WS-D — Doctrine ADRs + docs. ✅ DONE.** Ratified D1 as fsl-ui ADR-009
  (Box/presentational layer); ratified the `hit` collapse as ADR-020. The
  density ADR-019 was later reverted (see D2). Revised CONTRACT §4/§7,
  `sizing.md`, `llms.txt`.
- **WS-E — Rebuild the Studio on the finished layer (proof). ✅ DONE.** Every
  panel — Home, Stage/StageSample/PageGrid, Theme navigator/inspector/export,
  Component navigator/inspector/stage — now composes with the primitives
  (`Stack`/`Grid`/`Container`/`Surface`/`Heading`/`Text`) plus fsl-ui controls
  (`ToggleButtonGroup` for the preset picker, `Button`/`Link` for actions).
  `studio.css` fell **851 → 637 lines**; the residual is exactly the allowed
  set: the shell/viewport grid, and genuinely bespoke widgets no primitive
  covers — asymmetric editor grids (`.token-row`, `.theme-diff-row`), native
  color inputs, contrast badges, nav-list items, the command palette overlay,
  and the code blocks. A surfaced gap fed back into WS-A: **`Grid`
  `minColumnWidth`** (responsive auto-fit) was added because the fixed-column
  grid could not reflow in the narrow stage panes.

## 5. Sequencing & exit criteria

```
WS-C (foundation) → WS-A + WS-B (parallel) → WS-D (alongside) → WS-E (proof)
```

**Exit criteria — met.** A real app is buildable with ~zero hand-rolled
_layout/text_ CSS (the Studio proved it: all content composes with primitives);
the default control is desktop-comfortable and density is switchable by
projection; no arbitrary values reach consumer code; every semantic principle
in §2 is intact. The Studio's residual `studio.css` is the shell grid + bespoke
widgets primitives don't cover (asymmetric editor grids, native color inputs,
badges, nav items, palette overlay) — not a layout gap. Closing those fully
would need new primitives (e.g. a template/asymmetric `Grid`, a clickable-card
primitive), tracked as future evidence-driven work.

## 6. Open questions

- **OQ-1** density default per surface: is `comfortable` right app-wide, or
  should dense surfaces (data tables, token trees) default to `compact` via a
  nested density provider? (Lean: nestable provider, `comfortable` global
  default.)
- **OQ-2** `Box` prop surface breadth — start minimal (padding/margin/gap/
  background/color/border/radius/sizing) and grow on evidence, or ship the full
  set? (Lean: minimal, evidence-driven, to avoid over-engineering.)
- **OQ-3** does `Grid` need template-area support in v1, or just columns/rows/
  gap? (Lean: columns/rows/gap first.)
