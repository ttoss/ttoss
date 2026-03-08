---
title: Components
---

# ttoss Components

**ttoss Components** is the semantic, token-native component framework of ttoss.

It defines the **public UI layer** of the system.

**Core Tokens → Semantic Tokens → Components → Patterns → Applications**

That is the model.

- **Core tokens** define raw values.
- **Semantic tokens** define usage.
- **Components** define reusable UI contracts.
- **Patterns** compose components into task-level solutions.
- **Applications** build products from that system.

## Position

ttoss Components exists to keep UI **stable, reusable, and scalable** across themes, products, and implementations.

It is a **semantic framework first**.  
Official component libraries are **reference implementations** of that framework.

The role of ttoss Components is not to publish every possible widget.  
Its role is to define a small, durable public layer of UI meaning.

## What makes a ttoss component

A ttoss component is a **reusable semantic contract** built on semantic tokens.

A public component must be:

- **semantic** — defined by purpose and interaction meaning
- **token-native** — built from semantic tokens only
- **accessible** — accessibility belongs to the component contract
- **durable** — stable across themes, brands, and implementation changes
- **reusable** — worth standardizing beyond a single product

If it does not meet those conditions, it does not belong in the public ttoss surface.

## Core rules

### Components consume semantic tokens only

Components never consume core tokens directly.

Core tokens define values.  
Semantic tokens define usage.  
Components consume semantics.

### Public meaning belongs to ttoss

The meaning of a public component is defined by ttoss.

Implementation packages may evolve.  
The public contract must remain stable.

### Semantics come before styling

A component is defined by what it means and what it enables.

Styling is an implementation of that meaning.  
It is not the source of the contract.

### Accessibility is part of the contract

Accessibility is part of the component itself, not a later enhancement.

A public component must preserve the accessibility expectations of its role and interaction.

### The public surface stays small

The public catalog is intentionally selective.

A component becomes public only when it is clearly reusable, semantically stable, and worth the long-term cost of support.

## Family-first system

ttoss Components is organized by **semantic families**, not by a flat visual catalog.

The system starts from recurring UI roles in applications, such as:

- **Action**
- **Input**
- **Selection**
- **Navigation**
- **Disclosure**
- **Overlay**
- **Feedback**
- **Surface**

Components belong to families.  
Families give the system coherence because they group UI by semantic responsibility, not by visual similarity.

## Variants

ttoss does not use a single global visual menu of variants.

Variants are **small semantic axes defined per family**, only when they represent a real reusable distinction.

That means:

- variants are family-specific
- variants are semantic
- variants are not a dumping ground for visual options
- state is not variant

The system starts by asking:

- what family does this belong to?
- what type of component is it?
- what semantic distinctions actually matter here?

Not every component needs variants.  
Not every difference deserves a public axis.

## Patterns stay above components

Components and patterns are different layers.

A **component** is a reusable unit of UI meaning.  
A **pattern** is a composition of components used to solve a broader interface problem.

ttoss Components owns the component layer.  
It does not collapse patterns into the base component catalog.

## Reference implementations

ttoss may provide official implementation packages, such as React and web packages.

Those packages realize the system.  
They do not define it.

The system is defined by its semantic contracts.  
Implementation technology is replaceable.

## Local application layer

Applications need flexibility.

The official escape hatch of ttoss Components is the **local application layer**.

Applications may create:

- local patterns
- local components
- product-specific compositions

These local solutions remain outside the public ttoss surface unless they later prove reusable, stable, and semantically mature enough to be promoted.

This keeps ttoss flexible without weakening the public system.

## Public catalog

The public catalog is **small by design**.

ttoss should publish **few components, built well**, instead of many components with uneven maturity.

The goal is a public surface that is clear, reliable, and durable.

## Definition

**ttoss Components is a semantic, token-native, selective component framework.**

It provides a stable public UI layer above tokens and below patterns.

It standardizes reusable UI meaning.  
It keeps the public surface small and durable.  
It allows products to move fast through a local application layer without polluting the system.

That is ttoss Components.
