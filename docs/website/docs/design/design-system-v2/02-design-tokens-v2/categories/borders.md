---
title: Borders
---

# Borders

Border tokens define the widths and styles of lines used to separate or highlight UI elements. Consistent borders contribute to a clean and structured design.

## Core border tokens

Core borders live under `borders.width.<size>` and `borders.style.<style>`.

### Widths

Recommended sizes:

| Token                    | Value | Use case                             |
| ------------------------ | ----: | ------------------------------------ |
| `borders.width.0`        |   `0` | No border                            |
| `borders.width.hairline` | `1px` | Hairlines and subtle dividers        |
| `borders.width.sm`       | `2px` | Standard outlines                    |
| `borders.width.md`       | `4px` | Emphasis outlines (e.g. focus rings) |

### Styles

Supported styles include `solid`, `dashed`, `dotted`, `none`. For example: `borders.style.solid`, `borders.style.dashed`.

## Semantic border tokens

Semantic borders map to core widths and styles for specific purposes:

- `border.divider` – Thin lines separating content groups (maps to `borders.width.hairline` & `borders.style.solid` with a neutral color).
- `border.outline` – Standard outlines for cards and components.
- `border.focus` – Focus ring width and style (combine with a focus color token).
- `border.input` – Default border for input fields in various states.

By using semantic names you can adjust borders globally for dark themes or accessibility modes.

## Combining with colours

Border tokens only define width and style. To specify the colour, combine them with a color dimension token. For example:

```css
border: borders.width.sm borders.style.solid
  var(--token-input-primary-border-default);
```

Here `var(--token-input-primary-border-default)` resolves to a semantic color token.

## Guidelines

1. **Use hairline borders sparingly.** Hairlines are thin and may disappear on some screens. Prefer thicker borders for focus states or high‑contrast designs.
2. **Do not mix styles in the same component.** Keep outlines consistent.
3. **Avoid using borders to simulate dividers.** Use spacing and layout to separate elements; borders should complement, not substitute, structure.

Borders add structure and feedback to your UI. Tokens ensure they remain consistent across contexts.
