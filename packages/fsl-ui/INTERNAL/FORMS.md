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
- **B2. ✅ `labelPosition="side"` (2026-07-29).** Deferred twice for want of a
  consumer; built when the owner lifted the Studio freeze and named the Studio as
  the consumer. The readmission criterion this file wrote — "a wide, multi-row form
  — a settings or profile page" — is exactly what landed: a **Settings** page
  editing the workspace's own properties.
  The mechanism is the one probed back when it was deferred:
  `grid-template-columns: subgrid`. The Form declares two columns and each field
  root becomes a row that inherits them, so the alignment is the browser's rather
  than a width measured and threaded down — and that sharing is the whole reason
  side labels exist, which is why this is a Form decision and not a field prop.
  Measured in the Studio at 1280px, both modes: **five labels at x=400.97** and
  **four controls at x=806.77 with w=280.27** — one column each, which per-field
  grids cannot do. `alignItems: baseline` rather than `start`, because the control's
  own inset would otherwise drop its value below a top-aligned label and any offset
  to compensate is a number that stops being right when the inset changes — and the
  inset is fluid (F-035).
  **Looking at it caught what the guard had pinned wrong.** The first version
  asserted `gridColumn: ''` for `Checkbox`/`Switch` — reasoned, not observed —
  and the browser showed the result: the checkbox row landed in the **label**
  column and shared a grid line with Save changes, reading as its caption. Their
  _label_ does ignore `labelPosition` (it is the row; there was never a label above
  a control to move), but their _placement_ cannot: the box is the control, so the
  row takes the control column. Fixing it also shrank the label column from 391px
  to ~92px, because `max-content` had been sizing column 1 to the checkbox — so the
  controls went from 280px to 585px. Only measurement shows that.
  **One gap found by building the consumer:** `TextArea` had no way to set `rows`
  in its one-line form — the multiline field's most obvious knob was reachable only
  by composing slots. `FieldAuthoring` now takes a second type parameter for
  props that exist only in the one-line form, so `rows` joins it without losing the
  compile-time exclusivity the union exists for. D and H will want the same channel.
  _Guards:_ ten assertions in `fieldLayout.test.tsx` (the form declares the two
  columns; each of the four field kinds becomes a subgrid row with its label in
  column 1 and its control in column 2; supporting copy and the action row sit
  under the controls; the stacked default declares **no** grid properties at all;
  a field outside any Form still stacks; the context is still static now that it
  carries two keys), plus six on the Studio page. Studio coverage rose to 98.79 /
  90.41 and the threshold moved with it — the two uncovered fallbacks were replaced
  by one tested `formText` helper rather than by tests faking the unreachable.
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
- **B4. ✅ `contextualHelp` (2026-07-29).** S2's prop shape verbatim: every
  envelope root takes `contextualHelp={<ContextualHelp aria-label=…>…}`, and
  the new composite is `PopoverTrigger` + an icon-only `ActionButton` + a
  `Popover` wrapping a bare dialog — the `ActionMenu` recipe, one affordance
  over (one meta on the trigger; the surface keeps Popover's Overlay identity;
  `aria-label` type-required because S2's translated "Help" default needs the
  i18n runtime we refuse, ADR-001). The icon registry grew by exactly one
  intent (`action.help`, mapped to the ⓘ — S2's own default variant; the
  question-mark variant waits for a consumer). **The placement is two
  mechanisms, not a preference:** the trigger renders in an internal
  `labelRow` wrapper (the `Slider` part-name precedent) as a **sibling** of
  the `<label>` — inside it the trigger's words join the field's accessible
  NAME (the A2 measurement) and the label's click-to-focus swallows the
  trigger's click. Without the prop no wrapper enters the tree: the DOM is
  byte-identical to before the slot existed, asserted. The wrapper's gap is
  `gap.inline.sm`, not `xs` — `xs` is contractually visual-only and the
  trigger is an interactive target (spacing.md's own rule). The popover
  content states S2's `contextual-help-minimum-width` (268px) so a sentence
  wraps as a paragraph, not a ribbon. **The class guard caught a real defect
  before it shipped:** rendered inside `NumberField`, RAC's ambient
  `ButtonContext` demands a slot ("increment" or "decrement") from every RAC
  Button in the subtree and threw on the help trigger — `slot={null}` is the
  documented refusal, and only a table driven over every root would have hit
  it. The trigger defaults to `muted` (ambient by definition), carrying
  F-024's ruled caveat in its JSDoc. Measured in Chromium, both modes:
  labelRow 34px with the label centred, trigger 34×34 (≥ 2.5.8's 24px, and
  this one IS a tab stop), resting fill byte-equal to the page surface,
  content at exactly 268px. _Studio consumer:_ Settings' Region field —
  migration consequences are too long for a description line and too rare to
  spend the space permanently, which is the criterion. Guards: the envelope
  class table (every root hosts the slot outside its label; `Switch` asserted
  as the exception — its label is the row) plus the composite's own suite.
  Suites: fsl-ui 2358, Studio 75.
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
- **D. ✅ `SearchField` + `NumberField` (2026-07-29).** The adornment anatomy, the
  `EMBEDDED_TRIGGER` silhouette, and the last two `#12` violations.
  **Measured first, and the premise held exactly:** the three embedded triggers
  came out **32 / 25.33 / 20px**, all three rendering at `13.3333px` inside
  fields that are 16px. Two independent causes, which is why it was three numbers
  and not two — `ComboBox` asked for a font-relative `Icon size="text"` inside a
  `<button>` that declares no type, so its glyph inherited the UA size; and
  `SearchField` had no padding at all. `NumberField` was already right, so
  `EMBEDDED_TRIGGER` states its geometry rather than inventing a fourth number.
  Verified after: **32×32 at 16px** for all four triggers, both modes.
  **The reference validates the primitive rather than just the fix:** it names
  `in-field-button` as its own component with its own layout tokens
  (`in-field-button-edge-to-fill-medium` is `6px` — our `inset.control.sm`), so
  this is a third posture beside command and utility, not a convenience.
  **An accessibility floor decided the size.** Reading `edge-to-fill` as the
  _target_ gives a 20×20 clear button, which fails WCAG 2.5.8 (AA, 24×24) — and
  2.5.8's spacing exception cannot rescue the steppers, which are adjacent. So the
  interactive box is `hit` and the 6px is the glyph's breathing room. Fill and
  target are separate questions; the reference's naming is evidence for the split.
  **F-026 closed, and it was never only a rename:** both components were
  hand-rolling the field chrome. `SearchField` declared its own border, radius,
  motion, cascade and ring, and reserved 48px of inline padding on each side for
  adornments it then positioned absolutely over the value; the anatomy's
  frame/value split deleted all of it, and `NumberField` lost three private
  helpers. `KNOWN_NESTED_PAIRS` is now **empty**.
  **`SearchField` gained the one-line form**, so the family has no member left
  without one, and it moved from group 2 to group 1 of the envelope guard — which
  is exactly what that group's comment warned would silently stop being true.
  **Two defects found by rewriting rather than by looking:** the clear button
  rendered on an empty field (React Aria publishes `data-empty` for CSS; this
  package ships none, while a comment claimed React Aria handled it and a test
  pinned the wrong behaviour by counting two glyphs), and the trailing 48px stayed
  reserved whether or not the button existed. Both fixed; the button is gated on
  the root's `isEmpty` render prop.
  **Guard:** contract invariant **#14**, with both halves injection-verified — the
  equality test catches one component diverging, the value test catches the shared
  source drifting. It also caught itself: gating the clear button removed the
  element it measured, so the fixture had to give the field a value.

- **E. ✅ The selection family (2026-07-29).** Queued as "adopt `SwitchField`?"
  plus a list of geometry drifts, and reading the RAC **source** — not the types
  alone — collapsed the question before any design work: RAC 1.19 marks plain
  `Switch` `@deprecated: Use SwitchField + SwitchButton instead`, and
  `SwitchField` supplies **both** envelope contexts (`TextContext` with the
  description/errorMessage slots, `FieldErrorContext` with the full triple),
  owns `isRequired`/`isInvalid`/`validate`, and reads the Form's
  `validationBehavior` with the `native` default. So the F-033 Switch half was
  not "add a part" but "move onto the root upstream built for this hole" — and
  the new structure (a `<div>` root, the clickable `<label>` row as internal
  `data-part="button"`) is what dodges A2's name-absorption trap by
  construction: the copy is a _sibling_ of the label, so the shared envelope
  parts work as designed (aria-describedby via the slot, platform constraint
  copy from the always-mounted `FieldError`) instead of `Checkbox`'s gated
  re-implementation. The wrapper is gated on `hasSupport || isInvalid` because
  an empty span would still claim the root's flex gap and grow a bare switch.
  The envelope class guard moved `Switch` from group 3 to group 1 — the removal
  its own test name asked for.
  **Geometry: one shared scale, and measurement found a defect nobody listed.**
  `1.125rem` was hand-written in five files (Checkbox, Radio, GridList, Switch
  thumb, Slider thumb); `SELECTION_CONTROL` in the cross-cutting token layer now
  states it once (S2's **large** step, derived: our label text is 16px = S2
  large, whose `checkbox-control-size-large` is exactly 18px). The unlisted
  defect: the indicator glyph was `Icon size="sm"` — a **container-fluid** step
  (`clamp(14px, 0.8cqi + 11px, 20px)`) inside a fixed box, measured rendering
  **20×20 inside its own 18×18 box** at 1280px. F-021's shape one property over.
  Glyph hosts now declare `SELECTION_CONTROL.glyph` (12px — S2's large
  checkmark, `checkmark-icon-size-200`) as `fontSize` with `size="text"`.
  `GridList`'s second copy of the box had also kept the full `control` radius
  that P3 slice 3 halved on `Checkbox` (the reads-as-a-Radio defect, fixed in
  one copy, kept in the other) — single-sourcing `checkboxRadius` retires the
  class. **Switch track 40×24 → 30×18** (S2 large `switch-control-width-large`;
  the old track exceeded S2's extra-large 34×20), with the S2 signature the old
  one lacked: the handle **grows when ON** (10 → 12px), both states centred on
  the track's content box — the old thumb sat 1px low, an offset computed
  against the border box. The track's height IS the shared scale, which is what
  aligns a switch with the checkbox and radio beside it.
  **Slider: the `sizing: hit` claim is now read, and it was a WCAG hole.** The
  thumb was its own 18px visual — a pointer target below 2.5.8's 24×24 AA
  floor, and the spacing exception cannot rescue a range slider's two adjacent
  thumbs. The interactive box now takes `hit` (32px fine / 48px coarse, the
  direction S2's own mobile ramp moves) with the 18px handle inside it as the
  fill — the same target-vs-fill split `EMBEDDED_TRIGGER` records — and the
  ring stays on the visible handle, because a ring around a transparent box
  floats detached. The track reads `hit` too, so the header's token row stopped
  lying. Group layout single-sourced (`SELECTION_GROUP_STYLE`;
  `RadioGroup`/`CheckboxGroup` were byte-identical). Focus-offset literals were
  already gone (R2) — verified, no work.
  **Deliberate no-changes, recorded:** Radio stays 18px against S2's 16 (S2
  draws its radio 2px smaller at every step; one shared scale is the point of
  this item, the distinction carries no semantics for us, and the shape
  disambiguates). The Slider rail stays 6px against S2's 4 (the pill rails of
  `ProgressBar`/`Meter` from Slice 3 — three rails, one internal decision).
  The row inset (selectables 32px vs fields 34px above ~1200px) is **not**
  patched here: S2's own selectable rows are the field row's content box, ours
  already are, and the fluid-inset question underneath is F-035, owner packet.
  **Guard:** contract invariant **#15**, four equality tests + a value half,
  each verified to fail on injection (a diverging component size, the shared
  source drifting, GridList regrowing the full radius, the thumb losing its
  floor). _Studio consumer:_ Settings' "Enforce two-factor authentication"
  Switch, its consequence as a linked description — beside the Checkbox on
  purpose, the two selection shapes in one form. Verified in Chromium at
  1280px, both modes: box 18 / glyph 12 / track 30×18 / handle 10→12 centred at
  56 in both states / slider target 32×32 with rail, handle and target centres
  byte-equal at 88; message ink `rgb(185,28,28)` / `rgb(252,165,165)` —
  byte-identical to item F's family measurement. Suites: fsl-ui 2321, Studio 74.
- **F. ✅ The validation language (2026-07-29).** Two of the three things this
  item was written to build turned out not to need building, and the third was
  one branch. **What shipped:** `buildFieldTextPartStyle`'s `negative` tone now
  reads `input.negative.text.*` instead of the control's readable-value ink,
  reaching all seven field roots and `Checkbox` through the shared envelope;
  `CONTRACT.md` gains §3.2 stating the two token lines an invalid field spans;
  eight guards in `fieldEnvelope.test.tsx`, each verified to fail on injection.
  Measured in the Studio at 1280px, resolved: message `rgb(185,28,28)` light /
  `rgb(252,165,165)` dark, **6.47:1 / 7.97:1** against its surface, both AA;
  control unchanged at 4.83:1 border-on-fill.
  **What was written here and turned out wrong:** "needs the negative ink token
  F-032 measured as missing" — it was not missing (`input.negative.text.default`
  = `red.700`/`red.300`, shipped, unread). And F-031's flat cascade was not
  governance-sized: the owner ruled hover does not apply while invalid, and
  measurement showed focus was never lost — it rides the ring, which the colour
  cascade never touches. F-031 is withdrawn, not deferred.
  **The in-control glyph is not here and is not silently dropped:** it depends
  on the icon slot work, and nothing about it was blocked by the token question
  this item was really about. It moves to H alongside the format registry.
  **New finding, filed rather than folded in:** F-036 — the theme's contrast
  suite pairs text against its own role's background, so the ink-on-page-surface
  pairing this item introduced is measured by hand and guarded by nothing.
