---
sidebar_position: 2
title: Strategy
---

# GeoVis Strategy

## AI-Native Analytical Maps

Status: Strategy
Audience: Product, Engineering, Design, Data, AI
Scope: GeoVis, GeoVis Workspace, AI map generation, map editing, and map operation

---

## 1. What GeoVis is

GeoVis is the AI-native analytical mapping layer for product applications.

It exists to turn user intent into trustworthy, inspectable maps.

GeoVis is not a generic map library, a full GIS editor, a dashboard builder, or a clone of kepler.gl. It is a focused system for generating and operating catalog-backed analytical maps through AI and human interaction.

The strategic flow is:

```txt
user request
→ constrained map intent
→ catalog-grounded resolution
→ validated map
→ rendered UI
→ safe steering and repair
```

The core promise:

> AI can create and modify analytical maps without knowing rendering internals, inventing fields, consuming excessive context, or producing maps that look valid but mean the wrong thing.

---

## 2. Why GeoVis should exist

Most map tools are built for developers, GIS users, or open-ended data exploration.

AI needs a different surface.

A model should not be asked to assemble map-engine configuration, choose arbitrary fields, write visual encodings from memory, or decide joins and legends without constraints.

GeoVis should give AI a smaller, safer interface:

```txt
show this metric
for this geography
over this time range
with these filters
using a valid map type
then let the user inspect and refine it
```

The goal is not to make AI more creative with maps.

The goal is to make AI-generated analytical maps reliable enough to render directly in real product UIs.

---

## 3. The problem GeoVis solves

AI is useful for interpreting vague analytical requests.

AI is unreliable when forced to produce complex visualization implementation directly.

GeoVis should structurally reduce these failure modes:

```txt
hallucinated metrics
hallucinated datasets
invalid fields
wrong geography
wrong join
wrong map type
missing legend
misleading encoding
tooltip not matching the map
unexplained missing data
oversized context
full-map regeneration for small changes
```

A map that renders is not enough.

A GeoVis map must be valid, grounded, explainable, and steerable.

---

## 4. Product thesis

AI should usually generate **intent**, not final map implementation.

GeoVis should own the deterministic bridge from intent to map.

```txt
AI proposes.
Catalog constrains.
Resolver decides.
Validator blocks invalid maps.
UI renders.
Actions steer.
Errors repair.
Evals prove quality.
```

The model should not be the source of truth for geography, metrics, joins, encodings, legends, or permissions.

Those belong to the system.

---

## 5. What GeoVis must deliver

GeoVis should deliver seven product capabilities.

### 1. Constrained map intent

A compact AI-facing artifact that describes what the user wants to see.

It should capture the analytical task, metric, geography, time, filters, and unresolved ambiguity.

It should be small, typed, and easy to validate.

### 2. Trusted catalog

A catalog of what can be mapped.

At minimum, the catalog should define available metrics, datasets, geographies, joins, units, formatters, time ranges, filters, allowed map types, permissions, aliases, and descriptions.

The catalog is the main anti-hallucination layer.

If something is not in the catalog, AI cannot use it.

### 3. Deterministic resolution

A resolver converts intent into a valid map.

It decides which data, geography, join, map type, legend, tooltip, missing-data policy, and warnings apply.

This is where product, data, design, and engineering judgment becomes reusable.

### 4. Renderable map document

A resolved map artifact that the UI can render.

It should contain the final map definition: data bindings, geometry, visual encoding, legends, tooltip semantics, view, metadata, and warnings.

It should not be raw low-level rendering configuration unless that is an implementation detail behind the contract.

### 5. Human workspace

A default UI for using the map.

It should provide the map, legend, tooltip, details, controls, warnings, metadata, and table or selected-feature inspection.

The workspace is the human surface.

It should make the map understandable and operable without requiring every application to rebuild common map UI.

### 6. AI operation surface

A compact interface for AI to operate an existing map.

The AI should be able to change metric, geography, time, filters, layers, selection, or explanation through safe semantic actions.

The AI surface is not the visual layout.

The workspace is for humans.
The action surface and context packet are for AI.
Both should control the same resolved map state.

### 7. Repairable errors

Failures should be structured and actionable.

GeoVis should distinguish:

```txt
resolved
needs clarification
unsupported request
catalog mismatch
permission denied
insufficient data
invalid map
```

The system should not render a fake or guessed map when the request cannot be resolved.

A failed map should become a repair loop, not a dead end.

---

## 6. What GeoVis is not

GeoVis should not become:

```txt
a full GIS editor
a general-purpose map playground
a free-form dashboard builder
a low-code analytics platform
a thin wrapper around a map engine
a place for app-specific business logic
a prompt library for map generation
a dumping ground for all map-related UI
```

GeoVis should stay focused on one job:

> Make catalog-backed analytical maps generatable, validatable, renderable, inspectable, and steerable by AI and humans.

---

## 7. Why not use kepler.gl directly

kepler.gl is strong for human-driven geospatial exploration.

It is appropriate when users need to import arbitrary datasets, create layers manually, edit visual channels, configure filters, explore freely, and save rich exploratory map state.

GeoVis has a different purpose.

GeoVis is for product-embedded, catalog-constrained, AI-generated analytical maps.

The distinction:

```txt
kepler.gl
→ human-operated geospatial exploration workspace

GeoVis
→ AI-native analytical map generation and operation layer
```

GeoVis should learn from kepler.gl's separation of visual state, map state, style state, UI state, actions, and serialization.

