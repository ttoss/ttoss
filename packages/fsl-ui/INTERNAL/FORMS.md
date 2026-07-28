# Forms — the complete scope

The plan for closing forms in `@ttoss/fsl-ui`: the field family, the envelope
API, form construction, validation, groups, and field formats. Written
2026-07-26, executed item by item; each item lands as one commit with a real
consumer, a guard, and its documentation.

**Read the ROADMAP for the program context** (P3 Slice 5 is the geometry half of
this). This file is the forms-specific plan and the sequencing authority.

---

## 0. Ground rules

Inherited, not re-decided:

- Semantic identity first: Entity → token line (`CONTRACT.md` §1). No visual
  props on composites, no `style`/`className`; host customisation only through
  `--fsl-*` knobs (§7).
- Validation outcome is the `invalid` **State**, never an evaluation (ADR-017).
- All copy is caller-supplied; flow-critical labels are type-required (ADR-001).
- Theme values change data-only in `baseTheme.ts` (ADR-008); ADR-015's contrast
  suite stays green.
- Geometry comes from `components/Field/anatomy.tsx`; the row is asserted by
  contract invariant #11 and addressability by #12 (ADR-022).
- Fix the class, not the instance. Every finding leaves a guard, never a comment.

Two rulings that shape this scope:

- **Design and aesthetics follow Spectrum 2** (owner, 2026-07-25). Where S2 has
  a vocabulary for something, we adopt the vocabulary and keep our token model.
- **No form-library dependency, ever** (owner, 2026-07-26). `@ttoss/forms` is
  legacy alongside `@ttoss/ui` and will be discontinued, so fsl-ui carries the
  form capabilities itself. TanStack Form is reference and inspiration only.
  ADR-004 is superseded; F-005 resolves by deprecation rather than repair.

**The consumer is the Studio** (owner, 2026-07-26). Every item below is pulled
by a Meridian flow, so the evidence rule (§2.3) is satisfiable by construction
rather than by argument. Nothing ships without something in `docs/fsl-studio`
using it.

## 1. What is already inherited — verified, not assumed

Measured in the Studio's real login form (Chromium, 2026-07-26): **React Aria
already focuses the first invalid field on submit**, and moves to the next one
when the first is fixed (`email` → `password`, both carrying
`aria-invalid="true"`). S2 documents the same behaviour as a default; we get it
from RAC's `validationBehavior="native"`.

So the focus-management feature that a headless form library structurally
cannot provide is **already ours**, and the deliverable is a guard plus
documentation — not an implementation. What is genuinely missing beside it is a
**form-level error summary**, which S2 builds from `InlineAlert` + `autoFocus`.

Also inherited from RAC and already exposed: `validationErrors` on `Form`
(server errors keyed by field `name`), per-field `validate` callbacks, native
constraint validation (`isRequired`, `type`, `minValue`), and
`FormSubmit`'s `isPending`.

## 2. The API — three levels, one implementation

**Level 1 — a field is one line.** The 90 % path, and the one an AI writes
correctly on the first try:

```tsx
<TextField
  label="Email"
  name="email"
  type="email"
  isRequired
  description="We never share it."
/>
```

**Level 2 — a form configures its fields once.** Layout is a product decision,
so it lives on the `Form` and fields inherit it through context — the
ecosystem's pattern, and also how S2 does it:

```tsx
<Form labelPosition="side" necessityIndicator="icon" onSubmit={…}>
  <TextField label="Email" name="email" isRequired />
  <Select label="Role" name="role">…</Select>
  <FormActions>
    <Button composition="secondaryAction" evaluation="secondary">Cancel</Button>
    <FormSubmit>Save</FormSubmit>
  </FormActions>
</Form>
```

**Level 3 — composition when the shape is unusual.** The slot form of any
field, plus `FieldGroup` for one label over several controls:

```tsx
<FieldGroup label="Validade">
  <Select aria-label="Month" …/>
  <Select aria-label="Year" …/>
</FieldGroup>
```

Level 1 renders Level 3's parts, so the two cannot drift, and a discriminated
union makes them mutually exclusive at compile time (the ADR-001 mechanism,
already used by `ActionLabellingProps`). Every existing per-component slot
export stays as a thin alias — **no break**.

## 2b. Standalone fields — a field is not a form