- **G. ✅ `FieldGroup` + `Wizard` (2026-07-29).** The audit came first and cut
  the item in half. **The Wizard half was already built and its validation
  half was inherited:** the `Wizard` composite ships steps/summary/navigation
  with a render-prop whose JSDoc had promised "validation gating" — probed in
  jsdom before anything was written, and the composition works with **zero new
  API**: each step's content is its own `Form`, the forward button is a
  submit bound to the _active_ step's form via the HTML `form` attribute
  (`Button` forwards `type`/`form`), and native validation gates `goNext`
  while the step's own fields report the refusal. The deliverable is the B3a
  shape — a guard (two assertions in `Wizard.test.tsx`, invalid-blocks and
  valid-advances-with-rebinding) plus the story and llms.txt documenting the
  composition, because it would vanish silently under a Button that stopped
  forwarding the attributes.
  **The FieldGroup half was the build**, and the ADR-014 duplicate test is
  what needed answering: `Group` already ships `role="group"` +
  `aria-labelledby`, so a second component on the same role had to differ by
  more than paint. It does — `Group` is a labelled _surface_ frame
  (`inset.surface`, `radii.surface`, `title.sm` label: a bordered region of
  content) while `FieldGroup` **is a field** whose control happens to be a
  cluster: Input/root, the envelope's label step via
  `buildFieldTextPartStyle`, the form's stack rhythm, and a subgrid row under
  `labelPosition="side"` exactly like every other field (measured: its label
  shares the column with the fields around it at x=40). The label is a `span`
  wired by `aria-labelledby`, **not** a `<label>` — there is no single
  labelable control to point at — and each inner control keeps its own
  `aria-label`, because the group names the cluster and AT still needs each
  member named. Controls split the row equally (`grid-auto-columns: 1fr`,
  measured 594/594). Validation stays with the inner fields: a group has no
  validation state of its own, per FORMS §3's constraint (RAC's contexts are
  supplied per field root).
  _Studio consumer, both halves at once:_ Billing's **Add payment method**
  wizard — step 1 (card number with a `validate`, the Expiry `FieldGroup` as
  the month/year pair §2 named) gates step 2 (billing address) through native
  validation; saving writes the card's last4 to the store and the Billing
  page shows "Card ending 4242". Verified in Chromium both modes: the blocked
  step shows the field's own message plus the platform copy on both Selects,
  the pair splits the row equally, and the flow completes. Suites: fsl-ui
  2387, Studio 83 (coverage threshold moved up to 98.9/90.5).
