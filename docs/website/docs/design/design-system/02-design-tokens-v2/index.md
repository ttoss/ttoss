---
title: Design Tokens
---

# Design Tokens

Design tokens are named entities that store visual design attributes – such as colors, typography, spacing and more – in a format that can be shared across platforms. They capture design decisions as data, allowing you to replace hard‑coded values like `#FF6B6B` or `16px` with meaningful names such as `colors.action.background.negative.default` or `core.spacing.md`. This abstraction enables consistency, maintainability and scalability across web, mobile and design tools.

Our system uses a two‑tier token architecture: **Core Tokens** store raw, brand‑defining values with minimal abstraction; **Semantic Tokens** define contextual usage by referencing core tokens. Components must **never** consume core tokens directly. By centralizing decisions in semantic tokens we can change a core value once and propagate it throughout every context and theme.

### Token Categories

Design tokens encompass multiple domains. The following categories are defined in this system:

- **Colors:** brand hues and semantic color roles.
- **Elevation:** layers of depth expressed as shadow recipes.
- **Typography:** font families, sizes, weights and text styles.
- **Spacing:** consistent spacing scale for margins and paddings.
- **Sizing:** common widths and heights for controls and containers.
- **Radii:** border‑radius values.
- **Borders:** widths and styles for outlines and dividers.
- **Opacity:** transparent overlays and disabled states.
- **Motion:** durations and easings for interactive transitions.
- **Z‑Index:** stacking context levels.
- **Breakpoints:** responsive layout thresholds.
- **Data Visualization:** palettes for charts and analytics.

Each category provides both core and semantic tokens where appropriate. In some cases – such as elevation or spacing – a semantic layer may be minimal; the documentation highlights when this applies.

### Next Steps

To begin using tokens, read [How to Use Design Tokens](./01-how-to-use.md). To understand the contract between core and semantic tokens, see [Token Model](./model.md). For naming conventions, see [Naming & Taxonomy](./naming.md). Each token family has its own page starting with [Colors](./Categories/colors/index.md).
