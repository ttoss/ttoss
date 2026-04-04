---
title: Opacity
---

# Opacity

Opacity tokens define the **transparency system** of ttoss.

Opacity is a visual modifier.  
It does not carry UI meaning by itself.

Opacity should be used sparingly and only in cases where transparency is the correct mechanism, such as:

- scrims and backdrops
- loading veils
- controlled media dimming

It must be:

- **Restricted** — small and intentionally limited
- **Predictable** — avoid hidden side effects
- **Accessible** — never reduce critical contrast carelessly
- **Separate from color meaning** — most semantic meaning belongs to the color system

> Key principle: **Opacity is a modifier, not a primary semantic language.**

This system is built on **two explicit layers**:

1. **Core Tokens** — intent-free opacity values
2. **Semantic Tokens** — stable transparency contracts consumed by UI code

Components must always consume **semantic opacity tokens**, never core opacity tokens directly.

> **Rule:** Core opacity tokens are never referenced in components.

---

## Scope: Opacity vs Alpha Color

Opacity and alpha color are not the same thing.

- **Opacity** affects the entire element, including its contents.
- **Alpha color** affects only the specific color channel where it is applied.

This means:

- use **opacity tokens** for scrims, veils, and controlled whole-element dimming
- use **semantic color tokens with alpha** when only background, text, or borders should become transparent

> If the intention is “only the background should be translucent”, opacity is usually the wrong tool.

---

## Core Tokens

Core opacity tokens are intent-free numeric values.

They define the allowed transparency steps of the system.

### Core set

| Token              | Value  | Meaning           |
| :----------------- | :----- | :---------------- |
| `core.opacity.0`   | `0`    | fully transparent |
| `core.opacity.25`  | `0.25` | light dimming     |
| `core.opacity.50`  | `0.5`  | medium dimming    |
| `core.opacity.75`  | `0.75` | strong dimming    |
| `core.opacity.100` | `1`    | fully opaque      |

> Keep the scale small. Opacity becomes harder to reason about when too many intermediate values exist.

### Example

```js
const coreOpacity = {
  opacity: {
    0: 0,
    25: 0.25,
    50: 0.5,
    75: 0.75,
    100: 1,
  },
};
```

**Expected consumption pattern:** semantic opacity tokens reference core opacity tokens by alias.

---

## Semantic Tokens

Semantic opacity tokens define the **few cases where transparency is a stable, reusable contract**.

Opacity semantics should remain intentionally small.

### Token structure

```text id="y7v9s9"
opacity.{role}
```

### Canonical semantic set

- `opacity.scrim`
- `opacity.loading`
- `opacity.disabledMedia`

> Keep this set stable.
> Do not use opacity tokens as a generic replacement for semantic color or state tokens.

### Semantic Tokens Summary Table

| token                   | use when you are building…                  | contract (must be true)                           | default mapping   |
| :---------------------- | :------------------------------------------ | :------------------------------------------------ | :---------------- |
| `opacity.scrim`         | modal backdrops, blocking dim layers        | dims content behind a foreground layer            | `core.opacity.50` |
| `opacity.loading`       | loading veils over content or media         | content remains visible but clearly de-emphasized | `core.opacity.50` |
| `opacity.disabledMedia` | disabled visual media or image-like content | whole visual asset may be dimmed safely           | `core.opacity.50` |

### Example

```js id="2r1vph"
const semanticOpacity = {
  opacity: {
    scrim: '{core.opacity.50}',
    loading: '{core.opacity.50}',
    disabledMedia: '{core.opacity.50}',
  },
};
```

---

## What Opacity Should Not Do

Opacity should **not** be the default mechanism for:

- text hierarchy
- icon emphasis
- focus indicators
- borders
- selected state
- error/success/warning meaning
- hiding interactive elements

Those concerns should usually be solved by:

- semantic color tokens
- border/focus tokens
- visibility/display/state logic

> Most state meaning belongs to the color system, not to opacity.

## Rules of Engagement (non-negotiable)

1. **Semantic-only consumption**
   Components use semantic opacity tokens only.

2. **Do not use opacity for text or critical foreground by default**
   Use semantic colors with alpha when needed.

3. **Do not use opacity as a hiding strategy**
   `opacity: 0` does not remove interaction, focus, or DOM presence.

4. **Avoid stacking opacities**
   Nested opacity compounds visually and becomes hard to predict.

5. **Use opacity only where whole-element dimming is intended**
   If only one visual layer should become translucent, use alpha color instead.

6. **Remember layering side effects**
   `opacity < 1` creates a stacking context.

## Decision Matrix (pick fast)

1. **Do you want to dim everything inside the element?**
   → Use an opacity token

2. **Do you want only the background or line color to be translucent?**
   → Use a semantic color token with alpha

3. **Are you trying to communicate UI state or emphasis?**
   → Use the color system first

4. **Are you trying to hide something?**
   → Do not use opacity alone

---

## Usage Examples

| Usage                                   | Token                   |
| :-------------------------------------- | :---------------------- |
| Modal backdrop                          | `opacity.scrim`         |
| Loading veil over a card or media block | `opacity.loading`       |
| Disabled avatar or image-like element   | `opacity.disabledMedia` |

### Example

```css id="0hqlsr"
.modalBackdrop {
  opacity: var(--token-opacity-scrim);
}

.loadingVeil {
  opacity: var(--token-opacity-loading);
}
```

> Build output may expose semantic opacity tokens as CSS variables or framework-specific bindings. The semantic names remain the API.

---

## Accessibility and Interaction Notes

Opacity affects the whole rendered element.

That means:

- it can reduce contrast unexpectedly
- it can dim text and controls unintentionally
- invisible elements may still be interactive if only opacity is changed
- reduced opacity may affect stacking by creating a new stacking context

Use opacity carefully, and always validate:

- readability
- focus behavior
- pointer behavior
- layering behavior

---

## Theming

Themes may tune:

- the core opacity values
- the mapping of `opacity.scrim`, `opacity.loading`, and `opacity.disabledMedia`

Semantic token names **never change across themes**.

---

## Validation

### Errors (validation must fail when)

- core opacity order breaks:
  - `0 > 25`
  - `25 > 50`
  - `50 > 75`
  - `75 > 100`

- any semantic opacity token resolves outside the valid opacity range:
  - less than `0`
  - greater than `1`

- any of these tokens resolves to `0`, `1`, or an equivalent non-translucent value:
  - `opacity.scrim`
  - `opacity.loading`
  - `opacity.disabledMedia`

### Warning (validation should warn when)

- adjacent core opacity steps resolve to the same effective value

---

## Summary

- Opacity is a **restricted modifier**, not a broad semantic state system
- Core tokens define a small transparency scale
- Semantic tokens stay intentionally minimal
- Use opacity for scrims, loading veils, and controlled media dimming
- Use semantic colors instead when only one visual layer should be transparent
- Keep the family small, explicit, and hard to misuse
