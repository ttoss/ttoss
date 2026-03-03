---
title: Color States
---

# Color States

The optional **state** segment of a semantic color token describes _when_ the color applies. States capture interactions (hover, active, focus) or persistent conditions (disabled, selected). Not every dimension needs state variations, but interactive elements often do. The base state is always `default`—the appearance when there is no interaction.

## Interaction states

- **hover:** The element is under the pointer. Hover colours should be close to the default but provide a clear affordance. For example, a hover background may be slightly darker or lighter than the default.
- **active:** The element is being pressed or activated (mouse down). Active colours often emphasize depth or contrast relative to hover. They may map to a lower elevation level in addition to a color change.
- **focus:** The element has keyboard or accessibility focus (e.g. via tab). Focus colours are used for outlines or glows rather than backgrounds. They help keyboard users identify their current location.
- **selected:** The element is in a toggled or selected state (e.g. a selected tab or radio button). Selected colours should be distinct from hover and active.

## Persistent states

- **disabled:** The element is non‑interactive. Disabled colours should reduce contrast and saturation to convey inactivity. Avoid merely lowering opacity; instead use specific disabled tokens for each dimension.
- **visited:** Links or navigation items that the user has visited. Visited colours apply only to text and icons in navigation and content contexts.

## Rules

1. **Start from the default.** All tokens imply a `default` state when no explicit state is provided. Do not append `.default` unless needed for clarity.
2. **One state at a time.** Do not combine states (e.g. `hoverDisabled`). When multiple conditions apply, the following precedence is recommended: disabled > selected > active > hover > focus > default. Persistent states like `selected` override interactive states.
3. **Don’t overload state tokens.** States should convey interaction, not success or failure. Use the role segment for success/failure and keep state as simple as possible.
4. **Accessible contrast.** Ensure that every state variation meets contrast ratios against the underlying background for both light and dark themes.

Defining consistent state variations helps users predict behaviour and maintains a cohesive interaction language.
