# Forms — closed record

The plan for closing forms in `@ttoss/fsl-ui` — the field family, the envelope
API, form construction, validation, groups and field formats. Written
2026-07-26, executed item by item, **queue complete 2026-07-29**: every field
kind and every form capability stands in a real Studio flow.

**This file is a closed record.** It keeps the rulings that outlive the queue
and a dated index of what each item shipped. Compressed to basis form
2026-08-06 (owner directive; the E1 remainder in ROADMAP § "Route to the visual
sign-off"): the item-by-item narratives, the measurement tables and the
round-R/C/O/N/Q sections are in
`git log -p -- packages/fsl-ui/INTERNAL/FORMS.md`. Program context is the
ROADMAP § Route › P3 Slice 5.

**Where the old section numbers went** — component JSDoc, tests and FRICTION.md
cite them, and every claim they cite survives below: **§1** (what is inherited
from React Aria) and **§2 / §2b** (the three authoring levels; a field is not a
form) are under _What is inherited_ and _Architecture_; **§3** (the envelope
constraint) and **§4** (the item queue) are under _Architecture_ and the index;
**§5** (out of scope) is under _Standing deferrals_; **§7** (the per-item ritual
and the harness facts) keeps its own heading.

---

## Binding rulings

### Inherited, not re-decided

- Semantic identity first: Entity → token line (`CONTRACT.md` §1). No visual
  props on composites, no `style`/`className`; host customisation only through
  `--fsl-*` knobs (§7, ADR-002).
- All copy is caller-supplied; flow-critical labels are type-required (ADR-001).
- Theme values change data-only in `baseTheme.ts` (fsl-theme ADR-008); the
  contrast suite stays green.
- Geometry comes from `components/Field/anatomy.tsx` (ADR-022), asserted by
  contract invariants **#11** (the field row, both control shapes) and **#12**
  (addressability). The queue added **#13** (the choosable row), **#14** (the
  embedded trigger) and **#15** (the selection control).
- **Fix the class, not the instance. Every finding leaves a guard, never a
  comment.**

### Owner rulings

- **Design and aesthetics follow Spectrum 2** (2026-07-25). Where S2 has a
  vocabulary for something, we adopt the vocabulary and keep our token model.
  S2 is reference, not authority: the type engine, the `hit` floor and the
  fixed control inset stay ours (fsl-theme ADR-019/020/022).
- **No form-library dependency, ever** (2026-07-26). `@ttoss/forms` is legacy
  alongside `@ttoss/ui` and will be discontinued, so fsl-ui carries the form
  capabilities itself; TanStack Form is reference and inspiration only.
  **ADR-004 is superseded by ADR-027** and F-005 resolves by deprecation
  rather than repair.
- **The consumer is the Studio** (2026-07-26). Nothing ships without something
  in `docs/fsl-studio` using it, so the evidence rule (CONTRIBUTING §2.3) is
  satisfiable by construction rather than by argument.
