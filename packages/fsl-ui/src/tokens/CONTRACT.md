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

| Entity         | Colors          | Radii     | Border                        | Sizing | Spacing         | Typography               | Motion       | Elevation        |
| -------------- | --------------- | --------- | ----------------------------- | ------ | --------------- | ------------------------ | ------------ | ---------------- |
| **Action**     | `action`        | `control` | `outline.control`             | `hit`  | `inset.control` | `label`                  | `feedback`   | `flat`           |
| **Input**      | `input`         | `control` | `outline.control`             | `hit`  | `inset.control` | `label`                  | `feedback`   | `flat`           |
| **Selection**  | `input`         | `control` | `outline.control`, `selected` | `hit`  | `inset.control` | `label`                  | `feedback`   | `flat`           |
| **Navigation** | `navigation`    | `control` | `outline.control`             | `hit`  | `inset.control` | `label`                  | `feedback`   | `flat`           |
| **Disclosure** | `navigation`    | `control` | `outline.control`             | `hit`  | `inset.control` | `label`                  | `transition` | `flat`           |
| **Overlay**    | `informational` | `surface` | `outline.surface`             | —      | `inset.surface` | `title`, `body`, `label` | `transition` | `overlay`        |
| **Feedback**   | `feedback`      | `surface` | `outline.surface`             | —      | `inset.surface` | `body`, `label`          | `feedback`   | `raised`         |
| **Collection** | `informational` | `surface` | `outline.surface`, `divider`  | —      | `inset.surface` | `body`, `label`          | —            | `flat`, `raised` |
| **Structure**  | `informational` | `surface` | `outline.surface`, `divider`  | —      | `inset.surface` | `title`, `body`, `label` | —            | `flat`, `raised` |

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

---

## §4 — Standard Step Rule

> A component picks a **fixed** step that matches its semantic identity.
> There is no `size` prop. A component that needs different density or typography
> has a different semantic identity and is a different component.

| Family     | Standard step | Token path                                 |
| ---------- | ------------- | ------------------------------------------ |
| Sizing     | `base`        | `vars.sizing.hit.base`                     |
| Spacing    | `md`          | `vars.spacing.inset.{control\|surface}.md` |
| Typography | `md`          | `vars.text.label.md`                       |

If a design calls for a "small button", the question is: **why is it smaller semantically?**
Is it a toolbar action? A chip? A compact selection control? Name it, give it an entity, and it gets its own fixed step.

---

## §5 — data-\* Attribute Convention

Every component root MUST carry the identity attributes (`data-scope`, `data-part`); other attributes are emitted only when the dimension applies.

| Attribute          | Where                                       | Type / value                                                        | When emitted                                                                                                                                          |
| ------------------ | ------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-scope`       | every element                               | `kebab-case(meta.displayName)` — e.g. `"button"`, `"dialog"`        | Always.                                                                                                                                               |
| `data-part`        | every element                               | `meta.structure` — e.g. `"root"`, `"label"`, `"control"`            | Always.                                                                                                                                               |
| `data-evaluation`  | parts that consume evaluation tokens        | `EvaluationsFor<E>` — e.g. `"primary"`, `"negative"`                | When the part renders evaluation-dependent colors.                                                                                                    |
| `data-consequence` | leaf Action elements that declare an effect | `ConsequencesFor<E>` — `"neutral" \| "committing" \| "destructive"` | When the component accepts a `consequence` prop (`Button`, `MenuItem`, `FormSubmit`).                                                                 |
| `data-composition` | leaves that play a parent slot              | `CompositionsFor<E>` — e.g. `"primaryAction"`                       | When the component accepts a `composition` prop. Read at runtime by composites (e.g. `DialogActions` reorders by it).                                 |
| `data-platform`    | `DialogActions` only                        | `"ios" \| "windows"`                                                | Always on `DialogActions`. Reflects the active ordering convention.                                                                                   |
| `data-pending`     | `FormSubmit` only                           | `"true"` (omitted otherwise)                                        | While `isPending` is `true`. Lets host CSS/tests show spinner without re-wiring the disabled path.                                                    |
| `data-arming`      | `ConfirmationDialog` confirm button only    | `"true"` (omitted otherwise)                                        | While a `destructive` confirmation is awaiting its second click. Selected at runtime from `consequence` — the proof that Consequence drives behavior. |

**Sub-part identity convention** — composites reuse the host's `data-scope` and pin the per-part `data-part`:

```tsx
<div data-scope="dialog" data-part="actions">…</div>
<button data-scope="button" data-part="root" data-composition="primaryAction">…</button>
```

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

## §7 — Escape Hatches: Composite-Scoped CSS Custom Properties

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

| Knob                      | Component     | Fallback           |
| ------------------------- | ------------- | ------------------ |
| `--fsl-dialog-max-width`  | `DialogModal` | `min(500px, 90vw)` |
| `--fsl-dialog-max-height` | `DialogModal` | `90vh`             |
| `--fsl-menu-min-width`    | `Menu`        | `12rem`            |
| `--fsl-menu-max-width`    | `Menu`        | `min(320px, 90vw)` |

---

## §8 — Full Example: Button (Entity = Action)

`entity: 'Action'` → §1 row: colors=`action`, radii=`control`, border=`outline.control`,
sizing=`hit.base`, spacing=`inset.control.md`, typography=`label.md`, motion=`feedback`, elevation=`flat`.

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
        borderRadius: vars.radii.control,
        borderWidth: vars.border.outline.control.width,
        borderStyle: vars.border.outline.control.style,
        minHeight: vars.sizing.hit.base,
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

## §9 — Icons (internal glyph layer)

When a component needs a glyph (chevron, check, close, …), do **not** hardcode
a unicode character or hand-author SVG. Use the internal `Icon`
(`src/components/Icon/`) — a semantic layer over the Iconify provider
(ADR-005):

```typescript
import { Icon } from '../Icon'; // from src/components/*; '../../components/Icon' from composites

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
