---
title: Data Visualization
---

# Data Visualization

Data Visualization defines the semantic contract for representing analytical meaning across charts, dashboards, and geospatial overlays.

It extends Design Tokens v2 with a small, explicit layer for data-specific semantics while preserving the same system architecture:

- core tokens define raw values
- semantic tokens define meaning
- components and patterns consume semantic tokens only

This category exists to standardize recurring analytical meaning without coupling the system to chart types, rendering libraries, or map providers.

---

## Purpose

The purpose of this category is to make analytical meaning durable, reusable, and governable.

It defines semantic roles for:

- categorical identity
- ordered magnitude
- midpoint comparison
- analytical references
- contextual emphasis
- data status
- non-color analytical encodings
- minimal geospatial overlay semantics

The goal is not to define charts.

The goal is to define the stable meaning that charts, dashboards, and overlays express.

## Scope

Data Visualization governs:

- semantic color roles for analytical data
- non-color encodings that reinforce analytical meaning
- minimal geospatial semantics for thematic overlays

Data Visualization does **not** govern:

- chart type selection
- chart-specific configuration
- visualization libraries or rendering APIs
- multi-view composition
- tooltip behavior
- labeling strategies
- statistical transformations
- basemap design systems
- map projection, tiling, or generalization logic

These concerns belong to the pattern and implementation layers.

## Principles

### Semantic-first

Tokens express analytical meaning, not stylistic preference.

### Task-first

The system models analytical roles, not chart types.

### Small and explicit

Only stable and recurring concepts are encoded.

### Accessible by design

Meaning must not depend on color alone.

### Overlay-first for geospatial

Geospatial support focuses on thematic overlays, not full cartographic systems.

### Clear boundaries

Tokens govern meaning.  
Patterns and implementations govern composition and behavior.

## Architecture

Data Visualization follows the same architectural model as the rest of the system:

```text
core.foundation → semantic.foundation
core.dataviz    → semantic.dataviz
patterns/specs  → consume semantic only
```

### Foundation reuse

Data Visualization reuses the existing foundation wherever the problem is already solved, including:

- typography
- spacing
- sizing
- borders
- radii
- elevation
- z-index
- motion
- global opacity

### Core extension

Data Visualization introduces new core tokens only where the problem is unique to analytical visualization:

- analytical color palettes
- non-color encoding primitives

This keeps the category small and prevents parallel foundations.

---

## Semantic Surfaces

### Colors

`dataviz.color.*` defines the semantic roles of color in analytical contexts.

It governs:

- series identity
- sequential scales
- diverging scales
- analytical references
- analytical states
- data status

This is the primary semantic API of the category.

### Encodings

`dataviz.encoding.*` defines non-color channels used to reinforce meaning.

It governs:

- shape
- pattern
- stroke style
- opacity semantics

Encodings exist to improve accessibility, robustness, and perceptual clarity.

### Geospatial overlays

Geospatial overlays are part of Data Visualization.

They do not introduce a parallel color or encoding system.

Instead:

- overlays use `dataviz.color.*` for analytical color meaning
- overlays use `dataviz.encoding.*` for non-color reinforcement
- geospatial semantics define only the relationship between the overlay and spatial context

The geospatial contract is therefore contextual, not a separate visual language.

---

## What This Category Does Not Do

This category intentionally does not attempt to:

- model every visualization technique
- encode chart-specific semantics
- replace chart or map libraries
- define dashboard composition rules
- define complete cartographic systems

Its job is to provide a stable semantic layer for recurring analytical meaning.

## Consumption Model

Components and patterns must consume **semantic dataviz tokens only**.

They must never:

- consume `core.dataviz` directly
- create chart-type tokens in product code
- introduce local analytical vocabularies that bypass the contract

If a need cannot be expressed by existing semantics, it must be handled through:

1. existing tokens
2. pattern-level composition
3. deliberate governance of new semantics

## Relationship to the Core Color System

Data Visualization colors are distinct from UI semantic colors.

- UI colors express interface meaning
- Data Visualization colors express analytical meaning

These systems must remain separate.

A negative action color is not the same thing as a negative analytical scale value.
A highlighted chart series is not the same thing as a highlighted button state.

## Relationship to Patterns

Patterns are responsible for applying Data Visualization semantics to real visualizations.

They decide:

- which chart type to use
- which encoding strategy is appropriate
- whether scales are shared or independent
- whether meaning is reinforced through labels, legends, or annotations
- how maps behave across zoom levels

Data Visualization tokens provide the semantic building blocks.
Patterns turn those blocks into complete visualization behavior.

---

## Validation

Family-specific checks such as sequential order, diverging balance, bounded pattern sets, or detailed geospatial legibility belong in their own documents.

### Errors (validation must fail when)

- Data Visualization introduces chart-type, component, library, provider, or map-style semantics in the semantic token surface

- analytical opacity does not stay separate from foundation opacity:
  - `dataviz.encoding.opacity.*` resolves outside `core.dataviz.opacity.*`
  - foundation opacity tokens are used to encode analytical meaning

### Warning (validation should warn when)

- `dataviz.geo.state.focus` and `dataviz.geo.state.selection` resolve to the same effective value

---

## Summary

Data Visualization is a minimal semantic extension for analytical meaning.

It exists to make charts, dashboards, and geospatial overlays more:

- consistent
- accessible
- scalable
- and semantically durable

It does this by defining a small public API for analytical meaning while keeping chart behavior, composition, and rendering outside the token layer.
