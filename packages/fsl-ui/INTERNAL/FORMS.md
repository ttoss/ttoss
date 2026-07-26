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

## 3. Constraint that shapes everything

A generic `<Field>` wrapper around an arbitrary control **cannot work**. Read in
`react-aria-components@1.19.0`: `LabelContext`, `TextContext` and
`FieldErrorContext` are context-generic consumers, and the field root supplies
them. All three come from `TextField`, `Select`, `ComboBox`, `NumberField`,
`RadioGroup`, `SearchField` and `CheckboxGroup` — nine of our eleven components,
since our `TextArea` uses `RACTextField` as its root. `Slider` supplies
`LabelContext` alone; a single `Checkbox`/`Switch` carries its label as inline
children.

So the envelope is **the RAC root each composite already renders**, plus generic
parts mounted inside it, plus one shared geometry source. That is why one
`FieldLabel` can serve nine components with no a11y risk, and why "one label
over two controls" is a `role="group"` rather than a relabelled field.

## 4. Items, in dependency order

Each item: capability → Studio consumer → guard → docs → measured in browser,
both modes → commit.

- **A. Envelope parts + Level-1 props.** Generic `FieldLabel`,
  `FieldDescription`, `FieldMessage` (tone-aware) and the props↔slots union,
  with `TextField`/`TextArea` as first consumers (already on the anatomy).
  Adds `contextualHelp`, `prefix`, `suffix` in S2's prop shape — arbitrary
  content, not icon-only, which is what covers a `R$` prefix or an avatar.
  _Studio:_ the login form moves to Level-1 props.
- **B. `Form` becomes the layout authority.** Static field-layout context
  (`labelPosition`, `labelAlign`, `necessityIndicator`, `isDisabled`), with
  `labelPosition="side"` implemented as a CSS grid with named lines so labels
  and controls align across rows — the Form owns the grid, consumers write no
  CSS. Guard the inherited focus-first-invalid behaviour. Add
  `FormErrorSummary`. **The context carries static configuration only:** ours is
  plain React context, so per-keystroke state in it would re-render every field
  (TanStack can do that because its context holds static class instances with
  reactive properties — we cannot). A guard pins it. → ADR-025.
  _Studio:_ the invite form gets side labels and required markers.
- **C. `Select` + `ComboBox`.** Geometry onto the anatomy; F-009 closed by the
  envelope; F-019 via a named allowlist of RAC-published positioning vars
  (→ ADR-023) so the popover sizes to the frame; the flush focus ring; the
  centred value; option-row height against S2. Closes `combo-box/control` in
  invariant #12.
- **D. `SearchField` + `NumberField`.** Adornment parts and the
  `EMBEDDED_TRIGGER` silhouette, so the measured 20 / 25.33 / 32 px triggers
  become one number; the frame/value split closes the last two #12 violations.
- **E. `Checkbox` / `CheckboxGroup` / `RadioGroup` / `Switch` / `Slider`.** The
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