- **A component always paints** (2026-07-29, closing the "can it paint
  nothing?" question against the then-current recommendation): no
  `transparent` primitive **and no omitted background**, so every semantic
  background stays a declared, auditable value and the contrast pairs stay in
  the suite. The lawful fix inside the ruling is a stratum-aware **opaque**
  value — delivered 2026-08-04 as ADR-030's surface contract.
- **Hover does not apply while a field is invalid** (2026-07-29). It needed a
  guard rather than an implementation: `STATE_PRIORITY` already ordered
  `isInvalid` above `isHovered`.
- **The control inset is a fixed-px contract and control type stays fluid**
  (2026-07-29, fsl-theme ADR-022), which closed F-035 and F-021.

### What is inherited from React Aria — verified, not assumed

Measured in the Studio's login form (2026-07-26): **RAC already focuses the
first invalid field on submit** and moves to the next once it is fixed. Also
inherited and exposed: `Form validationErrors` (server errors keyed by field
`name`, cleared on **commit**/blur), per-field `validate`, native constraint
validation, and `FormSubmit`'s `isPending`. So the focus management a headless
form library structurally cannot provide is already ours, and the deliverable
was a guard (B3a) plus documentation — pinned because it would vanish silently
under an upstream change or a stray `validationBehavior="aria"`.

- **Do not touch `validationBehavior`.** `aria` mode does not merely stop
  _displaying_ native constraints, it **removes** them (`validity.valid` reads
  `true` on a required field). RAC's `native` default is correct in both
  contexts.
- **A field is not a form, and `Form` is the validation scope** — not a synonym
  for "a big form". A standalone field surfaces a `validate` result and a
  malformed value on blur with no prop set; only "required but never
  submitted" waits for a submit, which is right, because a field should not
  scold someone for not having filled it yet.

### Architecture — the constraints that shape the family

- **A generic `<Field>` wrapper around an arbitrary control cannot work.**
  `LabelContext`, `TextContext` and `FieldErrorContext` are context-generic
  consumers **supplied by the field root itself**, so the envelope is the RAC
  root each composite already renders plus the parts mounted inside it. This is
  also why "one label over two controls" is a `role="group"` (`FieldGroup`)
  rather than a relabelled field, and why a cluster has no validation state of
  its own.
- **Identity stays per-component; implementation is shared.** No exported
  generic `FieldLabel` — it would own a `data-scope`, and re-scoping published
  parts is a break bought for nothing (A). The envelope parts are internal and
  take `scope` as a **prop**, so `text-field/label` is still `text-field/label`
  while nine hand-written copies collapse to one (C2).
- **A part cannot be placed inside a control whose root is its own `<label>`**
  — on `Checkbox` that absorbed the copy into the accessible **name**. Where
  that happens the name is pinned with `aria-labelledby` and the copy linked
  with `aria-describedby` (A2).
- **Three authoring levels, one implementation:** a field is one line (the 90 %
  path, and the one an AI writes correctly first try); a `Form` configures its
  fields once through static context, because layout is a product decision
  (B1, ADR-025); slots when the shape is unusual. Level 1 renders Level 3's
  parts, and a discriminated union makes them mutually exclusive at compile
  time, so "I passed both, which wins?" cannot become an invisible runtime
  precedence rule.
- **Validation is split by part:** the **control** keeps its authored role and
  flips that role's `invalid` State (re-voicing it is the category mistake FSL
  Lexicon §10.15 names, and fsl-theme ADR-017 rules), while the **part that
  reports the outcome** carries the valence and reads `input.negative.text.*`
  (CONTRACT §3.2). The in-box glyph reads the same ink (H).
