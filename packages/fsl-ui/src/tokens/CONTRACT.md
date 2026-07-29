# Token Contract

> **Purpose**: Given an Entity, this document tells you exactly which `vars.*` paths to use,
> how to construct the full token path, and how to wire state and evaluation.
>
> This is the Layer 2 boundary artifact.
> For token family semantics (rules, valid values, responsive behaviour):
> see `@ttoss/fsl-theme` `Types.ts` and `/docs/design/design-system/design-tokens/`.

```typescript
import { vars } from '@ttoss/fsl-theme/vars';
import type { ComponentMeta, EvaluationsFor } from '@ttoss/fsl-ui/semantics';
```

---

## §0 — Component Implementation Pattern

Every component follows these four steps in order.

### Step 1 — Declare semantic identity (Layer 1)

```typescript
import type { ComponentMeta } from '../../semantics';

export const fooMeta = {
  displayName: 'Foo',
  entity: 'Action', // Entity from taxonomy.ts — drives everything below
  structure: 'root', // StructuresFor<'Action'>
} as const satisfies ComponentMeta<'Action'>;
```

`entity` is the key: it determines which row of §1 to read.

### Step 2 — Derive valid evaluations (Layer 1 → type system)

```typescript
import type { EvaluationsFor } from '../../semantics';

// Type is derived — no manual union to maintain.
// Source of truth: ENTITY_EVALUATION in taxonomy.ts.
type FooEvaluation = EvaluationsFor<(typeof fooMeta)['entity']>;
// → 'primary' | 'secondary' | 'accent' | 'muted' | 'negative'
```

`evaluation` and `consequence` are orthogonal: `consequence: 'destructive'`
(FSL §6) drives the interaction _mechanism_ (e.g. ConfirmationDialog arming);
`evaluation: 'negative'` drives the adverse _color voice_. A destructive
action typically pairs both, but neither implies the other — see §6 and
ENTITY_CONSEQUENCE in `taxonomy.ts`.

### Step 3 — Read token paths from §1

Look up `fooMeta.entity` in the Entity → Token Map (§1).  
Each column gives you the `vars.*` subtree. Use §2 to construct the exact path.

### Step 4 — Wire state and colors (§3)

Apply the State Priority Rule (§3) to resolve which color token to use for
the current combination of React Aria state booleans.

---

## §1 — Entity → Token Map

A component MUST use ONLY tokens from its Entity row.

| Entity         | Colors          | Radii                      | Border                        | Sizing | Spacing         | Typography               | Motion       | Elevation        |
| -------------- | --------------- | -------------------------- | ----------------------------- | ------ | --------------- | ------------------------ | ------------ | ---------------- |
| **Action**     | `action`        | `action`                   | `outline.control`             | `hit`  | `inset.control` | `action`                 | `feedback`   | `flat`           |
| **Input**      | `input`         | `control`                  | `outline.control`             | `hit`  | `inset.control` | `label`                  | `feedback`   | `flat`           |
| **Selection**  | `input`         | `control`                  | `outline.control`, `selected` | `hit`  | `inset.control` | `label`                  | `feedback`   | `flat`           |
| **Navigation** | `navigation`    | `control`                  | `outline.control`             | `hit`  | `inset.control` | `label`                  | `feedback`   | `flat`           |
| **Disclosure** | `navigation`    | `control`                  | `outline.control`             | `hit`  | `inset.control` | `label`                  | `transition` | `flat`           |
| **Overlay**    | `informational` | `surface`                  | `outline.surface`             | —      | `inset.surface` | `title`, `body`, `label` | `transition` | `overlay`        |
| **Feedback**   | `feedback`      | `surface`, `round` (rails) | `outline.surface`             | —      | `inset.surface` | `body`, `label`          | `feedback`   | `raised`         |
| **Collection** | `informational` | `surface`                  | `outline.surface`, `divider`  | —      | `inset.surface` | `body`, `label`          | —            | `flat`, `raised` |
| **Structure**  | `informational` | `surface`                  | `outline.surface`, `divider`  | —      | `inset.surface` | `title`, `body`, `label` | —            | `flat`, `raised` |

**Cross-cutting** (apply to ALL interactive entities — not in the table because they are entity-agnostic):

