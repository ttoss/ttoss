---
title: Design System
---

# Design System

The ttoss Design System provides a comprehensive foundation for building consistent, accessible, and scalable digital products.

## Core Principles

**1. Easy to use**  
Make it simple for newcomers to adopt our system. Easy to use means easy to change and experiment with, enabling rapid iteration.

**2. Simple with minimal dependencies**  
Focus on small, focused APIs that cover common use cases while keeping complexity low.

**3. Flexible, not rigid**  
Balance standardization with creative freedom. Enable both efficient standard builds and innovative custom solutions.

## Multi-Brand Support

Our system excels at supporting multiple brands through:

- **Theme Switching**: Different brands using the same component library
- **Token Override**: Brand-specific values while maintaining structure
- **Flexible Components**: Adaptable to various visual styles

## Key Benefits

Our design system delivers value aligned with [product development principles](/docs/product/product-development/principles):

- **Single Source of Truth**: Centralized design decisions following [E1: Quantified Overall Economics](https://ttoss.dev/docs/product/product-development/principles#e1-the-principle-of-quantified-overall-economics-select-actions-based-on-quantified-overall-economic-impact)
- **Cross-Team Collaboration**: Shared vocabulary between design and engineering
- **Rapid Prototyping**: Quick testing and iteration enabled by [FF8: Fast-Learning Principle](https://ttoss.dev/docs/product/product-development/principles#ff8-the-fast-learning-principle-use-fast-feedback-to-make-learning-faster-and-more-efficient)
- **Visual Consistency**: Unified experience across products
- **Scalability**: Support for multiple products and brands

## Implementation

For engineering details on how this system is realized in ttoss:

- **[Theme Provider](/docs/design/theme-provider)** — theme setup, switching, and customization
- **[UI Components](/docs/design/ui-components)** — reference component implementations

---

## Document Map

Single navigation table for all foundational design-system documents. Open the file whose question matches your task — do not read in order.

### Foundational Semantic Language (FSL)

| Document                                                                   | Read when you need…                                                                                                              |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [`01-fsl/index.md`](./01-fsl/index.md)                                     | Overview of FSL: what it is, the two normative artifacts, what derives from it.                                                  |
| [`01-fsl/fsl-lexicon.md`](./01-fsl/fsl-lexicon.md)                         | Canonical dictionary — the meaning of every core term across the nine semantic dimensions (Entity Kind, Structural Role, etc.).  |
| [`01-fsl/fsl-structural-language.md`](./01-fsl/fsl-structural-language.md) | Grammar — how lexicon terms combine into valid expressions, legality rules, and how downstream projections must derive from FSL. |

### Design Tokens — architecture & governance

| Document                                                                       | Read when you need…                                                                               |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| [`02-design-tokens/index.md`](./02-design-tokens/index.md)                     | Entry point: layered architecture (`core → semantic → component`) and the full family map.        |
| [`02-design-tokens/quick-reference.md`](./02-design-tokens/quick-reference.md) | Intent → token cheatsheet for quick selection.                                                    |
| [`02-design-tokens/model.md`](./02-design-tokens/model.md)                     | Architectural contract: invariants, RawValue exception inventory, FSL → token grammar projection. |
| [`02-design-tokens/modes.md`](./02-design-tokens/modes.md)                     | How modes (light/dark/etc.) remap semantic references without mutating core values.               |
| [`02-design-tokens/governance.md`](./02-design-tokens/governance.md)           | Public-contract rules: deprecation, naming, additions, removals.                                  |
| [`02-design-tokens/validation.md`](./02-design-tokens/validation.md)           | Build-time and runtime validation of the token contract.                                          |

### Token families (foundation)

| Document                                                                                       | Family                                                                            |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`02-design-tokens/02-families/colors.md`](./02-design-tokens/02-families/colors.md)           | Colors — UX/role/dimension/state grammar, FSL Entity Kind mapping, role coverage. |
| [`02-design-tokens/02-families/typography.md`](./02-design-tokens/02-families/typography.md)   | Typography — families, weights, ramps, semantic text styles.                      |
| [`02-design-tokens/02-families/spacing.md`](./02-design-tokens/02-families/spacing.md)         | Spacing — inset/gap/gutter/separation patterns and the responsive engine.         |
| [`02-design-tokens/02-families/sizing.md`](./02-design-tokens/02-families/sizing.md)           | Sizing — UI/layout ramps, hit targets, viewport behaviors.                        |
| [`02-design-tokens/02-families/radii.md`](./02-design-tokens/02-families/radii.md)             | Radii — corner curvature contracts (`control`, `surface`, `round`).               |
| [`02-design-tokens/02-families/borders.md`](./02-design-tokens/02-families/borders.md)         | Borders — line widths/styles and semantic line contracts.                         |
| [`02-design-tokens/02-families/elevation.md`](./02-design-tokens/02-families/elevation.md)     | Elevation — shadow recipes and semantic surface strata.                           |
| [`02-design-tokens/02-families/opacity.md`](./02-design-tokens/02-families/opacity.md)         | Opacity — semantic transparency contracts.                                        |
| [`02-design-tokens/02-families/motion.md`](./02-design-tokens/02-families/motion.md)           | Motion — durations, easings, semantic motion specs.                               |
| [`02-design-tokens/02-families/z-index.md`](./02-design-tokens/02-families/z-index.md)         | Z-Index — global stacking layers.                                                 |
| [`02-design-tokens/02-families/breakpoints.md`](./02-design-tokens/02-families/breakpoints.md) | Breakpoints — viewport thresholds (infrastructure-only, no semantic layer).       |

### Data Visualization (optional extension)

| Document                                                                                                                       | Read when you need…                                                |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| [`02-design-tokens/03-data-visualization/index.md`](./02-design-tokens/03-data-visualization/index.md)                         | Overview of the dataviz extension — when and how to enable it.     |
| [`02-design-tokens/03-data-visualization/dataviz-model.md`](./02-design-tokens/03-data-visualization/dataviz-model.md)         | Architectural extension of the token model for analytical meaning. |
| [`02-design-tokens/03-data-visualization/dataviz-colors.md`](./02-design-tokens/03-data-visualization/dataviz-colors.md)       | Semantic roles for color in analytical contexts.                   |
| [`02-design-tokens/03-data-visualization/dataviz-encodings.md`](./02-design-tokens/03-data-visualization/dataviz-encodings.md) | Non-color encoding channels (shape, pattern, position, etc.).      |

### Components

| Document                                                                 | Read when you need…                                                                          |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| [`03-components/index.md`](./03-components/index.md)                     | Overview of the component framework.                                                         |
| [`03-components/component-model.md`](./03-components/component-model.md) | Component Semantics Projection — how components derive from FSL and consume semantic tokens. |
| [`03-components/icon-system.md`](./03-components/icon-system.md)         | Icon model and conventions.                                                                  |
