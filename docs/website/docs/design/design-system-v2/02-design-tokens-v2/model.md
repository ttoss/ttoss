---
title: Token Model
---

# Token Model

A reliable design system separates the _definition_ of values from their _usage_. Our model therefore distinguishes between two kinds of tokens:

- **Core tokens** capture raw, brand‑defining values such as specific colors, scales of spacing, radii or opacities. They are the single source of truth for a theme. Core tokens do not encode intent—only values.

- **Semantic tokens** express design intentions. They map to core tokens and describe how a value should be used, for example as the background color of a navigation bar or the text color of a negative alert. Semantic tokens form the API consumed by components and patterns.

## Why two layers?

The separation enables consistent theming. When a design decision—like the primary brand color—changes, we update the corresponding core token. All semantic tokens referencing it automatically reflect the new value. Conversely, if we need a different color for navigation links than for buttons, we introduce a new semantic token referencing the same core value.

This model also prevents accidental misuse. Core tokens should never be used directly in product code; they are for theme authors. Semantic tokens enforce a contract between design and engineering: each token’s name conveys its context, role, dimension and state. By consuming only semantic tokens, developers benefit from built‑in accessibility and brand consistency.

## Core tokens

Core tokens live in family-specific namespaces. Their structure varies by family:

- **Colors:** `colors.<hue>.<scale>`, e.g. `colors.brand.500`, `colors.neutral.200`. Hues run along numeric scales from 50 (lightest) to 900 (darkest).

- **Spacing:** `spacing.<step>` through `spacing.<n>` define multiples of a base unit. They follow a geometric progression to maintain rhythm.

- **Radii:** `radii.none`, `radii.sm`, `radii.md`, `radii.lg`, `radii.full`.

- **Elevation:** `elevation.core.level.<0–5>` encapsulates shadow recipes.

Core tokens are versioned and brand‑specific. Changing a core token affects every semantic token that points to it.

## Semantic tokens

Semantic tokens follow a consistent semantic grammar.
Semantic tokens may have different values per theme or color mode, but their names remain stable. Components must always refer to semantic tokens rather than core tokens.
