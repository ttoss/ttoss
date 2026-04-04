---
title: Design Tokens
---

# Design Tokens

Design tokens define the **semantic language** of the system.

They separate **raw values** from **meaning**, allowing design decisions to stay consistent across themes, components, patterns, and platforms.

---

## Model

The system follows a layered architecture:

```text
core → semantic → components → patterns → applications
```

- **Core tokens** define raw, themeable values
- **Semantic tokens** define stable design meaning
- **Components and patterns** consume semantic tokens only

For the architectural contract of this model, see [Token Model](./model.md).

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

To understand the architecture, start with [Token Model](./model.md).

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
