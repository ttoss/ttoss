---
title: Borders
---

# Borders

Border tokens define the **line system** of ttoss: the widths, styles, and semantic contracts used to separate, contain, select, and focus interface elements.

Borders must be:

- **Structural** — clarify containment and separation without replacing layout
- **Predictable** — remain small, stable, and easy to choose
- **Accessible** — support clear selected and focus states
- **Composable** — work with semantic color tokens rather than duplicating color meaning
- **Durable** — avoid component-specific drift

This system is built on **two explicit layers**:

1. **Core Tokens** — intent-free line primitives
2. **Semantic Tokens** — stable line contracts consumed by UI code

Components must always consume **semantic border tokens**, never core border tokens directly.

> **Rule:** Core border tokens are never referenced in components.

---

## Scope: Border vs Outline vs Focus

This family governs the **line system** of the interface, but not every line is implemented with the same CSS mechanism.

- **Border** defines the line inside the element’s box model
- **Outline** defines a line outside the border and is often the preferred mechanism for focus indicators
- **Focus** is a distinct accessibility contract that may use line primitives, but is not treated as an ordinary outline-at-rest
- **Color** defines semantic meaning and belongs to the color system

This means:

- border tokens define **width** and **style**
- semantic color tokens define **color**
- focus indicators may consume line primitives, but they remain a separate semantic contract

> Key principle: borders define **stroke contracts**, not full visual meaning.


## Core Tokens

Core border tokens are intent-free primitives.  
They define the physical characteristics of lines in the system.

Borders do **not** require a responsive engine.  
Line thickness should remain stable across viewport sizes to preserve consistency and accessibility.

### Core Token Set

Core border tokens are organized into two groups:

1. **Widths** — line thickness
2. **Styles** — line pattern

#### Border Widths

| Token                   | Meaning                | Recommended use                               |
| :---------------------- | :--------------------- | :-------------------------------------------- |
| `core.border.width.none`     | no line                | borderless or reset cases                     |
| `core.border.width.default`  | standard line width    | default dividers and outlines                 |
| `core.border.width.selected` | stronger line emphasis | selected/current items when thickness changes |
| `core.border.width.focused`  | focus ring thickness   | accessible focus indicators                   |

#### Border Styles

| Token                 | Meaning          | Recommended use                            |
| :-------------------- | :--------------- | :----------------------------------------- |
| `core.border.style.solid`  | continuous line  | default borders, outlines, and focus rings |
| `core.border.style.dashed` | interrupted line | optional alternate structural emphasis     |
| `core.border.style.dotted` | dotted line      | rare, low-frequency utility use            |
| `core.border.style.none`   | no visible line  | reset cases                                |

> Keep the core set small. Border systems become unstable when too many widths or styles are introduced.

### Example

```js
const coreBorder = {
  border: {
    width: {
      none: '0px',
      default: '1px',
      selected: '2px',
      focused: '2px',
    },

    style: {
      solid: 'solid',
      dashed: 'dashed',
      dotted: 'dotted',
      none: 'none',
    },
  },
};
```

**Expected consumption pattern:** semantic line tokens reference core border tokens by alias.


## Semantic Tokens

Semantic border tokens define the **function** of a line in the interface.

They are intentionally anchored in **structural role**, not in component names.

### Token structure

```text
{family}.{role}.{context?}
```

* `family`: `border` or `focus`
* `role`: `divider | outline | selected | ring`
* `context`: `surface | control` (only where needed)

### Canonical semantic set

* `border.divider`
* `border.outline.surface`
* `border.outline.control`
* `border.selected`
* `focus.ring`

> Keep this set stable.
> Do not introduce component-specific line tokens by default (`border.input`, `border.card`, `border.tab`, etc.).

### Semantic Tokens Summary Table

| token| use when you are building…| contract (must be true)| default mapping|
| :--- | :--- | :--- | :--- |
| `border.divider` | separators between content groups | purely structural; low emphasis | `core.border.width.default` + `core.border.style.solid` |
| `border.outline.surface` | cards, panels, dialogs, menus, grouped surfaces | defines surface boundary | `core.border.width.default` + `core.border.style.solid` |
| `border.outline.control` | buttons, inputs, toggles, interactive controls | defines control boundary | `core.border.width.default` + `core.border.style.solid` |
| `border.selected` | active tabs, selected rows, chosen items | selection/current state changes thickness  | `core.border.width.selected` + `core.border.style.solid` |
| `focus.ring` | keyboard focus indicators | must remain clearly visible and accessible | `core.border.width.focused` + `core.border.style.solid` |

### Example

```js
const semanticBorder = {
  border: {
    divider: {
      width: '{core.border.width.default}',
      style: '{core.border.style.solid}',
    },

    outline: {
      surface: {
        width: '{core.border.width.default}',
        style: '{core.border.style.solid}',
      },

      control: {
        width: '{core.border.width.default}',
        style: '{core.border.style.solid}',
      },
    },

    selected: {
      width: '{core.border.width.selected}',
      style: '{core.border.style.solid}',
    },
  },

  focus: {
    ring: {
      width: '{core.border.width.focused}',
      style: '{core.border.style.solid}',
    },
  },
};
```

