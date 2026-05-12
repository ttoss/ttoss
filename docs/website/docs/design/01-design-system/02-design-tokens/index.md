---
title: Design Tokens
sidebar_position: 1
---

# Design Tokens

Design tokens are the **vocabulary** of the design system. They separate **raw values** from **meaning**, so design decisions stay consistent across themes, components, patterns, and platforms.

> **In one sentence:** raw values live in `core`, design intent lives in `semantic`, and components only consume `semantic`.

---

## Hello, token

A primary button. Three pieces are needed: a background, a border, and a text color. All three come from the **semantic** layer:

```tsx
// ✅ what a component actually consumes
style={{
  backgroundColor: theme.semantic.colors.action.primary.background.default,
  borderColor:     theme.semantic.colors.action.primary.border.default,
  color:           theme.semantic.colors.action.primary.text.default,
  borderRadius:    theme.semantic.radii.control,
  padding:         theme.semantic.spacing.inset.control.md,
  minHeight:       theme.semantic.sizing.hit.base,
}}
```

Each semantic token resolves to a **core** value. For example, `action.primary.background.default` resolves to `core.colors.neutral.1000`. Components never reference `core` directly — that is the contract.

Dark mode, high-contrast mode, or a new theme **do not change** this component. Only the `semantic → core` mapping changes.

> Want to pick tokens fast? Jump to [Quick Reference](./quick-reference.md).

---

## Model

The system follows a layered architecture:

```text
raw values → core tokens → semantic tokens → components → patterns → applications
```

- **Core tokens** hold raw, themeable values (`#94A3B8`, `16px`, `200ms`…)
- **Semantic tokens** hold stable design meaning (`action.primary.background`, `spacing.inset.control.md`…)
- **Components and patterns** consume semantic tokens only

For the architectural contract, see [Token Model](./model.md).

## Categories

The system is organized into two parts:

### Foundation

Foundation tokens define the core building blocks of UI systems:

- **Colors**
- **Typography**
- **Spacing**
- **Sizing**
- **Radii**
- **Borders**
- **Elevation**
- **Opacity**
- **Motion**
- **Z-Index**
- **Breakpoints**

Each family defines its own contract, and where applicable its own semantic grammar.

### Data Visualization

Data Visualization extends the system for **analytical meaning**.

It adds a controlled semantic layer for:

- analytical colors
- non-color encodings
- geospatial overlay semantics

This extension exists because analytical visualization introduces meaning that is not equivalent to standard UI semantics.

For the Data Visualization model, see [Data Visualization](./03-data-visualization/index.md) and [Model](./03-data-visualization/dataviz-model.md).

## Themes and Modes

Themes and modes allow the system to vary without changing semantic meaning.

- **Themes** may change core values and semantic mappings
- **Modes** remap semantic references to different core tokens — core values stay immutable
- **Semantic token names remain stable**

For details, see [Modes](./modes.md).

> **Implementation:** See [Theme Provider](/docs/design/theme-provider) for how themes and modes are configured in ttoss.

## Governance and Validation

The system is governed and validated to preserve semantic stability over time.

- **Governance** defines how tokens evolve
- **Validation** protects the contract before build and release

For details, see [Governance](./governance.md) and [Validation and Build](./validation.md).

---

## Next Steps

- Need a token **now**? → [Quick Reference](./quick-reference.md).
- Want the architecture? → [Token Model](./model.md).

Then explore the token families:

- [Colors](./02-families/colors.md)
- [Typography](./02-families/typography.md)
- [Spacing](./02-families/spacing.md)
- [Sizing](./02-families/sizing.md)
- [Radii](./02-families/radii.md)
- [Borders](./02-families/borders.md)
- [Elevation](./02-families/elevation.md)
- [Opacity](./02-families/opacity.md)
- [Motion](./02-families/motion.md)
- [Z-Index](./02-families/z-index.md)
- [Breakpoints](./02-families/breakpoints.md)
- [Data Visualization](./03-data-visualization/index.md)
