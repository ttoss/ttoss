---
title: Naming & Taxonomy
---

# Naming & Taxonomy

Consistent naming makes tokens discoverable and self‑documenting. We use a **path‑like notation** of segments separated by dots. Each segment belongs to a fixed vocabulary depending on whether the token is core or semantic.

## Core token naming

Core tokens describe raw values and live under `core.<family>`:

- **Colors:** `colors.<hue>.<scale>`  
  Examples: `colors.brand.500`, `colors.neutral.200`. Choose a descriptive hue (brand, neutral, accent, success, warning, error, info) and a numeric scale from lightest (50) to darkest (900).

- **Spacing:** `spacing.<step>`  
  Steps represent multiples of a base unit (e.g. `0`, `0.5`, `1`, `2`, `3`, etc.), mapping to pixel values according to the spacing scale.

- **Radii:** `radii.none`, `radii.sm`, `radii.md`, `radii.lg`, `radii.full`.

- **Elevation:** `elevation.core.level.<0–5>`.

- **Opacity:** `opacity.<step>` where `step` is a percentage or decimal (e.g. `opacity.50` equals 50% opacity).

- **Typography:** `font.family.<name>`, `font.weight.<name>`, `font.size.<step>`, `font.lineHeight.<step>`, `font.letterSpacing.<step>`.

Use lowercase letters and avoid abbreviations unless widely recognized (e.g. `md`, `lg`). Core token names must not encode usage or context.

## Semantic token naming

Semantic tokens indicate **where and why** a value is used. Their structure is:

```
<context>.<role>.<dimension>[.<state>]
```

- **Context:** where in the UI the token applies. Valid contexts include: `navigation`, `input`, `action`, `content`, `feedback`, `surface`, `overlay`, `dataviz`. You may extend this list judiciously when introducing new design patterns.

- **Role:** describes the hierarchy or meaning. Roles are limited to `primary`, `secondary`, `tertiary`, `neutral`, `positive`, `negative`, `warning` and `info`. Use only one role per token.

- **Dimension:** which aspect of an element is coloured: `background`, `text`, `border`, `icon`, `overlay` or `outline`.

- **State (optional):** interaction or UI state: `default`, `hover`, `active`, `focus`, `disabled`, `selected`, `visited`.

For example, `input.primary.border.focus` refers to the border colour of a primary input field when focused. Semantic tokens for elevation, typography, spacing and sizing follow similar patterns using context, role and dimension as appropriate.

## Rules of thumb

1. **Be explicit:** a token name should describe its purpose. Names like `secondary.color1` are insufficient; instead use `action.secondary.background.hover`.
2. **Never duplicate values:** if two tokens refer to the same core value, they still deserve distinct semantic names because their contexts differ.
3. **Stay within the vocabulary:** if you need a new context or role, propose it via governance rather than improvising a new segment.
4. **Avoid redundancy:** do not repeat the family in the semantic name (`color.action.primary...` is redundant; simply `action.primary...`).

Names are part of your API. Changing them is a breaking change, so choose them with care.
