---
title: Colors
---

# Colors

Colors define the semantic roles of color in analytical contexts.

They encode recurring analytical meaning across charts, dashboards, and geospatial overlays without coupling the system to chart types or rendering libraries.

This category is the primary semantic API of Data Visualization.

---

## Purpose

Data Visualization colors standardize how analytical meaning is represented through color.

They govern:

- categorical identity
- ordered magnitude
- midpoint comparison
- analytical references
- contextual emphasis
- data status

They do **not** define chart types, chart behavior, or full map styling.


## Scope

This category governs semantic color roles for:

- categorical series
- sequential scales
- diverging scales
- analytical references
- analytical states
- data status

This category does **not** govern:

- chart-specific color logic
- heatmap or choropleth implementation details
- statistical classification methods
- legend behavior
- basemap design
- forecast or uncertainty behavior by color alone

Those concerns belong to patterns and implementation.


## Principles

### Semantic-first

Tokens express analytical meaning, not palette names or visual styling.

### Task-first

Color roles are defined by the analytical task they support, not by chart type.

### Small and explicit

Only stable, recurring color semantics are tokenized.

### Color is primary, not sufficient

Color provides the main analytical signal, but critical meaning must still be supportable through other encodings when needed.

### Distinguish meaning classes

Categorical identity, ordered magnitude, midpoint comparison, and data absence are different semantic problems and must not be collapsed into one system.


## Model

Colors follow the same extension model as the category:

```text
core.dataviz → semantic.dataviz
patterns/specs → consume semantic only
```

### Core

Core tokens define raw analytical palettes:

* qualitative palettes for categorical data
* sequential palettes for ordered magnitude
* diverging palettes for midpoint comparisons

Core tokens are value-only and themeable.

### Semantic

Semantic tokens define analytical roles.

They form the public API of the category and must reference core tokens only.

---

## Core Tokens

```text id="2k3iwa"
core.dataviz.color.qualitative.1..8
core.dataviz.color.sequential.1..7
core.dataviz.color.diverging.1..7
```

Core tokens must remain context-free.

They must not encode:

* chart types
* UI intent
* data domain names
* map provider behavior

---

## Semantic Tokens

```text id="e8cg09"
dataviz.color.series.1..8

dataviz.color.scale.sequential.1..7

dataviz.color.scale.diverging.neg3
dataviz.color.scale.diverging.neg2
dataviz.color.scale.diverging.neg1
dataviz.color.scale.diverging.neutral
dataviz.color.scale.diverging.pos1
dataviz.color.scale.diverging.pos2
dataviz.color.scale.diverging.pos3

dataviz.color.reference.baseline
dataviz.color.reference.target

dataviz.color.state.highlight
dataviz.color.state.muted
dataviz.color.state.selected

dataviz.color.status.missing
dataviz.color.status.suppressed
dataviz.color.status.not-applicable
```

These tokens form the semantic contract for analytical color.

---

## Families

### Series

`series.*` defines categorical identity.

Use series colors for:

* nominal categories
* distinct groups
* named series in charts or maps

Series colors are discrete and non-ordered.

They must not imply magnitude, ranking, or midpoint comparison.

### Sequential Scale

`scale.sequential.*` defines ordered magnitude from low to high.

Use sequential scales for:

* ordered values
* progressive intensity
* quantitative or ordinal ranges where one direction is semantically meaningful

Sequential scales must preserve perceptual order.

Lower and higher steps must remain visually interpretable as part of the same ordered continuum.

### Diverging Scale

`scale.diverging.*` defines ordered comparison around a meaningful midpoint.

Use diverging scales only when the data has a true center, such as:

* zero
* baseline
* benchmark
* target delta

Diverging scales must not be used when the midpoint is arbitrary or absent.

`neutral` represents the central class.
Negative and positive sides must be interpreted symmetrically.

### Reference

`reference.*` defines supporting analytical guides.

* `reference.baseline` represents an analytical baseline
* `reference.target` represents a desired or required target

Reference colors are not primary data colors.
They exist to support interpretation.

