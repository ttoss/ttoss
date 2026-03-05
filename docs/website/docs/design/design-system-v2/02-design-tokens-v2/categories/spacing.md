---
title: Spacing
---

# Spacing

Spacing tokens define the **repeatable distances** used to build rhythm, hierarchy, alignment, and ergonomics across interfaces.

This system is built on **two explicit layers**:

1. **Core Spacing** — intent-free primitives and the **single responsiveness engine**
2. **Semantic Spacing** — stable layout patterns consumed by UI code

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

**Primitive**

- `space.unit`

**Steps**

- `space.0`
- `space.1`
- `space.2`
- `space.3`
- `space.4`
- `space.6`
- `space.8`
- `space.12`
- `space.16`

> Keep the step set small. If you want `space.5`, you likely need a semantic mapping, not a new core step.

### Example

```js
const coreSpacing = {
  space: {
    /**
     * The Responsive Engine
     * Container-first: scales with the inline size of the nearest query container.
     * If no eligible container exists, cqi falls back to the small viewport unit for that axis (sv*).
     */
    unit: 'clamp(4px, 0.5cqi + 2px, 8px)',

    /** Core steps (sparse scale) */
    0: '0px',
    1: 'calc(1 * {space.unit})',
    2: 'calc(2 * {space.unit})',
    3: 'calc(3 * {space.unit})',
    4: 'calc(4 * {space.unit})',
    6: 'calc(6 * {space.unit})',
    8: 'calc(8 * {space.unit})',
    12: 'calc(12 * {space.unit})',
    16: 'calc(16 * {space.unit})',

    /** Tier-2 (optional, not default): container-aware unit (kept for explicitness) */
    unitCq: 'clamp(4px, 0.6cqi, 8px)',
  },
};
```

**Expected consumption pattern:** semantic tokens reference core tokens by alias.

---

## Semantic Tokens

Semantic spacing is anchored in **layout physics**, not UX categories.
The semantic set is intentionally **small and unambiguous**. Semantic tokens are the only spacing API for components.

### Token structure

```
{pattern}.{context}.{step}
```

- `pattern`: `inset` | `gap` | `gutter` | `separation`
- `context`: `control` | `surface` | `stack` | `inline` | `page` | `section` | `interactive`
- `step`: `xs` | `sm` | `md` | `lg` | `xl` | `min`

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

| token                        | use when you are building…                    | contract (must be true)                  | default mapping                     |
| :--------------------------- | :-------------------------------------------- | :--------------------------------------- | :---------------------------------- |
| `inset.control.sm`           | compact controls                              | internal padding                         | `space.2`                           |
| `inset.control.md`           | default controls                              | internal padding                         | `space.3`                           |
| `inset.control.lg`           | large/prominent controls                      | internal padding                         | `space.4`                           |
| `inset.surface.sm`           | tight surfaces                                | internal padding                         | `space.3`                           |
| `inset.surface.md`           | default surfaces                              | internal padding                         | `space.4`                           |
| `inset.surface.lg`           | spacious surfaces                             | internal padding                         | `space.6`                           |
| `gap.stack.xs`               | tight vertical rhythm                         | sibling spacing via `gap`                | `space.2`                           |
| `gap.stack.sm`               | medium vertical rhythm                        | sibling spacing via `gap`                | `space.3`                           |
| `gap.stack.md`               | default vertical rhythm                       | sibling spacing via `gap`                | `space.4`                           |
| `gap.stack.lg`               | roomy vertical rhythm                         | sibling spacing via `gap`                | `space.6`                           |
| `gap.stack.xl`               | section-level rhythm                          | sibling spacing via `gap`                | `space.8`                           |
| `gap.inline.xs`              | **visual-only** tight grouping (icon + label) | never between interactive targets        | `space.1`                           |
| `gap.inline.sm`              | inline grouping                               | alias of `gap.stack.xs`                  | `space.2`                           |
| `gap.inline.md`              | looser inline grouping                        | alias of `gap.stack.sm`                  | `space.3`                           |
| `gap.inline.lg`              | spacious inline grouping                      | alias of `gap.stack.md`                  | `space.4`                           |
| `gutter.page`                | page outer padding                            | bounded, structural                      | `clamp(space.4, space.6, space.12)` |
| `gutter.section`             | section outer padding                         | bounded, structural                      | `clamp(space.3, space.4, space.12)` |
| `separation.interactive.min` | dense interactive target clusters             | only between click/tap/focusable targets | `clamp(8px, space.2, 12px)`         |

