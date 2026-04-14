---
title: Foundational Semantic Language
---

# Foundational Semantic Language (FSL)

> **FSL is the semantic foundation from which components, tokens, themes, and tooling are derived.**

UI systems become incoherent when meaning is defined locally — each component invents its own semantics, each token system invents its own vocabulary, and the gaps are filled by conventions that drift over time. FSL solves this by establishing a single source of semantic truth that all downstream systems derive from rather than define independently.

FSL is not styling, not a token tree, not a component API. It is the formal language of meaning that precedes all of those.

## Architecture

FSL is composed of two normative artifacts:

**[FSL Lexicon](./fls-lexicon.md)** — the controlled vocabulary. Defines the canonical meaning of every core term across nine semantic dimensions: Entity Kind, Structural Role, Interaction Kind, Composition Role, Evaluation, Consequence, State, Layer Role, and Context Class.

**[FSL Structural Language](./fls-structural-language.md)** — the grammar. Defines how lexicon terms combine into valid semantic expressions, what combinations are legal, how context may refine meaning, and how downstream projections must derive from the foundation.

## What derives from FSL

Every downstream semantic system is a **projection** of FSL — it derives from the foundation and must not define its own incompatible vocabulary:

- **Component Semantics Projection** (`component-model.md` + `taxonomy.ts`) — maps FSL to the component model
- **Semantic Token Projection** (design tokens docs + `Types.ts`) — maps FSL to token families and addresses
- **Deterministic Resolver** — build-time/runtime tooling that validates and projects semantic expressions

## The guarantee

The same semantic expression, in the same context, always produces the same result — regardless of which projection consumes it. This is only possible because meaning is defined once at the foundation.
