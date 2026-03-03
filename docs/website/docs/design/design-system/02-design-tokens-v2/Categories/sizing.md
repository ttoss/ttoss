---
title: Sizing
---

# Sizing

Sizing tokens define standard widths and heights for controls, icons and containers. They complement spacing tokens by ensuring that interactive elements are sized consistently.

## Core sizing tokens

Core sizing tokens live under `size.<category>.<step>`. Each category defines a sequence of sizes appropriate to that element type.

### Control heights

Token names: `size.control.height.<xs|sm|md|lg|xl>`

| Token                    |  Value | Use case                      |
| ------------------------ | -----: | ----------------------------- |
| `size.control.height.xs` | `24px` | Small pills, tag chips        |
| `size.control.height.sm` | `32px` | Small buttons, input fields   |
| `size.control.height.md` | `40px` | Default buttons, input fields |
| `size.control.height.lg` | `48px` | Large buttons, selects        |
| `size.control.height.xl` | `56px` | Hero buttons, search bars     |

### Icon sizes

Token names: `size.icon.<xs|sm|md|lg>`

| Token          |  Value |
| -------------- | -----: |
| `size.icon.xs` | `12px` |
| `size.icon.sm` | `16px` |
| `size.icon.md` | `20px` |
| `size.icon.lg` | `24px` |

### Containers and grid

Define container widths and grid breakpoints in the **Breakpoints** page instead of here. However, if you need generic container sizes (e.g. `size.container.sm`, `size.container.md`, `size.container.lg`), define them as core sizing tokens.

## Semantic sizing tokens

Semantic sizing tokens map to core sizes for specific uses. Examples:

- `control.height.primary` – Height of primary buttons (maps to `size.control.height.md`).
- `control.height.iconButton` – Height of icon-only buttons (maps to `size.control.height.sm`).
- `icon.size.inherit` – Icons that scale with font size (maps to `1em` rather than a fixed px value).

Defining semantic sizing tokens makes it easy to adjust all controls of a certain type by changing a single mapping.

## Guidelines

1. **Use core sizing tokens whenever possible.** Standardizing heights and widths ensures consistent clickable areas and improves accessibility.
2. **Avoid arbitrary numbers.** If a component’s size does not match a token, consider whether the design should be adjusted to fit the system.
3. **Coordinate with spacing.** A control’s height should align with the vertical rhythm of spacing tokens to avoid half pixel issues.

Sizing tokens provide a systemized approach to dimensions. They help maintain coherence across controls and layouts.