Every field works on its own; a `Form` is an amplifier, not a prerequisite. What
differs is **who triggers validation**, and this was probed rather than assumed
(2026-07-26):

| Setting                                                            | Result (all measured, 2026-07-26)                                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Inside `<Form>`, native constraints (`isRequired`, `type="email"`) | ✅ validates on submit, blocks it, focuses the first invalid field, shows the platform's localized copy |
| Standalone + a `validate` callback, **no prop set**                | ✅ surfaces on blur and clears when fixed                                                               |
| Standalone + a malformed value (`type="email"`), **no prop set**   | ✅ surfaces on blur                                                                                     |
| Standalone + `isRequired` only                                     | ⏳ waits for a submit                                                                                   |
| `validationBehavior="aria"`                                        | ⚠️ **removes** native constraints — `validity.valid` reads `true` on a required field                   |

**React Aria's `native` default is already correct in both contexts, so nothing
here needs a prop.** The one row that waits — `isRequired` with no submit — is
right rather than broken: a field should not scold someone for not having filled
it yet, and where there is something to confirm there is a button to confirm it,
which is the submit. So a lone field that needs a required check belongs in a
`Form` — `Form` is the validation scope, not a synonym for "a big form".

Two consequences for the plan:

- **Do not touch `validationBehavior`.** An earlier revision of this plan wanted
  to default it from Form presence. That would have been a **regression**, and
  measurement caught it before a line was written: `aria` mode does not merely
  stop _displaying_ native constraints, it **removes** them (last row above).
- **✅ `Checkbox` got the message part** (A2); `RadioGroup` and `CheckboxGroup`
  got the whole envelope (C2). **`Switch` is not the same job:** React Aria's
  `SwitchProps` omits `isRequired`/`isInvalid`/`validate`/`validationBehavior`
  entirely, so a `Switch` cannot be invalid — the question is whether to adopt
  RAC's separate `SwitchField` root, which is F-033's half in E.
  `Slider` stays without one: React Aria gives it no `FieldErrorContext`, because
  a slider always holds an in-range value — a boundary, not a gap.

For the common "confirm before continuing" modal both correct shapes now work:
gate the action on app state (the confirm button is disabled until the box is
checked — no message needed), or let the field state the rule (`Checkbox` with
`isRequired` + `errorMessage` inside a `Form`, shipped in A2).

## 3. Constraint that shapes everything

A generic `<Field>` wrapper around an arbitrary control **cannot work**. Read in
`react-aria-components@1.19.0`: `LabelContext`, `TextContext` and
`FieldErrorContext` are context-generic consumers, and the field root supplies
them. All three come from `TextField`, `Select`, `ComboBox`, `NumberField`,
`RadioGroup`, `SearchField` and `CheckboxGroup` — nine of our eleven components,
since our `TextArea` uses `RACTextField` as its root. `Slider` supplies
`LabelContext` alone; a single `Checkbox`/`Switch` carries its label as inline
children, which is why those two needed the A2 treatment rather than the
envelope. (Both _do_ import `TextContext`/`FieldErrorContext` — an earlier
revision of this file claimed otherwise for `Switch` and was wrong — but on a
lone `Checkbox` that error context stays quiet even while the input is
`aria-invalid` and the form refuses to submit, so `FieldError` is unusable there
and the message gates on the render-prop flag instead.)

So the envelope is **the RAC root each composite already renders**, plus the
parts mounted inside it, plus one shared geometry source. It is also why "one
label over two controls" is a `role="group"` rather than a relabelled field.

**Those parts stay per-component, and that was decided rather than assumed** (A).
A single exported `FieldLabel` reusable inside any field would need its own
`data-scope`, and re-scoping the existing per-component parts is a breaking
change to published attributes bought for nothing: the unification a caller
feels is the prop form, and the style duplication was already removed in the
anatomy. So `TextFieldLabel` and its siblings remain, sharing one style source.

**Sharing the implementation is a different question from sharing the identity,
and C2 answered it the other way.** The envelope parts are now internal and take
`scope` as a **prop** (`FieldLabelPart`, `FieldDescriptionPart`,
`FieldValidationMessagePart`), so every published pair is unchanged —
`text-field/label` is still `text-field/label` — while the nine hand-written
copies collapse to one. What A rejected was an _exported_ part that owned a scope;
what would have kept the drift is refusing to share the code behind them, and the
drift is measured: see C2.

