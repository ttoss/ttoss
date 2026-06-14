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

| Document                                                             | Read when you need…                                                                                                              |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [`fsl/index.md`](./fsl/index.md)                                     | Overview of FSL: what it is, the two normative artifacts, what derives from it.                                                  |
| [`fsl/fsl-lexicon.md`](./fsl/fsl-lexicon.md)                         | Canonical dictionary — the meaning of every core term across the nine semantic dimensions (Entity Kind, Structural Role, etc.).  |
| [`fsl/fsl-structural-language.md`](./fsl/fsl-structural-language.md) | Grammar — how lexicon terms combine into valid expressions, legality rules, and how downstream projections must derive from FSL. |

### Design Tokens — architecture & governance

| Document                                                                 | Read when you need…                                                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| [`design-tokens/index.md`](./design-tokens/index.md)                     | Entry point: layered architecture (`core → semantic → component`) and the full family map.        |
| [`design-tokens/quick-reference.md`](./design-tokens/quick-reference.md) | Intent → token cheatsheet for quick selection.                                                    |
| [`design-tokens/model.md`](./design-tokens/model.md)                     | Architectural contract: invariants, RawValue exception inventory, FSL → token grammar projection. |
| [`design-tokens/modes.md`](./design-tokens/modes.md)                     | How modes (light/dark/etc.) remap semantic references without mutating core values.               |
| [`design-tokens/governance.md`](./design-tokens/governance.md)           | Public-contract rules: deprecation, naming, additions, removals.                                  |
| [`design-tokens/validation.md`](./design-tokens/validation.md)           | Build-time and runtime validation of the token contract.                                          |

### Token families (foundation)

| Document                                                                           | Family                                                                            |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`design-tokens/families/colors.md`](./design-tokens/families/colors.md)           | Colors — UX/role/dimension/state grammar, FSL Entity Kind mapping, role coverage. |
| [`design-tokens/families/typography.md`](./design-tokens/families/typography.md)   | Typography — families, weights, ramps, semantic text styles.                      |
| [`design-tokens/families/spacing.md`](./design-tokens/families/spacing.md)         | Spacing — inset/gap/gutter/separation patterns and the responsive engine.         |
| [`design-tokens/families/sizing.md`](./design-tokens/families/sizing.md)           | Sizing — UI/layout ramps, hit targets, viewport behaviors.                        |
| [`design-tokens/families/radii.md`](./design-tokens/families/radii.md)             | Radii — corner curvature contracts (`control`, `surface`, `round`).               |
| [`design-tokens/families/borders.md`](./design-tokens/families/borders.md)         | Borders — line widths/styles and semantic line contracts.                         |
| [`design-tokens/families/elevation.md`](./design-tokens/families/elevation.md)     | Elevation — shadow recipes and semantic surface strata.                           |
| [`design-tokens/families/opacity.md`](./design-tokens/families/opacity.md)         | Opacity — semantic transparency contracts.                                        |
| [`design-tokens/families/motion.md`](./design-tokens/families/motion.md)           | Motion — durations, easings, semantic motion specs.                               |
| [`design-tokens/families/z-index.md`](./design-tokens/families/z-index.md)         | Z-Index — global stacking layers.                                                 |
| [`design-tokens/families/breakpoints.md`](./design-tokens/families/breakpoints.md) | Breakpoints — viewport thresholds (infrastructure-only, no semantic layer).       |

### Data Visualization (optional extension)

| Document                                                                                                           | Read when you need…                                                |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| [`design-tokens/data-visualization/index.md`](./design-tokens/data-visualization/index.md)                         | Overview of the dataviz extension — when and how to enable it.     |
| [`design-tokens/data-visualization/dataviz-model.md`](./design-tokens/data-visualization/dataviz-model.md)         | Architectural extension of the token model for analytical meaning. |
| [`design-tokens/data-visualization/dataviz-colors.md`](./design-tokens/data-visualization/dataviz-colors.md)       | Semantic roles for color in analytical contexts.                   |
| [`design-tokens/data-visualization/dataviz-encodings.md`](./design-tokens/data-visualization/dataviz-encodings.md) | Non-color encoding channels (shape, pattern, position, etc.).      |

### Components

| Document                                                           | Read when you need…                                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| [`components/index.md`](./components/index.md)                     | Overview of the component framework.                                                         |
| [`components/component-model.md`](./components/component-model.md) | Component Semantics Projection — how components derive from FSL and consume semantic tokens. |
| [`components/icon-system.md`](./components/icon-system.md)         | Icon model and conventions.                                                                  |