| Token family     | Path                                          |
| ---------------- | --------------------------------------------- | ------ | ------- | -------- | ----------- |
| Focus ring       | `vars.focus.ring.width` / `.style` / `.color` |
| Disabled opacity | `vars.opacity.disabled`                       |
| Scrim opacity    | `vars.opacity.scrim`                          |
| Scrim color      | `vars.overlay.scrim`                          |
| Z-Index          | `vars.zIndex.layer.{base                      | sticky | overlay | blocking | transient}` |

### §1.1 — Mapping Rationale

The Entity → Token Map above groups 9 entities into 5 UX color contexts.
The grouping criterion is a single discriminant question:

> **"What is the user's primary cognitive mode when interacting with this entity?"**

| Cognitive Mode                                                             | UX Context      | Entities                       | Why they share tokens                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------- | --------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Deciding** — evaluating consequences before triggering an effect         | `action`        | Action                         | The user weighs risk/reward before committing. Visual identity must signal _actionability_ and _consequence weight_.                                                                                                                                                                                       |
| **Providing** — supplying or selecting data for the system                 | `input`         | Input, Selection               | Both involve data provision. Selection is constrained input — the user picks from a set rather than entering freeform, but the cognitive task is the same: "give the system a value."                                                                                                                      |
| **Orienting** — navigating across or revealing within an information space | `navigation`    | Navigation, Disclosure         | Navigation moves the user across destinations; Disclosure reveals structure in place. Both answer "where am I / what's here?" — spatial and structural orientation share the same visual language.                                                                                                         |
| **Receiving** — consuming a system-initiated status or outcome message     | `feedback`      | Feedback                       | The user is the audience, not the initiator. Tokens must communicate valence (positive/caution/negative) without implying interactivity.                                                                                                                                                                   |
| **Reading** — consuming organized, persistent content                      | `informational` | Overlay, Collection, Structure | All are content-carrying surfaces. Overlay is temporary content elevated above the page, Collection is a grouped set of items, Structure is the organizational frame. They share surface-level visual treatment because their tokens serve the _content they carry_, not the container's interaction mode. |

**How to use this table when adding a new entity or component:**

1. Ask: "What is the user's primary cognitive mode?"
2. Find the matching row → that is the UX context → that is the `Colors` column for §1.
3. The remaining columns (Radii, Border, Sizing, etc.) follow from the **surface type**: interactive entities use `control` tokens, content-carrying entities use `surface` tokens.

**Legal vs required.** The §1 row is the **legal** set of token families a component MAY consume — not a list it MUST consume. A frame-only `Structure` (e.g. `Form`, `Wizard`) that composes children without painting a surface lawfully reads zero tokens from `vars.colors.informational.*` and only consumes `spacing` / `typography`. Reading **outside** the row remains forbidden; reading a **subset** of it is normal.