### State

`state.*` defines analytical emphasis.

* `state.highlight` emphasizes a focal subset
* `state.muted` de-emphasizes secondary context
* `state.selected` marks explicit analytical selection

State colors must not redefine categorical identity or scale semantics.

They modify reading context, not analytical class.

### Status

`status.*` defines non-analytic data conditions.

* `status.missing` means data is absent
* `status.suppressed` means data exists but is intentionally withheld
* `status.not-applicable` means the value does not apply to the case

Status tokens are essential to avoid collapsing distinct data conditions into a single visual treatment.

They must not be used to encode zero or low values.

---

## Geospatial Use

Geospatial overlays use the same color semantics as the rest of Data Visualization.

This means:

* categorical map overlays use `series.*`
* ordered geographic intensity uses `scale.sequential.*`
* midpoint comparisons on maps use `scale.diverging.*`
* map-specific overlay emphasis may use `state.*`
* missing or suppressed geographic data must use `status.*`

`dataviz.geo.*` does not define a second color language for maps.

Geography changes context, not the semantic meaning of analytical color.

---

## Usage Rules

### 1. Use the correct semantic family

Choose colors by analytical meaning:

* categories → `series.*`
* ordered magnitude → `scale.sequential.*`
* midpoint comparison → `scale.diverging.*`
* guides → `reference.*`
* emphasis → `state.*`
* absence/withholding/inapplicability → `status.*`

Do not substitute one family for another.

### 2. Do not encode chart types

Color tokens must remain chart-agnostic.

Invalid examples:

* `bar.primary`
* `line.forecast`
* `choropleth.fill`
* `map.region.positive`

### 3. Do not overload color with complex meaning

Forecast and uncertainty must not be represented by color alone.

When those concepts are needed, use composition across categories, such as:

* color + stroke
* color + opacity
* color + pattern

### 4. Keep series bounded

`series.*` is intentionally bounded.

If the number of categories exceeds the supported set, solve the problem in the pattern layer through grouping, faceting, filtering, interaction, or another visualization strategy.

Do not expand the semantic series range casually.

### 5. Keep status distinct from value

Missing, suppressed, and not-applicable are not value states.

They must remain visually distinguishable from:

* zero
* low values
* muted context
* unselected data

---

## Relationship to Other Categories

### Encodings

Encodings reinforce color semantics when color alone would make interpretation fragile.

### Geospatial semantics

Geospatial semantics govern how overlays interact with spatial context.
They do not redefine analytical color meaning.

### Foundation colors

Foundation UI colors and Data Visualization colors solve different problems.

UI colors express interface meaning.
Data Visualization colors express analytical meaning.

These systems must remain separate.

---

## Validation

### Errors (validation must fail when)

- diverging color semantics are structurally incomplete:
  - missing `neutral`
  - missing one or more negative steps
  - missing one or more positive steps
  - negative and positive sides have different cardinality

- any two of these status tokens resolve to the same effective value:
  - `dataviz.color.status.missing`
  - `dataviz.color.status.suppressed`
  - `dataviz.color.status.not-applicable`

- any status token resolves to the same effective value as:
  - a sequential scale step
  - a diverging scale step
  - `dataviz.color.state.muted`

### Warning (validation should warn when)

- `dataviz.color.series` exceeds `1..8`

- `dataviz.color.scale.sequential` exceeds `1..7`

- `dataviz.color.reference.baseline` or `dataviz.color.reference.target` resolves to the same effective value as a primary data color token

- `dataviz.color.state.highlight`, `dataviz.color.state.muted`, and `dataviz.color.state.selected` lose effective distinction

- adjacent sequential steps resolve to the same effective value

- adjacent diverging steps on the same side resolve to the same effective value

---

## Summary

Colors define the semantic roles of color in analytical systems.

They provide a stable, reusable API for representing:

* categories
* magnitude
* midpoint comparison
* references
* emphasis
* data status

By keeping these roles explicit and bounded, the system remains simple, scalable, and unambiguous across charts, dashboards, and geospatial overlays.
