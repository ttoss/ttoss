---
title: Z-Index
---

# Z-Index

Z-index tokens define the **global layering system** of ttoss.

They do not describe visual style.  
They define **which interface strata sit above others** in the normal stacking order of the application.

Z-index tokens are used for:

- sticky interface regions
- floating overlays
- blocking overlays
- transient topmost UI inside the normal application layer

They must be:

- **Structural** — represent interface strata, not components
- **Predictable** — form a small, stable hierarchy
- **Deliberate** — discourage arbitrary numbers
- **Context-aware** — work with stacking contexts, not against them

> Key principle: **z-index defines layer strata, not component names.**

This system is built on **two explicit layers**:

1. **Core Tokens** — intent-free numeric levels
2. **Semantic Tokens** — stable layer contracts consumed by UI code

Components must always consume **semantic z-index tokens**, never core z-index values directly.

> **Rule:** Core z-index tokens are never referenced in components.

---

## Scope: Z-Index vs Stacking Context vs Top Layer

Z-index only works **within the relevant stacking context**.

This means:

- a higher `z-index` does **not** guarantee that an element will appear above everything else
- ancestor stacking contexts can isolate descendants
- local layering and global layering are different concerns

Also, browser-managed **top layer** elements (such as modal dialogs or popovers promoted by the platform) are **outside** the normal z-index scale.

### This family governs

- the **normal application stacking system**
- viewport-level and app-level layer order
- semantic layer relationships inside the standard document tree

### This family does not govern

- the browser **top layer**
- local micro-layering inside a single component
- visual depth (that belongs to elevation)

> Z-index controls **ordering**, not depth.  
> Elevation expresses depth.  
> Top layer is a browser-level exception.

---

## Core Tokens

Core z-index tokens are intent-free numeric levels.

They define the ordered strata available to the system.

### Core set

| Token            | Value | Meaning                                         |
| :--------------- | ----: | :---------------------------------------------- |
| `core.zIndex.level.0` |   `0` | base application layer                          |
| `core.zIndex.level.1` | `100` | sticky layer                                    |
| `core.zIndex.level.2` | `200` | overlay layer                                   |
| `core.zIndex.level.3` | `300` | modal layer                                     |
| `core.zIndex.level.4` | `400` | transient top layer inside the normal app stack |

> Values are spaced intentionally to leave room for controlled local layering when necessary.

### Example

```js
const coreZIndex = {
  zIndex: {
    level: {
      0: 0,
      1: 100,
      2: 200,
      3: 300,
      4: 400,
    },
  },
};
```

**Expected consumption pattern:** semantic z-index tokens reference core levels by alias.

---

## Semantic Tokens

Semantic z-index tokens define **global layer roles**.

They are intentionally anchored in **interface strata**, not component names.

### Token structure

```text
z.layer.{stratum}
```

### Canonical semantic set

- `z.layer.base`
- `z.layer.sticky`
- `z.layer.overlay`
- `z.layer.modal`
- `z.layer.transient`

> Keep this set stable.
> Do not create component-specific z-index tokens by default (`z.dropdown`, `z.tooltip`, `z.toast`, etc.).

### Semantic Tokens Summary Table

| token               | use when you are building…                                                                      | contract (must be true)                                           | default mapping  |
| :------------------ | :---------------------------------------------------------------------------------------------- | :---------------------------------------------------------------- | :--------------- |
| `z.layer.base`      | page content and normal document flow                                                           | default application layer                                         | `core.zIndex.level.0` |
| `z.layer.sticky`    | sticky headers, sticky navigation, anchored persistent bars                                     | must remain above normal content while still inside the app stack | `core.zIndex.level.1` |
| `z.layer.overlay`   | non-blocking overlays such as dropdowns, menus, popovers, floating panels                       | floats above sticky/base content but does not block the whole app | `core.zIndex.level.2` |
| `z.layer.modal`     | blocking overlays such as dialogs, sheets, blocking drawers                                     | sits above other overlays and blocks interaction behind it        | `core.zIndex.level.3` |
| `z.layer.transient` | transient topmost UI inside the normal stack, such as toasts or tooltip-like transient overlays | highest application-controlled layer before browser top layer     | `core.zIndex.level.4` |

### Example