One further limit, measured in A2: a part cannot simply be placed _inside_ a
control whose root is its own `<label>`. On `Checkbox` that absorbed the copy
into the accessible **name** — `"Accept termsYou agree to the terms."`, with a
name query for the label alone no longer matching. Where that happens the name
is pinned with `aria-labelledby` and the copy linked with `aria-describedby`.

## 4. Items, in dependency order

Each item: capability → Studio consumer → guard → docs → measured in browser,
both modes → commit.

- **A. ✅ Level-1 props (2026-07-26).** The props↔slots union, with
  `TextField`/`TextArea` as first consumers (already on the anatomy).
  Landed as the `FieldAuthoring` union on `TextField`/`TextArea` (ADR-022
  addendum), with the Studio's login form converted — each field one element
  instead of four, geometry and validation re-measured unchanged in both modes.
  **Generic exported parts were rejected:** a `FieldLabel` usable in any field
  would need its own `data-scope`, and changing the scope of the existing
  per-component parts is a breaking change to published attributes for no gain —
  the unification callers actually feel is the prop form, and the style dedup
  already happened in the anatomy. `contextualHelp` and the necessity indicator
  move to **B** (they share the label row); `prefix`/`suffix` move to **D**
  (they need the adornment anatomy).
- **A2. ✅ The Checkbox envelope (2026-07-26).** `description` + `errorMessage`
  on `Checkbox`, in S2's vocabulary — whose documented example is exactly the
  terms-and-conditions checkbox. Closes the `Checkbox` half of F-033. _Studio:_
  the invite dialog gained a required acknowledgement, which broke three flow
  tests until they passed the new gate — the right kind of failure.
- **B1. ✅ Form publishes field layout; a required field marks itself
  (2026-07-26).** A dedicated context in the anatomy — not `formScope`, which
  throws without its host — read with a default so a standalone field still
  works. Static configuration only, held by two tests: a keystroke in one field
  does not re-render its siblings, and the value survives a Form re-render by
  identity. First consumer is `necessityIndicator: 'icon' | 'none'` (default
  `icon`, marking the required fields as the reference does); the `'label'`
  variant is rejected until a consumer supplies its localized copy (ADR-001).
  Wired into `TextField`, `TextArea` and `Checkbox`. → ADR-025. _Studio:_ the
  invite dialog's email (composed authoring) and acknowledgement checkbox both
  mark themselves; four `getByLabelText` queries moved to `getByRole` because a
  required label's text content now contains the asterisk.
- **B2. ⏸ `labelPosition="side"` — deferred, no consumer (2026-07-26).** The
  evidence rule applies to this plan too: no Meridian surface wants side labels.
  The two forms that exist are a narrow login card and a ~300px invite modal,
  where side labels would be wrong, and the Billing page's only `label` belongs
  to a `Meter`. Creating a consumer is not available either — the ROADMAP freezes
  new Studio features for P3. Building it now would be reserved API, which is what
  §2.3 forbids and what B1 already refused twice (the `'label'` necessity variant,
  and `labelPosition` in the context).
  **Readmission criterion:** a surface with a wide, multi-row form — a settings or
  profile page — which is also when the alignment is worth having.
  **Mechanism already verified, so the future work is cheap:** the layout must be
  `grid-template-columns: subgrid` on each field root inside a Form-owned grid,
  because each field is its own component and would otherwise size its label
  column alone, leaving the controls ragged — which is the entire point of side
  labels. Probed in the target Chromium: `CSS.supports('grid-template-columns',
'subgrid')` is `true`, and two rows with labels "Email" and "Confirm password"
  put both controls at the same x (127px). Per-field grids without subgrid do not
  align and are not an acceptable fallback.
- **B3a. ✅ The focus guard (2026-07-26).** Five assertions pinning what §1
  measured as inherited rather than owed: a failed submit is blocked, focus lands
  on the first invalid field and moves to the next once that is fixed, each
  invalid field is reported exactly once with the **control** as the event target,
  a required `Checkbox` blocks like any other field, and a field with no
  `errorMessage` still reports the platform's own copy. Worth pinning because it
  is load-bearing and invisible: it is the thing a headless form library
  structurally cannot offer, and it would vanish silently under an upstream change
  or a stray `validationBehavior="aria"`.
