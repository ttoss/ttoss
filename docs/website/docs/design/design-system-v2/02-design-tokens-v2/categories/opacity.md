---
title: Opacity
---

# Opacity

Opacity tokens control transparency. They are used to express disabled states, overlays and layering effects. Rather than manually specifying percentages, use our defined opacity tokens to maintain consistency and accessibility.

## Core opacity tokens

Core opacity tokens live under `opacity.<step>`, where `step` is a percentage expressed as an integer or decimal between 0 and 100. For example:

| Token         |  Value | Use case                         |
| ------------- | -----: | -------------------------------- |
| `opacity.100` |  `1.0` | Fully opaque                     |
| `opacity.75`  | `0.75` | Hover overlays, placeholder text |
| `opacity.50`  | `0.50` | Disabled backgrounds, scrims     |
| `opacity.25`  | `0.25` | Glass effects, subtle overlays   |
| `opacity.0`   |  `0.0` | Fully transparent                |

These values are guidelines; your brand team defines the actual set. Use increments that produce distinct effects.

## Semantic opacity tokens

Semantic opacity tokens map to core opacity values based on context. For example:

- `overlay.backdrop.opacity` → `opacity.50`
- `overlay.spinner.opacity` → `opacity.75`
- `feedback.disabled.text.opacity` → `opacity.50`

By using semantic names you can adjust transparency per theme. For instance, a dark theme may require lower opacity to achieve the same perceived dimming as a light theme.

## Usage guidelines

1. **Do not apply opacity directly to text.** Instead of setting an element’s opacity, choose a semantically appropriate color (e.g. `content.secondary.text.disabled`) and define its alpha in the core color palette. Applying opacity to a whole element affects its children unintentionally.
2. **Avoid stacking opacities.** Multiple layers of opacity multiply, reducing contrast. Choose single overlay tokens for masks and scrims.
3. **Use opacity for state, not emphasis.** If you need to de‑emphasize an element, consider using the neutral color palette rather than simply reducing opacity.

Opacity tokens complement elevation and color tokens. They help to create depth and disabled states without breaking contrast guidelines.
