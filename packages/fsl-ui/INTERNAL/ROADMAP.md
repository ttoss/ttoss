# fsl-ui — Market-Readiness Roadmap

> Working plan produced by the 2026-07-15 deep audit. Two workstreams:
> **A** — remediate every audit finding; **B** — implement the full React Aria
> Components (RAC) atomic catalog in the fsl-ui pattern, so the package ships
> a complete, reviewed base layer for compositions/patterns and serves as the
> real-world validation of the FSL theory.
>
> Out of scope by explicit decision: Storybook wiring, adoption/migration work,
> `private: true` flip (gated — see D2).

Legend: effort `S` (≤ half day) · `M` (1–2 days) · `L` (3+ days). Every item
lists acceptance criteria (AC). File:line references are evidence from the
audit, valid as of commit `81c257d`.

---

## Workstream A — Audit findings remediation

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

**A7. AccordionTrigger swallows the Button API** `S`
Accepts only `children`; drops `isDisabled`, `onPress`, `id`, `slot` — the
computed disabled styling is unreachable dead state. Also `level={3}` is fixed
on the heading.

- Extend RAC Button props (minus `style`/`className`); add `headingLevel` prop
  (default 3).
- AC: `<AccordionTrigger isDisabled>` renders the already-implemented disabled
  state; heading level configurable; tests for both.

**A8. RTL correctness** `S`
`Switch.tsx` positions the thumb with physical `left:`.

- Replace with `insetInlineStart`; sweep confirms the rest of the package is
  already logical-props.
- New contract-test invariant: physical position/margin/padding properties
  (`left:`, `right:`, `marginLeft`, `paddingRight`, …) are forbidden in `src/`.
- AC: Switch thumb slides correctly under `dir="rtl"` (jsdom assertion on the
  computed style key); invariant test green.

**A9. Toast rides RAC `UNSTABLE_` APIs on an open range** `S` _(decision)_
`UNSTABLE_Toast*` with `react-aria-components: ^1.9.0` — a RAC minor may
rename/break.

- Pin `~1.9.0` until RAC stabilizes Toast; add a canary test that imports the
  `UNSTABLE_` symbols and fails loudly with an upgrade note if absent.
- AC: lockfile pins the minor; canary test exists.

**A10. Tree-shaking verification** `M`
Single entry bundles all components into one chunk; `sideEffects: false`
should let bundlers shake it, but nobody proved it — if it fails, importing
`Button` drags Wizard + Dialog + all of RAC.

- Bundle probe in CI (esbuild/rollup building `import { Button } from
'@ttoss/fsl-ui'` against the built dist; assert output size below a budget
  and absence of `Wizard` code).
- If shaking fails: per-component entries in tsdown + exports map.
- Document the measured cost of RAC in the README (market transparency).
- AC: probe in CI with a byte budget; README states the numbers.

**A11. `@ttoss/forms` (RHF + Zod) bridge** `L` _(strategic)_
The monorepo standard is `@ttoss/forms`; fsl-ui `Form` is RAC-native. Without
a bridge every app must pick a side and adoption dies there.

- Spike: controlled-component pattern connecting RHF `Controller` to fsl-ui
  controls (`isInvalid`, `validate`, `value/onChange`); decide between a
  documented recipe vs. an adapter entry (`@ttoss/fsl-ui/forms`).
- AC: a real form (3 fields + Zod schema + submit) built with @ttoss/forms +
  fsl-ui controls, as a test; decision recorded as ADR.

### A-P3: accessibility & test hardening

**A12. Wizard focus management + announcements** `M`
Hand-rolled DOM: step changes move no focus, announce nothing; "Step 2 of 3"
exists only as `data-*`.

- On step change: move focus to the new step's heading/container; add a
  visually-hidden `aria-live=polite` region announcing progress; expose
  `aria-label`/`aria-labelledby` guidance (or derive a default from step count).
- AC: keyboard/screen-reader flow test (focus lands on new step; live region
  text updates).

**A13. a11y + keyboard test layer** `M`
Everything is `fireEvent.click`; no ARIA assertions; no axe.