- **B3b. ⏸ `FormErrorSummary` — deferred, no consumer (2026-07-26).** Same
  discipline as B2. A summary earns its place on a form long enough that the first
  invalid field can be scrolled out of view; the Studio's forms are two and four
  fields, React Aria already focuses the first invalid field, and each field
  already states its own error — so a summary would add a second voice saying the
  same thing. The Studio freeze forbids building a longer form to justify it.
  **Readmission criterion:** a form tall enough that the first invalid field can
  be off-screen.
  **Two things already established, so the future work is cheap.** The data is
  reachable: `onInvalid` fires **once per invalid field** with `event.target` being
  the control, carrying `name`, `aria-labelledby` (so the label text resolves) and
  `validationMessage` — asserted in the focus guard, which is also the payoff of
  invariant #12's addressability. And the appearance is decided: as `Feedback`/root
  with `evaluation="negative"` it would read `feedback.negative`, which Slice 3
  made a **filled** rung (`red.600` on `neutral.0`) — the `Toast` precedent. S2's
  own InlineAlert is _tinted_ instead, and the tinted rung lives in
  `informational.negative`, which CONTRACT §1 forbids a Feedback component from
  reading. That is the F-024 / F-029 axis a third time: the tree has no quiet
  in-context rung. Decide it there, not by having one component reach across.
