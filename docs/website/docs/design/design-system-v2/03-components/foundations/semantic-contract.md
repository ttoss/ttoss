---
title: Semantic Contract
---

# Semantic Contract

The **Semantic Contract** defines the stable meaning of components in **ttoss**.

It establishes the contract between:

- **Tokens**, which define visual language
- **Components**, which define reusable UI meaning
- **Applications**, which compose interfaces from both

**Purpose:** keep the component system **consistent, accessible, themeable, and durable** over time.

This contract prevents components from drifting into implementation-driven styling and ensures semantics remain stable as themes, products, and implementations evolve.
This document defines the invariants of the component layer. It intentionally excludes implementation details.

---

## Invariants

The rules below are permanent.

### 1. Components consume semantic tokens only

Components must never consume core tokens directly.

- Core tokens define values.
- Semantic tokens define usage.
- Components consume semantics.

This keeps the API stable across themes and prevents product code from depending on raw values.

### 2. Semantics precede appearance

A component is defined first by **what it means** and **what it does**, not by how it looks.
Visual treatment is a consequence of semantics, never the source of semantics.

### 3. ttoss owns the public meaning

The public meaning of a component belongs to **ttoss**.
Implementation libraries may realize that meaning, but they do not define it.
This keeps the system durable even when implementation strategy changes.

### 4. Components are contracts, not escape hatches

A component is not a place where teams locally re-decide the design system.
If the same exception appears repeatedly, that is a signal that the semantic system may need to evolve.

### 5. Foundations stay orthogonal

Components compose foundations, but they must not collapse them into opaque meaning.
In ttoss:

- **color** expresses meaning and intent
- **elevation** expresses depth
- **typography** expresses text style
- **spacing** expresses layout relationships
- **sizing** expresses physical bounds and ergonomics

These concerns must remain distinct.

### 6. Accessibility is part of the contract

Accessibility is not an enhancement applied later.

A component contract must preserve:

- semantic structure
- focus and keyboard expectations
- state exposure
- readable and perceivable content
- ergonomic interaction where relevant

A component that breaks these expectations is breaking the contract.

### 7. The contract stays small and stable

The semantic contract defines only what must remain stable across the system.
It must not absorb implementation details, local workarounds, or product-specific exceptions.

---

## Boundary of the component layer

The component layer is responsible for:

- reusable UI meaning
- stable semantic structure
- stable interaction meaning
- stable state semantics
- consistent consumption of semantic tokens

The component layer is not responsible for:

- defining raw values
- inventing new visual meaning locally
- solving product-specific workflows
- replacing patterns
- encoding implementation details into the public contract

Patterns remain above the component layer.

A **component** is a reusable semantic UI contract.  
A **pattern** is a composition of one or more components used to solve a user task.

## Final rule

**ttoss owns the semantic contract.**

- Tokens define the language.
- Components define reusable semantic UI contracts.
- Patterns compose those contracts into user-facing solutions.
- Applications build products from that system.

That is the contract.