- **Class guards, not instance fixes:** **no component source may write an
  `outlineOffset` literal** (round R2 — a literal that happens to match a
  constant is indistinguishable from one that tracks it until the theme changes
  the ring's thickness); invariant #12's known-violations list ships with a
  companion test asserting every entry still reproduces, so a fixed one must be
  deleted instead of rotting into an exemption (round R3 moved `MenuItem` to
  `structure: 'control'`, a deliberate published-attribute change); and the
  FRICTION index count must be worded so the instruction line does not match
  its own grep (round R5).

### Standing deferrals, with readmission criteria

- **⏸ B3b `FormErrorSummary`** — no consumer, and the ROADMAP forbids inventing
  one. **Readmission:** a form tall enough that the first invalid field can be
  scrolled off-screen. Both halves are pre-verified: the data is reachable
  (`onInvalid` fires once per invalid field with the **control** as target —
  the payoff of invariant #12), and **its appearance is no longer blocked**:
  the colour half is answered by `semantic.valence.{valence}.ink` (fsl-theme
  ADR-029) and the surface by the `status.passive` posture (`feedback.muted`,
  fsl-ui ADR-043) — it composes on `InlineAlert` rather than needing a
  language of its own. So the only thing it waits on is its consumer.
  **Corrected 2026-08-12 (F-062):** this entry used to say the appearance was
  blocked because "the reference's InlineAlert is tinted and the tinted rung
  lives in `informational.negative`". Tinted is the reference's opt-in
  `fillStyle="subtleFill"`; its default is a bordered neutral, which needs a
  valence ink and edge and no valence fill at all.
- **⏸ The quiet field posture** (C4) — deferred on the evidence rule for the
  fourth time in this plan. S2 exposes `isQuiet` on `Picker` **only** and
  models it as an inset collapse; our default already matches its default.
  **Readmission:** a picker inside dense content — a table cell, a toolbar —
  which is also where a boxed field starts to read as noise. Its colour half
  lands on the F-024 axis.
- **⏸ Out of scope, on demand only:** array/repeatable fields · `LabeledValue`
  (read-only Intl-formatted display; build when a Meridian detail view pulls
  it) · `FileUploader`/`AttachedFiles` (we ship `FileTrigger` — the button, not
  the flow) · `DatePicker` · `Group orientation`.
- **Not imported from the owner's drafts:** 4px radius (ours 8 matches S2's
  `corner-radius-medium-default`), the 12/16px type pair, Atkinson
  Hyperlegible, RadioButton's fused state axes, `NumberOfOptions` (a Figma
  limitation), and HUG roots with no ergonomic floor — our `minHeight: hit`
  stays.

### Decided no-changes — not to be reopened

- **The picker popover overlays the description below the field** (ADR-023).
  RAC anchors it to the trigger, so it covers what is beneath, which is what an
  overlay is — and both reference implementations do the same.
- **`Menu` and `Popover` do not take their trigger's width** (ADR-023). A menu
  shows things to do, not a field's value space; both authorities exclude it.
- **`Checkbox` does not use the shared envelope parts** (C2). Its root _is_ a
  `<label>`. It shares what it can: the text-part style and the necessity
  marker.
- **A `Select` trigger's accessible name is value-then-label** ("Choose a role
  Role") — React Aria's own `aria-labelledby` order, and correct. Consequence
  worth knowing rather than fixing: a name query must not be exact.
- **The resting field border stays 1px** — S2 ships **colour only** for
  validation (`negative-border-color-*`, no negative border _width_;
  `picker-border-width` is 1px), so the apparent conflict with
  `ActionButton`'s deliberately-kept 1px never existed.
- **Radio stays 18px** against S2's 16 (one shared selection scale is the
  point; shape disambiguates), and **the slider rail stays 6px** against S2's 4
  (three rails, one internal decision — P3 Slice 3).

### Learned from TanStack, without depending on it

Layers are fine, fragmentation is not — the three levels share one
implementation; generics are inferred from runtime values, never passed by a
caller; their context-performance note is why the `Form`'s context is
**static-only** (ADR-025). Not copied: render-prop-per-field verbosity, and
`React.lazy` for tree-shaking, which fights ADR-006's unbundle emit and the
treeshake budget. Noted with no consumer: an `errorMap` keyed by **when**
validation ran (change / blur / submit).

### Per-item ritual, and standing harness facts

The ritual each item ran, kept for the next family pass: geometry measured on
both sides and in both modes with screenshots · findings decided with written
reasons · deliberate no-changes recorded as rigidly as changes · a guard per
behavioural finding and a contract invariant when it is a class · an ADR when
the decision is architectural · a FRICTION entry per gap · a story in
`docs/fsl-storybook` · a Studio consumer · suites green, coverage at 100,
treeshake within budget.

- Node 24 is `/opt/node24/bin`; Playwright resolves only from the repo root and
  uses `executablePath: '/opt/pw-browsers/chromium'`; `playwright install` must
  never be run. Storybook `:6007` and Studio `:5173` die between sessions.