- **H. ✅ Field formats, and the in-control validation glyph (2026-07-29,
  ADR-026).** The registry shipped as written: `format="br.cep"` on `TextField`
  resolves mask + `inputMode` + `autoComplete` from one name, on the
  `Icon`-intent pattern (`{locale}.{format}`, a `FieldFormat` union that fails
  the typecheck on an unknown name). The Brazil set is **four**, not the five
  §4 listed: CEP, CPF, CNPJ, phone (multi-pattern — the mask switches at the
  11th digit). **Currency was cut from the registry on inspection**, not
  deferred: grouping separators move as digits are typed, which digit-slot
  masking cannot express and `Intl.NumberFormat` already owns —
  `NumberField formatOptions={{ style: 'currency' }}` is the shipped answer,
  and the ADR names it so the gap is not refiled. Checksum validation (CPF's
  check digits) stays with the caller's `validate` because a validate message
  is user-facing copy the package cannot ship (ADR-001). The masked value is
  the submitted value — what the user sees is what `FormData` carries — and
  the caret restores by digit count, so typing into the middle of a masked
  value does not throw the cursor to the end. Backspace over a literal deletes
  the digit before it, because deleting a hyphen the user never typed and
  watching it come back is the classic mask defect.
  **The glyph forced the split conversion, and the conversion surfaced a
  latent drift.** `TextField`/`TextArea` were self-painted, so an in-box
  adornment had nowhere to sit; both moved to the frame + borderless-value
  shape the other split members already had, verified **byte-identical** in
  Chromium before/after (frame 34px/1px border/8px radius, value at the same
  reading edge, both modes). Converting exposed that the split members'
  value ink had silently stopped reading `text.invalid` — `buildFieldValueStyle`
  is now flag-aware, the same cascade the self-painted shape already had.
  `FieldInvalidGlyph` is a field-level primitive in the envelope: `status.alert`
  intent in the shared icon slot, `input.negative.text` ink (reporting valence,
  Lexicon §10.15/§3.2 — the same line the message reads), `aria-hidden` because
  the message already tells AT, at `inset.control.md` from the field edge (12px
  — S2's `field-edge-to-alert-icon`, and it lands on our own token exactly).
  All six **boxed** members carry it (`text-field`, `text-area`, `select`,
  `combo-box`, `number-field`, `search-field`); the boxless three
  (`radio-group`, `checkbox-group`, `switch`) are named exceptions in the class
  guard — no box, no in-box glyph. Measured in Chromium both modes: glyph
  20×20 at 13px from the edge (12 inset + 1 border), ink `rgb(185,28,28)` /
  `rgb(252,165,165)` — byte-identical to item F's message measurement, WCAG
  1.4.1 reinforcement closed as F promised.
  _Guards:_ 15 format tests (registry data, paste, overflow, phone mask
  switch, backspace-over-literal, caret, masked `FormData`, attrs, controlled
  value, caller `validate`) + the glyph class guard in `fieldEnvelope.test.tsx`
  (every boxed member marks while invalid, carries none while valid),
  injection-verified. Contract invariants #10/#11 re-baselined for the split
  move. _Studio consumer:_ Billing's payment wizard address step collects CEP
  and CNPJ through the registry — the Brazilian-entity invoicing fields §2
  motivated. Suites: fsl-ui 2425, Studio 83.
- **I. ✅ The Studio's complete form (2026-07-29).** Not a kitchen sink on one
  page: the audit came first and mapped every capability to its Studio
  consumer, and what the queue's eight items had left unconsumed was exactly
  seven things — `RadioGroup`, `CheckboxGroup`, `NumberField`, `Slider`,
  `SearchField`, and the two §1 inherited claims nothing had exercised:
  `FormSubmit isPending` and `Form validationErrors`. **What shipped is the
  Environments flow**: a new Meridian route whose list is filtered by a
  `SearchField` (a filter, which is what a search field _is_ — not a form
  value) and whose **New environment** form is the complete form — name
  (TextField, `validate`), type (required RadioGroup with `contextualHelp`),
  branch, instances (NumberField, 1–16), scale-up CPU (Slider, percent
  `formatOptions`, the one control with no native form participation —
  component state by design), notifications (CheckboxGroup) — submitted
  **async** against the fictional backend, with the pending window on the
  button and a duplicate name refused by the **server** and routed to the
  field by `name`.
  **The first consumer found a defect two items of JSDoc had promised away
  (F-037):** `FormSubmit` hand-wrote `data-pending`/`data-composition` and
  converted pending into `disabled` — the DOM carried neither attribute
  (React Aria clobbers both after the passthrough spread) and the disable
  dropped keyboard focus mid-submit. The fix subtracted code: RAC Button's
  native `isPending` does the whole job strictly better — `aria-disabled`
  (stays focusable), press blocked, `type` rides as `button` while pending
  (no implicit re-submission through it), AT announced, `data-pending`
  emitted. Measured while writing the guard: the form's own implicit
  submission (Enter in a lone text input) still fires on the `<form>`, out
  of any button's reach — so the host that owns the lifecycle re-entry-guards
  its handler, and the Studio's does, with a test dispatching a raw submit
  during the pending window. Also read at the source rather than assumed:
  server errors clear on **commit** (blur), not per keystroke —
  `useFormValidationState`'s `commitValidation` is what clears them.
  _Guards:_ `formValidationBehaviour.test.tsx` gains the first
  `isPending` and `validationErrors` assertions (pending
  marks/names/stays-focusable; press blocked; server error routed by `name`,
  withdrawn on commit); two Form stories (PendingSubmit, ServerErrors);
  llms.txt states both capabilities. _Verified in Chromium both modes:_
  filter narrows and clears, pending probe
  `{data-pending: true, aria-disabled: true, disabled: false, type: button}`,
  the server refusal renders the full item-F/H language on the name field
  (border + message + glyph `rgb(185,28,28)`), slider steps 70%→65% by
  keyboard, and the created row reads
  `preview-eu · preview · main · 3 · Failed, Rolled back`. Suites: fsl-ui
  2428, Studio 100 (coverage threshold up to 99.1/92.5/99).
  **The map, for the record — where each capability lives in the Studio:**
  one-line authoring everywhere · composed slots (Team invite) · side labels
  - `Switch` envelope + `contextualHelp` (Settings) · wizard per-step
    validation + `FieldGroup` + formats (Billing) · confirm `Checkbox` (Team)
    · first-invalid focus (Login) · selection family, steppers, slider,
    search, groups, async submit, server errors (Environments). Every field
    kind and every form capability now stands in a real flow.

## 4b. The round before D — everything open, sorted by what unblocks it

Written 2026-07-28 after C closed, at the owner's request: one pass over
everything this queue deferred or newly found, so the remainder is decided before
item D starts rather than during it.

**The sort is the point.** These are not one backlog. Three rows need nothing but
work; several need a _consumer_ and building them without one is the reserved API
§2.3 forbids and this plan has already refused four times; the rest need a
decision only the owner can make about the colour and type model. Presenting them
flat would invite exactly the build the discipline exists to prevent.

### R — actionable now: no consumer, no decision, real defects

- **R1. ✅ The field row's height is fluid, and the docs stated it as a fixed 34px.**
  Measured in Chromium at 390 / 900 / 1280 / 1920:
  `--tt-spacing-inset-control-sm` is `calc(1 * clamp(4px, 0.25cqi + 3px, 6px))`,
  so it resolves **4px / 5.25px / 6px / 6px**, while `--tt-sizing-hit` is
  `clamp(32px, 2rem, 36px)` and resolves **32px throughout** — rem-anchored,
  exactly as ADR-019 ruled. The row therefore measures **32 / 32.5 / 34 / 34**.
  Every "34px = the field row" claim is true only above ~1200px: `llms.txt`'s
  Action entry, `CONTRACT.md` §5's choosable-row paragraph, ADR-021's
  re-litigation answer, the ROADMAP's Slice 4 ② entry. The same paragraph's
  "the row is the field minus its border" holds only where content clears the
  floor — at 390 both bottom out at 32 and the difference is 0. _Fix:_ state the
  ramp wherever the number is claimed, and say which part of it is invariant (the
  floor and the tokens) versus derived (the pixel height). This surfaced twice
  during C4 as a suspected regression that had to be re-measured to dismiss, which
  is the cost of a number written as if fixed.
  _Second half, not actionable here:_ whether the control **inset** should be
  container-fluid at all. ADR-019 ruled control _geometry_ non-fluid and the inset
  escaped the ruling, which is F-021's shape one property over → filed as **F-035**
  and packaged with the owner set below.
- **R2. ✅ `outlineOffset` literals: nine left, and they are how C4's four-way split
  happened.** `Switch`, `Toast`, `RadioGroup`, `Checkbox` write `'2px'`;
  `Disclosure`, `Accordion` and `Table` (×3) write `'-2px'`. Each duplicates one of
  the two constants — and `'-2px'` only equals `FOCUS_RING_INSET` while the theme's
  ring width is 2px, so it is a literal that happens to match rather than one that
  tracks. _Fix:_ replace all nine (zero visual delta, both constants resolve to the
  same values today) and add the class guard the `--fsl-` namespace already has:
  **no component source may write an `outlineOffset` literal**, so the next one
  cannot enter. Without that guard this list regrows, which is the whole history of
  the two constants.
- **R3. ✅ F-030 — `menu/root` addressed the popover _and_ every row.** Guarded by
  invariant #12 as a named violation since Slice 5 ⓠ. It is resolvable **without a
  taxonomy change**: `MenuItem` is `Action`/`root`, and `control` is already legal
  on Action, so moving its structure to `control` both removes the collision and
  states the truth ADR-022 settled — `control` names the element the user operates,
  and a menu row is exactly that. _Named cost:_ it changes a published attribute
  for menu rows (`menu/root` → `menu/control`), which is a real break; unlike the
  break item A refused, the attribute being replaced is the _ambiguous_ one, and
  invariant #12's anti-stale companion will force the entry out of the list the
  moment it is fixed. _Alternative:_ admit `item` to `ENTITY_STRUCTURE.Action`,
  which grows the vocabulary for one component and is the weaker answer.
- **R4. ✅ A doc correction of my own.** The C2 ROADMAP entry cited **F-027** for
  "Storybook does not follow `prefers-color-scheme`". F-027 is the theme's
  border-contrast inventory auditing only the light bundle — a different fact.
  _Fix:_ drop the citation and record the harness fact where the other harness
  facts live (§7's environment note): Storybook's preview reads the theme's own
  root attribute, so `colorScheme` on a Playwright context is **not** enough to
  measure the dark bundle; set `data-tt-mode` explicitly. Every dark measurement in
  C2's first pass was taken before this was understood and had to be retaken.
- **R5. ✅ The FRICTION index count was self-matching.** Line 17 told a reader to
  regenerate the count by grepping `Status:** open` — and that instruction line
  matches its own grep, so the count is always one high. It has been wrong twice
  in this queue for that reason (there are **19** open entries, not twenty).
  _Fix:_ count `### F-` headers whose entry is open, or word the instruction so it
  does not match itself.

**Round R landed 2026-07-28.** All five in one commit, with no behaviour change
outside R3's published attribute. Three things the round itself produced:

- The `-2px` insets turned out to have **three** distinct mechanisms behind them,
  not one, and each was measured rather than assumed: _scrolling_ (a `ComboBox`
  option 0.11px from a scrolled viewport edge), _clipped_ (`Accordion` and
  `Disclosure` set `overflow: hidden` on their root), and _flush_ (a `Table` row
  sits 1px from a table edge with a 12px radius and `overflow: visible`, so a
  floated ring would be drawn over the border and outside the corner).
  `FOCUS_RING_INSET`'s doc names all three, because "clipped or scrolling" — what
  it said after C4 — would have been wrong for the Table.
- **R3 cost nothing in the taxonomy and its two test consumers survived
  untouched**, because both query the _popover_. That is the check that made the
  break safe to take: the only readers of `menu/root` wanted the element that
  keeps it.
- The offset guard is the durable half of R2. The nine literals were
  byte-identical to the constants, verified in the browser at every site — which
  is precisely why nothing had caught them: a literal that happens to match is
  indistinguishable from one that tracks until the theme changes the ring's
  thickness, and only the derived one follows.

### C — deferred: the fix is a consumer, not code. Do not build these in the round

Each already carries a verified mechanism, so the future work is cheap; what none
of them has is a surface that wants it. Building any of them now produces reserved
API, which §2.3 forbids and B1 refused twice inside its own item.

| Item                              | Readmission criterion                                                                                                                                                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~**B2** `labelPosition="side"`~~ | ✅ **Built 2026-07-29** — the owner lifted the Studio freeze and named the Studio as the consumer, and the criterion was met exactly: a Settings page.                                                                                                                                            |
| **B3b** `FormErrorSummary`        | A form tall enough that the first invalid field can scroll off-screen. Data reachable (`onInvalid` fires per field with the control as target); appearance blocked on the same F-024/F-029 axis.                                                                                                  |
| **C4's quiet field posture**      | A picker inside dense content — a table cell, a toolbar — which is also where a boxed field starts to read as noise. S2 exposes `isQuiet` on `Picker` only; its tokens make the posture an inset collapse (`field-edge-to-*-quiet: 0px`, label tightened `-8px`). The colour half lands on F-024. |

### O — what the design docs already decided, and what is genuinely left

**Rewritten 2026-07-29, and the rewrite is the lesson.** This section listed eight
FRICTION ids as eight owner decisions. Reading `docs/website/docs/design` and the
theme showed that was wrong on two counts: the eight collapse into **three**
questions about the model, and **two of the three were already answered in
writing** — with the tokens already shipped. One entry (F-032) had been filed
claiming a token was missing that exists. The reading rule that failure earned is
binding in the ROADMAP under "Before deciding anything".

| Question                                                                      | Status after reading the authorities                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Can a component paint nothing?** (F-024, F-029, the quiet field posture) | **✅ Ruled 2026-07-29 — no, a component always paints.** The owner closed it against this row's earlier recommendation: `colors.md` is followed to the letter — no `transparent` primitive **and no omitted background**; every semantic background stays a declared, auditable value and the contrast pairs stay in the suite. Cost accepted and named in F-024: the quiet rung mismatches a raised dark surface (`#161616` on `#262626`), and the lawful future fix inside the ruling is a stratum-aware **opaque** value (after F-027's dark audit), on evidence. Consequences: F-029's missing "negative ink on a surface" rung, when a consumer demands it, is an opaque rung; C4's deferred quiet field takes an opaque resting fill when its consumer arrives, not a transparent one.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **2. Is `invalid` a colour or a valence?** (F-031, F-032, F-034)              | **✅ Closed 2026-07-29 — and the row that stood here got the answer half wrong, which is worth keeping.** It read `colors.md` → "Picking a role" (_"valence dominates emphasis … if the token communicates outcome or **validity**"_) and concluded that "our `invalid`-state-on-`input.primary` is the deviation" — i.e. that the **control** should switch role. The Lexicon forbids exactly that: §10.15 calls re-voicing a control for a runtime outcome a category mistake, and §7's State table says `invalid` is "never an authorial valence choice". `model.md` §11 puts the Lexicon above the family doc, and `colors.md`'s rule is scoped to _a token that communicates validity_ — which the message's ink is and the control's chrome is not. **It is both: a State on the control, a valence on the part that reports it**, and the theme had already written that in a comment beside the token. The owner ruling (hover does not apply while invalid) removed the last thing that looked like it needed a mechanism; measurement removed the other (focus rides the ring, not the border). Shipped: one branch in `buildFieldTextPartStyle`, `CONTRACT.md` §3.2, eight guards, contrast measured in both modes. |
| **3. Fixed ramp or `cqi`?** (F-021, F-035)                                    | **✅ Ruled 2026-07-29 (owner) — both halves, opposite directions, one ADR (fsl-theme ADR-022).** The **inset** is outcome-bearing: `inset.control.{sm\|md\|lg}` is now a fixed-px contract (`6px`/`12px`/`24px`, the engine's own desktop values), validated by spacing Error #17 and registered in model.md §8 — measured 32/34/34/34 at 390–1920 — the mid-range drift F-035 measured is gone (900px read 32.5, reads 34 now) and the 390px step is the fluid type meeting the `hit` floor, which closes F-035 and makes ADR-019/020's ruling true by mechanism (its "never binds" premise had been measured false). A bounded band was rejected with arithmetic: the unit tops out only at cqi ≥ 1200, so any band containing its range preserves the 900px drift. The **type** stays fluid: that is the system's own identity (`typography.md`), S2 is reference not authority — F-021 closes as working-as-designed with readmission on measured illegibility or a coarse-pointer consumer.                                                                                                                                                                                                                               |

**Not a decision — a prerequisite.** F-027: the border-contrast inventory audits
the light bundle only (~90 undecided dark contexts). Whichever of the above lands,
it lands unverified in dark until that audit exists.

### Q — the queue, unchanged

~~**B4** `contextualHelp`~~ (**done 2026-07-29**) · ~~**D** `SearchField` +
`NumberField`~~ (**done 2026-07-29**) · ~~**E** the selection family~~ (**done
2026-07-29**) · ~~**G** `FieldGroup` + `Wizard`~~ (**done 2026-07-29**) ·
~~**H** field formats~~ (**done 2026-07-29**) · ~~**I** the Studio's complete
form~~ (**done 2026-07-29**). **The queue is complete.**

**F came in far smaller than this plan sized it**, and the reason is the lesson
rather than the schedule. It was queued as a token-model change — switch the field
family's role, add missing `background` rungs, verify new pairings in both modes.
Reading the Lexicon first collapsed it to a single branch in one function plus
docs and guards: the control was already correct and deliberately so, the ink the
message needed already shipped, and the cascade already ordered `invalid` above
`hover`. Two of the three things F was going to build did not need building. What
it did surface is genuinely new — F-036, that the contrast suite cannot see a
cross-role pairing — which is the sort of thing only shipping the change finds.
Item **E** confirmed the finding this queue handed it — and sharpened it: plain
`SwitchProps` omits validation because plain `Switch` is **deprecated**, and the
`SwitchField` root it pointed to carried everything the envelope needs. Both
findings handed to **D** — the embedded trigger's UA font-size and `SearchField`
having no one-line form — were confirmed by measurement and closed with it.

### N — decided no-changes from this queue, not to be reopened

Recorded with the same rigidity as the changes, per §7.

- **The picker popover overlays the description below the field** (ADR-023). React
  Aria anchors it to the trigger, so it covers what is beneath — which is what an
  overlay is, and what both reference implementations do.
- **`Checkbox` does not use the shared envelope parts** (C2). Its root _is_ a
  `<label>`, so copy placed inside is absorbed into the accessible name — measured
  in A2. It shares what it can: the text-part style and the necessity marker.
- **`Menu` and `Popover` do not take their trigger's width** (ADR-023). A menu
  shows things to do, not a field's value space; both authorities exclude it.
- **A `Select` trigger's accessible name is value-then-label** ("Choose a role
  Role"). React Aria's own `aria-labelledby` order; announcing the value and then
  what it names is correct, and the name excludes the necessity marker as intended.
  Consequence worth knowing rather than fixing: a name query must not be exact.

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

**Baselines to detect regression:** fsl-ui 2321 tests, fsl-theme 1006, Studio 74;
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

**Storybook does not follow `prefers-color-scheme`.** Its preview reads the
theme's own root attribute, so a Playwright context's `colorScheme` is not enough
to measure the dark bundle — set `data-tt-mode` on `document.documentElement`
explicitly, and the same applies to the Studio, which owns its mode through a
toggle. Every "verified in both modes" claim taken with `colorScheme` alone
measured the light bundle twice; C2's first pass did exactly that and was retaken.
This is a harness fact and **not** F-027, which is the theme's border-contrast
inventory auditing only the light bundle — a different thing that the C2 entry
originally cited here by mistake.
