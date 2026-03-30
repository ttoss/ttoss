---
title: Encodings
---

# Encodings

Encodings define non-color visual channels used to represent analytical meaning.

They exist to reinforce interpretation, improve accessibility, and reduce overreliance on color.

This category does not replace color semantics.  
It complements them.

---

## Purpose

Encodings standardize recurring analytical distinctions that should not depend on color alone.

They cover:

- categorical differentiation through shape
- categorical differentiation through pattern
- semantic line treatment through stroke style
- contextual emphasis through opacity

These tokens make analytical meaning more robust across themes, display conditions, and accessibility needs.


## Scope

Encodings govern:

- non-color channels that carry stable analytical meaning
- redundant signals used alongside color
- semantic emphasis and de-emphasis

Encodings do **not** govern:

- chart-specific mark configuration
- library-specific rendering behavior
- legend layout
- direct labeling strategies
- animation behavior
- arbitrary visual styling

These concerns belong to patterns and implementation.


## Principles

### Meaning over styling

Encodings represent analytical roles, not decorative variation.

### Color is not enough

Critical distinctions must remain interpretable without depending only on color.

### Small and deliberate

Only recurring, reusable channels are tokenized.

### Compositional

Encodings work together with color and pattern logic.  
They do not attempt to encode complete analytical meaning by themselves.


## Model

Encodings follow the same extension model as the category:

```text
core.dataviz → semantic.dataviz
patterns/specs → consume semantic only
```

### Core

Core tokens define raw encoding primitives:

* shapes
* patterns
* stroke styles
* opacity values

> Opacity primitives in `core.dataviz` are independent from foundation opacity tokens.
> They exist specifically to support analytical encoding and must not be used as a general-purpose transparency system.

### Semantic

Semantic tokens define analytical intent:

* series differentiation
* reference treatment
* forecast treatment
* uncertainty treatment
* contextual de-emphasis

Patterns and components must consume semantic tokens only.

---

## Core Tokens

```text
core.dataviz.shape.1..8
core.dataviz.pattern.1..6

core.dataviz.stroke.solid
core.dataviz.stroke.dashed
core.dataviz.stroke.dotted

core.dataviz.opacity.context
core.dataviz.opacity.muted
core.dataviz.opacity.uncertainty
```

Core tokens are value-only and context-free.

---

## Semantic Tokens

```text
dataviz.encoding.shape.series.1..8
dataviz.encoding.pattern.series.1..6

dataviz.encoding.stroke.reference
dataviz.encoding.stroke.forecast
dataviz.encoding.stroke.uncertainty

dataviz.encoding.opacity.context
dataviz.encoding.opacity.muted
dataviz.encoding.opacity.uncertainty
```

These tokens form the public API of the category.

---

## Families

### Shape

`shape.series.*` defines categorical distinction through form.

Use shape when:

* categories need redundant differentiation
* marks are small or dense
* color alone would be insufficient

Shape is primarily intended for point-based representations and compact categorical marks.

### Pattern

`pattern.series.*` defines categorical distinction through fill texture.

Use pattern when:

* categories appear in filled regions
* area-based marks need redundancy
* grayscale or low-color contexts must remain interpretable

Pattern is especially useful in filled analytical areas, including geospatial overlays.

### Stroke

Stroke encodes semantic treatment for line-based distinctions.

* `stroke.reference` is used for analytical guides or baselines
* `stroke.forecast` is used for projected or forward-looking segments
* `stroke.uncertainty` is used for uncertain or estimated bounds

Stroke semantics must remain visually distinct from primary data marks.

### Opacity

Opacity defines analytical emphasis, not general visual transparency.

This category introduces **analytical encoding opacity**, which is distinct from
foundation opacity used for UI behaviors such as scrims, loading states, or surface dimming.

- foundation opacity modifies interface layers and interaction states
- dataviz encoding opacity encodes analytical meaning within data representations

Opacity in Data Visualization must be interpreted as a semantic channel,
not as a styling control.

---

## Geospatial Use

Geospatial overlays use the same encoding semantics as the rest of Data Visualization.