- **Storybook does not follow `prefers-color-scheme`** — its preview reads the
  theme's own root attribute, so a Playwright context's `colorScheme` is **not**
  enough to measure the dark bundle: set `data-tt-mode` on
  `document.documentElement` explicitly. The same applies to the Studio, which
  owns its mode through a toggle. Any "verified in both modes" claim taken with
  `colorScheme` alone measured the light bundle twice (C2's first pass did, and
  was retaken). This is a harness fact and **not** F-027, which is the theme's
  border-contrast inventory auditing only the light bundle.
- The `@docs/fsl-storybook` **build** fails on a pre-existing environmental
  mismatch — its `storybook-llms-extractor` post-step wants
  `chrome-headless-shell` `-1223` while the container ships `-1194`; verified
  identical on a clean tree.

---

## Index — items A–I

Every item: capability → Studio consumer → guard → docs → measured in the
browser, both modes → one commit.

- **A** ✅ 2026-07-26 — the Level-1 props↔slots union (`FieldAuthoring`) on
  `TextField`/`TextArea`; generic exported parts rejected; `placeholder`
  forwarded because RAC deliberately omits it; the one-line form always mounts
  the message slot, which buys the platform's own localized constraint copy.
  _Studio:_ the login form, four elements per field down to one. → ADR-022
  addendum.
- **A2** ✅ 2026-07-26 — `description` + `errorMessage` on `Checkbox` in S2's
  vocabulary, closing the `Checkbox` half of F-033; withdrew the plan's
  `validationBehavior` defaulting; established the name-absorption limit and
  that RAC's `FieldError` returns `null` on a lone `Checkbox`. _Studio:_ the
  invite dialog's required acknowledgement. → `git log`.
- **B1** ✅ 2026-07-26 — the `Form` publishes field layout through a dedicated
  **static** context (not `formScope`, which throws without its host, so a lone
  field stays first-class); first consumer `necessityIndicator: 'icon' | 'none'`;
  the `'label'` variant rejected until a consumer supplies localized copy.
  Corrected mid-flight: RAC sets the native `required` attribute, not
  `aria-required`. → ADR-025.
- **B2** ✅ 2026-07-29 — `labelPosition="side"` via subgrid
  (`grid-template-columns`): the Form declares two columns and each field root
  inherits them, so the label column is the browser's job — which is why side
  labels are a Form decision, not a field prop. `alignItems: baseline`. `Checkbox`/`Switch`
  ignore `labelPosition` for their label but not for their placement. `rows`
  reached the one-line form through a second `FieldAuthoring` type parameter.
  _Studio:_ the Settings page. → `fieldLayout.test.tsx`.
- **B3a** ✅ 2026-07-26 — the focus/validation guard: five assertions pinning
  what §1 measured as inherited rather than owed. → `formValidationBehaviour`
  / `fieldEnvelope` suites.
- **B3b** ⏸ deferred 2026-07-26 — see the standing deferrals above.
- **B4** ✅ 2026-07-29 — `contextualHelp` on every envelope root (the
  `ActionMenu` recipe one affordance over; `action.help` intent; `aria-label`
  type-required). The trigger is a **sibling** of the `<label>` in an internal
  `labelRow`, for two measured mechanisms; without the prop the DOM is
  byte-identical. The class guard caught RAC's ambient `ButtonContext`
  demanding a slot inside `NumberField` (`slot={null}` is the documented
  refusal). _Studio:_ Settings' Region field. → `git log`.
- **C1** ✅ 2026-07-26 — `Select` + `ComboBox` onto the anatomy: five measured
  defects closed by one refactor (`inline-flex` root, flush focus rings,
  centred value, `combo-box/control` naming two elements, a ring literal);
  invariant #11 grew to cover self-painted **and** split control shapes. →
  ADR-022, invariant #11.
- **C2** ✅ 2026-07-28 — the field envelope, closing F-009: one
  label/description/validationMessage set in the anatomy, taking `scope` as a
  prop so published pairs are unchanged; a split control's frame must declare
  the row's type; a label does not tint itself `text.invalid`; the guard is a
  class guard, table-driven over the roots. _Studio:_ the invite dialog's Role
  is chosen rather than defaulted. → ADR-022 addendum.
