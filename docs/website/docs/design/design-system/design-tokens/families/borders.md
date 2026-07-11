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

## Scope: line geometry only

Border tokens define the **line system** of the interface: width and style. Colour belongs to [colors](./colors.md). Edge selection (top/bottom/inline-start) belongs to components.

Two CSS mechanisms render lines, and the family covers both:

- **`border`** — lines inside the box model. Default mechanism for `divider`, `outline.{surface,control,selected}`.
- **`outline`** — lines outside the box model. Preferred mechanism for `focus.ring` (no layout shift, clearer a11y).

> The token role `outline` (a grouping under `semantic.border.*`) and the CSS property `outline` are not the same thing. The former is a namespace for at-rest boundary contracts; the latter is a render mechanism. `focus.ring` is the only contract that _must_ render via the CSS `outline` property; `border.outline.*` may render either way depending on the component.

## Pairing with colour

Border tokens carry no colour. Every visible line is a composition:

```text
stroke = semantic.border.{token}.{width,style}     (geometry, this family)
       + semantic.colors.{ux}.{role}.border.{state} (colour, colors family)
```

Focus is the same composition with one difference — see [Focus Implementation](#focus-implementation) for which colour to pick.

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

| Token                        | Meaning                | Recommended use                               |
| :--------------------------- | :--------------------- | :-------------------------------------------- |
| `core.border.width.none`     | no line                | borderless or reset cases                     |
| `core.border.width.default`  | standard line width    | default dividers and outlines                 |
| `core.border.width.selected` | stronger line emphasis | selected/current items when thickness changes |
| `core.border.width.focused`  | focus ring thickness   | accessible focus indicators                   |

#### Border Styles

| Token                      | Meaning          | Recommended use                            |
| :------------------------- | :--------------- | :----------------------------------------- |
| `core.border.style.solid`  | continuous line  | default borders, outlines, and focus rings |
| `core.border.style.dashed` | interrupted line | optional alternate structural emphasis     |
| `core.border.style.dotted` | dotted line      | rare, low-frequency utility use            |
| `core.border.style.none`   | no visible line  | reset cases                                |

> **Naming note:** Border width names (`default`, `selected`, `focused`) look like state names but are not UI intent in the sense prohibited by model.md §1. They are positions in a four-step scale named by their canonical use-site — a deliberate choice that encodes an ordering constraint: `focused ≥ selected > default > none`. A purely ordinal scheme (`0, 1, 2, 3`) would lose this constraint from the name and JSDoc alone. Themes may remap the semantic layer (e.g., map `outline.selected.width` to `core.border.width.default` when selection is expressed through color only, not thickness) — the indirection is not ceremonial. The prohibition in §1 targets component-specific or context-specific names (`core.border.width.button`, `core.border.width.card`), not canonical use-site names in a small, closed scale.

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

- `family`: `border` or `focus`
- `role`: `divider | outline | ring`
- `context`: `surface | control | selected` (only where needed)

### Canonical semantic set

- `border.divider`
- `border.outline.surface`
- `border.outline.control`
- `border.outline.selected`
- `focus.ring` — width + style + **color**; the color field is the system-wide focus default (cross-cutting infrastructure, see [model.md §6](../model.md#6-no-parallel-vocabulary))

> Keep this set stable.
> Do not introduce component-specific line tokens by default (`border.input`, `border.card`, `border.tab`, etc.).

### Semantic Tokens Summary Table

| token                     | use when you are building…                      | contract (must be true)                                                                    | default mapping                                                                       |
| :------------------------ | :---------------------------------------------- | :----------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| `border.divider`          | separators between content groups               | purely structural; low emphasis                                                            | `core.border.width.default` + `core.border.style.solid`                               |
| `border.outline.surface`  | cards, panels, dialogs, menus, grouped surfaces | defines surface boundary                                                                   | `core.border.width.default` + `core.border.style.solid`                               |
| `border.outline.control`  | buttons, inputs, toggles, interactive controls  | defines control boundary                                                                   | `core.border.width.default` + `core.border.style.solid`                               |
| `border.outline.selected` | active tabs, selected rows, chosen items        | selection/current state changes thickness                                                  | `core.border.width.selected` + `core.border.style.solid`                              |
| `focus.ring`              | keyboard focus indicators                       | must remain clearly visible and accessible; carries width + style + color (system default) | `core.border.width.focused` + `core.border.style.solid` + `semantic.focus.ring.color` |

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

      selected: {
        width: '{core.border.width.selected}',
        style: '{core.border.style.solid}',
      },
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
They do not define semantic meaning through colour.

To express meaning, pair line tokens with semantic color tokens:

```css
border: var(--token-border-outline-control-width)
  var(--token-border-outline-control-style)
  var(--token-input-primary-border-default);
```

Typical pairings:

- `border.divider` + `informational.muted.border.default`
- `border.outline.surface` + `informational.muted.border.default`
- `border.outline.control` + `{ux}.{role}.border.default` (per the component’s `{ux}`)
- `border.outline.selected` + `{ux}.{role}.border.selected`
- `focus.ring` + focus colour — see [Focus Implementation](#focus-implementation) for the rule

> Width and style express **how strong the line is**.
> Colour expresses **what the line means**.

## Focus Implementation

`focus.ring` is a semantic line contract for keyboard/programmatic focus. It carries `width`, `style`, **and** `color` — the colour field exists because focus needs a system-wide default that no `{ux}` owns (see [model.md §6](../model.md#6-no-parallel-vocabulary)).

Render via CSS `outline`, not `border`: outlines sit outside the box, avoid layout shift, and produce clearer a11y indicators.

### Which focus colour

| The component is…                                                                         | Use                                                                       |
| :---------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| an `Action` / `Input` / `Navigation` / `Feedback` (clear FSL Entity Kind)                 | `{ux}.{role}.border.focused` from `semantic.colors.*`                     |
| an `Informational` surface made interactive (focusable Card, profile chip, custom widget) | `semantic.focus.ring.color` (system default)                              |
| an `Input` with `negative` or `caution` valence where focus must inherit the valence      | `input.{negative\|caution}.border.focused` (overrides the system default) |

The two paths are not duplicates — per-context tokens answer "how does _this_ `{ux}` look when focused?"; `focus.ring.color` answers "what is the _system_ default when no `{ux}` applies?". Pick by which question the component is asking.

### Example

```css
/* Focusable profile card — no obvious {ux}: use the system default */
.card:focus-visible {
  outline-width: var(--tt-focus-ring-width);
  outline-style: var(--tt-focus-ring-style);
  outline-color: var(--tt-focus-ring-color);
  outline-offset: 2px;
}

/* Input in error — negative valence overrides the system default */
.input--error:focus-visible {
  outline-width: var(--tt-focus-ring-width);
  outline-style: var(--tt-focus-ring-style);
  outline-color: var(--tt-input-negative-border-focused);
  outline-offset: 2px;
}
```

> `outline-offset` belongs to the implementation layer unless the system later promotes it into a token.

## Scope: Tokens vs Components vs Edge Selection

Line tokens define **line contracts**.
They do not define component-specific APIs.

- **Design tokens** define widths, styles, and semantic line roles
- **Components** choose where the line is applied (all sides, top only, bottom only, etc.)
- **Patterns** may decide which edge carries the line

This means:

- edge selection belongs to the component or pattern layer
- line tokens remain stable and reusable
- the token system avoids exploding into edge-specific or component-specific names

> Example: an active tab may consume `border.outline.selected`, while the tab component decides that the line appears only on the bottom edge.

## Rules of Engagement (non-negotiable)

1. **Semantic-only consumption:** components use semantic line tokens only
2. **Color meaning stays in the color system:** line tokens never encode error/success/warning meaning by themselves
3. **Focus is distinct from outline-at-rest:** `focus.ring` is a dedicated semantic contract
4. **Do not create component-specific line tokens by default:** avoid `border.input`, `border.card`, `border.table`, etc.
5. **Do not use borders as a substitute for layout:** use spacing and structure first; borders complement separation
6. **Do not overuse style variation:** default to `solid`; use `dashed` or `dotted` only when the pattern truly needs it

## Decision Matrix

1. **Separating groups of content?** → `border.divider`
2. **Default boundary of a containing surface?** → `border.outline.surface`
3. **Default boundary of an interactive control?** → `border.outline.control`
4. **Selected/current state shown through stronger thickness?** → `border.outline.selected`
5. **Keyboard/programmatic focus indicator?** → `focus.ring` for geometry; for colour, see [Which focus colour](#which-focus-colour)

## Usage Examples

| Usage                          | Token                     |
| :----------------------------- | :------------------------ |
| Card or panel outline          | `border.outline.surface`  |
| Input or button outline        | `border.outline.control`  |
| Divider between content groups | `border.divider`          |
| Selected tab / active row      | `border.outline.selected` |
| Focus ring                     | `focus.ring`              |

> Build output may expose semantic line tokens as CSS variables or framework-specific bindings. The semantic names remain the API.

## Advanced CSS Capabilities (escape hatches, not token contracts)

CSS supports more line complexity than the ttoss foundation exposes by default, including:

- per-side borders
- multiple width values
- separate outline properties
- offset outlines

These are valid implementation capabilities, but they are **not part of the canonical semantic token contract**.

Use them only when layout, interaction, or accessibility truly requires them.

Examples:

- `border-bottom-width`
- `border-inline-start`
- `outline`
- `outline-offset`

> If a pattern repeatedly needs specialized edge logic, solve it at the pattern/component layer first — not by expanding the foundation tokens prematurely.

## Theming

Themes may tune:

- core border widths (`core.border.width.*`)
- core border styles (`core.border.style.*`)
- semantic mappings if the overall line language of the brand changes

Semantic token names **never change across themes**.

---

## Validation

### Errors (validation must fail when)

- `border.outline.selected` resolves to a width weaker than `border.outline.{surface,control}`
- `focus.ring` resolves to a width weaker than `border.outline.*`
- `border.outline.selected` resolves to `none`, `0`, or an equivalent non-visible line
- `focus.ring` resolves to `none`, `0`, or an equivalent non-visible line
- generated output collapses `focus.ring` and `border.outline.*` into the same effective line contract

### Warning (validation should warn when)

- `border.outline.selected` resolves to the same effective line contract as the resting outline
- `focus.ring` resolves to the same effective line contract as the resting outline

---

## Summary

- Core tokens define the available line widths and styles
- Semantic tokens define a small set of stable line contracts
- Border color remains in the color system
- Focus is a dedicated semantic contract and is usually implemented with `outline`
- Edge-specific behavior belongs to components and patterns, not to the foundation tokens
- The system stays small, predictable, and scalable
