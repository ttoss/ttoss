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
- **✅ `Checkbox` got the message part** (A2). **`Switch` still needs it** —
  folded into E.
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
- **B2. `labelPosition="side"`.** `labelPosition` + `labelAlign` join the
  context, implemented as a CSS grid with named lines so labels and controls
  align across rows — the Form owns the grid, consumers write no CSS.
- **B3. The error summary + the focus guard.** `FormErrorSummary`, and a test
  pinning the focus-first-invalid behaviour §1 measured as already inherited.
- **B4. `contextualHelp`.** A slot beside the label, in S2's prop shape.
- **C. `Select` + `ComboBox`.** Geometry onto the anatomy; F-009 closed by the
  envelope; F-019 via a named allowlist of RAC-published positioning vars
  (→ ADR-023) so the popover sizes to the frame; the flush focus ring; the
  centred value; option-row height against S2. Closes `combo-box/control` in
  invariant #12.
- **D. `SearchField` + `NumberField`.** Adornment parts and the
  `EMBEDDED_TRIGGER` silhouette, so the measured 20 / 25.33 / 32 px triggers
  become one number; the frame/value split closes the last two #12 violations.
- **E. `Checkbox` / `CheckboxGroup` / `RadioGroup` / `Switch` / `Slider`.**
  `description` and `validationMessage` parts for `Checkbox`/`Switch` (F-033 —
  today a required one turns red and cannot say why); the
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

**Baselines to detect regression:** fsl-ui 2052 tests, fsl-theme 1006, Studio 57;
treeshake 3212 bytes of 16000.

**Environment (facts, not assumptions):** Node 24 is `/opt/node24/bin`;
Playwright resolves only from the repo root and uses
`executablePath: '/opt/pw-browsers/chromium'`; Storybook `:6007` and Studio
`:5173` both die between sessions and need relaunching. The
`@docs/fsl-storybook` **build** fails on a pre-existing environmental mismatch —
its `storybook-llms-extractor` post-step wants `chrome-headless-shell` version
`-1223` while the container ships `-1194`; verified identical on a clean tree,
and `playwright install` must never be run.