- Add `jest-axe` to the canonical render of every component (loop over the
  auto-discovered registry — same mechanism as contract tests).
- Keyboard tests: Tab/Enter/Escape/Arrows on Menu, Dialog (Esc + focus trap),
  Select, Accordion, Tabs (when built); assert DialogActions focus order vs
  the platform-reordered visual order.
- AC: axe suite green package-wide; keyboard suites for the 5 interactive
  composites.

**A14. Layout-literal rule** `S`
`12rem`, `320px`, `500px`, `1.2s`, `40%`, `2px` etc. — CONTRACT bans color
literals but is silent on layout.

- Rule (CONTRIBUTING): layout literals allowed only as named module-level
  constants with a justification comment (the `TRACK_W` pattern in Switch);
  magic inline literals forbidden.
- AC: rule documented; existing literals converted to named constants.

### A-P4: documentation (docs/website)

**A15. Write `docs/design/ui-components/index.md`** `M`
Every "see the React implementation" link in the corpus lands on an
"under construction" stub.

- Content: what fsl-ui is (one paragraph), catalog table by Entity (generated
  from the same data as B-table below), customization model (A6 policy),
  links to CONTRACT/taxonomy/component-model. No duplication — link, don't
  restate (repo docs rule).
- AC: page live; no dangling "under construction".

**A16. CONTRIBUTING §2.3 example vs code divergence** `S`
Doc example spreads `{...props}` after data-attrs (caller could override
`data-composition`); real code spreads before. Fix the example. Also remove the
aspirational "sibling selectors" comment in `Accordion.tsx` (~line 220) that
describes unimplemented divider collapsing.

- AC: doc matches code; comment removed or implemented.

---

## Workstream B — RAC atomic catalog in the fsl-ui pattern