- **C3** ✅ 2026-07-28 — the picker popover takes the field row's width
  (F-019): `--trigger-width` is documented public API, so the namespace ban
  gained a **named allowlist** rather than a hole; `min-width` is the floor and
  `width` the knob-overridable default; the guard moved to the **rendered**
  inline styles after a source-text regex stayed green through the very change
  it existed to catch. → ADR-023.
- **C4** ✅ 2026-07-28 — the choosable row is one decision: an option row **is**
  the field row's content box (32 vs 34px, one inset and one type), so
  `CHOOSABLE_ROW` lives in the cross-cutting token layer because the five rows
  span three entities and the entity decides a row's colours, never its box;
  `FOCUS_RING_INSET` is derived from the theme's ring width. Filed F-034;
  deferred the quiet posture. → contract invariant **#13**, CONTRACT §5.
- **D** ✅ 2026-07-29 — `SearchField` + `NumberField`: `EMBEDDED_TRIGGER` as a
  third posture beside command and utility (the reference names
  `in-field-button` as its own component), with the **interactive box taking
  `hit`** because reading `edge-to-fill` as the target fails WCAG 2.5.8 — fill
  and target are two questions. F-026 closed and `KNOWN_NESTED_PAIRS` emptied
  by taking the frame/value split; the clear button gated on `isEmpty`. →
  contract invariant **#14**.
- **E** ✅ 2026-07-29 — the selection family: plain `Switch` is `@deprecated`
  upstream, so the F-033 half was to move onto RAC's `SwitchField`, whose
  structure dodges A2's name-absorption trap by construction; `SELECTION_CONTROL`
  states the scale once (18px box / 12px glyph); the Switch track goes 40×24 →
  30×18 with the handle growing when ON; `Slider`'s thumb target takes `hit`,
  closing a WCAG 2.5.8 hole. _Studio:_ Settings' two-factor Switch. → contract
  invariant **#15**.
- **F** ✅ 2026-07-29 — the validation language, shipped as one branch in one
  function: reading the Lexicon first removed two of the three things the item
  was written to build, F-031 was withdrawn as not-a-defect (focus rides the
  ring), and a **vacuous** guard was deleted rather than kept as reassurance
  (jsdom resolves no custom properties). Filed F-036. → CONTRACT §3.2.
- **G** ✅ 2026-07-29 — `FieldGroup` + `Wizard`: per-step validation composes
  with **zero new API** (each step is its own `Form`; the forward button is a
  submit bound to it via the HTML `form` attribute), so the deliverable is a
  guard; `FieldGroup` answers ADR-014's duplicate test by being a **field**
  whose control is a cluster, where `Group` is a labelled surface frame.
  _Studio:_ Billing's Add-payment-method wizard. → ADR-014, `Wizard.test.tsx`.
- **H** ✅ 2026-07-29 — field formats as a named locale-scoped registry
  (`format="br.cep"`, four Brazil formats; currency **cut on inspection**
  because `Intl.NumberFormat` owns it; checksums stay with the caller's
  `validate`), and the in-box `FieldInvalidGlyph` on all six boxed members.
  `TextField`/`TextArea` moved to the split shape, verified byte-identical.
  _Studio:_ Billing's address step. → ADR-026.
- **I** ✅ 2026-07-29 — the Studio's complete form (Environments): the last
  seven unconsumed capabilities in one real flow, async submit with a server
  refusal routed by `name`. The first consumer found **F-037** — `FormSubmit`
  had promised attributes RAC clobbers and disabled itself out of keyboard
  focus — and the fix subtracted code in favour of RAC Button's native
  `isPending`. **The queue is complete.** →
  `formValidationBehaviour.test.tsx`, llms.txt.
