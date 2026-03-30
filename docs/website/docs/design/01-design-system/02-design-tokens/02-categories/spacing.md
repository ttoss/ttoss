---
title: Spacing
---

# Spacing

Spacing tokens define the **repeatable distances** used to build rhythm, hierarchy, alignment, and ergonomics across interfaces.

This system is built on **two explicit layers**:

1. **Core Tokens** — intent-free primitives and the **single responsiveness engine**
2. **Semantic Tokens** — stable layout patterns consumed by UI code

Components must always consume **semantic spacing**, never core spacing directly.

> **Rule:** Core spacing is never referenced in components.

---

## Core Tokens

Core spacing tokens are intent-free primitives and the single source of truth for responsiveness.

They exist to:

- centralize fluid logic (the responsive engine lives here)
- keep semantic tokens as **aliases** (stable names, theme-tunable engine)
- make the system predictable (no ad-hoc coefficients in semantics)

### Core set

- **Primitive**: `core.space.unit`
- **Steps**: `core.space.0`, `core.space.1`, `core.space.2`, `core.space.3`, `core.space.4`, `core.space.6`, `core.space.8`, `core.space.12`, `core.space.16`

> Keep the step set small. If you want `core.space.5`, you likely need a semantic mapping, not a new core step.

### Example

```js
const core = {
  space: {
    /**
     * The Responsive Engine
     * Container-first: scales with the inline size of the nearest query container.
     * If no eligible container exists, cqi falls back to the small viewport unit for that axis (sv*).
     */
    unit: 'clamp(4px, 0.5cqi + 2px, 8px)',

    /** Core steps (sparse scale) */
    0: '0px',
    1: 'calc(1 * {core.space.unit})',
    2: 'calc(2 * {core.space.unit})',
    3: 'calc(3 * {core.space.unit})',
    4: 'calc(4 * {core.space.unit})',
    6: 'calc(6 * {core.space.unit})',
    8: 'calc(8 * {core.space.unit})',
    12: 'calc(12 * {core.space.unit})',
    16: 'calc(16 * {core.space.unit})',

    /** Tier-2 (optional, not default): container-aware unit (kept for explicitness) */
    unitCq: 'clamp(4px, 0.6cqi, 8px)',
  },
};
```

**Expected consumption pattern:** semantic tokens reference core tokens by alias.

---

## Semantic Tokens

Semantic spacing is anchored in **layout physics**, not UX categories.

### Token structure

```
{pattern}.{context}.{step?}
```

- `pattern`: `inset`, `gap`, `gutter`, `separation`
- `context`: `control`, `surface`, `stack`, `inline`, `page`, `section`, `interactive`
- `step`: `xs`, `sm`, `md`, `lg`, `xl`, `min`

`step` is only used in some cases.

#### Patterns:

| `{pattern}`  | Description                                            |
| :----------- | :----------------------------------------------------- |
| `inset`      | padding inside elements                                |
| `gap`        | spacing between siblings                               |
| `gutter`     | structural layout padding (page/section)               |
| `separation` | minimum ergonomic distance between interactive targets |

### Canonical shapes

- `inset.control.{sm|md|lg}`
- `inset.surface.{sm|md|lg}`
- `gap.stack.{xs|sm|md|lg|xl}`
- `gap.inline.{xs|sm|md|lg}`
- `gutter.{page|section}`
- `separation.interactive.min`

### Semantic Tokens Summary Table

