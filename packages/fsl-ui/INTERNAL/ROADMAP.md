# FSL — Program Roadmap

> **Single source of truth for FSL scope and status** (consolidated
> 2026-07-22). Covers `@ttoss/fsl-theme`, `@ttoss/fsl-ui`, their docs, and the
> rulings on the satellites (`fsl-bench`, `fsl-studio`). Planning docs it
> supersedes: `EVOLUTION.md` (closed — exit criteria met, kept as record);
> `PURPOSE.md` / `STRATEGIC_EVAL.md` (deleted — stale ui2-era drafts; the
> north star below carries their intent). New planning content lands **here**,
> never in a new file.

## Program — route to v1

### North star

`fsl-theme` + `fsl-ui` finished to the level where they are the default
choice over Tailwind/Chakra/Material for ttoss applications: semantic,
accessible, AI-first, and visually refined out of the box. **Finished means
in production use — not feature-complete on paper.**

### Scope ruling (2026-07-22)

The program is two packages and one docs section. Everything else is support
tooling, admitted only when it serves the adoption gate.

| Surface                    | Ruling                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/fsl-theme`       | ✅ **Done** (v2.x): full token model, ~99% enforced coverage, 20 ADRs, professional base theme. Maintenance + additive polish only (P3 aesthetic pass may tune values; no new families without a consumer — evidence rule).                                                                                                                                                                                    |
| `packages/fsl-ui`          | 🔥 **Active** — the route below is the plan.                                                                                                                                                                                                                                                                                                                                                                   |
| `docs/website/docs/design` | 🔥 **Active** — consolidation only (P0); no new doc families.                                                                                                                                                                                                                                                                                                                                                  |
| `packages/fsl-bench`       | ⏸ **Parked.** Real, working evidence instrument — but a benchmark victory is not a release gate (the 2026-07-16 gemini-only run showing fsl-ui behind Radix on first-pass is a signal to iterate `llms.txt` via adoption, not a wall). Re-run after v1 as marketing evidence, on demand.                                                                                                                       |
| `docs/fsl-studio`          | 🔥 **Active — the P1 adoption vehicle** (ruling revised 2026-07-22, owner decision). Rebuilt **from scratch with zero reuse** of v1 code. v1 (Tazuna-UX-framed tool) is deleted; PRD v2 is dead. The v2 product frame: a deliberately conventional showcase app — shell + blocks gallery + component catalog + theme lab — that exists to generate the adoption friction log and the aesthetic proving ground. |

### The gate (replaces D1 → D2; revised 2026-07-22)

**fsl-ui v1.0 ships when Studio v2 is deployed with its four blocks and the
friction log is worked down to zero blockers.** The blocks (Login,
Settings/CRUD, Dashboard, Pricing) are real application flows in miniature —
they exercise forms+validation, tables+selects, dataviz, and marketing
composition, which is the friction a business app would generate. The
residual self-reference (the system's own showcase validating the system) is
accepted and named: **"first screen in an external business app" is the v1.x
milestone that follows**, not a v1.0 blocker. The AI-executability benchmark
(D1) stays demoted to optional evidence. Rationale: a gate the team never
runs blocks forever; the Studio gate is reachable, in-repo, and generates
representative friction.

### Route

- **P0 — Docs consolidation** _(started 2026-07-22; first pass landed)_
  - [x] Fix doc↔code contradictions: `sizing.hit` ramp in fsl-theme README (ADR-020), `dimension` axis in `Types.ts` header (model.md), missing `invalid` State in fsl-structural-language §5.7 (ADR-017), dataviz `foundation`/"v2" framing, theme-authoring self-reference.
  - [x] Remove dead surface: 6 style-reference stubs deleted; `getting-started` written (was "Under Construction"); `built-in-themes/default.md` → `enterprise-neutral.md` reframed as a draft Formal Style Profile (shipped themes: `baseTheme` + `bruttal`); `icon-system.md` migrated off the retired `Responsibility`/`Host`/`*Frame` vocabulary; ui2-era INTERNAL drafts deleted.
  - [ ] Merge the three per-family theme-shaping formats (`theme-authoring.md` × `enterprise-neutral.md` × style-reference profiles) into one canonical layer with the other two linking, not restating.
  - [ ] Single-source the color grammar and the intent→token cheatsheet: design docs canonical, package READMEs keep only the npm-facing quickstart + a link.
- **P1 — Studio v2 as the adoption app (THE gate)** _(revised 2026-07-22; owner picked the Studio)_
  - **Zero reuse of v1.** The v1 app is deleted (src, tests, PRD, `studio.css`). Recorded lesson: v1 used the adoption app as a UX experiment (Tazuna-UX-driven navigation/layout) and shipped unusable — the design system's job is to make the _conventional_ excellent; experimental IA does not belong in the adoption vehicle.
  - **Product frame (fixed, small):** conventional shell (sidebar + content, `AppShell` + fsl-ui primitives only) hosting three surfaces — **Blocks gallery** (the adoption engine), **Component catalog**, **Theme lab**. Nothing from PRD v2 (blast-radius/AI bands) enters.
  - **Slices, in order:** ① shell + navigation + mode toggle → ② Login block → ③ Settings/CRUD block (this is what pulls Table/ComboBox with real evidence) → ④ Dashboard block (dataviz) → ⑤ Pricing/marketing block → ⑥ catalog + theme lab rebuilt on the proven shell.
  - **Hard budget:** zero hand-rolled _layout_ CSS. Bespoke CSS only for a widget no primitive covers, one justification comment per rule — a gap found this way is a logged friction item, not a silent workaround.
  - **Quality ritual per block:** a block merges only with (a) its friction-log entries filed and (b) a side-by-side comparison against 2–3 reference-grade products, light **and** dark. This runs P3's aesthetic bar per delivery instead of as an end phase.
  - **Friction log:** `docs/fsl-studio/FRICTION.md` (the Wave-1/2 discipline): every hand-rolled style, missing component, confusing API, or `llms.txt`/CONTRACT gap is a logged item — that log **is** the v1 backlog. Doc fixes land immediately (this is what the bench was trying to measure, obtained for free).
- **P2 — Evidence-driven gaps** _(only what P1 demands, in demand order)_
  - Wave 3 trimmed: **ComboBox** and **Table** are the likely first asks; Tree only on demand. Date/time suite (Phase 3) and Color/DnD (Phase 4) stay deferred until an app asks.
  - Public `Icon` export decision (ADR-005 follow-up) when an app needs glyphs outside shipped components.
- **P3 — Aesthetic excellence pass** _(the "game changer" bar — base theme as flagship)_
  - Structured design review of `baseTheme` against 2–3 reference-grade systems (side-by-side screenshots of the same screens, light + dark): typography rhythm, elevation depth (ADR-018 tonal), radii/border character, motion feel, empty/hover/focus states.
  - Findings land as core-value tuning in `baseTheme.ts` (data-only per ADR-008; contrast guarantees per ADR-015 must hold) + the composition "taste layer" doc.
  - The frozen Studio deploy doubles as the visual proving ground — it already renders the catalog; no new Studio features allowed for this.
- **v1.0 criteria (all of):** adoption gate met (Studio v2 deployed, four blocks, friction log at zero blockers) · P0 both remaining items done · P2 items the adoption demanded shipped · P3 bar applied per block (ritual above) · CHANGELOG migration notes honest. **v1.x milestone:** first screen in an external business app.

### Anti-scope-creep rules (binding)

1. **Evidence rule, program-wide** (extends the existing ADR culture): no new package, doc family, tool, or projection axis without a real consumer already waiting.
2. New ideas go to the parking lot below — never to a new file, package, or PRD.
3. A phase is not "in progress" until the previous one's checklist is done or explicitly waived here.

### Parking lot

- fsl-bench launch campaign (Anthropic + Gemini, A/B llms.txt) — after v1, as evidence.
- `@ttoss/fsl-blocks` package — blocks live **inside Studio v2** first; extract to a package only when an external app wants to consume a block (that demand is the trigger — evidence rule).
- Studio blast-radius/impact band (the dead PRD v2 idea) — only if post-v1 demand appears.
- More built-in themes beyond `baseTheme`/`bruttal` (the Enterprise Neutral profile is the first candidate) — after P3 defines the quality bar.
- Density projection (reverted ADR-019) — only when a real app demands a switchable-density surface.
- Storybook wiring for fsl-ui — deliberately out of scope; the Studio deploy serves the browse need.

---

# Detailed tracker — fsl-ui workstreams

> Working plan produced by the 2026-07-15 deep audit. Two workstreams:
> **A** — remediate every audit finding; **B** — implement the full React Aria
> Components (RAC) atomic catalog in the fsl-ui pattern, so the package ships
> a complete, reviewed base layer for compositions/patterns and serves as the
> real-world validation of the FSL theory.
>
> Out of scope by explicit decision: Storybook wiring. Adoption is governed by
> the Program section above (P1 gate); the `private: true` flip follows the
> revised D2.

## Scope guard (binding for every executor of this plan)

Writable surfaces — **only**:

- `packages/fsl-ui/**`
- `packages/fsl-theme/**` (only when an item genuinely requires it, e.g. new
  tokens)
- `packages/fsl-bench/**` (added 2026-07-16 for Workstream D — the D1
  benchmark harness lives in its own private package so its dependencies
  (baseline libraries, model SDKs) never touch the measured package, and so
  it consumes fsl-ui the way an external app would)
- `docs/website/docs/design/**` pages that document fsl-ui / fsl-theme
  (A15 targets the `ui-components` **documentation page**, not any package)

Read-only — never modified by this plan: every other package, including
`@ttoss/ui`, `@ttoss/forms`, `@ttoss/components` (they may be _consumed_ as
devDependencies for integration tests, e.g. A11, but their source is
untouchable). No Storybook files, no root CI/workflow files — anything this
plan needs to run in CI ships as a script inside `packages/fsl-ui`.

Legend: effort `S` (≤ half day) · `M` (1–2 days) · `L` (3+ days). Every item
lists acceptance criteria (AC). File:line references are evidence from the
audit, valid as of commit `81c257d`.

---

## Workstream A — Audit findings remediation

> **Status: ✅ COMPLETE (2026-07-15).** All 16 findings remediated in one
> pass. Package state after the pass: 662 tests green, 100% coverage on
> every dimension, axe + keyboard suites in place, `@ttoss/forms` bridge
> proven, packaging carries the AI surface (`llms.txt` + CONTRACT in the
> tarball). Per-item notes below (⤷). The build and `tsc` type-check run
> locally under Node 24 (the repo standard, `engines.node >= 24`).

### A-P0: bugs and broken promises

**A1. ProgressBar indeterminate animation is dead** `S`
`ProgressBar.tsx` animates `tt-progressbar-indeterminate 1.2s infinite`; the
`@keyframes` is defined nowhere — the fill sits statically at 40%.

- Inject the keyframes once (module-level `<style>` injection or a tiny
  `ensureKeyframes()` helper in `tokens/`), guarded by
  `@media (prefers-reduced-motion: reduce)`.
- New contract-test invariant #8: every `animation:` name referenced in `src/`
  must have a matching `@keyframes` definition (greppable).
- AC: indeterminate bar visibly animates in a browser; reduced-motion disables
  it; invariant test fails if a keyframe goes missing again.

> ⤷ **Done.** `src/tokens/keyframes.ts` — `ANIMATION_NAMES` registry + `ensureKeyframes()` (idempotent, SSR-safe `<style id="fsl-ui-keyframes">` injection with a `prefers-reduced-motion: reduce` kill switch), wired via `useInsertionEffect` in ProgressBar. Invariant #8 lives in `keyframes.test.ts`: every `animation:` in `src/` must reference `ANIMATION_NAMES.*` (or reset), and every registered name must have a `@keyframes` block.

**A2. Dialog width is unconfigurable** `S` _(depends on A6 decision)_
`Dialog.tsx` hardcodes `maxWidth: 'min(500px, 90vw)'` on the internal modal
surface; `style`/`className` are omitted and the documented wrapper workaround
cannot reach the constrained element.

- Implement via the A6 escape-hatch mechanism (recommended: composite-scoped
  CSS custom property `--fsl-dialog-max-width` with the current value as
  fallback: `maxWidth: 'var(--fsl-dialog-max-width, min(500px, 90vw))'`).
- AC: a host can set the width via CSS targeting `[data-scope="dialog"]`
  without touching component code; default behavior unchanged; documented in
  CONTRACT.md.

> ⤷ **Done.** `--fsl-dialog-max-width` + `--fsl-dialog-max-height` knobs via `fslVar` with the previous literals as fallbacks; documented in CONTRACT.md §7 and covered by contract tests asserting the rendered `var(...)` values.

**A3. i18n decision — 7 hardcoded English defaults** `M` _(decision + ADR)_
`Wizard` (Back/Next/Finish), `ConfirmationDialog` (Confirm/Cancel/"Click again
to confirm"), `Select` ("Select…"). No i18n rule exists in CONTRIBUTING.

- Decision (recommended): make flow-critical labels **required** (no defaults)
  on `ConfirmationDialog` and `WizardNavigation`; keep the `Select` placeholder
  as a documented English fallback. Record as a package ADR in CONTRIBUTING.
- Add an i18n section to CONTRIBUTING: components never depend on
  `@ttoss/react-i18n`; all user-facing text is caller-supplied; defaults are
  forbidden for flow-critical labels.
- AC: `tsc` forces callers to supply the labels; ADR recorded; CONTRIBUTING
  rule added; tests updated.

> ⤷ **Done.** ADR-001 + CONTRIBUTING §6. `ConfirmationDialog`: `confirmLabel`/`cancelLabel` required, `armedLabel` required-iff-destructive via a discriminated union on `consequence`. `WizardNavigation`: labels required unless the render-prop `children` owns the row (union type). `Select` placeholder and the Wizard `announceStep` live-region copy stay as documented English fallbacks with override props.

**A4. npm packaging breaks the AI-first promise** `S`
`files: ["dist"]` omits `CONTRACT.md`; README references `src/…` paths that do
not exist in the published tarball; no `llms.txt`; README has zero usage
examples.

- Add `src/tokens/CONTRACT.md` (or a copied `CONTRACT.md` at package root) and
  `llms.txt` to `files`.
- Author `llms.txt`: distilled CONTRACT §0–§5 + component catalog + the
  Entity → token map + state cascade — the machine-readable ground truth.
- Rewrite README: install → `ThemeProvider` (from `@ttoss/fsl-theme/react`) →
  first Button → link to CONTRACT/taxonomy with paths valid in the tarball.
- AC: `npm pack` tarball contains the AI surface; README quickstart works
  copy-paste in a fresh Vite app.

> ⤷ **Done.** `files: ["dist", "llms.txt", "src/tokens/CONTRACT.md"]`; `llms.txt` authored (semantic model, catalog, Entity→token map, cascade, integration rules); README rewritten with install → `createTheme()` + `ThemeProvider` → first Button, verified against the real fsl-theme API.

**A5. Stale references and old identity** `S`

- `ISSUE.md §2.2/2.3/2.4` cited in `Wizard.tsx`, `ConfirmationDialog.tsx`,
  `Wizard.test.tsx`, `DialogActions.test.tsx` — file does not exist. Move the
  cited rationale into CONTRIBUTING (it is the behavior-driving evidence rule)
  and repoint the comments.
- CONTRIBUTING.md title says `@ttoss/ui2`, examples import `@ttoss/theme2/vars`
  → rename to `@ttoss/fsl-ui` / `@ttoss/fsl-theme/vars`.
- `compositeScope.test.tsx:216` passes `totalSteps={2}` — prop does not exist
  on `WizardProps`; fix the test and investigate why TS accepted it (likely a
  spread/`any` hole worth closing).
- AC: `grep -rn "ISSUE.md\|ui2\|theme2" src tests CONTRIBUTING.md` returns
  nothing; the phantom-prop compiles no more.

> ⤷ **Done.** Grep is clean (src, tests, CONTRIBUTING, README). Evidence-rule comments now point at CONTRIBUTING §2.3 (Patterns A/B + Consequence dispatch). Phantom `totalSteps` removed from `compositeScope.test.tsx` — it survived because jest runs babel without type-checking; `tsc` (build/CI) is the type gate.

### A-P1: real-world API & robustness

**A6. Escape-hatch policy (systemic decision)** `M` _(blocks A2, B-wave items)_
Composites omit `style`/`className` by doctrine, but real apps need: Dialog
width, Menu popover sizing (`12rem` / `min(320px, 90vw)` hardcoded), popover
`crossOffset`/`shouldFlip`/`containerPadding`.

- Decision (recommended): **composite-scoped CSS custom properties** as the
  single official escape hatch — `--fsl-<scope>-<knob>` consumed with the
  current literal as fallback. Preserves the no-visual-props doctrine; the
  host customizes via CSS/theme, the mechanism the system already sanctifies.
- Expose safe RAC positioning props (`crossOffset`, `shouldFlip`) where the
  primitive supports them.
- Document the policy in CONTRACT.md as a numbered section; every future
  component follows it.
- AC: policy section in CONTRACT; Dialog + Menu retrofitted; contract test
  asserting every `--fsl-*` var has a fallback value.

> ⤷ **Done.** CONTRACT.md §7 (policy + registered-knob table) and ADR-002. `src/tokens/escapeHatch.ts` (`fslVar`) is the single consumption path; contract tests ban raw/fallback-less `var(--fsl-…)` and any CSS var outside the `--tt-`/`--fsl-` namespaces. Menu also forwards `crossOffset`/`shouldFlip`/`containerPadding`.

**A7. AccordionTrigger swallows the Button API** `S`
Accepts only `children`; drops `isDisabled`, `onPress`, `id`, `slot` — the
computed disabled styling is unreachable dead state. Also `level={3}` is fixed
on the heading.

- Extend RAC Button props (minus `style`/`className`); add `headingLevel` prop
  (default 3).
- AC: `<AccordionTrigger isDisabled>` renders the already-implemented disabled
  state; heading level configurable; tests for both.

> ⤷ **Done.** `AccordionTriggerProps` extends RAC `ButtonProps` (minus `style`/`className`/`slot`); `headingLevel` prop (default 3). Tests cover `isDisabled` (button disabled + no toggle), `onPress`, `id`, and heading levels.

**A8. RTL correctness** `S`
`Switch.tsx` positions the thumb with physical `left:`.

- Replace with `insetInlineStart`; sweep confirms the rest of the package is
  already logical-props.
- New contract-test invariant: physical position/margin/padding properties
  (`left:`, `right:`, `marginLeft`, `paddingRight`, …) are forbidden in `src/`.
- AC: Switch thumb slides correctly under `dir="rtl"` (jsdom assertion on the
  computed style key); invariant test green.

> ⤷ **Done.** Thumb now uses `insetInlineStart`/`insetBlockStart` and transitions `inset-inline-start`; Toast region `bottom` → `insetBlockEnd`. New contract invariant bans physical box properties (`top/left/right/bottom`, `margin*/padding*/border*` physical variants) across `src/`; `Switch.test.tsx` asserts the logical keys.

**A9. Toast rides RAC `UNSTABLE_` APIs on an open range** `S` _(decision)_
`UNSTABLE_Toast*` with `react-aria-components: ^1.9.0` — a RAC minor may
rename/break.

- Pin `~1.9.0` until RAC stabilizes Toast; add a canary test that imports the
  `UNSTABLE_` symbols and fails loudly with an upgrade note if absent.
- AC: lockfile pins the minor; canary test exists.

> ⤷ **Done.** Pinned `~1.19.0` — the minor the package actually ran against (the audit text said `~1.9.0`, but the lockfile had been resolving `^1.9.0` → 1.19.0; pinning to 1.9.0 literally would have been a silent downgrade that breaks ToastRegion). Canary: `racCanary.test.ts` imports every consumed `UNSTABLE_` symbol with an upgrade note. ADR-003.

**A10. Tree-shaking verification** `M`
Single entry bundles all components into one chunk; `sideEffects: false`
should let bundlers shake it, but nobody proved it — if it fails, importing
`Button` drags Wizard + Dialog + all of RAC.

- Bundle probe as a script inside `packages/fsl-ui` (wired to its own
  `test`/`build:verify` script — no root CI/workflow changes): esbuild/rollup
  building `import { Button } from '@ttoss/fsl-ui'` against the built dist;
  assert output size below a budget and absence of `Wizard` code.
- If shaking fails: per-component entries in tsdown + exports map.
- Document the measured cost of RAC in the README (market transparency).
- AC: probe in CI with a byte budget; README states the numbers.

> ⤷ **Done.** `scripts/verify-treeshake.mjs` (`pnpm run verify:treeshake`, esbuild, prefers dist / falls back to src): Button-only bundle = **1 812 bytes** minified (budget 16 000), zero composite leakage. README states the number.
>
> ⤷ **Follow-up (2026-07-16, ADR-006).** Once Node 24 made `dist` locally buildable, the probe (reading `dist`) exposed that the default single-chunk build did **not** tree-shake — a Button-only import dragged Wizard/ConfirmationDialog/ToastRegion (61 KB). Fixed by `unbundle: true` in `tsdown.config.ts` (one module per file; `index.mjs` is a pure re-export barrel). The probe now measures `dist` at the same **1 812 bytes** as `src`; the guarantee holds for the published artifact.

**A11. `@ttoss/forms` (RHF + Zod) bridge** `L` _(strategic)_
The monorepo standard is `@ttoss/forms`; fsl-ui `Form` is RAC-native. Without
a bridge every app must pick a side and adoption dies there.

- Spike: controlled-component pattern connecting RHF `Controller` to fsl-ui
  controls (`isInvalid`, `validate`, `value/onChange`); decide between a
  documented recipe vs. an adapter entry (`@ttoss/fsl-ui/forms`). Either way
  the code lives **inside fsl-ui**; `@ttoss/forms` is consumed as a
  devDependency for the integration test and is never modified.
- AC: a real form (3 fields + Zod schema + submit) built with @ttoss/forms +
  fsl-ui controls, as a test; decision recorded as ADR.

> ⤷ **Done.** `formsBridge.test.tsx`: TextField + Select + Checkbox wired through `Controller`/`useForm`/`zodResolver`/`z` re-exported by `@ttoss/forms` (devDependency; source untouched). Invalid submit blocks + surfaces `aria-invalid`; valid submit delivers typed values; error round-trip clears. Decision = documented recipe, no adapter entry: ADR-004. Jest `transformIgnorePatterns` scoped via `getTransformIgnorePatterns()` to compile the ESM chain @ttoss/forms drags in.

### A-P3: accessibility & test hardening

**A12. Wizard focus management + announcements** `M`
Hand-rolled DOM: step changes move no focus, announce nothing; "Step 2 of 3"
exists only as `data-*`.

- On step change: move focus to the new step's heading/container; add a
  visually-hidden `aria-live=polite` region announcing progress; expose
  `aria-label`/`aria-labelledby` guidance (or derive a default from step count).
- AC: keyboard/screen-reader flow test (focus lands on new step; live region
  text updates).

> ⤷ **Done.** On step change (never on mount) focus moves to the new step/summary body (`tabIndex={-1}` targets); visually-hidden `aria-live="polite"` region announces progress; `announceStep` prop overrides the English fallback (i18n rule §6). Five behavior tests including a pt-BR localization test.

**A13. a11y + keyboard test layer** `M`
Everything is `fireEvent.click`; no ARIA assertions; no axe.

- Add `jest-axe` to the canonical render of every component (loop over the
  auto-discovered registry — same mechanism as contract tests).
- Keyboard tests: Tab/Enter/Escape/Arrows on Menu, Dialog (Esc + focus trap),
  Select, Accordion, Tabs (when built); assert DialogActions focus order vs
  the platform-reordered visual order.
- AC: axe suite green package-wide; keyboard suites for the 5 interactive
  composites.

> ⤷ **Done.** `DOM_FIXTURES` extracted to `domFixtures.tsx` (shared, auto-covering: a new component's fixture feeds both contract + axe suites). `a11y.test.tsx`: jest-axe green over every canonical render (TextField fixtures gained proper labels). `keyboard.test.tsx` (user-event): Menu (Enter/arrows/activate/Escape+focus restore), Dialog (Escape + focus trap), Select (open/select/Escape), Accordion (Enter toggle, Tab order). Tabs joins when built (Wave 1).

**A14. Layout-literal rule** `S`
`12rem`, `320px`, `500px`, `1.2s`, `40%`, `2px` etc. — CONTRACT bans color
literals but is silent on layout.

- Rule (CONTRIBUTING): layout literals allowed only as named module-level
  constants with a justification comment (the `TRACK_W` pattern in Switch);
  magic inline literals forbidden.
- AC: rule documented; existing literals converted to named constants.

> ⤷ **Done.** Rule in CONTRIBUTING §4. Converted: Menu (`12rem`, `min(320px,90vw)`, offset 4), Dialog (`min(500px,90vw)`, `90vh`), ProgressBar (`40%`, `1.2s`), Toast (`240px`, region max-width) — each with a justification comment. `outlineOffset` micro-nudges documented as the tolerated inline exception.

### A-P4: documentation (docs/website)

**A15. Write `docs/design/ui-components/index.md`** `M`
Every "see the React implementation" link in the corpus lands on an
"under construction" stub.

- Content: what fsl-ui is (one paragraph), catalog table by Entity (generated
  from the same data as B-table below), customization model (A6 policy),
  links to CONTRACT/taxonomy/component-model. No duplication — link, don't
  restate (repo docs rule).
- AC: page live; no dangling "under construction".

> ⤷ **Done.** `docs/design/ui-components/index.md` written: what fsl-ui is, catalog by Entity, customization model (§7 knobs + data-attributes), links to component-model/design-tokens — no content duplication.

**A16. CONTRIBUTING §2.3 example vs code divergence** `S`
Doc example spreads `{...props}` after data-attrs (caller could override
`data-composition`); real code spreads before. Fix the example. Also remove the
aspirational "sibling selectors" comment in `Accordion.tsx` (~line 220) that
describes unimplemented divider collapsing.

- AC: doc matches code; comment removed or implemented.

> ⤷ **Done.** §2.3 Pattern B example now spreads `{...props}` before the identity attributes (with the rationale in a comment); the aspirational sibling-selector comment in `Accordion.tsx` replaced with a description of the actual divider behavior.

---

## Workstream B — RAC atomic catalog in the fsl-ui pattern

Goal: every React Aria component wrapped in the fsl-ui pattern (`*Meta` +
CONTRACT row + legality matrices + contract tests + behavior tests), giving a
complete reviewed atomic base — and the empirical validation of the FSL
theory (per-component friction is the measurement: if the taxonomy can't
express a component cleanly, that's a finding, not a workaround).

### B0. Sequencing rule (read first)

**Foundations before scale.** A6 (escape hatches ✅), A3 (i18n rule ✅), A14
(literal rule ✅) landed with Workstream A, and **B1 (icon story ✅, 2026-07-15,
ADR-005)** is now done — every one of the ~25 new components consumes these
decisions; deciding after would have meant 25× rework. **Foundations complete
— Wave 1 is unblocked.**

**Per-component Definition of Done** (applies to every row below):

1. `*Meta` declared per Entity with legality-matrix backing; new
   `STRUCTURAL_ROLES` admitted only with the evidence rule satisfied.
2. Tokens only from the Entity's CONTRACT §1 row; state colors via
   `resolveInteractiveStyle`; focus via `focusRingOutline`; escape hatches via
   A6 policy; logical CSS properties only.
3. `data-scope`/`data-part`/`data-*` per CONTRACT §5.
4. Contract tests pass by auto-discovery (zero manual registry edits).
5. Behavior tests: pointer + keyboard + axe; controlled & uncontrolled where
   applicable.
6. JSDoc on component + every prop (repo rule); usage example in JSDoc.
7. CONTRACT.md/llms.txt catalog entries updated.

### B1. Icon story (pre-requisite) `M`

> **Status: ✅ DONE (2026-07-15).** Decision (ADR-005): **Iconify is the
> official glyph provider** — no hand-authored SVG, no unicode v1. An internal
> semantic layer (`src/components/Icon/`) implements the `icon-system.md`
> intent contract (`icon.{family}.{intent}`): `intents.ts` (provider-agnostic
> vocabulary, subset in use), `glyphs.ts` (default **Lucide** mapping, per-icon
> `@iconify/icons-lucide/*`, registered offline via `addIcon` behind an
> idempotent `ensureIconGlyphs()` — SSR-safe, no runtime API fetch), `Icon.tsx`
> (Entity=Structure, `data-scope`/`data-part="icon"`, `currentColor`, sized by
> `vars.sizing.icon.*`, `size` sm/md/lg). **Internal** — not exported from
> `index.ts`; seed of the future standalone `@ttoss/fsl-icon`. The four v0
> unicode consumers (Accordion ▸, Checkbox ✓/−, Select ▼, Toast ✕) are
> retrofitted to `<Icon intent=…>`. 682 tests green, axe clean, `tsc`/build
> green locally (Node 24). Documented in CONTRACT §9 + llms.txt.
>
> ⤷ **Friction log (FSL validation).** The mapping was clean — Icon fits
> Entity=Structure with the existing `icon` structural role (no
> `STRUCTURAL_ROLES` addition, no governance proposal needed). One real defect
> surfaced and was fixed: on a custom element (`<iconify-icon>`), React renders
> `aria-hidden={true}` as an empty attribute (`aria-hidden=""`), which does not
> hide from AT — the value must be the string `"true"`. No taxonomy divergence.

Original decision brief (kept for the record): minimal internal `Icon`,
Entity Structure, `data-part="icon"`, sized by `vars.sizing.icon.*`, covering
the ~6 internal glyphs (chevron-down/right, check, dash, close, plus
calendar/search for later waves), aligned with `icon-system.md`'s intent;
unblocks DatePicker/SearchField later.

### B2. Catalog — full RAC coverage table

Status: ✅ shipped · 🔧 shipped-but-audit-items · ⬜ to build · ⏸ deferred.

| RAC component                                           | Status | Entity                        | structure (root/parts)                                                     | ux context (derived)                      | Evaluations                       | Key states                         | Taxonomy additions needed                                                                                                                                | Notes / decisions                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------- | ------ | ----------------------------- | -------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button                                                  | ✅     | Action                        | root                                                                       | action                                    | per matrix                        | hover/active/disabled              | —                                                                                                                                                        | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ToggleButton                                            | ✅     | Action                        | root                                                                       | action                                    | primary/muted                     | **pressed** (persistent)           | none — `pressed` legal on action                                                                                                                         | The proof case for `pressed` ≠ `active` — resolved inline (helper can't emit `pressed`); friction logged in ToggleButton.tsx (Wave 1, 2026-07-16)                                                                                                                                                                                                                                                                                                                         |
| ToggleButtonGroup                                       | ✅     | Selection                     | root (frame-only)                                                          | input                                     | none (Selection carries none)     | selected                           | none                                                                                                                                                     | Group = Selection semantics (one/many of a set); frame-only host, items are `ToggleButton`s; RAC single-select renders items as role=radio (Wave 1, 2026-07-16)                                                                                                                                                                                                                                                                                                           |
| FileTrigger                                             | ✅     | Action                        | root                                                                       | action                                    | primary/secondary/muted           | droptarget                         | none — `droptarget` legal on action                                                                                                                      | Reuses the package `Button` (data-scope override) as its Action root — RAC FileTrigger renders no DOM root itself (internal-reuse precedent: Wizard/ConfirmationDialog/Form). `droptarget` State deferred: exercised end-to-end only when paired with DropZone (Phase 4) (Wave 2, 2026-07-16)                                                                                                                                                                             |
| Link                                                    | ✅     | Navigation                    | root                                                                       | navigation                                | per matrix                        | current/visited                    | —                                                                                                                                                        | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Tabs                                                    | ✅     | Navigation (+Structure panel) | Tabs=root · TabList=control · Tab=item · TabPanel=Structure/content        | navigation                                | primary/muted                     | **selected + current**             | none                                                                                                                                                     | Tabs/TabList/Tab are Navigation; TabPanel is **Structure/content** (the content the tabs reveal — Navigation has no `content` role, so the fix was the correct Entity, not a taxonomy widening). TabList→`control`; indicator = decorative data-part. Keyboard arrows tested (Wave 1, 2026-07-16)                                                                                                                                                                         |
| Breadcrumbs                                             | ✅     | Navigation                    | root + item                                                                | navigation                                | primary/muted                     | current                            | none                                                                                                                                                     | Last item = `current` (RAC `isCurrent`, aria-current, text not link); separator decorative aria-hidden (Wave 1, 2026-07-16)                                                                                                                                                                                                                                                                                                                                               |
| Disclosure (single)                                     | ✅     | Disclosure                    | root + trigger + content                                                   | navigation                                | primary/muted                     | expanded                           | none                                                                                                                                                     | Standalone counterpart of Accordion. Composite (Disclosure/DisclosureTrigger/DisclosurePanel) mirroring the Accordion sub-part pattern on a bare RAC `Disclosure` (no group); scope propagates `evaluation` + guards host presence; chevron driven by `DisclosureStateContext` (Wave 2, 2026-07-16)                                                                                                                                                                       |
| Accordion (DisclosureGroup)                             | ✅     | Disclosure                    | —                                                                          | navigation                                | —                                 | expanded                           | —                                                                                                                                                        | A7 + A16 resolved (2026-07-15)                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Checkbox                                                | ✅     | Selection                     | root + selectionControl + indicator + label                                | input                                     | none                              | checked/indeterminate/invalid      | —                                                                                                                                                        | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| CheckboxGroup                                           | ✅     | Selection                     | root + label + description + validationMessage                             | input                                     | none                              | invalid (group-level)              | none                                                                                                                                                     | Mirrors RadioGroup; group `isInvalid` propagates to child Checkboxes (RAC). FRICTION (FSL): Selection has no `description`/`validationMessage` structural roles (those are Input's) — per "no taxonomy additions" they ship as internal data-parts (no meta), only root carries a meta; RadioGroup `label` precedent. Admit the roles via governance only if a future component needs them as declared identities (Wave 2, 2026-07-16)                                    |
| RadioGroup / Radio                                      | ✅     | Selection                     | —                                                                          | input                                     | —                                 | —                                  | —                                                                                                                                                        | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Switch                                                  | ✅     | Selection                     | —                                                                          | input                                     | —                                 | —                                  | —                                                                                                                                                        | A8 resolved — logical props (2026-07-15)                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Select                                                  | ✅     | Selection                     | —                                                                          | input                                     | —                                 | —                                  | —                                                                                                                                                        | A6 knobs shipped                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ListBox (standalone)                                    | ✅     | Collection                    | root + item                                                                | informational (surface) / items use input | —                                 | selected                           | none                                                                                                                                                     | Per-part entity split shipped as ADR-007 + CONTRACT §1 note: container = Collection (informational surface), items = Selection (input chrome, `selected` State) — the entity→ux test unions both contexts. No standalone-throw guard (RAC collection owns item context, SelectItem precedent) (Wave 2, 2026-07-16)                                                                                                                                                        |
| GridList                                                | ✅     | Collection                    | root + item + selectionControl                                             | informational                             | primary/muted                     | selected                           | none                                                                                                                                                     | Multi-select rows; per-row selectionControl (checkbox, input chrome). Same ADR-007 split as ListBox (container Collection, rows Selection). Drag handle deferred with DnD (Wave 2, 2026-07-16)                                                                                                                                                                                                                                                                            |
| Table                                                   | ⬜ `L` | Collection                    | root + item + title(columnheader) + content(cell) + actions?               | informational                             | primary/muted                     | selected + hover(row)              | possibly none — map columnheader→`title`, row→`item`, cell→`content`; if that reads wrong in practice, propose `cell`/`row` roles via FSL §17 governance | The largest single build; sort indicators need B1 icons; virtualization deferred (RAC Virtualizer, phase later)                                                                                                                                                                                                                                                                                                                                                           |
| Tree                                                    | ⬜     | Collection                    | root + item + indicator + trigger                                          | informational                             | primary/muted                     | selected + expanded                | none                                                                                                                                                     | expanded is legal on informational ✓                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| TagGroup                                                | ✅     | Selection                     | root + item + closeTrigger                                                 | input                                     | none                              | selected                           | none                                                                                                                                                     | Composite (TagGroup + Tag). CANONICAL ANSWER shipped to colors.md "Common confusions": a filter chip / removable tag uses `selected` (set membership), NOT `pressed`. FRICTION (FSL): Selection has no `closeTrigger` role (Overlay/Feedback do) — the remove button is an internal data-part (no meta), SearchField clear-button precedent; only root + item carry metas. Icon-label names the remove button (Wave 2, 2026-07-16)                                        |
| Menu                                                    | ✅     | Collection                    | —                                                                          | informational                             | —                                 | —                                  | —                                                                                                                                                        | A6 knobs shipped                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| TextField                                               | ✅     | Input                         | —                                                                          | input                                     | —                                 | invalid ✓                          | —                                                                                                                                                        | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| TextArea                                                | ✅     | Input                         | root + control + label + description + validationMessage                   | input                                     | none                              | invalid                            | none                                                                                                                                                     | Mirrors TextField parts with RAC `TextArea` control (multiline); `rows` prop + vertical resize (field-sizing deferred); presence-scope guard on sub-parts (Wave 1, 2026-07-16)                                                                                                                                                                                                                                                                                            |
| SearchField                                             | ✅     | Input                         | root + label + control + leadingAdornment + trailingAdornment              | input                                     | none                              | invalid                            | none                                                                                                                                                     | FRICTION: Input has no `icon`/`closeTrigger` roles — mapped search glyph→`leadingAdornment`, clear button→`trailingAdornment` (existing roles, no taxonomy change). Consumes the B1 Icon (`action.search`/`action.close`); `clearLabel` required (i18n) (Wave 1, 2026-07-16)                                                                                                                                                                                              |
| NumberField                                             | ✅     | Input                         | root + control + label + trigger(steppers) ×2 + validationMessage          | input                                     | none                              | invalid                            | none                                                                                                                                                     | Monolithic Input composite (single root meta; label/control/steppers/description/validationMessage are internal data-parts — Select precedent). FRICTION: `trigger` is not a legal Input role, and the entity→ux test binds color reads to declared entities — so steppers ship as internal parts in Input chrome, not as declared Action identities. New Icon intents action.increment/decrement (ADR-005). Composition exercised at behavior level (Wave 2, 2026-07-16) |
| Slider                                                  | ✅     | Input                         | root + control(thumb) + label + status(output)                             | input                                     | none                              | disabled/focused/**droptarget?no** | mapping decision: thumb→`control`, track→`surface`(part), output→`status`. If `surface` reads wrong for track, admit `track` via FSL §17                 | Monolithic Input composite; single root meta (label/track/fill/thumb/output are internal parts). ADR-008 registered the mapping decision: Input has no `surface`/`status` role, so track/output ship as internal parts and the FSL §17 widening is DEFERRED (not proposed) — no runtime dispatches on those identities (evidence rule). thumb=`control` is legal. RTL + keyboard from RAC (Wave 2, 2026-07-16)                                                            |
| ComboBox                                                | ⬜ `L` | Input                         | root + control + trigger + label + item(s via ListBox) + validationMessage | input                                     | none                              | invalid/expanded                   | none                                                                                                                                                     | Input entity (freeform + choice); popover reuses ListBox; the accordion-vs-select of ambiguity cases — document Entity rationale in meta JSDoc                                                                                                                                                                                                                                                                                                                            |
| Autocomplete                                            | ⏸      | Input                         | —                                                                          | input                                     | —                                 | —                                  | —                                                                                                                                                        | RAC newer API; wait for ComboBox learnings                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Form                                                    | ✅     | Structure                     | —                                                                          | informational                             | —                                 | —                                  | —                                                                                                                                                        | A11 resolved — RHF/Zod recipe test                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Dialog/Modal                                            | ✅     | Overlay                       | —                                                                          | informational                             | —                                 | —                                  | —                                                                                                                                                        | A2 resolved — --fsl-dialog-\* knobs                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Popover (standalone)                                    | ✅     | Overlay                       | root (positioner+surface folded, as Menu)                                  | informational                             | primary/muted                     | —                                  | none                                                                                                                                                     | Extracted the Menu/Select anchored-surface pattern into a public composite; `--fsl-popover-max-width` knob from day one; `PopoverTrigger` aliases RAC's overlay trigger (Wave 1, 2026-07-16)                                                                                                                                                                                                                                                                              |
| Tooltip                                                 | ✅     | Overlay                       | root (positioner+surface folded, as Menu)                                  | informational                             | primary/muted                     | —                                  | none                                                                                                                                                     | Non-blocking, `zIndex.layer.overlay`, `motion.transition`; no-focusable-content rule documented in JSDoc; `--fsl-tooltip-max-width` knob (Wave 1, 2026-07-16)                                                                                                                                                                                                                                                                                                             |
| ProgressBar                                             | ✅     | Feedback                      | —                                                                          | feedback                                  | —                                 | —                                  | —                                                                                                                                                        | A1 resolved — keyframes registry                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Meter                                                   | ✅     | Feedback                      | root + label + status + body(track) + content(fill)                        | feedback                                  | primary/positive/caution/negative | —                                  | none                                                                                                                                                     | Sibling of ProgressBar (static value vs activity) — JSDoc disambiguates; single root meta + internal parts (ProgressBar precedent). FRICTION (tooling, not FSL): RAC's `useMeter` emits `role="meter progressbar"` (deliberate FF/Chrome fallback) which trips axe `aria-allowed-attr` — a known axe limitation with role fallback lists. DOM kept correct; rule disabled for the Meter fixture only, documented inline (Wave 2, 2026-07-16)                              |
| Toast                                                   | ✅     | Feedback                      | —                                                                          | feedback                                  | —                                 | —                                  | —                                                                                                                                                        | A9 resolved — pinned ~1.19.0 + canary                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Separator                                               | ✅     | Structure                     | root                                                                       | informational                             | muted                             | —                                  | none                                                                                                                                                     | `border.divider` token consumer — first pure-Structure atomic (Wave 1, 2026-07-16)                                                                                                                                                                                                                                                                                                                                                                                        |
| Group                                                   | ✅     | Structure                     | root + label                                                               | informational                             | primary/muted                     | —                                  | none                                                                                                                                                     | Field grouping wrapper — `role="group"` frame; optional visible `label` wired via `aria-labelledby`; single root meta + internal label part (RadioGroup precedent) (Wave 2, 2026-07-16)                                                                                                                                                                                                                                                                                   |
| Toolbar                                                 | ✅     | Structure                     | root + actions                                                             | informational                             | primary/muted                     | —                                  | none                                                                                                                                                     | Arrow-key roving nav between actions (RAC); painted bar surface consumes `informational[evaluation]` (evidence rule → evaluation prop earns its place); single root meta hosts the controls (Wave 2, 2026-07-16)                                                                                                                                                                                                                                                          |
| Calendar                                                | ⏸ `L`  | Selection                     | root + title + trigger ×2 + item(cells)                                    | input                                     | none                              | selected/disabled/current(today?)  | decision: `current` on input context is NOT legal today (navigation-only) — either map today→`selected` variants or extend input states via governance   | Phase 3: needs `@internationalized/date` dependency decision + B1 icons                                                                                                                                                                                                                                                                                                                                                                                                   |
| RangeCalendar                                           | ⏸ `L`  | Selection                     | —                                                                          | input                                     | —                                 | selected(range endpoints/middle)   | range-middle styling has no state token — decision needed                                                                                                | Phase 3                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| DateField / TimeField                                   | ⏸      | Input                         | root + control(segments) + label                                           | input                                     | none                              | invalid                            | segment focus styling                                                                                                                                    | Phase 3                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| DatePicker / DateRangePicker                            | ⏸ `L`  | Input                         | composite (Field + trigger + Popover + Calendar)                           | input                                     | none                              | invalid/expanded                   | —                                                                                                                                                        | Phase 3 capstone — the biggest composition test of the whole system                                                                                                                                                                                                                                                                                                                                                                                                       |
| ColorArea/Field/Picker/Slider/Swatch/SwatchPicker/Wheel | ⏸      | Input/Selection               | —                                                                          | input                                     | —                                 | —                                  | color-value semantics don't exist in the token grammar                                                                                                   | Phase 4, explicitly optional: niche for "all our apps"; revisit on demand                                                                                                                                                                                                                                                                                                                                                                                                 |
| DropZone + useDragAndDrop                               | ⏸      | Structure/varies              | —                                                                          | informational                             | —                                 | droptarget                         | none — droptarget exists!                                                                                                                                | Phase 4; the tokens are already waiting                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Virtualizer                                             | ⏸      | (utility)                     | —                                                                          | —                                         | —                                 | —                                  | —                                                                                                                                                        | Not a semantic component; adopt inside Table/ListBox when perf demands                                                                                                                                                                                                                                                                                                                                                                                                    |

### B3. Waves

- **Wave 1 — unblock real apps + fill weak Entities** `~2 wks`: ✅ **COMPLETE
  (2026-07-16).** ToggleButton, ToggleButtonGroup, Tooltip, Popover, Tabs,
  Breadcrumbs, TextArea, SearchField, Separator — all shipped with the
  per-component DoD (contract auto-discovery, axe, behavior tests, JSDoc,
  catalog). Friction logged: ToggleButton (`pressed`≠`active`, inline cascade);
  Tabs (TabPanel is Structure/content, not Navigation); SearchField (Input has
  no `icon`/`closeTrigger` → `leadingAdornment`/`trailingAdornment`). No
  taxonomy changes were needed — every case resolved to an existing role/Entity.
- **Wave 2 — data & forms depth** `~2-3 wks`: ✅ **COMPLETE (2026-07-16).**
  Group, Toolbar, Meter, Disclosure, CheckboxGroup, NumberField, TagGroup,
  ListBox, GridList, Slider, FileTrigger — all shipped with the per-component
  DoD (contract auto-discovery, axe, behavior + keyboard tests, JSDoc,
  catalog). Suite: 1 285 tests green, 100% coverage, build + tsc green.
  **Friction log (FSL D1 validation data):**
  - **ADR-007** — a Collection container may host Selection-pattern items
    (ListBox/GridList: container = Collection/informational, items =
    Selection/input). The entity→ux contract test unions all declared
    entities' contexts, so one file lawfully reads both. No taxonomy change.
  - **ADR-008** — Slider's ROADMAP mapping wanted track→`surface`,
    output→`status`, but Input has neither role. Resolved with internal parts
    (no meta); the FSL §17 widening is **deferred, not proposed** — nothing
    dispatches on those identities (evidence rule). thumb→`control` is legal.
  - **CheckboxGroup / TagGroup / NumberField** — Selection has no
    `description`/`validationMessage`/`closeTrigger` and Input has no `trigger`
    role. Every one resolved to **internal data-parts** (no meta, no legality
    claim) via the RadioGroup-`label` / SearchField-clear-button precedent;
    only lawful roots + items carry metas. Zero taxonomy additions.
  - **TagGroup** shipped the canonical "filter chip → `selected` (not
    `pressed`)" answer into colors.md "Common confusions".
  - **Meter** — RAC's deliberate `role="meter progressbar"` fallback trips
    axe `aria-allowed-attr` (a tooling limitation, not FSL); the correct DOM is
    kept and a per-fixture `axeOptions` disables only that rule for Meter.
  - New Icon intents `action.increment`/`action.decrement` (ADR-005 growth
    rule) for the NumberField steppers.
    Net FSL finding: the flat per-entity vocabulary expressed all 11 components
    without a single taxonomy change — the "missing" roles the ROADMAP part
    lists implied are documentation artifacts, not expressivity gaps.
- **Wave 3 — the heavies** `~3 wks`:
  ComboBox, Table, Tree.
- **Phase 3 — date/time suite** (own dependency + i18n decisions): Calendar,
  RangeCalendar, DateField, TimeField, DatePicker, DateRangePicker.
- **Phase 4 — optional**: Color suite, DnD/DropZone, Virtualizer adoption.

Waves parallelize well (components are independent); each lands as its own PR
with the per-component DoD. Theory-validation rule: any component whose FSL
mapping required a workaround gets a short writeup in CONTRIBUTING (new ADR or
lexicon governance proposal) — that friction log IS the validation data.

---

## Workstream D — Strategic proof & release gate

> **Re-gated (2026-07-22, see §Program):** D1 is **parked** — an optional
> evidence instrument, no longer a release blocker. D2's gate is **adoption**
> (Program P1), not the benchmark.

**D1. AI-executability benchmark** `L` ⏸ — first-pass success rate of
LLM-generated UI vs Radix/MUI/RAC baselines (methodology:
`INTERNAL/BENCHMARK_EVAL.md`), once A4 (llms.txt) and Wave 1 land. This
produces the launch number. Fixed prompt suite: dialog, field+validation,
menu, destructive confirm, themed composite; measure token-selection
correctness + semantic error rate + human corrections.

> ⤷ **Harness shipped (2026-07-16): `packages/fsl-bench`.** Decisions
> recorded:
>
> - **Cohort** — headless cohort = fsl-ui, React Aria Components, Radix
>   Primitives; **MUI is an opinionated control in a separate column**
>   (BENCHMARK_EVAL cohort rule; MUI's training-data prevalence inside the
>   cohort would confound grammar-vs-priors, as a control it strengthens
>   the claim).
> - **A/B condition** — fsl-ui runs with the shipped `llms.txt` AND with a
>   bare export-list context; the delta isolates the grammar's
>   contribution from model priors. This is the decisive number.
> - **Models** — one Anthropic + one non-Anthropic (Gemini) for claim
>   neutrality; defaults `claude-opus-4-8` / `gemini-pro-latest`,
>   overridable per run. Transport channels are user-selectable (direct
>   APIs, Claude via Vertex AI or Amazon Bedrock) — auth and per-channel
>   defaults live in the fsl-bench README.
> - **Grading** — objective gauntlet (tsc strict → jsdom render → RTL
>   behavior asserts in an isolated child process per sample) + mechanical
>   semantic lint; repair loop ≤ 2 (rounds-to-green proxies human
>   corrections); Wilson 95% intervals. Calibrated by 20 golden fixtures
>   (every scenario × every library must pass with zero findings) — the
>   fairness proof, enforced in `fsl-bench`'s test suite.
> - Methodology + honesty rules (freeze-before-run, full audit JSONL,
>   spot-check protocol) live in `packages/fsl-bench/README.md`.
>
> **Parked (2026-07-22):** the launch campaign (needs `ANTHROPIC_API_KEY` +
> `GEMINI_API_KEY`; `pnpm run bench` in `packages/fsl-bench`) moves to the
> Program parking lot — run after v1 as evidence, on demand. The 2026-07-16
> gemini-only calibration run (fsl-ui 48% vs Radix 100% first-pass,
> `packages/fsl-bench/results/`) is treated as iteration input for
> `llms.txt`/docs via the P1 friction log, not as a gate.

**D2. Release gate** `S` — governed by §Program "The gate": one real ttoss
application flow on fsl-ui in production, friction log worked to zero
blockers. CI green including a real tsdown build, A-P0 complete, A13 axe
suite green remain prerequisites. Record the gate in this file when met.

---

## Suggested execution order

```
[✅ done 2026-07-15] A1–A16 (all of Workstream A, incl. foundations A6/A3/A14)
[✅ done 2026-07-15] B1 icon story (ADR-005 — Iconify/Lucide internal layer)
[✅ done 2026-07-16] Wave 1 + Wave 2
[✅ done 2026-07-19] EVOLUTION plan (Box/Grid/Container layer, hit collapse)
→ P0 docs consolidation → P1 adoption (THE gate) → P2 evidence-driven gaps
→ P3 aesthetic pass → v1.0 → (parking lot: D1 campaign, Phase 3/4 waves)
```