---

#### Example

```js
export const semanticSpacing = {
  inset: {
    control: {
      sm: '{space.2}',
      md: '{space.3}',
      lg: '{space.4}',
    },
    surface: {
      sm: '{space.3}',
      md: '{space.4}',
      lg: '{space.6}',
    },
  },

  gap: {
    stack: {
      xs: '{space.2}',
      sm: '{space.3}',
      md: '{space.4}',
      lg: '{space.6}',
      xl: '{space.8}',
    },
    inline: {
      xs: '{space.1}', // visual-only tight grouping
      sm: '{gap.stack.xs}', // aliases reduce knobs
      md: '{gap.stack.sm}',
      lg: '{gap.stack.md}',
    },
  },

  gutter: {
    page: 'clamp({space.4}, {space.6}, {space.12})',
    section: 'clamp({space.3}, {space.4}, {space.12})',
  },

  separation: {
    interactive: {
      min: 'clamp(8px, {space.2}, 12px)',
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
6. **No responsive logic in components:** responsiveness lives in Core (`space.unit`), not in UI code.

## Decision Matrix (pick fast)

1. **Padding inside an element?** → `inset.control.*` / `inset.surface.*`
2. **Spacing between siblings?** → `gap.stack.*` / `gap.inline.*`
3. **Page/section structure?** → `gutter.page` / `gutter.section`
4. **Dense cluster of interactive targets?** → `separation.interactive.min`

---

## Usage Examples

| Usage                               | Token                                             |
| :---------------------------------- | :------------------------------------------------ |
| Stack (vertical rhythm)             | `gap: semanticSpacing.gap.stack.md`               |
| Inline group (visual grouping)      | `gap: semanticSpacing.gap.inline.sm`              |
| Surface padding                     | `padding: semanticSpacing.inset.surface.md`       |
| Page gutter                         | `padding-inline: semanticSpacing.gutter.page`     |
| Dense toolbar (interactive targets) | `gap: semanticSpacing.separation.interactive.min` |

> Build output may expose semantic tokens as CSS variables (as shown above) or as framework-specific bindings. The semantic names remain the API.

---

## Compatibility: Flex `gap` fallback (only if required)

If your support matrix includes environments without flex-gap support, emit a fallback:

```js
const rowStyles = {
  display: 'flex',
  flexDirection: 'row',
  /* Preferred */
  gap: semanticSpacing.gap.inline.sm,

  /* Fallback */
  '@supports not (gap: 1rem)': {
    '& > * + *': {
      marginLeft: semanticSpacing.gap.inline.sm,
    },
  },
};
```

---

## Theming & Density (allowed knobs)

Themes may tune spacing without renaming semantic tokens.

1. **Tune `space.unit`** (global density + responsiveness)
   - denser: lower clamp bounds
   - airier: higher clamp bounds

2. **Optional density mode (rare)**
   If multiple UI densities are truly needed, remap only:
   - `inset.control.*`
   - `gap.*` (stack + inline aliases)

Keep `gutter.*` and `separation.*` conservative.

---

## Tier-2 Capability: Container-Aware Spacing (optional)

For highly modular layouts (cards in grids, split panes), you may introduce:

- `space.unitCq = clamp(4px, 0.6cqi, 8px)`

This is **not default**. Use it only in layout primitives/surfaces explicitly designed for container scaling.

---

## Summary

- One responsiveness engine: `space.unit`
- Small core step set: `space.{0..16}` (sparse)
- Small semantic set: inset / gap / gutter / separation
- Gap-first, semantic-only consumption
- Responsive by contract, no breakpoint logic in components
