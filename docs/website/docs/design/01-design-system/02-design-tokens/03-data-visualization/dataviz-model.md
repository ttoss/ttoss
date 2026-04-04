---
title: Model
---

# Model

Data Visualization extends the Design Tokens v2 model to represent analytical meaning.

It follows the same architectural principles as the system while introducing a controlled extension for data-specific semantics.

---

## Architecture

```text
core.foundation → semantic.foundation
core.dataviz    → semantic.dataviz
patterns/specs  → consume semantic only
```

### Core

Core tokens define raw, themeable values.

- `core.foundation` contains global primitives such as colors, spacing, typography, borders, radii, and motion
- `core.dataviz` contains non-color encoding primitives specific to analytical visualization:
  - mark shapes, fill patterns, stroke dash arrays, and analytical opacity values
- Analytical colors are sourced from `core.colors.*` — no separate dataviz color palette is needed

Core tokens must remain value-only and context-free.

### Semantic

Semantic tokens define meaning.

- `semantic.foundation` defines UI semantics
- `semantic.dataviz` defines analytical semantics

Semantic tokens:

- reference core tokens only
- express stable analytical roles
- form the public API of the category

Components and patterns must consume semantic tokens exclusively.

### Patterns and Specifications

Patterns and specifications define how tokens are applied.

They are responsible for:

- chart type selection
- multi-view composition
- legend and labeling strategies
- tooltip behavior
- interaction design
- geospatial rendering details

These concerns are intentionally out of scope for tokens.

---

## Semantic Boundary

Data Visualization tokens encode analytical meaning, not implementation.

### Included

- categorical identity
- ordered magnitude
- midpoint comparison
- analytical references
- contextual states
- data status
- non-color encodings for redundancy
- geospatial overlay semantics

### Excluded

- chart-specific configuration
- statistical methods
- rendering logic
- layout and composition rules
- visualization library behavior
- full map styling systems

---

## Core Extension Rules

Data Visualization introduces new core tokens only when all of the following are true:

1. the problem is unique to analytical visualization
2. the concept is stable across multiple chart types and domains
3. the value can be defined independently of context

This results in a minimal set of new primitives:

- encoding primitives for shape, pattern, stroke, and analytical opacity

> Analytical opacity is distinct from foundation opacity.
> Foundation opacity is used for interface layering and interaction states. Data Visualization opacity is used as an encoding channel for analytical meaning.

All other needs must reuse existing foundation tokens.

---

## Semantic Design Rules

Semantic tokens must follow these constraints.

### 1. Role-based naming

Tokens express analytical roles, not visual properties.

Examples:

- `series`
- `scale.sequential`
- `scale.diverging`
- `reference`
- `state`
- `status`

### 2. No chart-specific semantics

Tokens must not encode chart types or components.

Invalid examples:

- `bar.primary`
- `line.highlight`
- `map.region.fill`

### 3. No library coupling

Tokens must remain independent from rendering technologies.

They cannot reference:

- specific chart libraries
- map providers
- rendering engines

### 4. Composability

Complex meaning must be expressed through composition across families.

Examples:

- forecast = color + stroke + optional opacity
- uncertainty = color + opacity + pattern

No single token should attempt to encode complex analytical meaning alone.

---

## Geospatial Contract

Geospatial support follows an overlay-first approach.

Geography does not introduce a parallel semantic language for color or encoding.
It defines the contextual contract for analytical overlays on spatial surfaces.

### Geospatial layers

- **Context**: geographic background that supports orientation
- **Overlay**: analytical data rendered on top of geography
- **State**: spatial interaction such as focus and selection

### Geospatial semantic tokens

```text
dataviz.geo.context.muted
dataviz.geo.context.boundary
dataviz.geo.context.label

dataviz.geo.state.selection
dataviz.geo.state.focus
```

### Geospatial rules

1. geospatial overlays use `dataviz.color.*` for analytical color meaning
2. geospatial overlays use `dataviz.encoding.*` for non-color reinforcement
3. `dataviz.geo.*` defines only contextual spatial semantics
4. `dataviz.geo.*` must not introduce a parallel color or encoding language

### What geospatial semantics govern

- contextual reduction behind overlays
- supportive boundaries that preserve spatial reading
- contextual labels that preserve orientation
- explicit spatial focus and selection states

### What geospatial semantics do not govern

- basemap design
- projection
- tiling
- zoom and generalization algorithms
- label placement systems
- provider-specific map style behavior

---

## Validation Expectations

### Analytical

- sequential scales must preserve perceptual order
- diverging scales must center around a meaningful midpoint
- series tokens must remain within bounded sets
- status tokens must clearly differentiate absence of data

### Accessibility

- meaning must not rely on color alone
- encodings must provide redundancy when required
- critical graphical elements must remain perceptible

### Geospatial

- overlays must remain legible against supported geographic context
- context reduction must not compete with the primary analytical layer
- spatial focus and selection must remain distinguishable from the base state

---

## Summary

The Data Visualization model defines a minimal and strict semantic layer for analytical meaning.

It ensures that:

- tokens remain stable and reusable
- meaning is separated from implementation
- geospatial overlays reuse the same analytical semantics as other visualizations
- visualization systems can scale without semantic drift

By limiting scope and enforcing clear boundaries, the model provides a robust foundation for data-driven interfaces.