| token                        | use when you are building…                    | contract (must be true)                  | default mapping                                    |
| :--------------------------- | :-------------------------------------------- | :--------------------------------------- | :------------------------------------------------- |
| `inset.control.sm`           | compact controls                              | internal padding                         | `core.space.2`                                     |
| `inset.control.md`           | default controls                              | internal padding                         | `core.space.3`                                     |
| `inset.control.lg`           | large/prominent controls                      | internal padding                         | `core.space.4`                                     |
| `inset.surface.sm`           | tight surfaces                                | internal padding                         | `core.space.3`                                     |
| `inset.surface.md`           | default surfaces                              | internal padding                         | `core.space.4`                                     |
| `inset.surface.lg`           | spacious surfaces                             | internal padding                         | `core.space.6`                                     |
| `gap.stack.xs`               | tight vertical rhythm                         | sibling spacing via `gap`                | `core.space.2`                                     |
| `gap.stack.sm`               | medium vertical rhythm                        | sibling spacing via `gap`                | `core.space.3`                                     |
| `gap.stack.md`               | default vertical rhythm                       | sibling spacing via `gap`                | `core.space.4`                                     |
| `gap.stack.lg`               | roomy vertical rhythm                         | sibling spacing via `gap`                | `core.space.6`                                     |
| `gap.stack.xl`               | section-level rhythm                          | sibling spacing via `gap`                | `core.space.8`                                     |
| `gap.inline.xs`              | **visual-only** tight grouping (icon + label) | never between interactive targets        | `core.space.1`                                     |
| `gap.inline.sm`              | inline grouping                               | alias of `gap.stack.xs`                  | `core.space.2`                                     |
| `gap.inline.md`              | looser inline grouping                        | alias of `gap.stack.sm`                  | `core.space.3`                                     |
| `gap.inline.lg`              | spacious inline grouping                      | alias of `gap.stack.md`                  | `core.space.4`                                     |
| `gutter.page`                | page outer padding                            | bounded, structural                      | `clamp(core.space.4, core.space.6, core.space.12)` |
| `gutter.section`             | section outer padding                         | bounded, structural                      | `clamp(core.space.3, core.space.4, core.space.12)` |
| `separation.interactive.min` | dense interactive target clusters             | only between click/tap/focusable targets | `clamp(8px, core.space.2, 12px)`                   |

---

#### Example

```js
const spacing = {
  inset: {
    control: {
      sm: 'core.space.2',
      md: 'core.space.3',
      lg: 'core.space.4',
    },
    surface: {
      sm: 'core.space.3',
      md: 'core.space.4',
      lg: 'core.space.6',
    },
  },

  gap: {
    stack: {
      xs: 'core.space.2',
      sm: 'core.space.3',
      md: 'core.space.4',
      lg: 'core.space.6',
      xl: 'core.space.8',
    },
    inline: {
      xs: 'core.space.1', // visual-only tight grouping
      sm: 'gap.stack.xs', // aliases reduce knobs
      md: 'gap.stack.sm',
      lg: 'gap.stack.md',
    },
  },

  gutter: {
    page: 'clamp({core.space.4}, {core.space.6}, {core.space.12})',
    section: 'clamp({core.space.3}, {core.space.4}, {core.space.12})',
  },

  separation: {
    interactive: {
      min: 'clamp(8px, {core.space.2}, 12px)',
    },
  },
};
```

---

## Rules of Engagement (non-negotiable)

1. **Semantic-only consumption:** components use semantic spacing only.
2. **Gap-first:** sibling spacing uses `gap` (Flex/Grid) by default.
3. **Inset is for padding:** `inset.*` is only for internal padding.
4. **Gutters are structural:** use `gutter.*` for page/section layout padding.
5. **Separation is ergonomic:** `separation.interactive.min` is only for interactive targets.
6. **No responsive logic in components:** responsiveness lives in Core (`core.space.unit`), not in UI code.

## Decision Matrix (pick fast)

1. **Padding inside an element?** → `inset.control.*` / `inset.surface.*`
2. **Spacing between siblings?** → `gap.stack.*` / `gap.inline.*`
3. **Page/section structure?** → `gutter.page` / `gutter.section`
4. **Dense cluster of interactive targets?** → `separation.interactive.min`

---

## Usage Examples

| Usage                               | Token                                       |
| :---------------------------------- | :------------------------------------------ |
| Stack (vertical rhythm)             | `{gap: gap.stack.md}`                       |
| Inline group (visual grouping)      | `{gap: gap.inline.sm}`                      |
| Surface padding                     | `{padding: inset.surface.md}`               |
| Page gutter                         | `{padding-inline: gutter.page}`             |
| Dense toolbar (interactive targets) | `{gap: separation.interactive.min}`         |

