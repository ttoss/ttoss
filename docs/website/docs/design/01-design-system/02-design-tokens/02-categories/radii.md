---
title: Radii
---

# Radii

Radii tokens define the **corner curvature system** of ttoss.

Radii shape the visual character of the interface. They influence:

- **Softness vs sharpness** — how angular or rounded the UI feels
- **Containment** — how clearly a surface feels bounded
- **Affordance** — how interactive elements communicate touchability
- **Consistency** — how shape stays coherent across the product

This system is built on **two explicit layers**:

1. **Core Tokens** — intent-free radius primitives
2. **Semantic Tokens** — stable shape contracts consumed by UI code

Components must always consume **semantic radii**, never core radii directly.

> **Rule:** Core radii are never referenced in components.

---

## Core Tokens

Core radii tokens are intent-free primitives.  
They define the available degrees of corner curvature in the system.

Unlike spacing or typography, radii do **not** need a responsive engine.  
Radii are usually stable across viewport sizes and should remain visually consistent unless a theme intentionally redefines them.

Radii are intentionally stable. Unlike spacing or typography, they do not require a responsive engine by default.  
If a product needs adaptive curvature, it should be handled at the theme or pattern layer, not in the foundational token contract.

### Core set

- `core.radii.none`
- `core.radii.sm`
- `core.radii.md`
- `core.radii.lg`
- `core.radii.xl`
- `core.radii.full`

> Keep the scale small and opinionated. Too many radius steps weaken visual identity.

### Core Token Summary Table

| token        | meaning             | recommended use                                                             |
| :----------- | :------------------ | :-------------------------------------------------------------------------- |
| `core.radii.none` | no rounding         | square shapes, separators, intentionally angular UI                         |
| `core.radii.sm`   | subtle rounding     | compact controls, small details                                             |
| `core.radii.md`   | default rounding    | standard controls and common surfaces                                       |
| `core.radii.lg`   | strong rounding     | prominent surfaces and larger UI containers                                 |
| `core.radii.xl`   | expressive rounding | highly softened surfaces or brand-forward containers                        |
| `core.radii.full` | fully rounded       | pills, capsules, and shapes whose intended form is explicitly fully rounded |

> `core.radii.full` expresses the intent of full roundness. Perfect circles still depend on the element's dimensions.

### Example

```js
const coreRadii = {
  radii: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
};
```

**Expected consumption pattern:** semantic radii reference core tokens by alias.

---

## Semantic Tokens

Semantic radii are anchored in **shape contracts**, not component names.

The semantic set is intentionally **small and stable**.
Its job is to express the structural role of curvature in the interface without turning into component-specific aliases.

### Token structure

```text
radii.{contract}
```

### Semantic contracts

| `contract` | meaning                                                               |
| :--------- | :-------------------------------------------------------------------- |
| `control`  | Radius for interactive controls and touchable UI elements             |
| `surface`  | Radius for surfaces that contain or group content                     |
| `round`    | Full-round shape intent for pills, capsules, and circular affordances |

### Canonical semantic set

- `radii.control`
- `radii.surface`
- `radii.round`

> Keep this set stable. Do not add component-specific radii tokens by default.

### Semantic Tokens Summary Table

| token           | use when you are building…                                         | contract (must be true)                         | default mapping |
| :-------------- | :----------------------------------------------------------------- | :---------------------------------------------- | :-------------- |
| `radii.control` | buttons, inputs, toggles, interactive chips, clickable affordances | the element is primarily an interactive control | `core.radii.md`      |
| `radii.surface` | cards, panels, dialogs, menus, popovers, grouped containers        | the element is primarily a containing surface   | `core.radii.lg`      |
| `radii.round`   | pills, capsules, circular affordances, fully rounded shapes        | the intended shape is explicitly fully rounded  | `core.radii.full`    |

### Example

```js
const semanticRadii = {
  radii: {
    control: '{core.radii.md}',
    surface: '{core.radii.lg}',
    round: '{core.radii.full}',
  },
};
```

---

## Scope: Tokens vs Components vs CSS Overrides

Radii tokens define **shape contracts**. They do not define component variants.

- **Design tokens** define the radius scale and the stable semantic contracts.
- **Components** consume those contracts (`radii.control`, `radii.surface`, `radii.round`).
- **Component-specific corner rules** belong to the component or pattern layer, not the foundation layer.

> Example: an avatar does not need a dedicated `radii.avatar` token.
> If its intended shape is fully rounded, it consumes `radii.round`.

---

## Rules of Engagement (non-negotiable)

1. **Semantic-only consumption:** components use semantic radii only.
2. **Uniform-radius first:** radii tokens define one radius value per token.
3. **No component-specific radii tokens by default:** avoid `radii.avatar`, `radii.toast`, `radii.card`, etc.
4. **Round is an intent, not a component:** use `radii.round` whenever the intended shape is fully rounded.
5. **Theme the core, not the semantics:** brands may make the system more angular or softer by changing core values, never by renaming semantic tokens.

---

## Decision Matrix (pick fast)

1. **Is the element primarily an interactive control?**
   → `radii.control`

2. **Is the element primarily a containing surface?**
   → `radii.surface`

3. **Is the intended shape explicitly fully rounded?**
   → `radii.round`

---

## Advanced CSS Capabilities (escape hatches, not token contracts)

CSS supports more complex corner behavior than the ttoss radii foundation exposes by default, including:

- multiple radius values
- elliptical radii
- logical corner radius properties

These are **valid CSS capabilities**, but they are **not part of the canonical token contract**.

Use them only when layout or internationalization truly requires them.

### Examples of non-token escape hatches

- `border-radius: 8px 24px`
- `border-radius: 16px / 8px`
- `border-start-start-radius`
- `border-start-end-radius`
- `border-end-start-radius`
- `border-end-end-radius`

> If a pattern repeatedly needs corner-specific or logical-corner radii, that should be solved at the pattern/component layer first — not by expanding the foundation tokens prematurely.

---

## Usage Examples

| Usage                                  | Token           |
| :------------------------------------- | :-------------- |
| Standard button radius                 | `radii.control` |
| Card or panel radius                   | `radii.surface` |
| Fully rounded chip or pill             | `radii.round`   |
| Avatar with fully rounded shape intent | `radii.round`   |

> Build output may expose semantic radii as CSS variables or framework-specific bindings. The semantic names remain the API.

---

## Theming

Themes may tune:

- the **core radius scale** (`core.radii.sm`, `core.radii.md`, `core.radii.lg`, etc.)
- the semantic mappings (`radii.control`, `radii.surface`) if a brand intentionally changes the overall shape language

Semantic token names **never change across themes**.

---

## Validation

### Errors (validation must fail when)

- core radii order breaks:
  - `none > sm`
  - `sm > md`
  - `md > lg`
  - `lg > xl`
  - `xl > full`

- `core.radii.full` resolves to `0`, `none`, or an equivalent non-visible radius

### Warning (validation should warn when)

- adjacent core radii steps resolve to the same effective value

- `radii.surface` resolves to a smaller effective radius than `radii.control`

---

## Summary

- Core radii define the available degrees of curvature
- Semantic radii define a small set of stable shape contracts
- Components consume only semantic radii
- Radii is **uniform-radius first**
- Corner-specific and logical-corner radii are **escape hatches**, not canonical tokens
- The system stays small, predictable, and scalable
