---
title: FSL Structural Language
---

# FSL Structural Language

> **The FSL Structural Language defines how foundational semantic concepts are combined into valid, governed, machine-usable semantic expressions.**
>
> It is the formal structure that sits between the **FSL Lexicon** and all **derived semantic systems**.

This document is normative.

It defines:

- the structural dimensions of the language
- the canonical shape of semantic expressions
- normalization rules
- legality rules
- contextual refinement rules
- the interface boundary to downstream projections
- conformance requirements

It does **not** define:

- the full dictionary of core concepts
- component APIs
- token-family grammars
- theme values
- runtime implementation

Those belong to other artifacts.

---

# 1. Purpose

The purpose of the FSL Structural Language is to make the FSL Lexicon usable as a real language.

The Lexicon defines:

- what the terms mean

The Structural Language defines:

- how terms can be combined
- what combinations are valid
- what combinations are invalid
- what context may refine
- what downstream systems may derive

Without the Structural Language, the Lexicon is a dictionary without syntax.  
Without the Lexicon, the Structural Language is a syntax without meaning.

Both are required.

---

# 2. Role in the architecture

The semantic architecture is composed of five layers:

1. **FSL Lexicon**  
   The dictionary of foundational concepts.

2. **FSL Structural Language**  
   The formal structure of valid semantic expressions.

3. **Component Semantics Projection**  
   The component model derived from FSL. Specified by the [Component Model](/docs/design/design-system/components/component-model).

4. **Semantic Token Projection**  
   The semantic token model derived from FSL. Specified by the [design tokens documentation](/docs/design/design-system/design-tokens/model).

5. **Resolution contract**  
   The obligation that every resolution function (validate, normalize, resolve, project, explain) has a declared owner. Defined in §14.

This document defines only layer 2. It defines structure, not delivery state — the implementation status of each layer is tracked in the [FSL overview](./index.md).

---

# 3. Design principles

## 3.1 Structure must remain smaller than projections

The Structural Language must remain minimal.  
Anything that exists only because a downstream system needs it belongs in a projection profile, not here.

## 3.2 Every dimension must answer a distinct question

Dimensions must be orthogonal.  
If two dimensions answer the same semantic question, one of them is wrong or redundant.

## 3.3 The language must support composition

The meaning of a valid expression must come from:

- the meanings of its constituent terms
- the structure that combines them
- lawful context refinement only

## 3.4 Context refines; it does not redefine

Context may narrow or specialize meaning, but it may not replace foundational identity.

## 3.5 Structural legality is part of the language

Validity is not a downstream implementation heuristic.  
It is part of the language itself.

## 3.6 Projections are derived, not foundational

Component semantics and token semantics must derive from this structure.  
They must not define their own incompatible language.

## 3.7 Composition names structural slots

The Composition dimension deliberately reuses Structural Role names (`label`, `description`, `status`, `control`, `body`, `selection`, and others) as **slot designators** — the parent-side name of the position where a structurally-typed part belongs.

This is a design choice, not a disjointness violation. A term like `label` in the Structural Role dimension describes a part's own topology; the same term in the Composition dimension designates the slot that part occupies in a larger whole. The dimension carries the distinction; the shared name carries the correspondence between a part and the slot it fills. See §11.3 for the formal disjointness rule.

---

# 4. Semantic strata

The Structural Language recognizes two strata.

## 4.1 Foundational stratum

The foundational stratum contains semantic dimensions that exist before:

- component APIs
- token grammars
- theme systems
- styling engines

These dimensions are the true core of the language.

## 4.2 Projection stratum

The projection stratum contains semantic forms needed by downstream systems.

Examples:

- token-family-specific semantic domains
- text-scale grammars
- spacing contracts
- size contracts

These are governed by FSL but are **not** part of the foundational structure defined here.

This document covers only the foundational stratum and its projection interfaces.

---

# 5. Foundational structural dimensions

The Structural Language defines the following structural dimensions.

The actual vocabulary of each dimension lives in the **FSL Lexicon**.  
This document defines their structural role in the language.

## 5.1 Entity

**Question answered:** What kind of interactive thing is this?

