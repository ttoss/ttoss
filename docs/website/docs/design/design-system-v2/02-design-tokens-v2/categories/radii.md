---
title: Radii
---

# Radii

Radii tokens define the curvature of corners. Consistent radii contribute to a cohesive look and feel. Our system offers a small set of radii sizes and optional semantic aliases.

## Core radii tokens

Core radii tokens live under `radii.<size>`. Recommended values:

| Token        |    Value | Description                              |
| ------------ | -------: | ---------------------------------------- |
| `radii.none` |    `0px` | Square corners                           |
| `radii.xs`   |    `2px` | Subtle rounding for small elements       |
| `radii.sm`   |    `4px` | Default rounding for controls and cards  |
| `radii.md`   |    `8px` | Elevated elements like modals and panels |
| `radii.lg`   |   `12px` | Large containers or special components   |
| `radii.full` | `9999px` | Fully rounded (circle/pill)              |

These values are themeable; brands may choose different pixel values.

## Semantic radii tokens

Semantic radii tokens map to core radii and indicate _where_ the radius is applied. Examples:

- `radii.surface` – Default radius for cards and panels.
- `radii.control` – Default radius for buttons and inputs.
- `radii.pill` – Fully rounded for pills and tags.
- `radii.avatar` – Radius for user avatar images.
- `radii.toast` – Radius for toast notifications.

Define semantic names when multiple components share the same rounding; this allows easy changes across the UI.

## Usage guidelines

1. **Do not mix radii sizes arbitrarily.** Choose one or two radii sizes for your brand and apply them consistently.
2. **Use semantic aliases to avoid duplication.** Instead of specifying `radii.sm` in every button, define `radii.control`.
3. **Theme variations.** Some brands may use more angular designs; adjust core radii values in the theme rather than changing semantic names.

Radii tokens provide a simple yet powerful way to reinforce brand personality through corner shapes.