- **B4. `contextualHelp`.** A slot beside the label, in S2's prop shape.
- **C1. ✅ `Select` + `ComboBox` onto the anatomy (2026-07-26).** One refactor,
  five measured defects closed: `Select`'s root was `inline-flex` so it alone
  never filled its column (97.98px against its siblings' 1200px); its trigger drew
  the focus ring **flush at 0px** where the family floats it at 2px, as did
  `ComboBox`'s frame; its value inherited `text-align: center` from the `<button>`
  it is, so a selected value sat centred one row above a start-aligned input —
  live in the Studio's invite dialog; and `combo-box/control` named both the frame
  and the inner input, the last of invariant #12's field violations to fall.
  Invariant #11 grew to cover both control shapes: a self-painted member resolves
  the whole row on one element, a split member spreads it across frame and value,
  because a frame that also padded would double the gap on the reading edge.
- **C2. ✅ The field envelope, closing F-009 (2026-07-28).** Scoped as
  "`Select` gains `description` + `errorMessage`" and measured first, which
  changed the scope: probed across all nine field roots, the necessity marker B1
  shipped reached **three** of them, `RadioGroup` carried F-009's exact shape one
  family over, and three files held a private `resolveFieldTextColors` computing
  what `buildFieldTextPartStyle` already computes. So the deliverable is one
  envelope — `FieldLabelPart` / `FieldDescriptionPart` /
  `FieldValidationMessagePart` in the anatomy — used by `Select`, `ComboBox`,
  `NumberField`, `RadioGroup`, `CheckboxGroup`, `SearchField`'s label and the
  `TextField`/`TextArea` slot exports.
  **This does not reopen A's rejection**, it draws the line A was actually
  drawing: A refused an _exported_ generic `FieldLabel` because it would need its
  own `data-scope`, and re-scoping published parts is a break bought for nothing.
  These are internal and take `scope` as a prop, so `text-field/label` is still
  `text-field/label` — every addressable attribute is byte-identical either side
  of the refactor. → ADR-022 addendum.
  Two things fell out of measuring rather than reading. A split control's
  **frame** declared no type, so the same `ComboBox` resolved `16px` in Storybook
  and `18px` in the Studio's invite dialog — a frame that declares nothing
  inherits the host's paragraph size and hands it to every adornment in it; the
  row's type now sits on the frame, asserted by invariant #11 for both shapes.
  And `Select`'s label alone tinted itself `text.invalid` when invalid — invisible
  drift, because F-032 measures that token as the same ink as `text.default`;
  dropped rather than spread, since a whole label turning red is not the language
  the reference uses.
  _Studio:_ the invite dialog's Role is now **chosen rather than defaulted** — it
  defaulted to Developer, so an invite could silently grant deploy access to
  someone nobody picked a role for, and the field had no way to insist. Three
  flow tests had to start picking a role; a fourth asserts the refusal through the
  published `[data-part="validationMessage"]`.
  _Verified in Chromium, both modes:_ in the Studio the email control, the Role
  trigger and the Timezone frame all report `x=427 w=426 h=34`, Role's envelope
  copy sits at 14px against the label's 16px, focus after a refused submit lands
  on `select/trigger`, and the trigger's invalid border reads `rgb(220,38,38)` /
  `rgb(252,165,165)` — byte-identical to `TextField`'s.
  **The guard's axis is executed, not remembered.** A self-audit of this item found
  the first version naming an axis and then quietly omitting two of its members, so
  the axis is now a test: it greps the RAC dist for the roots that supply both
  contexts and asserts the membership, and every member is placed in one of three
  groups — carries the whole envelope, label only (`SearchField`, no one-line form
  until D), or deliberately without it (`Checkbox`, whose root is a `<label>` so
  copy inside it is absorbed into the accessible name; `Switch`; `Slider`). An
  upstream change now fails the test instead of silently ageing the comment.
- **C3. ✅ The picker popover takes the field row's width (F-019, 2026-07-28).**
  The governance question turned out narrower than the plan assumed, because
  `--trigger-width` is **documented public API**: it appears in React Aria's
  Popover docs in a "CSS Variables" table as "The width of the popover trigger
  element", and RAC's own `Select`/`ComboBox` examples read it. So the namespace
  ban gains a **named allowlist** (`UpstreamCssVar` + `upstreamVar`), not a hole,
  and `--trigger-anchor-point` was _not_ admitted — nothing needs it. → ADR-023.
  **Both authorities draw the same line, and it is picker-vs-menu.** S2 documents
  `menuWidth` on `Picker`/`ComboBox` as "By default, matches width of the trigger.
  Note that the minimum width of the dropdown is always equal to the trigger's
  width" and has no such prop on `Menu`; RAC styles the two picker popovers and
  not the menu. Those are two rules, so they became two declarations: `min-width`
  is the unconditional floor, `width` is the knob-overridable default. Our `Menu`
  keeps `--fsl-menu-min-width` (measured 192px against a 108.88px trigger —
  correct) and `Popover` keeps its max-width.
  Measured before: **102.11px of Select popover under a 1200px trigger** and
  79.61px under 310px; ComboBox 142.88px and 115.27px. After: equal at every
  combination, and **426px against a 426px field** in the Studio's invite dialog,
  both modes. Stress case at a 140px trigger — a long option wraps to three lines
  with no overflow either way.
  **The enforcement lesson is the part worth carrying forward.** The pre-existing
  ban was a source-text regex over `src/components/**`; composing the read in a
  `src/tokens/` helper slipped past it and the suite stayed green through exactly
  the change the rule existed to catch. The binding guard is now over the rendered
  inline styles of every fixture, plus a source check that nothing _writes_ an
  allowlisted name — RAC stops observing the trigger the moment `--trigger-width`
  is supplied. All three were verified to fail on an injected violation.
  Third instance of the same duplication class in this family: the two picker
  popover builders were byte-identical, like the field row and the envelope before
  them, so the popover and its list now come from the anatomy too.
  _Deliberate no-change:_ the open popover overlays the description below the
  field. RAC anchors it to the trigger (`placement: 'bottom start'`), so it covers
  what is beneath — which is what an overlay is. F-019 mentioned the overlap
  beside the width; only the width was a defect.
- **C4. ✅ The choosable row is one decision; the quiet posture deferred
  (2026-07-28).** Measuring the whole class first is what shaped it: the family
  was already **split down the middle**. `MenuItem`, the `ActionMenu` rows and
  `GridListItem` measured 32px with `inset.control.sm` on the block axis and a
  `hit` floor; `SelectItem`, `ComboBoxItem` and `ListBoxItem` measured **44px**
  with `inset.control.md` and **no floor at all**. So three members were right,
  by hand, and three were 12px taller.
  32px is also exactly what the reference specifies, derived from its own tokens
  rather than eyeballed: a medium menu row is
  `menu-item-top-to-selected-icon-medium` (11px) + `checkmark-icon-size-100`
  (10px) + 11px = **32px desktop**, and 13 + 14 + 13 = **40px mobile** — the same
  `component-height-100` ramp a field's height comes from. An option row _is_ the
  field row's content box: the field adds a 1px border per edge and comes out at
  34px, the row draws none and comes out at 32px, both from one inset and one
  type. So `CHOOSABLE_ROW` + `buildChoosableRowStyle` live in the cross-cutting
  token layer beside `ICON_SLOT_STYLE`, because the five rows span three entities
  and the entity decides a row's _colours_, never its box. Asserted by contract
  invariant **#13**, including that the row and the field read the same inset,
  radius and type size — so changing one has to be a deliberate change to both.
  **The ring came with it, and it was a real defect rather than untidiness.** Four
  offsets were in use across the five rows (the constant's `2px`, `2px` twice as a
  hand-written literal, `-1px`, `-2px`), and measurement settled it: in a scrolled
  `ComboBox` list the focused option sits **0.11px** from the viewport edge, so a
  ring needing `offset + width` px of room outside the box is **clipped** — at
  `+2px` (4px needed) and still at `-1px` (1px needed). Only the negated ring
  width needs none, so `FOCUS_RING_INSET` is derived from
  `vars.focus.ring.width` instead of written as a literal, and the property
  survives a theme that changes the thickness. **C1 had standardised the wrong
  value here:** it replaced `SelectItem`'s `'2px'` literal with the constant,
  fixing the hygiene and preserving a value this measurement shows is wrong for a
  row inside a clipped surface.
  **The quiet posture is deferred, and it is not the owner stop this plan
  predicted.** Slice 3's note was accurate: S2 exposes `isQuiet` on `Picker`
  **only** — not on `TextField`, `NumberField`, `ComboBox`, `Switch` or
  `Checkbox`. Its tokens describe the posture as an inset collapse
  (`field-edge-to-border-quiet`, `-text-quiet`, `-visual-quiet` all `0px`,
  `picker-end-edge-to-disclosure-icon-quiet: 0px`) with the label tightened by
  `-8px` — an edge-to-edge field rather than a box. Deferred on the evidence rule,
  for the fourth time in this plan: no Meridian surface wants it (both Studio
  pickers sit in dialogs, where the boxed field is what makes the target obvious),
  our default already matches S2's default, and the Studio freeze forbids
  inventing a consumer. **Readmission criterion:** a surface where a picker sits
  inside dense content — a table cell, a toolbar — which is also where the boxed
  field starts to read as noise. It _does_ touch the F-024 axis when it arrives
  (a quiet field needs a transparent resting fill, the same "borrow the surface,
  paint nothing" shape, one tree over), so the colour half is the owner's the day
  a consumer exists; there is nothing to decide until then.
  **New gap, filed not fixed (F-034):** every row marks keyboard focus with a
  ring, while the reference marks it with a **background** —
  `menu-item-background-color-keyboard-focus` sits beside `-hover` and `-down`,
  and there is no row ring in its token set. Changing that is the focus
  _language_, and it needs a `focused` background rung the input subtree does not
  have (`resolveInteractiveStyle` resolves `focusVisible` for `border` only).
- **D. `SearchField` + `NumberField`.** Adornment parts and the
  `EMBEDDED_TRIGGER` silhouette, so the measured 20 / 25.33 / 32 px triggers
  become one number; the frame/value split closes the last two #12 violations.
  **C2 found the cause of that spread, so D need not re-derive it:** an embedded
  trigger declares no type of its own, so its glyph is sized by the UA `<button>`
  font-size — `ComboBox`'s chevron button measures `13.3333px` and a 25.33px box
  while the field around it is 16px. `Icon size="text"` is relative, so the glyph
  inherits the mistake. `SearchField` also has **no one-line form at all** (props
  render nothing but the root) — the authoring union A gave `TextField`/`TextArea`
  stops there, which is why the envelope reached only its label in C2.
- **E. `Checkbox` / `CheckboxGroup` / `RadioGroup` / `Switch` / `Slider`.**
  The `validationMessage` part for `Switch` (F-033's remaining half — `Checkbox`
  landed in A2, and `RadioGroup`/`CheckboxGroup`'s envelope landed in C2). **Read
  in `Switch.d.ts` during C2, and it changes the shape of the work:** React Aria's
  `SwitchProps` **omits** `isRequired`, `isInvalid`, `validate` and
  `validationBehavior` outright, so there is no validation state to render — a
  `Switch` cannot be invalid today. What exists instead is a separate
  `SwitchField` root (`SwitchFieldProps`, `SwitchFieldContext`, and an
  `isRequired` on `SwitchRenderProps`), so F-033's Switch half is a question about
  adopting that root, not about adding a part. Also: the
  32 → 34 px row inset, one shared glyph scale (three hard-coded `1.125rem` and
  a Switch track that exceeds S2's extra-large), focus-offset literals → the
  constant, group layout single-sourced, Slider's unread `sizing: hit` claim.
  F-021 packet for the owner.
- **F. The validation language.** Colour + in-control glyph + toned message,
  all from the `invalid` State → ADR-024. Needs the negative ink token F-032
  measured as missing. F-031 (the flat cascade that makes an invalid field go
  dead to hover and press) is governance-sized — options to the owner.
- **G. `FieldGroup` + `Wizard`.** `role="group"` with `aria-labelledby`;
  per-step validation for the multistep flow.
- **H. Field formats.** A `format` registry on the `Icon`-intent pattern:
  named, locale-scoped format data resolving mask + `inputMode` +
  `autoComplete`. Never a `type` prop explosion. The Brazil set (CEP, CPF,
  CNPJ, phone, currency) is the first consumer. Own ADR.
- **I. The Studio's complete form.** A Meridian flow exercising every capability
  end to end — the proving ground and the regression surface.

## 5. Deliberately out of scope, with readmission criteria

- **Array / repeatable fields** — no Studio flow needs them yet.
- **`LabeledValue`** (S2 first-class; the drafts' `ValueText`): read-only,
  Intl-formatted value display. Build when a Meridian detail view pulls it.
- **`FileUploader` / `AttachedFiles`** — we ship `FileTrigger`, the button and
  not the flow. The drafts specify five states; build on demand.
- **`DatePicker`** — RAC has the primitives; no flow needs it yet.
- **Group `orientation`** — no consumer.
- **Not imported from the drafts:** 4 px radius (ours 8 matches S2's
  `corner-radius-medium-default`), the 12/16 px type pair, Atkinson Hyperlegible,
  RadioButton's fused state axes, `NumberOfOptions` (a Figma limitation), and
  HUG roots with no ergonomic floor — our `minHeight: hit` stays.

## 6. Learned from TanStack, without depending on it

- **"Generics are grim"** — infer from runtime values; never make a caller pass
  a generic.
- **"Unified APIs"** — layers are fine, fragmentation is not: the levels in §2
  share one implementation.
- Their **context-performance** note is why B's context is static-only.
- The _shape_ of `withFieldGroup` / `createFieldMap` informs G's remappable
  groups.
- `errorMap` keyed by **when** validation ran (change / blur / submit) is a real
  dimension — noted, not built, no consumer.
- **Not copied:** render-prop-per-field verbosity at the call site (their own
  docs call it verbose), and `React.lazy` for tree-shaking field components,
  which fights ADR-006's unbundle emit and the synchronous treeshake budget.

## 7. Per-item definition of done

Geometry measured both sides and both modes, screenshots attached · findings
decided with written reasons · deliberate no-changes recorded with the same
rigidity as changes · a guard per behavioural finding, a contract invariant when
it is a class · ADR when the decision is architectural · FRICTION append per gap
· story in `docs/fsl-storybook` for anything new or changed · a Studio consumer ·
suites green · coverage held at 100 · treeshake within budget · lint · ROADMAP
entry in the Slice 4 voice.

**Baselines to detect regression:** fsl-ui 2222 tests, fsl-theme 1006, Studio 58;
treeshake 3249 bytes of 16000 — up 37 from C4's `FOCUS_RING_INSET`, which lives in a
module `Button` already imports; `choosableRow.ts` itself shakes out of a
Button-only bundle, verified by its absence from the output.

**Environment (facts, not assumptions):** Node 24 is `/opt/node24/bin`;
Playwright resolves only from the repo root and uses
`executablePath: '/opt/pw-browsers/chromium'`; Storybook `:6007` and Studio
`:5173` both die between sessions and need relaunching. The
`@docs/fsl-storybook` **build** fails on a pre-existing environmental mismatch —
its `storybook-llms-extractor` post-step wants `chrome-headless-shell` version
`-1223` while the container ships `-1194`; verified identical on a clean tree,
and `playwright install` must never be run.