---

## Color Pairing

Border tokens define **geometry only**.
They do not define semantic meaning through color.

To express meaning, pair line tokens with semantic color tokens.

### Example

```css
border: var(--token-border-outline-control-width)
  var(--token-border-outline-control-style)
  var(--token-input-primary-border-default);
```

Typical pairings:

* `border.divider` + a muted semantic border color
* `border.outline.surface` + a neutral semantic border color
* `border.outline.control` + an input/control semantic border color
* `border.selected` + a selected/current semantic border color
* `focus.ring` + a focused semantic border color

> Width and style express **how strong the line is**.
> Color expresses **what the line means**.


## Focus Implementation

`focus.ring` is a semantic line contract, but it is usually implemented with **`outline`** rather than `border`.

This is preferred because:

* outline sits outside the border
* it avoids layout shift
* it supports clearer accessible focus indicators

Typical implementation details such as `outline-offset` belong to the implementation layer unless the system later promotes them into tokens.

### Example

```css
:focus-visible {
  outline-width: var(--token-focus-ring-width);
  outline-style: var(--token-focus-ring-style);
  outline-color: var(--token-input-primary-border-focused);
  outline-offset: 2px;
}
```

> Use `focus.ring` as the semantic source of truth.
> Implement it with `outline` when that produces the best accessible result.


## Scope: Tokens vs Components vs Edge Selection

Line tokens define **line contracts**.
They do not define component-specific APIs.

* **Design tokens** define widths, styles, and semantic line roles
* **Components** choose where the line is applied (all sides, top only, bottom only, etc.)
* **Patterns** may decide which edge carries the line

This means:

* edge selection belongs to the component or pattern layer
* line tokens remain stable and reusable
* the token system avoids exploding into edge-specific or component-specific names

> Example: an active tab may consume `border.selected`, while the tab component decides that the line appears only on the bottom edge.


## Rules of Engagement (non-negotiable)

1. **Semantic-only consumption:** components use semantic line tokens only
2. **Color meaning stays in the color system:** line tokens never encode error/success/warning meaning by themselves
3. **Focus is distinct from outline-at-rest:** `focus.ring` is a dedicated semantic contract
4. **Do not create component-specific line tokens by default:** avoid `border.input`, `border.card`, `border.table`, etc.
5. **Do not use borders as a substitute for layout:** use spacing and structure first; borders complement separation
6. **Do not overuse style variation:** default to `solid`; use `dashed` or `dotted` only when the pattern truly needs it


## Decision Matrix

1. **Is this line separating groups of content?**
   → `border.divider`

2. **Is this the default boundary of a containing surface?**
   → `border.outline.surface`

3. **Is this the default boundary of an interactive control?**
   → `border.outline.control`

4. **Is this indicating selected/current state through stronger thickness?**
   → `border.selected`

5. **Is this a keyboard/programmatic focus indicator?**
   → `focus.ring`


## Usage Examples

| Usage                          | Token                    |
| :----------------------------- | :----------------------- |
| Card or panel outline          | `border.outline.surface` |
| Input or button outline        | `border.outline.control` |
| Divider between content groups | `border.divider`         |
| Selected tab / active row      | `border.selected`        |
| Focus ring                     | `focus.ring`             |

> Build output may expose semantic line tokens as CSS variables or framework-specific bindings. The semantic names remain the API.


## Advanced CSS Capabilities (escape hatches, not token contracts)

CSS supports more line complexity than the ttoss foundation exposes by default, including:

* per-side borders
* multiple width values
* separate outline properties
* offset outlines

These are valid implementation capabilities, but they are **not part of the canonical semantic token contract**.

Use them only when layout, interaction, or accessibility truly requires them.

Examples:

* `border-bottom-width`
* `border-inline-start`
* `outline`
* `outline-offset`

> If a pattern repeatedly needs specialized edge logic, solve it at the pattern/component layer first — not by expanding the foundation tokens prematurely.


## Theming

Themes may tune:

* core border widths (`core.border.width.*`)
* core border styles (`core.border.style.*`)
* semantic mappings if the overall line language of the brand changes

Semantic token names **never change across themes**.

---

## Validation

### Errors (validation must fail when)

- `border.selected` resolves to a width weaker than `border.outline.*`
- `focus.ring` resolves to a width weaker than `border.outline.*`
- `border.selected` resolves to `none`, `0`, or an equivalent non-visible line
- `focus.ring` resolves to `none`, `0`, or an equivalent non-visible line
- generated output collapses `focus.ring` and `border.outline.*` into the same effective line contract

### Warning (validation should warn when)

- `border.selected` resolves to the same effective line contract as the resting outline
- `focus.ring` resolves to the same effective line contract as the resting outline

---

## Summary

* Core tokens define the available line widths and styles
* Semantic tokens define a small set of stable line contracts
* Border color remains in the color system
* Focus is a dedicated semantic contract and is usually implemented with `outline`
* Edge-specific behavior belongs to components and patterns, not to the foundation tokens
* The system stays small, predictable, and scalable