This means:

* point-based overlays may use `shape.series.*`
* area-based overlays may use `pattern.series.*`
* spatial references may use `stroke.reference`
* uncertain spatial overlays may use `stroke.uncertainty` and `opacity.uncertainty`
* reduced map context may use `opacity.context`

`dataviz.geo.*` does not define a second encoding language for maps.

Geography changes context, not the semantic role of encoding channels.

---

## Usage Rules

### 1. Encodings are semantic, not chart-specific

Tokens must not encode chart types.

Invalid examples:

* `bar.pattern.1`
* `line.stroke.primary`
* `map.fill.texture`

### 2. Encodings complement color

Use encodings to reinforce meaning already established through semantic color or analytical role.

Encodings should not introduce a parallel, unrelated classification system.

### 3. Forecast and uncertainty require composition

Forecast and uncertainty must not rely on color alone.

They should be expressed through composition across families, for example:

* color + stroke
* color + opacity
* color + pattern

### 4. Opacity is not a free styling control

Only semantic opacity roles are allowed.

Do not create ad-hoc transparency values to tune chart appearance.

### 5. Do not mix analytical opacity with UI opacity

Analytical opacity (`dataviz.encoding.opacity.*`) must not be used for:

- UI layering
- overlays or scrims
- disabled or inactive interface states

Foundation opacity tokens must not be used to encode analytical meaning.

These systems are intentionally separate.

### 6. Keep categorical sets bounded

Series differentiation through shape and pattern must remain bounded and intentional.

If the number of categories exceeds the supported set, solve the problem at the pattern layer through grouping, filtering, faceting, or another visualization strategy.

---

## Accessibility

Encodings are part of the accessibility contract of Data Visualization.

They help ensure that:

* meaning does not depend only on color
* meaningful graphics remain distinguishable
* categories remain readable under constrained viewing conditions

Patterns and components should use encodings whenever color alone would make interpretation fragile.


## Relationship to Other Categories

### Colors

Colors provide the primary semantic roles for analytical meaning.
Encodings reinforce and stabilize that meaning.

### Geospatial semantics

Geospatial semantics govern spatial context and overlay states.
They do not replace shape, pattern, stroke, or opacity as analytical channels.

### Foundation tokens

Spacing, typography, borders, and other primitives remain part of the global foundation and are reused as needed.

---

## Validation

### Errors (validation must fail when)

- analytical opacity does not stay separate from foundation opacity:
  - `dataviz.encoding.opacity.*` resolves outside `core.dataviz.opacity.*`
  - foundation opacity tokens are used to encode analytical meaning

- forecast or uncertainty is introduced without composition support:
  - `dataviz.encoding.stroke.forecast` or `dataviz.encoding.stroke.uncertainty` is missing when those semantics are declared
  - uncertainty is modeled only by opacity without a second reinforcing channel

- `dataviz.geo.*` introduces a parallel encoding language instead of reusing:
  - `dataviz.encoding.shape.*`
  - `dataviz.encoding.pattern.*`
  - `dataviz.encoding.stroke.*`
  - `dataviz.encoding.opacity.*`

### Warning (validation should warn when)

- `dataviz.encoding.shape.series` exceeds `1..8`

- `dataviz.encoding.pattern.series` exceeds `1..6`

- `dataviz.encoding.stroke.reference`, `dataviz.encoding.stroke.forecast`, and `dataviz.encoding.stroke.uncertainty` lose effective distinction

- `dataviz.encoding.opacity.context`, `dataviz.encoding.opacity.muted`, and `dataviz.encoding.opacity.uncertainty` lose effective distinction

- the category exposes color semantics but no shape or pattern series primitives, increasing the risk that categorical meaning depends only on color

- pattern and shape series capacities are both absent, reducing redundancy options for categorical differentiation

---

## Summary

Encodings define the non-color channels of analytical meaning.

They keep the system accessible, composable, and resilient by standardizing how charts and overlays differentiate:

* categories
* references
* forecasts
* uncertainty
* context

across both generic and geospatial analytical views.