```js
const semanticZIndex = {
  z: {
    layer: {
      base: '{core.zIndex.level.0}',
      sticky: '{core.zIndex.level.1}',
      overlay: '{core.zIndex.level.2}',
      modal: '{core.zIndex.level.3}',
      transient: '{core.zIndex.level.4}',
    },
  },
};
```

---

## Stacking Context Awareness

Z-index tokens do **not** bypass stacking context rules.

Common properties that may create new stacking contexts include:

- `position: sticky`
- `opacity < 1`
- `transform`
- `filter`
- `isolation: isolate`
- `contain`
- `container-type`
- flex or grid items with explicit `z-index`

This means a correctly chosen semantic token can still appear “wrong” if the element lives inside an isolated stacking context.

> Use z-index tokens to define **intended stratum**.
> Use implementation discipline to avoid accidental stacking context traps.

---

## Local Layering vs Global Layering

This family defines **global application strata**.

Do not use global z-index tokens for every internal detail of a component.

Examples of **local layering**:

- a close button inside a dialog
- a sticky subheader inside a panel
- decorative layers inside a card
- internal handles, highlights, or overlays inside a component

These should usually be solved **locally**, within the component’s own stacking context.

> Global z-index tokens are for **cross-component layer relationships**.
> Local layering belongs to the component or pattern layer.

---

## Top Layer

Some browser features promote elements into the **top layer**, which sits above the normal stacking system.

Examples include:

- modal dialogs shown by the platform
- popovers promoted to top layer
- fullscreen elements

These are **not governed** by ttoss z-index tokens.

> Z-index tokens govern the normal application stack.
> The browser top layer is outside that contract.

---

## Rules of Engagement (non-negotiable)

1. **Semantic-only consumption**
   Components use semantic z-index tokens only.

2. **Strata, not components**
   Z-index tokens define interface layers, not component names.

3. **Do not use arbitrary large numbers**
   Avoid `9999`, `99999`, or ad-hoc escalation.

4. **Do not treat z-index as a global guarantee**
   Always consider stacking context boundaries.

5. **Use global tokens only for global layering**
   Internal component layering should remain local whenever possible.

6. **Top layer is out of scope**
   Do not try to model browser top-layer behavior as normal z-index tokens.

---

## Decision Matrix (pick fast)

1. **Is this normal page content?**
   → `z.layer.base`

2. **Is this a persistent sticky interface region?**
   → `z.layer.sticky`

3. **Is this a floating non-blocking overlay?**
   → `z.layer.overlay`

4. **Is this a blocking overlay that owns interaction?**
   → `z.layer.modal`

5. **Is this a transient topmost UI element inside the normal application stack?**
   → `z.layer.transient`

6. **Is this actually a browser top-layer element?**
   → z-index token does not govern it

---

## Usage Examples

| Usage                             | Token               |
| :-------------------------------- | :------------------ |
| Main page content                 | `z.layer.base`      |
| Sticky top navigation             | `z.layer.sticky`    |
| Dropdown / menu / floating panel  | `z.layer.overlay`   |
| Dialog / blocking drawer          | `z.layer.modal`     |
| Toast / transient tooltip-like UI | `z.layer.transient` |

> Build output may expose semantic z-index tokens as CSS variables or framework-specific bindings. The semantic names remain the API.

---

## Theming

Z-index is usually **not themed**.

It is layout infrastructure, not brand expression.

If an application truly needs a different layer hierarchy, adjust the scale **as a system**, not by changing one token in isolation.

---

## Validation

### Errors (validation must fail when)

- core z-index order breaks:
  - `level.0 >= level.1`
  - `level.1 >= level.2`
  - `level.2 >= level.3`
  - `level.3 >= level.4`

- `core.zIndex.level.0` resolves below `0`

- semantic layer order breaks:
  - `z.layer.base >= z.layer.sticky`
  - `z.layer.sticky >= z.layer.overlay`
  - `z.layer.overlay >= z.layer.modal`
  - `z.layer.modal >= z.layer.transient`

### Warning (validation should warn when)

- adjacent core z-index levels differ by less than `10`

---

## Summary

- Z-index defines **global interface strata**
- Core tokens define numeric levels
- Semantic tokens define stable layer roles
- Components consume only semantic z-index tokens
- The family governs the **normal application stack**, not the browser top layer
- Local layering remains outside the global token contract
- The system stays small, predictable, and durable