Goal: every React Aria component wrapped in the fsl-ui pattern (`*Meta` +
CONTRACT row + legality matrices + contract tests + behavior tests), giving a
complete reviewed atomic base — and the empirical validation of the FSL
theory (per-component friction is the measurement: if the taxonomy can't
express a component cleanly, that's a finding, not a workaround).

### B0. Sequencing rule (read first)

**Foundations before scale.** A6 (escape hatches), A3 (i18n rule), B1 (icon
story) and A14 (literal rule) MUST land before the component waves — every
one of the ~25 new components consumes those decisions; deciding after means
25× rework.

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

Unicode glyphs (▸ ✓ − ✕) are v0. Decide: minimal internal `Icon` (inline SVG,
Entity Structure, `data-part="icon"`, sized by `vars.sizing.icon.*`) covering
the ~6 internal glyphs (chevron-down/right, check, dash, close, plus
calendar/search for later waves) — or codify unicode as the v1 decision.
Recommended: minimal internal Icon (not exported publicly yet), aligned with
`icon-system.md`'s intent; unblocks DatePicker/SearchField later.

### B2. Catalog — full RAC coverage table

Status: ✅ shipped · 🔧 shipped-but-audit-items · ⬜ to build · ⏸ deferred.

| RAC component                                           | Status | Entity           | structure (root/parts)                                                     | ux context (derived)                      | Evaluations                       | Key states                         | Taxonomy additions needed                                                                                                                                | Notes / decisions                                                                                                                                                                        |
| ------------------------------------------------------- | ------ | ---------------- | -------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button                                                  | ✅     | Action           | root                                                                       | action                                    | per matrix                        | hover/active/disabled              | —                                                                                                                                                        | —                                                                                                                                                                                        |
| ToggleButton                                            | ⬜     | Action           | root                                                                       | action                                    | primary/muted                     | **pressed** (persistent)           | none — `pressed` legal on action                                                                                                                         | The proof case for `pressed` ≠ `active` (colors.md "common confusions")                                                                                                                  |
| ToggleButtonGroup                                       | ⬜     | Selection        | root + item                                                                | input                                     | none (Selection carries none)     | selected                           | none                                                                                                                                                     | Group = Selection semantics (one/many of a set); items map `isSelected→selected` not `checked` (set membership)                                                                          |
| FileTrigger                                             | ⬜     | Action           | root                                                                       | action                                    | primary/secondary/muted           | droptarget                         | none — `droptarget` legal on action                                                                                                                      | Pair with DropZone (RAC) for the full drop story; validates `droptarget` state end-to-end                                                                                                |
| Link                                                    | ✅     | Navigation       | root                                                                       | navigation                                | per matrix                        | current/visited                    | —                                                                                                                                                        | —                                                                                                                                                                                        |
| Tabs                                                    | ⬜     | Navigation       | root + item + indicator + content(panel)                                   | navigation                                | primary/muted                     | **selected + current**             | none                                                                                                                                                     | Fills the empty Navigation story; panel is `structure: content`; keyboard arrows tested                                                                                                  |
| Breadcrumbs                                             | ⬜     | Navigation       | root + item                                                                | navigation                                | primary/muted                     | current                            | none                                                                                                                                                     | Last item = `current`; separator is decorative (aria-hidden)                                                                                                                             |
| Disclosure (single)                                     | ⬜     | Disclosure       | root + trigger + content                                                   | navigation                                | primary/muted                     | expanded                           | none                                                                                                                                                     | Standalone counterpart of Accordion (which is DisclosureGroup); trivial extraction from Accordion internals                                                                              |
| Accordion (DisclosureGroup)                             | 🔧     | Disclosure       | —                                                                          | navigation                                | —                                 | expanded                           | —                                                                                                                                                        | A7 (trigger API), A16 (stale comment)                                                                                                                                                    |
| Checkbox                                                | ✅     | Selection        | root + selectionControl + indicator + label                                | input                                     | none                              | checked/indeterminate/invalid      | —                                                                                                                                                        | —                                                                                                                                                                                        |
| CheckboxGroup                                           | ⬜     | Selection        | root + label + description + validationMessage                             | input                                     | none                              | invalid (group-level)              | none                                                                                                                                                     | Mirrors RadioGroup shape; group invalid propagates to items                                                                                                                              |
| RadioGroup / Radio                                      | ✅     | Selection        | —                                                                          | input                                     | —                                 | —                                  | —                                                                                                                                                        | —                                                                                                                                                                                        |
| Switch                                                  | 🔧     | Selection        | —                                                                          | input                                     | —                                 | —                                  | —                                                                                                                                                        | A8 (RTL `left:`)                                                                                                                                                                         |
| Select                                                  | ✅     | Selection        | —                                                                          | input                                     | —                                 | —                                  | —                                                                                                                                                        | popover sizing → A6                                                                                                                                                                      |
| ListBox (standalone)                                    | ⬜     | Collection       | root + item                                                                | informational (surface) / items use input | —                                 | selected                           | none                                                                                                                                                     | Container informational, items are Selection-pattern: precedent set by Select's items; document this split in CONTRACT                                                                   |
| GridList                                                | ⬜     | Collection       | root + item + selectionControl                                             | informational                             | primary/muted                     | selected                           | none                                                                                                                                                     | Multi-select rows; drag handle deferred with DnD                                                                                                                                         |
| Table                                                   | ⬜ `L` | Collection       | root + item + title(columnheader) + content(cell) + actions?               | informational                             | primary/muted                     | selected + hover(row)              | possibly none — map columnheader→`title`, row→`item`, cell→`content`; if that reads wrong in practice, propose `cell`/`row` roles via FSL §17 governance | The largest single build; sort indicators need B1 icons; virtualization deferred (RAC Virtualizer, phase later)                                                                          |
| Tree                                                    | ⬜     | Collection       | root + item + indicator + trigger                                          | informational                             | primary/muted                     | selected + expanded                | none                                                                                                                                                     | expanded is legal on informational ✓                                                                                                                                                     |
| TagGroup                                                | ⬜     | Selection        | root + item + closeTrigger                                                 | input                                     | none                              | selected                           | none                                                                                                                                                     | Removable tags = closeTrigger part; the "filter chip" ambiguity from the docs audit gets its canonical answer here (selected, not pressed) — write it into colors.md "common confusions" |
| Menu                                                    | ✅     | Collection       | —                                                                          | informational                             | —                                 | —                                  | —                                                                                                                                                        | popover knobs → A6                                                                                                                                                                       |
| TextField                                               | ✅     | Input            | —                                                                          | input                                     | —                                 | invalid ✓                          | —                                                                                                                                                        | —                                                                                                                                                                                        |
| TextArea                                                | ⬜     | Input            | root + control + label + description + validationMessage                   | input                                     | none                              | invalid                            | none                                                                                                                                                     | Reuse TextField parts; RAC TextField with multiline; `field-sizing`/rows decision                                                                                                        |
| SearchField                                             | ⬜     | Input            | root + control + closeTrigger + icon                                       | input                                     | none                              | invalid                            | none                                                                                                                                                     | Clear button = closeTrigger; icon needs B1                                                                                                                                               |
| NumberField                                             | ⬜     | Input            | root + control + label + trigger(steppers) ×2 + validationMessage          | input                                     | none                              | invalid                            | none                                                                                                                                                     | Steppers are Action-pattern parts inside an Input composite — good composition test                                                                                                      |
| Slider                                                  | ⬜     | Input            | root + control(thumb) + label + status(output)                             | input                                     | none                              | disabled/focused/**droptarget?no** | mapping decision: thumb→`control`, track→`surface`(part), output→`status`. If `surface` reads wrong for track, admit `track` via FSL §17                 | RTL + keyboard heavy; hit-target tokens on thumb                                                                                                                                         |
| ComboBox                                                | ⬜ `L` | Input            | root + control + trigger + label + item(s via ListBox) + validationMessage | input                                     | none                              | invalid/expanded                   | none                                                                                                                                                     | Input entity (freeform + choice); popover reuses ListBox; the accordion-vs-select of ambiguity cases — document Entity rationale in meta JSDoc                                           |
| Autocomplete                                            | ⏸      | Input            | —                                                                          | input                                     | —                                 | —                                  | —                                                                                                                                                        | RAC newer API; wait for ComboBox learnings                                                                                                                                               |
| Form                                                    | ✅     | Structure        | —                                                                          | informational                             | —                                 | —                                  | —                                                                                                                                                        | A11 bridge                                                                                                                                                                               |
| Dialog/Modal                                            | ✅     | Overlay          | —                                                                          | informational                             | —                                 | —                                  | —                                                                                                                                                        | A2 width                                                                                                                                                                                 |
| Popover (standalone)                                    | ⬜     | Overlay          | root + surface + positioner                                                | informational                             | primary/muted                     | —                                  | none                                                                                                                                                     | Extract from Menu/Select internals into a public composite; layer `overlay` (not blocking); A6 knobs from day one                                                                        |
| Tooltip                                                 | ⬜     | Overlay          | root + surface + positioner                                                | informational                             | primary/muted                     | —                                  | none                                                                                                                                                     | Non-blocking, `zIndex.layer.overlay`, `motion.transition`; no focusable content rule documented                                                                                          |
| ProgressBar                                             | 🔧     | Feedback         | —                                                                          | feedback                                  | —                                 | —                                  | —                                                                                                                                                        | A1 keyframes                                                                                                                                                                             |
| Meter                                                   | ⬜     | Feedback         | root + label + status + body(track) + content(fill)                        | feedback                                  | primary/positive/caution/negative | —                                  | none                                                                                                                                                     | Sibling of ProgressBar (static value vs activity) — JSDoc must disambiguate per lexicon style                                                                                            |
| Toast                                                   | 🔧     | Feedback         | —                                                                          | feedback                                  | —                                 | —                                  | —                                                                                                                                                        | A9 UNSTABLE pin                                                                                                                                                                          |
| Separator                                               | ⬜     | Structure        | root                                                                       | informational                             | muted                             | —                                  | none                                                                                                                                                     | `border.divider` token consumer — first pure-Structure atomic                                                                                                                            |
| Group                                                   | ⬜     | Structure        | root + label                                                               | informational                             | primary/muted                     | —                                  | none                                                                                                                                                     | Field grouping wrapper                                                                                                                                                                   |
| Toolbar                                                 | ⬜     | Structure        | root + actions                                                             | informational                             | primary/muted                     | —                                  | none                                                                                                                                                     | Arrow-key navigation between actions (RAC) — keyboard tests                                                                                                                              |
| Calendar                                                | ⏸ `L`  | Selection        | root + title + trigger ×2 + item(cells)                                    | input                                     | none                              | selected/disabled/current(today?)  | decision: `current` on input context is NOT legal today (navigation-only) — either map today→`selected` variants or extend input states via governance   | Phase 3: needs `@internationalized/date` dependency decision + B1 icons                                                                                                                  |
| RangeCalendar                                           | ⏸ `L`  | Selection        | —                                                                          | input                                     | —                                 | selected(range endpoints/middle)   | range-middle styling has no state token — decision needed                                                                                                | Phase 3                                                                                                                                                                                  |
| DateField / TimeField                                   | ⏸      | Input            | root + control(segments) + label                                           | input                                     | none                              | invalid                            | segment focus styling                                                                                                                                    | Phase 3                                                                                                                                                                                  |
| DatePicker / DateRangePicker                            | ⏸ `L`  | Input            | composite (Field + trigger + Popover + Calendar)                           | input                                     | none                              | invalid/expanded                   | —                                                                                                                                                        | Phase 3 capstone — the biggest composition test of the whole system                                                                                                                      |
| ColorArea/Field/Picker/Slider/Swatch/SwatchPicker/Wheel | ⏸      | Input/Selection  | —                                                                          | input                                     | —                                 | —                                  | color-value semantics don't exist in the token grammar                                                                                                   | Phase 4, explicitly optional: niche for "all our apps"; revisit on demand                                                                                                                |
| DropZone + useDragAndDrop                               | ⏸      | Structure/varies | —                                                                          | informational                             | —                                 | droptarget                         | none — droptarget exists!                                                                                                                                | Phase 4; the tokens are already waiting                                                                                                                                                  |
| Virtualizer                                             | ⏸      | (utility)        | —                                                                          | —                                         | —                                 | —                                  | —                                                                                                                                                        | Not a semantic component; adopt inside Table/ListBox when perf demands                                                                                                                   |

### B3. Waves

- **Wave 1 — unblock real apps + fill weak Entities** `~2 wks`:
  ToggleButton, ToggleButtonGroup, Tooltip, Popover, Tabs, Breadcrumbs,
  TextArea, SearchField, Separator. (After A6/A3/B1/A14.)
- **Wave 2 — data & forms depth** `~2-3 wks`:
  NumberField, Slider, CheckboxGroup, TagGroup, ListBox, GridList, Toolbar,
  Group, Meter, Disclosure, FileTrigger.
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

**D1. AI-executability benchmark** `L` — run `INTERNAL/STRATEGIC_EVAL.md`
criterion 6 (first-pass success rate of LLM-generated UI vs Radix/MUI/RAC
baselines) once A4 (llms.txt) and Wave 1 land. This produces the launch
number. Fixed prompt suite: dialog, field+validation, menu, destructive
confirm, themed composite; measure token-selection correctness + semantic
error rate + human corrections.

**D2. `private: true` flip gate** `S` — flip only when: CI green including a
real tsdown build (local builds are blocked by a pre-existing container env
issue — CI is authoritative), A-P0 complete, A13 axe suite green, D1 executed.
Record the gate in this file when flipped.

---

## Suggested execution order

```
A1 A2 A4 A5 A7 A8 A9 (P0/quick, parallel)
→ A6 + A3 + B1 + A14 (foundation decisions, sequential-ish)
→ Wave 1 ∥ A12 A13 (a11y layer grows with the wave)
→ A10 A11 A15 A16
→ Wave 2 → Wave 3
→ D1 benchmark → D2 gate → Phase 3
```