The semantic identity of the thing.

**Vocabulary:** [Lexicon §1 — Entity Kind](./fsl-lexicon.md#1-entity-kind) (the normative registry; this document never re-enumerates it).

Entity is the strongest identity dimension.
It must not be redefined by context.

:::note Name collision with the Structure dimension
The Entity Kind `Structure` (capitalized) is distinct from the Structural Role dimension (§5.2) which uses lowercase `structure` as its field name in the canonical expression. See Lexicon §10.12 for the full disambiguation.
:::

---

## 5.2 Structure

**Question answered:** What structural function does this part play?

The semantic topology of the thing or part.

**Vocabulary:** [Lexicon §2 — Structural Role](./fsl-lexicon.md#2-structural-role).

Structure describes part function, not identity.

---

## 5.3 Interaction

**Question answered:** What kind of interaction is being expressed?

Interaction describes the mode of user-system semantic operation.

**Vocabulary:** [Lexicon §3 — Interaction Kind](./fsl-lexicon.md#3-interaction-kind).

> `popup.*` composite terms (listbox/grid/tree/dialog) are intentionally **not** foundational — they belong to the Web/ARIA Projection Profile. The trigger carries `disclose.toggle`; the revealed surface is modeled as its own Entity expression. See FSL Lexicon §10.14.

Interaction is a foundational dimension because real interface structures cannot be disambiguated safely from identity and structure alone. (A profile may still defer codifying it — see §13.3.)

---

## 5.4 Composition

**Question answered:** What role does this thing play within a larger composition?

Composition expresses relational semantics.

**Vocabulary:** [Lexicon §4 — Composition Role](./fsl-lexicon.md#4-composition-role).

Composition refines meaning relationally.  
It does not replace entity identity.

---

## 5.5 Evaluation

**Question answered:** What evaluative or emphatic meaning is carried?

Evaluation expresses semantic emphasis or valence.

**Vocabulary:** [Lexicon §5 — Evaluation](./fsl-lexicon.md#5-evaluation) (a discriminated union of emphasis and valence — an expression carries one class or the other, never both).

Evaluation is foundational because meaning like “negative” or “muted” must exist before token color or visual realization is chosen.

---

## 5.6 Consequence

**Question answered:** What user-facing consequence or risk profile is carried?

Consequence expresses interaction-critical semantics such as risk, reversibility, or interruption.

**Vocabulary:** [Lexicon §6 — Consequence](./fsl-lexicon.md#6-consequence).

Consequence exists because some semantics materially shape interaction design and user experience while remaining deeper than styling.

---

## 5.7 State

**Question answered:** What semantic or interactional state is active?

**Vocabulary:** [Lexicon §7 — State](./fsl-lexicon.md#7-state).

State is governed by legality.  
Not every state is legal for every interaction type.

---

## 5.8 Layer

**Question answered:** What semantic layer role does this thing occupy?

**Vocabulary:** [Lexicon §8 — Layer Role](./fsl-lexicon.md#8-layer-role).

Layer is semantic layering, not raw z-index.

---

## 5.9 Context

**Question answered:** What lawful contextual refinements are active?

Context is a controlled refinement dimension.

**Vocabulary:** [Lexicon §9 — Context Class](./fsl-lexicon.md#9-context-class).

Context may refine meaning but must not redefine foundational identity.

---

# 6. Canonical semantic expression

The foundational language is expressed through a canonical semantic expression.

## 6.1 Canonical form

```txt id="1x1udm"
SemanticExpression = {
  entity: EntityTerm,
  structure: StructureTerm,
  interaction?: InteractionTerm,
  composition?: CompositionTerm,
  evaluation?: EvaluationTerm,
  consequence?: ConsequenceTerm,
  state?: StateTerm,
  layer?: LayerTerm,
  context?: ContextRefinementSet
}
```

## 6.2 Required dimensions

Every valid semantic expression must contain:

- `entity`
- `structure`

All other dimensions are optional by form, but only legal when semantically meaningful.

## 6.3 Optionality rules

A dimension may be omitted when:

- it is not relevant to the expression
- it is lawfully inferable during normalization
- it is absent at the foundational layer and introduced later only by lawful projection

A dimension must not be omitted when its absence would make the expression semantically ambiguous in a way that the language cannot legally resolve.

---

# 7. Expression classes

Not all expressions are equally complete.
The language defines three expression classes.

## 7.1 Minimal expression

Contains only the required dimensions.

Example shape:

```txt id="cjwg1z"
{
  entity: Action,
  structure: control
}
```

A minimal expression is legal if:

- it is well-formed
- the combination is permitted by legality rules
- omitted dimensions may remain omitted or be lawfully inferred later

## 7.2 Qualified expression

Adds one or more optional dimensions that further specify meaning.

Example shape:

```txt id="za1gvt"
{
  entity: Action,
  structure: control,
  interaction: confirm,
  evaluation: primary
}
```

## 7.3 Refined expression

A qualified expression after lawful contextual refinement and normalization.

This is the form consumed by downstream projection profiles and the resolution mechanisms that fulfill §14.

---

# 8. Well-formedness rules

These are syntactic-semantic rules of the language.

## 8.1 Rule W-01

Every expression must contain valid terms from approved foundational registries.

## 8.2 Rule W-02

No dimension may appear twice in contradictory form within the same expression.

## 8.3 Rule W-03

A term must belong to the correct dimension.

A `State` term cannot be used where an `Evaluation` term is expected, and so on.

## 8.4 Rule W-04

A structural expression must be explicit enough to be distinguishable from its nearest semantic neighbors.

If an expression remains ambiguous after all lawful inference, it is invalid.

## 8.5 Rule W-05

Context may not appear alone.
Context only exists as refinement on a base expression.

---

# 9. Legality model

Well-formed does not mean legal.

The language requires legality checking.

## 9.1 Lexical legality

Every term must be:

- defined in the FSL Lexicon
- active in the current FSL version
- legal for its dimension

## 9.2 Structural legality

An expression is structurally legal only if the combination of dimensions is permitted.

## 9.3 Context legality

A contextual refinement is legal only if it narrows or specializes meaning without redefining foundational identity.

## 9.4 Projection legality

An expression may be well-formed and foundationally legal, yet still unsupported by a specific downstream projection profile.
That is a projection concern, not a core language concern.

---

# 10. Legality obligations and matrices

Well-formedness (§8) is checked per expression. Legality is checked per **combination** — and the language requires every legality decision to have a declared owner. The foundational layer defines the obligation here; the actual values — which combinations are legal — are the responsibility of each Projection Profile.

## 10.1 The legality obligation

For every pair of **codified** dimensions whose combination can be invalid, a Projection Profile must declare exactly one legality source:

- **Authorial matrix** — an explicit matrix artifact (e.g. Entity × Structure).
- **Runtime resolution** — a named runtime mechanism resolves legality (e.g. a platform layer that only surfaces applicable states). The profile must name the mechanism.
- **Structural impossibility** — the combination cannot be expressed in the profile's surface, and the profile says so.

A Projection Profile is incomplete if any pair of its codified dimensions lacks a declared legality source.

## 10.2 Non-codified dimensions

Legality obligations follow the dimension's disposition (§13.3):

- an **absorbed** dimension's legality must be recoverable from the absorbing mechanism;
- a **deferred** dimension carries no legality obligation until readmission.

## 10.3 Canonical matrices

These matrices are the canonical illustrations of the obligation. Which of them a profile owes depends on which dimensions it codifies — they are examples, not a fixed checklist:

- **Entity × Structure** — which structures are legal for each entity kind (`Overlay × backdrop` may be legal; `Action × backdrop` is generally illegal).
- **Entity × Interaction** — which interaction kinds are legal for each entity kind (`Selection × toggle.tristate` may be legal; `Feedback × entry.text` is illegal).
- **Interaction × State** — which states are legal for each interaction kind (`toggle.tristate` allows `indeterminate`; `navigate.link` may allow `visited`; `command` does not generally allow `checked`).
- **Structure × Layer** — which layer roles are meaningful for which structural roles (`backdrop × blocking` may be legal; `label × blocking` is generally not).
- **Composition × Refinement** — what refinements are legal under each composition role (`dismissAction` may lawfully bias downstream evaluation or consequence handling; no composition role may redefine entity identity).

Profiles have lawfully needed matrices this list does not name — Entity × Evaluation, Entity × Composition, Entity × Consequence — and future profiles may need others. Conformance is measured against the obligation in §10.1, not against this list.

---

# 11. Normalization model

Normalization transforms a valid expression into canonical internal form before projection.

Normalization is part of the language contract.

## 11.1 Purpose of normalization

Normalization exists to:

- fill lawful defaults
- make implicit semantics explicit when permitted
- produce a canonical form for downstream systems
- avoid repeated ad hoc interpretation

## 11.2 Types of normalization

### A. Defaulting

A dimension may receive a default if the default is explicitly governed.

Example:

- `Action + control` may default to `interaction=command`

### B. Inference

A dimension may be inferred if the inference is explicit, deterministic, and governed.

Example:

- `Selection + toggle.tristate` may make `indeterminate` a legal state even if it is not active

### C. Canonicalization

Equivalent structural forms may be normalized to one canonical representation.

## 11.3 Normalization prohibitions

Normalization must not:

- invent new base identity
- bypass legality
- hide ambiguity that should instead be rejected
- smuggle in projection-specific terms into the foundational layer

## 11.4 Concurrent activation

Every dimension in an expression is single-valued (§6.1) — but at runtime an environment may activate several State terms simultaneously (an item can be at once selected, focused, and hovered). A profile that must resolve concurrent activations into a single term must declare a **deterministic, total resolution order**.

A resolution order that collapses Lexicon-distinct terms into one (for example, resolving a selection activation to `checked`) is a **lossy projection decision**. It is held to the same standard §13.3 applies to absorbed dimensions: declared, justified, and either recoverable from the resolving mechanism or carrying an explicit readmission criterion. A profile may not collapse distinct terms silently.

---

# 12. Context refinement model

Context is part of the language, but it is tightly constrained.

## 12.1 What context may do

Context may:

- narrow interpretation
- select among lawful alternatives
- specialize downstream projection
- encode known environmental constraints

## 12.2 What context may not do

Context may not:

- redefine `entity`
- contradict legality matrices
- collapse distinctions between dimensions
- introduce projection-only meaning into the foundational layer

## 12.3 Context classes

The language recognizes the following context classes:

- `composition`
- `environment`
- `interactionEnvironment`
- `mode`
- `density`
- `accessibilityPreference`
- `platformCondition`

Any new context class must be governed as an extension.

---

# 13. Projection interfaces

The Structural Language must support projection, but it must not hard-code the structure of downstream systems.

Projection is handled by **Projection Profiles**.

## 13.1 Required projection targets

The architecture must support at least:

### Component Semantics Projection

Derives:

- semantic identity for the component model
- part/topology semantics
- relational/compositional semantics
- interaction legality for components

### Semantic Token Projection

Derives:

- family-specific semantic forms
- semantic contracts
- semantic addresses
- projection-level legality rules

## 13.2 Projection boundary rule

If a term exists only because a downstream projection needs it, it does not belong in the Structural Language.

## 13.3 Profile dimension dispositions

A Projection Profile is not required to codify every foundational dimension identically. Each dimension in a profile must declare one of three dispositions:

- **Codified** — the profile exposes the dimension with its own registry and legality rules. The canonical case.
- **Absorbed** — the profile declares that the dimension's semantic content is fully captured by another mechanism already present in the profile, and the dimension is therefore not exposed as independent. The profile must name the absorbing mechanism and justify why no meaning is lost.
- **Deferred** — the profile acknowledges the dimension, reserves its name, but does not yet codify it. The profile must state the criterion that will graduate the dimension from deferred to codified.

A disposition is legal only if it preserves foundational meaning. A profile may not **silently** omit a dimension, nor may it absorb a dimension whose distinctions cannot be recovered from the absorbing mechanism.

---

# 14. Resolution contract

The Structural Language does not require a resolution engine. It requires that resolution be lawful — and it defines that requirement as a contract.

The choice of meaning is not deterministic: authors choose terms, context refines them, taste exists. What must be deterministic is the projection of a chosen expression into its result. The contract governs only that projection.

A conforming system must provide the following resolution functions, and must name the owner of each:

- **Validate** — deliver a legality verdict from the declared legality sources (§9, §10)
- **Normalize** — apply lawful defaults, inference, and canonicalization (§11)
- **Resolve** — reduce concurrent activations through a declared, total order (§11.4)
- **Project** — translate the refined expression into a projection profile's form (§13)
- **Explain** — make every verdict and projection derivable from declared sources, not local interpretation

The contract's inputs are: a semantic expression, the active lexical registries, the declared legality sources, the normalization rules, contextual refinement inputs, and a selected projection profile. Its outputs are: the normalized expression, a legality verdict, the projected semantic form, and an explanation.

A single resolver engine that performs every function is one lawful fulfillment of this contract. A pipeline of distributed mechanisms, each owning one function, is another.

What makes token resolution deterministic is that every resolution function has a declared owner — not that one program performs them all.

---

# 15. Conformance requirements

A system conforms to the FSL Structural Language only if it:

1. uses the FSL Lexicon as its foundational vocabulary
2. forms expressions in the canonical shape defined here
3. meets the legality obligations of §10
4. implements normalization explicitly
5. treats context as lawful refinement, not free reinterpretation
6. uses Projection Profiles for all downstream derivation
7. exposes enough information for deterministic explanation

---

# 16. Minimal examples

## 16.1 Action control

```txt id="j3rhhf"
{
  entity: Action,
  structure: control
}
```

This is a legal minimal expression if `Action × control` is legal.

---

## 16.2 Confirming primary action

```txt id="44ngyw"
{
  entity: Action,
  structure: control,
  interaction: confirm,
  composition: primaryAction,
  evaluation: primary
}
```

This is a qualified expression.

---

## 16.3 Destructive dismissive overlay flow

```txt id="4rn11t"
{
  entity: Overlay,
  structure: backdrop,
  interaction: status.interruptive,
  consequence: destructive,
  layer: blocking
}
```

This is valid only if:

- `Overlay × backdrop` is legal
- `status.interruptive` is legal under that entity/structure combination
- `blocking` is legal for `backdrop`

---

## 16.4 Tri-state selection control

```txt id="4l3qcb"
{
  entity: Selection,
  structure: selectionControl,
  interaction: toggle.tristate,
  state: indeterminate
}
```

This expression exists specifically to prove that the language can represent semantics that cannot be safely reduced to “selected or not”.

---

## 16.5 Navigation item

```txt id="e8l59q"
{
  entity: Navigation,
  structure: item,
  interaction: navigate.link,
  state: current
}
```

This is valid only if:

- `Navigation × item` is legal
- `navigate.link` is legal for `Navigation`
- `current` is legal for `navigate.link`

---

# 17. Extension model

The Structural Language supports extensions.

An extension is legal only if it:

- introduces meaning not already expressible
- does not duplicate existing dimensions
- does not contradict foundational meaning
- declares its legality rules
- declares its normalization rules if needed
- declares whether it belongs to the foundational or projection stratum

Extension must be rare.

## 17.1 Projection renaming

A Projection Profile may introduce new names for foundational dimensions when the projection name better models the projection's domain, provided:

1. The mapping from foundational term to projection term is explicit and documented in the projection artifact.
2. The foundational vocabulary is preserved in meaning.
3. The projection name does not introduce new semantic content that belongs in the foundational layer.

Example: a Component Semantics Projection could rename the `Entity` dimension to `Responsibility` — values identical, only the dimension name changes to fit the component model. A profile may equally choose to keep the foundation names; keeping them is the default posture.

---

# 18. Final statement

The FSL Structural Language is the formal structure of the foundational semantic language.

It turns the Lexicon into a real language by defining:

- the foundational dimensions
- the canonical expression form
- legality
- normalization
- contextual refinement
- projection interfaces

It is intentionally small.

Its purpose is not to solve tokens or components directly.
Its purpose is to make it possible for both to derive from the same semantic language, and for resolution to operate deterministically through declared owners rather than local interpretation.