**Stacking inside `informational`.** When two `informational` surfaces overlap (Card inside Dialog, Dialog over page, …) they may resolve to the same `background` colour. Differentiation is paid in `elevation` first, `border` second, never in colour. See [colors.md → Stacking informational surfaces](/docs/design/design-system/design-tokens/colors#stacking-informational-surfaces) for the operational rule.

**Collection containers with Selection items (per-part entity split).** A selectable list composite (`ListBox`, `GridList`, `Table`) is allowed to declare **two entities across its parts**: the container root is `Collection` (an `informational` surface — the frame that carries the items) while each selectable item is `Selection` (`input` chrome, `selected` State). The item's selection chrome is therefore identical to `Select`/`Checkbox`/`RadioGroup` (`vars.colors.input.*`), and the container reads `vars.colors.informational.*`. This is intentional and enforced-compatible: the entity→ux-context contract test unions the contexts of all entities declared in a file, so both reads are legal. See ADR-007 for the rationale. `Table` extends the split with two Collection parts: `TableColumn` is the `title` structural role (columnheader; sortable columns render the `action.sortAscending`/`action.sortDescending` Icon intents) and `TableCell` is `content` — the ROADMAP B2 mapping, no taxonomy addition needed.

**Surface type rule** (derives all non-color columns):

| Surface type                             | Radii     | Border            | Sizing | Spacing         | Elevation                                    |
| ---------------------------------------- | --------- | ----------------- | ------ | --------------- | -------------------------------------------- |
| `control` — user operates this directly  | `control` | `outline.control` | `hit`  | `inset.control` | `flat`                                       |
| `surface` — carries content for the user | `surface` | `outline.surface` | —      | `inset.surface` | per entity (flat, raised, overlay, blocking) |

This means the full §1 row for any entity is determined by two decisions:

1. **Cognitive mode** → Colors column
2. **Surface type** → all other columns (except Typography, Motion, and Elevation which have entity-specific assignments)

---

## §2 — vars Path Formulas

Given the column value from §1, here is the exact path formula for each family.

### Colors

```
vars.colors.{Colors}[evaluation][dimension][state]
```

- `{Colors}` — the value from the Colors column (e.g. `action`, `navigation`)
- `evaluation` — `EvaluationsFor<E>` from `taxonomy.ts` → `ENTITY_EVALUATION[entity]`
- `dimension` — `background` | `border` | `text`
- `state` — one of the names listed in `STATES` (e.g. `default`, `hover`, `focused`, `disabled`, `pressed`, `selected`, `invalid`); resolved at runtime by React Aria render props, not authorially declared.

Example:

```typescript
const c = vars.colors.action[evaluation]; // evaluation = 'primary'
c.background.default; // → var(--tt-colors-action-primary-background-default)
c.border.focused; // → var(--tt-colors-action-primary-border-focused)
c.text.disabled; // → var(--tt-colors-action-primary-text-disabled)
```

Not every dimension/state combination is defined in every theme — optional chaining (`?.`) is required.

### Radii

```
vars.radii.{Radii}
```

Example: `vars.radii.control`

### Border

```
vars.border.{Border}.width
vars.border.{Border}.style
```

Example: `vars.border.outline.control.width`, `vars.border.outline.control.style`

### Sizing (interactive entities)

```
vars.sizing.hit.{step}
```

Standard step for all interactive components: **`base`**.  
`min` and `prominent` are reserved for components with a distinct semantic identity (e.g. compact toolbar action, prominent CTA).  
Hit targets are ergonomic minimums — CSS automatically responds to `@media (any-pointer: coarse)`.

### Spacing

```
vars.spacing.inset.{Spacing}.{step}
```

Standard step: **`md`**.

Example: `vars.spacing.inset.control.md`

### Typography

```
vars.text.{Typography}.{step}
```

Standard step: **`md`**. Spread the whole object: `...(vars.text.label.md as React.CSSProperties)`.

### Motion — `feedback`

```
vars.motion.feedback.duration
vars.motion.feedback.easing
```

Apply to `transitionDuration` + `transitionTimingFunction`. Always declare `transitionProperty` explicitly.

### Motion — `transition`

```
vars.motion.transition.enter.duration / .easing
vars.motion.transition.exit.duration  / .easing
```

### Elevation

```
vars.elevation.surface.{Elevation}
```

Example: `vars.elevation.surface.flat`, `vars.elevation.surface.overlay`

---

## §3 — State Priority Rule

When wiring state-dependent colors, evaluate conditions in the canonical
order defined by `STATE_PRIORITY` in
[`src/semantics/taxonomy.ts`](../semantics/taxonomy.ts). Highest priority
first:

```
disabled > invalid > expanded > indeterminate > selected
        > focusVisible > pressed > hovered > default
```

`STATE_PRIORITY` is the single source of truth for this cascade. Do **not**
duplicate the order in component code — use `resolveInteractiveStyle` (§3.1).
The tuple also binds each React Aria flag to the token-state key it selects
(e.g. `isSelected → checked`, `isPressed → active`, `isHovered → hover`).

Template (React Aria pattern, background / border / text dimensions):

```typescript
style={({ isHovered, isPressed, isDisabled, isFocusVisible }) => ({
  backgroundColor: resolveInteractiveStyle(c?.background, { isHovered, isPressed, isDisabled }),
  borderColor:     resolveInteractiveStyle(c?.border,     { isDisabled, isFocusVisible }),
  color:           resolveInteractiveStyle(c?.text,       { isHovered, isPressed, isDisabled })
                 ?? c?.text?.default,

  // Focus ring — always via outline, never via border (avoids layout shift).
  // Applied through the single-source helper, same rule as the state cascade.
  outline: focusRingOutline(isFocusVisible),
})}
```

The focus ring is applied via `focusRingOutline` (`src/tokens/focusRing.ts`) —
the single source of truth for the `vars.focus.ring.*` outline, mirroring how
`resolveInteractiveStyle` centralises the state cascade. Do **not** inline the
`vars.focus.ring.*` ternary in component code.

### §3.1 — `resolveInteractiveStyle` helper

Interactive components MUST use `resolveInteractiveStyle` (in `src/tokens/`)
to apply the `STATE_PRIORITY` cascade **per color dimension**. The helper
iterates the tuple — no component re-implements the ternary chain.

Pass only the flags the dimension respects — e.g. `background` usually
ignores `isFocusVisible`, `border` usually ignores `isHovered` /
`isPressed`. Omitted flags short-circuit that level of the cascade.

Structural tokens (`radii`, `border.*.width/style`, `sizing`, `spacing`,
`typography`, `motion`) are read as literals from `vars.*` following the
component's entity row in §1. They are intentionally **not** abstracted into
a helper: the literal read is the contract's grep-able audit trail.

```typescript
backgroundColor: resolveInteractiveStyle(c?.background, { isHovered, isPressed, isDisabled }),
borderColor:     resolveInteractiveStyle(c?.border,     { isDisabled, isFocusVisible }),
color:           resolveInteractiveStyle(c?.text,       { isHovered, isPressed, isDisabled })
               ?? c?.text?.default,
```

### §3.2 — Validation: the one part that reads another role

`invalid` is a State, `negative` is an Evaluation, and FSL Lexicon §10.15 keeps
them apart in a way that splits a failed field across **two token lines**:

- **The control** keeps the role it was authored with and flips that role's
  `invalid` State. A `muted` field that fails validation is still `muted`.
  Re-voicing it (`evaluation: 'negative'`) is the category mistake §10.15 names —
  state lives in the user's data, evaluation lives in the author's pen.
- **The `validationMessage`** is the adjacent display part _reporting_ the
  outcome, so it lawfully carries the valence and reads
  `input.negative.text.*` — regardless of the control's role. It is the only
  part in the family that reads a role other than its component's, which is
  why it goes through `buildFieldTextPartStyle`'s `tone` rather than being
  hand-written per component.

The theme states the same split from its side: `input.primary.text.invalid` is
the control's ordinary reading ink on purpose, because a value the user must
re-read is not where the signal is spent. The valence on the control is the
border alone.

**Hover does not apply while invalid** (owner ruling, 2026-07-29). No mechanism
was needed for it — `invalid` already outranks `hovered` in the cascade above,
and `border` passes no `isHovered` at all. It is recorded here because it is now
a product decision rather than a side effect of the tuple's order, and
`tests/unit/tests/fieldEnvelope.test.tsx` fails if a call site stops passing
`isInvalid` and lets hover win.

---

## §4 — Standard Step Rule

> A component picks a **fixed** step that matches its semantic identity.
> There is no `size` prop. A component that needs different density or typography
> has a different semantic identity and is a different component.

| Family     | Standard step | Token path                                 |
| ---------- | ------------- | ------------------------------------------ |
| Sizing     | _(single)_    | `vars.sizing.hit`                          |
| Spacing    | `md`          | `vars.spacing.inset.{control\|surface}.md` |
| Typography | `md`          | `vars.text.label.md`                       |

If a design calls for a "small button", the question is: **why is it smaller semantically?**
Is it a toolbar action? A chip? A compact selection control? Name it, give it an entity, and it gets its own fixed step.

> **Layout is not a control.** The "no size prop" rule governs _interactive_
> components (Entity ≠ Structure). The presentational layer — `Box`, `Grid`,
> `Container`, `Stack`, `Surface` (all Entity = `Structure`) — is the sanctioned,
> **token-constrained** escape hatch (ADR-009): its props accept only token keys
> (`padding="md"`, `columns={3}`, `maxWidth="reading"`) or layout keywords
> (`align`, `auto`/`100%`/`fit-content`), never a raw `style`/`className`/hex/px.
> Compose layouts with these instead of hand-rolling CSS.

---

## §5 — data-\* Attribute Convention

Every component root MUST carry the identity attributes (`data-scope`, `data-part`); other attributes are emitted only when the dimension applies.

| Attribute          | Where                                           | Type / value                                                        | When emitted                                                                                                                                                                                                                                                                                                             |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data-scope`       | every element                                   | `kebab-case(meta.displayName)` — e.g. `"button"`, `"dialog"`        | Always.                                                                                                                                                                                                                                                                                                                  |
| `data-part`        | every element                                   | `meta.structure` — e.g. `"root"`, `"label"`, `"control"`            | Always.                                                                                                                                                                                                                                                                                                                  |
| `data-evaluation`  | parts that consume evaluation tokens            | `EvaluationsFor<E>` — e.g. `"primary"`, `"negative"`                | When the part renders evaluation-dependent colors.                                                                                                                                                                                                                                                                       |
| `data-consequence` | leaf Action elements that declare an effect     | `ConsequencesFor<E>` — `"neutral" \| "committing" \| "destructive"` | When the component accepts a `consequence` prop (`Button`, `MenuItem`, `FormSubmit`).                                                                                                                                                                                                                                    |
| `data-composition` | leaves that play a parent slot                  | `CompositionsFor<E>` — e.g. `"primaryAction"`                       | When the component accepts a `composition` prop. Read at runtime by composites (e.g. `DialogActions` reorders by it).                                                                                                                                                                                                    |
| `data-platform`    | `DialogActions` only                            | `"ios" \| "windows"`                                                | Always on `DialogActions`. Reflects the active ordering convention.                                                                                                                                                                                                                                                      |
| `data-pending`     | `FormSubmit` only                               | `"true"` (omitted otherwise)                                        | While `isPending` is `true`. Lets host CSS/tests show spinner without re-wiring the disabled path.                                                                                                                                                                                                                       |
| `data-arming`      | `ConfirmationDialog` confirm button only        | `"true"` (omitted otherwise)                                        | While a `destructive` confirmation is awaiting its second click. Selected at runtime from `consequence` — the proof that Consequence drives behavior.                                                                                                                                                                    |
| `data-orientation` | Action-family groups (`ButtonGroup`, `Toolbar`) | `"horizontal" \| "vertical"`                                        | Always. On `ButtonGroup` it reflects the axis **actually rendered**, so it reads `vertical` when a horizontal row had to collapse — assert the rendered state, not the authored prop. On `Toolbar` (emitted by React Aria) it is the authored axis, which is also the arrow-key axis; a toolbar never re-orients itself. |
| `data-collapsed`   | `ButtonGroup` only                              | `"true"` (omitted otherwise)                                        | When a `horizontal` request gave way because the row did not fit. Separates "the author asked for a column" from "the row ran out of room" for host CSS and tests.                                                                                                                                                       |

**Sub-part identity convention** — composites reuse the host's `data-scope` and pin the per-part `data-part`:

```tsx
<div data-scope="dialog" data-part="actions">…</div>
<button data-scope="button" data-part="root" data-composition="primaryAction">…</button>
```

**Uniqueness — `(data-scope, data-part)` addresses one element per subtree.** The pair is the
package's addressing scheme: a test, a host stylesheet and an AI agent all resolve a part by
it. So **no element may contain a descendant carrying the same pair.** Sibling repeats are
legitimate and common — two radios in a group, two steppers in a NumberField, two glyph hosts
— because the defect is ambiguity _within_ a subtree, not repetition in a document. Asserted
by contract invariant #12, which ships with a list of named known violations, each annotated
with what removes it; a companion test asserts every listed violation still reproduces, so a
fixed one must be deleted rather than left as a standing exemption.

**Declared parts vs internal parts.** `data-part` equals `meta.structure` for every part that
declares a `ComponentMeta`, and those are checked against the entity's legal roles. A component
may also emit **internal** parts — elements with no meta, whose names need not be in the
entity's role vocabulary (`Slider`'s `track`/`fill`/`labelRow`, `ComboBox`'s
`positioner`/`surface`, a field's `frame`). Internal parts exist so that structure the entity
has no role for stays addressable without growing the taxonomy nominally (ADR-008). They are
still bound by the uniqueness rule above.

The clearest case is the field envelope on a **`Selection`** root. `Select`, `CheckboxGroup`
and `RadioGroup` each render `description` and `validationMessage`, and neither is a legal
`Selection` structural role — the roles are root/control/label/indicator/selectionControl/item,
and those two belong to `Input`. All three ship them as internal parts, so no illegal role is
ever claimed and the vocabulary does not grow for three components that borrow one shape.
Admitting the roles to `ENTITY_STRUCTURE.Selection` stays available as an FSL governance
decision; three components reaching the same answer is evidence for the internal-part
treatment, not against it.

**The embedded trigger.** An Action that lives _inside_ a field's box — a
`SearchField`'s clear button, a `NumberField`'s two steppers, a `ComboBox`'s
chevron — resolves its box from `EMBEDDED_TRIGGER` (`src/tokens/embeddedTrigger.ts`),
never from its host. The reference system names the same primitive
(`in-field-button`, with its own layout token set), so this is a third posture
beside the command and utility silhouettes in `ActionTrigger/anatomy.tsx` rather
than a convenience. Contract invariant **#14** asserts it.

Two rules an author will otherwise get wrong. **It declares the field row's type
although it renders no text:** a `<button>` with no type of its own inherits the
UA's `13.3333px`, so anything font-relative inside it — an `Icon` asked for
`size="text"` — silently shrinks. That is what made three triggers measure 32,
25.33 and 20px. **Its colours come from its host and not from `action.*`:** the
"entity → ux-context alignment" test binds a file's colour reads to the entities
that file declares, and these hosts declare `Input` only. It costs nothing —
`input.primary.background` resolves the same first two rungs as `action.muted`, so
the trigger is invisible against its field until the pointer arrives.

**The choosable row.** A row the user picks from — a `Select` option, a `ComboBox` option, a
`MenuItem`, a `ListBoxItem`, a `GridListItem` — resolves its box from `CHOOSABLE_ROW`
(`src/tokens/choosableRow.ts`), not from its own component. The five span three entities, and the
entity decides a row's **colours**, never its geometry: they read the same block inset, inline
inset, radius and type as the field row, so an option sits under a field at the same rhythm — the
row is the field's content box, and the field is that plus the 1px border per edge it draws. Stated
in tokens rather than pixels on purpose: both are fluid (F-035), so at a 1280px viewport it reads
32px row / 34px field and at 390px both bottom out on `sizing.hit` and the difference is 0. Its
focus ring
is **inset by exactly the ring width**, because every one of these rows lives in a clipped or
scrolling surface and a ring needing room outside the box gets cut off at a scroll edge. Asserted by
contract invariant #13.

Where a control's painted box and its operated element are different nodes, **`control` names
the element the user operates** — the one that takes focus and holds the value — and the
painted box is an internal `frame`. Reversing that would make `[data-part="control"]` resolve a
`<div>` nobody can type into (ADR-022; ADR-008 draws the same line for Slider's thumb).

The contract test [`components.contract.test.tsx`](../../tests/unit/tests/components.contract.test.tsx) auto-discovers every `*Meta` and asserts each attribute value is legal per the matrices in `taxonomy.ts`.

---

## §6 — Color Role Coverage

> **Source of truth: `ENTITY_EVALUATION` in `taxonomy.ts`.**
> Read it directly — do not rely on any other copy.

```typescript
import { ENTITY_EVALUATION } from '@ttoss/fsl-ui/semantics';

// Which evaluations are valid for a given entity:
const valid = ENTITY_EVALUATION['Action'];
// → ['primary', 'secondary', 'accent', 'muted', 'negative']
//
// Note: 'negative' on Action is the adverse color *voice*. It does not
// imply behavior — effect-on-state is expressed separately through
// `consequence: 'destructive'` (see ENTITY_CONSEQUENCE), which drives
// interaction mechanics (e.g. ConfirmationDialog arming).
```

---

## §7 — Escape Hatches

There are **two** sanctioned escape hatches, for two different needs:

1. **Composition → the presentational layer (ADR-009).** To arrange, pad, size,
   or lightly group content, use `Box`/`Grid`/`Container`/`Stack`/`Surface`
   (Entity = `Structure`). Their props are token-constrained (token keys +
   layout keywords only) — this is the answer to "I need custom layout" and
   replaces hand-rolled CSS. See §4.
2. **Host geometry on composites → composite-scoped CSS custom properties.**
   For host-owned geometry knobs on interactive composites (which own their
   layout and expose no visual props), the single channel is described below.

Composites own their layout: they expose no `style`/`className` and no
visual props. The **single sanctioned customization channel** is a
composite-scoped CSS custom property — a _knob_ — named
`--fsl-<scope>-<knob>` and consumed through the `fslVar` helper
(`src/tokens/escapeHatch.ts`):

```typescript
maxWidth: fslVar('--fsl-dialog-max-width', DIALOG_MAX_WIDTH_DEFAULT),
```

Hosts customize with ordinary CSS — no component code involved:

```css
/* Wider dialogs across the app */
[data-scope='dialog'] {
  --fsl-dialog-max-width: 720px;
}

/* One specific menu */
.settings-menu [data-scope='menu'] {
  --fsl-menu-max-width: 480px;
}
```

Rules (enforced by the contract tests):

1. Every knob read MUST go through `fslVar` and MUST carry a fallback —
   the component's default. A knob without a fallback is a violation.
2. The `--fsl-` namespace is reserved for host knobs. `--tt-*` theme
   tokens never take fallbacks (that ban is unchanged — fallbacks on theme
   tokens mask missing token coverage).
3. Knobs are for **geometry the host legitimately owns** (widths, heights
   of overlay surfaces). Colors, spacing steps, typography, and anything
   else covered by a semantic token are NOT knobs — they belong to the
   theme.
4. Where the underlying React Aria primitive exposes safe positioning
   props (`placement`, `offset`, `crossOffset`, `shouldFlip`,
   `containerPadding`), the composite forwards them as ordinary props —
   positioning is behavior, not chrome.

Registered knobs:

| Knob                            | Component     | Fallback               |
| ------------------------------- | ------------- | ---------------------- |
| `--fsl-combo-box-max-height`    | `ComboBox`    | `min(20rem, 60vh)`     |
| `--fsl-combo-box-popover-width` | `ComboBox`    | `var(--trigger-width)` |
| `--fsl-form-label-width`        | `Form`        | `max-content`          |
| `--fsl-dialog-max-width`        | `DialogModal` | `min(500px, 90vw)`     |
| `--fsl-dialog-max-height`       | `DialogModal` | `90vh`                 |
| `--fsl-menu-min-width`          | `Menu`        | `12rem`                |
| `--fsl-menu-max-width`          | `Menu`        | `min(320px, 90vw)`     |
| `--fsl-popover-max-width`       | `Popover`     | `min(320px, 90vw)`     |
| `--fsl-select-popover-width`    | `Select`      | `var(--trigger-width)` |
| `--fsl-tooltip-max-width`       | `Tooltip`     | `min(280px, 90vw)`     |

### Upstream custom properties — a named allowlist (ADR-023)

Rule 2 above reserves `--fsl-` for host knobs and bans a third namespace, because
an unnamed one is an unreviewable styling side channel. One narrow class is
exempt: a custom property **published as documented API by a direct dependency**,
where the value is something only the dependency can compute.

The exemption is an allowlist, not a hole. Names live in the `UpstreamCssVar`
union and are read through `upstreamVar(name, fallback)` — same fallback
requirement as `fslVar`, though it means something different: not "the host did
not customise this" but "the dependency did not publish it".

| Property          | Published by         | Read by              | Fallback |
| ----------------- | -------------------- | -------------------- | -------- |
| `--trigger-width` | React Aria `Popover` | `Select`, `ComboBox` | `auto`   |

**Reads only.** React Aria resolves `--trigger-width` as
`props.style['--trigger-width'] || measured`, and supplying our own value also
switches off the `ResizeObserver` that keeps it current — so writing it would
freeze a popover at its trigger's first-paint width.

Both halves are enforced, and the source-text rule alone is **not** sufficient:
it scans `src/components/**`, so a helper composing the string elsewhere slips
past it (which is exactly what happened when `upstreamVar` was added). The
binding check is over the **rendered** inline styles of every DOM fixture, plus a
source check that nothing assigns an allowlisted name.

---

## §8 — Full Example: Button (Entity = Action)

`entity: 'Action'` → §1 row: colors=`action`, radii=`action`, border=`outline.control`,
sizing=`hit`, spacing=`inset.control.md`, typography=`action.md`, motion=`feedback`, elevation=`flat`.

**Two silhouettes inside the Action row.** The row above lists the _command_
tokens (`radii.action`, `text.action`, `inset.action.block`) that `Button`
reads. `ActionButton` and `ToggleButton` read the **utility** set from the same
row — `radii.control`, `text.label.md`, `inset.control.{sm,md}` — because an
ambient operation on content must recede beside a commitment. Both silhouettes
are declared once in `components/ActionTrigger/anatomy.tsx`
(`COMMAND_SILHOUETTE` / `UTILITY_SILHOUETTE`) and every Action trigger takes
its geometry from that module: the anatomy, the `hit` floor on both axes and
the icon-only square are shared code, not conventions each component
re-implements.

Anatomy: `root` · `icon` · `label` — all three are lawful Action structural
roles (`ENTITY_STRUCTURE.Action`), so a Button with a glyph declares real
identities instead of anonymous spans. `sizing.hit` binds **both** axes: it
drives the height and supplies a square minimum width, which is what makes the
icon-only form's _floor_. The square itself is arithmetic, not an imposed
`aspect-ratio`: the icon-only form mirrors its block inset on the inline axis
and squares its glyph slot to one line (`1lh`), so both axes carry identical
padding and identical content extent — which also makes the square resolve to
the same height as a labelled CTA (40px at the desktop bound). Deriving it from
`aspect-ratio` was tried and rejected: the shrink-to-fit width won, squeezing
the vertical inset and breaking that height parity. The glyph arrives as a caller-supplied `<Icon>` **element**, not
an intent string: a component that renders a caller's glyph imports
`IconProps` as a _type only_, so it never pulls the glyph registry into a
consumer that renders text alone (the tree-shaking guarantee — ADR-006).

```typescript
import { vars } from '@ttoss/fsl-theme/vars';
import type { ComponentMeta, EvaluationsFor } from '../../semantics';

// Step 1 — identity
export const buttonMeta = {
  displayName: 'Button',
  entity: 'Action',
  structure: 'root',
} as const satisfies ComponentMeta<'Action'>;

// Step 2 — valid evaluations, derived from taxonomy
type ButtonEvaluation = EvaluationsFor<(typeof buttonMeta)['entity']>;

// Step 3 — wire props
export const Button = ({ evaluation = 'primary', ...props }: ButtonProps) => {
  const c = vars.colors.action[evaluation]; // §2 Colors formula

  return (
    <RACButton
      data-scope="button"   // §5
      data-part="root"
      data-evaluation={evaluation}
      style={({ isHovered, isPressed, isDisabled, isFocusVisible }) => ({
        // Static layout — §2 formulas
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: vars.radii.action,
        borderWidth: vars.border.outline.control.width,
        borderStyle: vars.border.outline.control.style,
        minHeight: vars.sizing.hit,
        paddingBlock: vars.spacing.inset.control.md,
        paddingInline: vars.spacing.inset.control.md,
        ...(vars.text.label.md as React.CSSProperties),
        transitionDuration: vars.motion.feedback.duration,
        transitionTimingFunction: vars.motion.feedback.easing,
        transitionProperty: 'background-color, border-color, color',

        // State-dependent colors — §3 priority rule
        backgroundColor: isDisabled ? c?.background?.disabled
                       : isPressed  ? c?.background?.active
                       : isHovered  ? c?.background?.hover
                       :              c?.background?.default,
        borderColor: isFocusVisible ? c?.border?.focused
                   : isDisabled     ? c?.border?.disabled
                   :                  c?.border?.default,
        color: isDisabled ? c?.text?.disabled
             : isPressed  ? (c?.text?.active ?? c?.text?.default)
             : isHovered  ? (c?.text?.hover  ?? c?.text?.default)
             :               c?.text?.default,
        outline: isFocusVisible
          ? `${vars.focus.ring.width} ${vars.focus.ring.style} ${vars.focus.ring.color}`
          : 'none',
      })}
    />
  );
};
```

---

## §9 — Icons (semantic glyph layer; public since ADR-010)

When a component needs a glyph (chevron, check, close, …), do **not** hardcode
a unicode character or hand-author SVG. Use `Icon` — a semantic layer over
the Iconify provider (ADR-005; public export per ADR-010):

```typescript
import { Icon } from '@ttoss/fsl-ui'; // inside this package: '../Icon' from src/components/*

<Icon intent="disclosure.expand" />          // named by meaning, not glyph
<Icon intent="action.close" size="sm" />     // sm | md (default) | lg → vars.sizing.icon.*
<Icon intent="action.search" label={label} /> // labelled (role=img) instead of decorative
```

Rules:

1. **Intent, not glyph.** Pick an `icon.{family}.{intent}` from
   `src/components/Icon/intents.ts`. Need one that is not there yet? Add the
   intent to `intents.ts` **and** its Lucide glyph to `glyphs.ts` (a two-line
   edit; the `satisfies Record<IconIntent, …>` makes a missing glyph a compile
   error). The registry grows only when a real component needs it.
2. **Color is inherited.** Icon renders `currentColor`; set the color on the
   surrounding element (as Checkbox's `indicator` does). Icon reads no color
   token.
3. **Size is the only token Icon reads** — `vars.sizing.icon.{sm|md|lg}` via
   the `size` prop. This is not the §4 density `size` (that governs interactive
   hit targets); a glyph legitimately scales with its context.
4. **Decorative by default** (`aria-hidden`). Pass `label` only when the icon
   is the sole carrier of meaning — and pass caller-localized copy (§6/i18n).
5. Icon is **internal** — never re-export it from `src/index.ts`. It is the
   seed of a future standalone `@ttoss/fsl-icon` package.