> Build output may expose semantic tokens as CSS variables (as shown above) or as framework-specific bindings. The semantic names remain the API.

---

## Output Guidance (Web)

The following sections are specific to CSS/web output and do not affect the semantic contract.

### Flex `gap` fallback (only if required)

If your support matrix includes environments without flex-gap support, emit a fallback:

```js
const rowStyles = {
  display: 'flex',
  flexDirection: 'row',
  /* Preferred */
  gap: 'gap.inline.sm',

  /* Fallback */
  '@supports not (gap: 1rem)': {
    '& > * + *': {
      marginLeft: 'gap.inline.sm',
    },
  },
};
```

---

## Theming & Density (allowed knobs)

Themes may tune spacing without renaming semantic tokens.

1. **Tune `core.space.unit`** (global density + responsiveness)
   - denser: lower clamp bounds
   - airier: higher clamp bounds

2. **Optional density mode (rare)**
   If multiple UI densities are truly needed, remap only:
  - `inset.control.*`
  - `gap.*` (stack + inline aliases)

Keep `gutter.*` and `separation.*` conservative.

---

### Container-Aware Spacing (optional)

For highly modular layouts (cards in grids, split panes), you may introduce:

- `core.space.unitCq = clamp(4px, 0.6cqi, 8px)`

This is **not default**. Use it only in layout primitives/surfaces explicitly designed for container scaling.

---

## Validation

### Errors (validation must fail when)

- inset order breaks:
  - `inset.control.sm > inset.control.md`
  - `inset.control.md > inset.control.lg`
  - `inset.surface.sm > inset.surface.md`
  - `inset.surface.md > inset.surface.lg`

- a surface inset step is tighter than the corresponding control inset step:
  - `inset.surface.sm < inset.control.sm`
  - `inset.surface.md < inset.control.md`
  - `inset.surface.lg < inset.control.lg`

- any `gap.stack.*` token resolves to anything other than a `core.space.*` step alias

- stack gap order breaks:
  - `gap.stack.xs > gap.stack.sm`
  - `gap.stack.sm > gap.stack.md`
  - `gap.stack.md > gap.stack.lg`
  - `gap.stack.lg > gap.stack.xl`

- `gap.inline.xs > gap.inline.sm`

- `gutter.page` is not a bounded `clamp(...)` contract

- `gutter.section` is not a bounded `clamp(...)` contract

- `gutter.*` introduces direct responsive logic such as `cqi`, `cqmin`, `cqmax`, `vi`, `vw`, `%`, media queries, or breakpoint logic instead of composing from `core.space.*`

- `gutter.page` resolves smaller than `gutter.section` at any bound

- `separation.interactive.min` is not a bounded `clamp(...)` contract

- `separation.interactive.min` introduces direct responsive logic such as `cqi`, `cqmin`, `cqmax`, `vi`, `vw`, `%`, media queries, or breakpoint logic instead of composing from `core.space.*`

- `separation.interactive.min` has a minimum bound below `5spx`

- any semantic spacing token other than `gutter.*` or `separation.interactive.min` defines its own raw formula instead of aliasing core spacing steps

- generated output does not emit a viewport-safe fallback before container-based overrides

- generated output does not gate container-based overrides behind `@supports (width: 1cqi)`

### Warning (validation should warn when)

- adjacent `inset.control.*` steps resolve to the same effective value

- adjacent `inset.surface.*` steps resolve to the same effective value

- adjacent `gap.stack.*` steps resolve to the same effective value

- `gap.inline.xs` resolves to the same effective value as `gap.inline.sm`

- `gutter.page` and `gutter.section` resolve to the same effective contract

- `separation.interactive.min` resolves to the same effective value as `gap.inline.sm`

---

## Summary

- One responsiveness engine: `core.space.unit`
- Small core step set: `core.space.{0..16}` (sparse)
- Small semantic set: inset / gap / gutter / separation
- Gap-first, semantic-only consumption
- Responsive by contract, no breakpoint logic in components
