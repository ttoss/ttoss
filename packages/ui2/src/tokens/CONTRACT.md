# Token Contract

> **Purpose**: Given an Entity, this document tells you exactly which `vars.*` paths to use,
> how to construct the full token path, and how to wire state and evaluation.
>
> This is the Layer 2 boundary artifact.
> For token family semantics (rules, valid values, responsive behaviour):
> see `@ttoss/theme2` `Types.ts` and `/docs/design/design-system/design-tokens/`.

```typescript
import { vars } from '@ttoss/theme2/vars';
import type { ComponentMeta, EvaluationsFor } from '@ttoss/ui2/semantics';
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
  interaction: 'command', // InteractionsFor<'Action'>
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

### Step 3 — Read token paths from §1

Look up `fooMeta.entity` in the Entity → Token Map (§1).  
Each column gives you the `vars.*` subtree. Use §2 to construct the exact path.

### Step 4 — Wire state and colors (§3)

Apply the State Priority Rule (§3) to resolve which color token to use for
the current combination of React Aria state booleans.

---

## §1 — Entity → Token Map

A component MUST use ONLY tokens from its Entity row.

| Entity         | Colors       | Radii     | Border                        | Sizing | Spacing         | Typography               | Motion       | Elevation        |
| -------------- | ------------ | --------- | ----------------------------- | ------ | --------------- | ------------------------ | ------------ | ---------------- |
| **Action**     | `action`     | `control` | `outline.control`             | `hit`  | `inset.control` | `label`                  | `feedback`   | `flat`           |
| **Input**      | `input`      | `control` | `outline.control`             | `hit`  | `inset.control` | `label`                  | `feedback`   | `flat`           |
| **Selection**  | `input`      | `control` | `outline.control`, `selected` | `hit`  | `inset.control` | `label`                  | `feedback`   | `flat`           |
| **Navigation** | `navigation` | `control` | `outline.control`             | `hit`  | `inset.control` | `label`                  | `feedback`   | `flat`           |
| **Disclosure** | `navigation` | `control` | `outline.control`             | `hit`  | `inset.control` | `label`                  | `transition` | `flat`           |
| **Overlay**    | `content`    | `surface` | `outline.surface`             | —      | `inset.surface` | `title`, `body`, `label` | `transition` | `overlay`        |
| **Feedback**   | `feedback`   | `surface` | `outline.surface`             | —      | `inset.surface` | `body`, `label`          | `feedback`   | `raised`         |
| **Collection** | `content`    | `surface` | `outline.surface`, `divider`  | —      | `inset.surface` | `body`, `label`          | —            | `flat`, `raised` |
| **Structure**  | `content`    | `surface` | `outline.surface`, `divider`  | —      | `inset.surface` | `title`, `body`, `label` | —            | `flat`, `raised` |

**Cross-cutting** (apply to ALL interactive entities — not in the table because they are entity-agnostic):

| Token family     | Path                                          |
| ---------------- | --------------------------------------------- | ------ | ------- | -------- | ----------- |
| Focus ring       | `vars.focus.ring.width` / `.style` / `.color` |
| Disabled opacity | `vars.opacity.disabled`                       |
| Scrim opacity    | `vars.opacity.scrim`                          |
| Z-Index          | `vars.zIndex.layer.{base                      | sticky | overlay | blocking | transient}` |

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
- `state` — `StatesFor<I>` from `taxonomy.ts` → `INTERACTION_STATE[interaction]`

Example:

```typescript
const c = vars.colors.action[evaluation]; // evaluation = 'primary'
c.background.default; // → var(--tt-action-primary-background-default)
c.border.focused; // → var(--tt-action-primary-border-focused)
c.text.disabled; // → var(--tt-action-primary-text-disabled)
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

When wiring state-dependent colors, evaluate conditions in this order (highest priority first):

```
disabled > focusVisible > pressed > hovered > default
```

Template (React Aria pattern):

```typescript
style={({ isHovered, isPressed, isDisabled, isFocusVisible }) => ({
  // Background
  backgroundColor: isDisabled    ? c?.background?.disabled
                 : isPressed     ? c?.background?.active
                 : isHovered     ? c?.background?.hover
                 : /* default */ c?.background?.default,

  // Border color
  borderColor: isFocusVisible ? c?.border?.focused
             : isDisabled     ? c?.border?.disabled
             :                  c?.border?.default,

  // Text color
  color: isDisabled ? c?.text?.disabled
       : isPressed  ? (c?.text?.active ?? c?.text?.default)
       : isHovered  ? (c?.text?.hover  ?? c?.text?.default)
       :               c?.text?.default,

  // Focus ring (always via outline, never via border — avoids layout shift)
  outline: isFocusVisible
    ? `${vars.focus.ring.width} ${vars.focus.ring.style} ${vars.focus.ring.color}`
    : 'none',
})}
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

Every component root element MUST carry these attributes for styling, testing, and debugging:

```typescript
data-scope="foo"            // = fooMeta.displayName in kebab-case
data-part="root"            // Structural role of this DOM element
data-evaluation={evaluation} // Current evaluation value
```

Sub-parts (label, icon, control) use:

```typescript
data-scope="foo"
data-part="label"   // or "icon", "control", etc.
```

---

## §6 — Color Role Coverage

> **Source of truth: `ENTITY_EVALUATION` in `taxonomy.ts`.**
> Read it directly — do not rely on any other copy.

```typescript
import { ENTITY_EVALUATION } from '@ttoss/ui2/semantics/taxonomy';

// Which evaluations are valid for a given entity:
const valid = ENTITY_EVALUATION['Action'];
// → ['primary', 'secondary', 'accent', 'muted', 'negative']
```

---

## §7 — Full Example: Button (Entity = Action)

`entity: 'Action'` → §1 row: colors=`action`, radii=`control`, border=`outline.control`,
sizing=`hit.base`, spacing=`inset.control.md`, typography=`label.md`, motion=`feedback`, elevation=`flat`.

```typescript
import { vars } from '@ttoss/theme2/vars';
import type { ComponentMeta, EvaluationsFor } from '../../semantics';

// Step 1 — identity
export const buttonMeta = {
  displayName: 'Button',
  entity: 'Action',
  structure: 'root',
  interaction: 'command',
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