It should not inherit kepler.gl's broad control surface as the primary interface for AI.

---

## 8. Design principles

### Intent over implementation

AI should express what the map should answer, not how the map engine should draw it.

### Catalog over guessing

AI may choose from known analytical options. It may not invent data reality.

### Resolve before render

No AI-generated map should render until deterministic resolution and validation have succeeded.

### Small context over large context

AI should receive only the information needed for the next decision: available options, current map summary, allowed actions, and structured errors.

It should not need full datasets, full map documents, raw geometry, rendering internals, or long documentation.

### Actions over regeneration

Once a map exists, most changes should be small semantic updates, not full regeneration.

Changing a metric, filter, year, layer, or selected feature should not require rebuilding the entire map from scratch.

### Explainability by construction

Every map should make clear:

```txt
what metric is shown
which geography is used
what the encoding means
which source is used
what is missing
which warnings apply
```

### One source of truth

Each state must have one owner.

Do not duplicate metric, filter, selection, map document, or UI state across AI, application, workspace, and runtime.

### Human and AI steering should converge

If a human can change something through the UI, AI should be able to perform the equivalent semantic operation through the AI operation surface.

---

## 9. The GeoVis operating model

GeoVis should support four modes.

### Generate

Create a map from a user request.

```txt
natural language
→ constrained intent
→ catalog-grounded resolver
→ validated map
→ rendered workspace
```

### Steer

Modify an existing map safely.

```txt
current map
→ semantic action
→ validated update
→ updated map
```

### Explain

Explain the current map from resolved metadata, not model guesswork.

```txt
current map summary
→ metric, geography, source, legend, warnings
→ grounded explanation
```

### Repair

Recover from invalid, ambiguous, unsupported, or incomplete requests.

```txt
structured error
→ allowed options or clarification
→ corrected intent
→ resolved map
```

---

## 10. The AI context packet

GeoVis should produce a compact context packet for AI.

It should summarize the current map and allowed next actions without exposing unnecessary implementation detail.

Example contents:

```txt
current task
current metric
current geography
current time range
active filters
map type
legend summary
warnings
selected feature
allowed actions
available options relevant to the next step
last structured error
```

This is a first-class product artifact.

It keeps AI useful without forcing the model to read full specs, datasets, or map-engine configuration.

---

## 11. Validation model

GeoVis should validate three levels.

### Structural validity

Is the artifact well-formed?

```txt
required fields
types
enums
schema rules
```

### Semantic validity

Does the map make analytical sense?

```txt
metric exists
geography exists
join exists
unit matches formatter
map type fits the metric
legend matches encoding
tooltip matches mapped value
missing data is handled
```

### Product validity

Is the map allowed and appropriate for this application?

```txt
permissions
approved datasets
approved metrics
freshness
risk policy
supported geographies
```

A map can be structurally valid and still be wrong.

GeoVis must care about all three.

---

## 12. What "the right map" means

A right map is not simply a rendered map.

A right map satisfies the user's analytical task using valid data, an appropriate geography, a defensible visual encoding, and clear interpretation surfaces.

GeoVis should explicitly support common analytical tasks:

```txt
distribution
comparison
ranking
change over time
outlier detection
feature lookup
coverage or gap analysis
```

Each task should have expected rules for metric type, geography, map type, legend, tooltip, and warnings.

This gives the resolver and evals something concrete to judge.

---

## 13. Evaluation

GeoVis is not ready when maps render.

GeoVis is ready when generation, steering, explanation, and repair pass representative evals against real catalogs.

Evals should measure:

```txt
schema validity
correct metric
correct geography
correct map type
hallucinated ID rate
resolver success rate
ambiguity detection
repair success
token cost
turns to rendered map
manual correction rate
```

The key question:

> Did the system produce the right map, cheaply, safely, and with a recoverable failure path?

---

## 14. Strategic boundaries

Implementation can change.

Package names, components, providers, schemas, and runtime details are not the strategy.

The strategy is the boundary model:

```txt
AI intent
→ small, constrained, model-friendly

Catalog
→ trusted source of mappable reality

Resolver
→ deterministic product/data/design judgment

Map document
→ validated rendering contract

Runtime
→ map execution and interaction

Workspace
→ human operation surface

Action surface
→ AI operation surface

Context packet
→ compact AI state

Evals
→ proof that the system works
```

Any implementation that strengthens these boundaries is aligned.

Any implementation that weakens them needs scrutiny.

---

## 15. Decision checklist

Before adding a feature to GeoVis, ask:

```txt
Does it make AI-generated maps more reliable?
Does it reduce hallucination risk?
Does it reduce context cost?
Does it make invalid maps easier to reject or repair?
Does it improve map understanding?
Does it preserve catalog-grounded resolution?
Does it avoid leaking map-engine internals?
Does it avoid turning GeoVis into a GIS editor?
```

If not, it probably belongs in the application or in a separate package.

---

## 16. Final definition

GeoVis is the AI-native analytical mapping layer for product applications.

It turns vague analytical requests into validated, inspectable maps through constrained intent, trusted catalog, deterministic resolution, safe actions, compact context, and evaluation.

The strategic formula:

```txt
Intent, not implementation.
Catalog, not hallucination.
Resolution, not guessing.
Actions, not regeneration.
Repair, not dead ends.
Evaluation, not hope.
```

GeoVis should exist only if it makes AI-generated analytical maps reliable enough to use directly in real product interfaces.
