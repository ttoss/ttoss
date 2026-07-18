# fsl-ui / fsl-theme — Evolution & Revision Plan

> **Status:** Approved (2026-07-18) · **Owner:** @enniolopes
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
  - ⏳ **Remaining:** implement the `data-tt-density` projection runtime
    (emitter block + provider + per-density remaps per §3 D2).
- **WS-A — Presentational layer (fsl-ui). ✅ DONE.** `Box` (D1 / ADR-009),
  `Grid` (2D), `Container`; `Text`/`Heading` gained `align` + tabular `numeric`
  (a free `weight` prop was rejected — weight belongs to the type step;
  uppercase eyebrows read as `label-sm`/`muted`). `Stack`/`Surface` kept. All
  token-constrained, no raw values, 100% coverage.
- **WS-B — Control density adoption (fsl-ui).** Wire the density-aware steps
  through the controls (they mostly inherit; verify `Button` et al. resolve the
  projected steps); add the density provider export/wiring.
- **WS-D — Doctrine ADRs + docs.** Ratify D1 (Box escape) and D2 (density
  projection); revise CONTRACT §4/§7, `sizing.md`, `llms.txt`.
- **WS-E — Rebuild the Studio on the finished layer (proof).** Target
  `studio.css` ≈ 0 (page grid + resets only). Residual CSS = a package gap →
  feeds back into WS-A/B.

## 5. Sequencing & exit criteria

```
WS-C (foundation) → WS-A + WS-B (parallel) → WS-D (alongside) → WS-E (proof)
```

**Exit criteria:** a real app is buildable with ~zero hand-rolled CSS; the
default control is desktop-comfortable and density is switchable by projection;
no arbitrary values reach consumer code; every semantic principle in §2 intact;
the Studio rebuilt with `studio.css` ≈ 0.

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
