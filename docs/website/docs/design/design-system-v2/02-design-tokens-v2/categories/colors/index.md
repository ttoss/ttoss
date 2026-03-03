---
title: Colors
---

# Colors

Color is one of the most expressive design elements. Our color tokens enable consistent palettes across brands, themes and modes. This page covers **core** color values and **semantic** color tokens. Additional pages dive into the semantics of UX contexts, roles, dimensions, states and data visualization.

## Core color tokens

Core colours are grouped into _hues_ such as `brand`, `neutral`, `positive`, `negative`, `warning` and `info`. Each hue defines a scale from 50 (lightest) to 900 (darkest). For example:

| Hue     | Scale | Example value |
| ------- | ----: | ------------- |
| brand   |    50 | `#EFF6FF`     |
|         |   500 | `#3B82F6`     |
|         |   700 | `#1D4ED8`     |
| neutral |     0 | `#FFFFFF`     |
|         |   200 | `#E5E7EB`     |
|         |   900 | `#111827`     |

The scale is not linear; it is designed by your brand team to ensure harmonious shades and sufficient contrast. Core color names do not encode usage. They provide the raw palette used by all themes.

### Creating core colours

When defining a new hue, provide at least three steps: a light, a midtone and a dark. Avoid too many near‑identical steps; each should serve a purpose (e.g. backgrounds vs borders vs text). Document the intended usage and ensure that the palette meets contrast requirements for both light and dark themes.

## Semantic color tokens

Semantic colours map the raw palette into meaningful contexts. They follow the grammar `context.role.dimension.state`. For example:

- `navigation.primary.background.default`: the default background of a primary navigation container.
- `content.secondary.text.disabled`: the color of disabled secondary text within the content area.
- `feedback.negative.icon.default`: the icon color for negative feedback (e.g. error messages).

Semantic names may look verbose, but they encode everything you need to know at a glance. Components consume only these names. The underlying values are resolved per theme.

### Examples

| Semantic token                          | Description                    | Light theme           | Dark theme            |
| --------------------------------------- | ------------------------------ | --------------------- | --------------------- |
| `navigation.primary.background.default` | Top bar background             | `colors.brand.500`    | `colors.brand.300`    |
| `action.secondary.text.hover`           | Secondary button text on hover | `colors.brand.700`    | `colors.brand.200`    |
| `feedback.positive.icon.default`        | Success icon color             | `colors.positive.600` | `colors.positive.400` |

The semantic layer also ensures accessibility. For instance, hover states darken or lighten appropriately to meet contrast ratios.

### Additional pages

Color semantics are rich and deserve dedicated guidance:

- [UX contexts](./ux) — defines _where_ a color is used (navigation, input, content, action, feedback, dataviz).
- [Roles](./role) — defines _why_ a color is used (primary, secondary, neutral, positive, negative, warning, info).
- [Dimensions](./dimension) — defines _which part_ of the element the color applies to (background, text, border, icon, overlay).
- [States](./state) — defines _when_ the color applies (default, hover, active, focus, disabled, selected).
- [Data visualization](./dataviz) — covers palettes for charts and analytics.

Read those pages to understand the vocabulary and how to choose the correct semantic name.
