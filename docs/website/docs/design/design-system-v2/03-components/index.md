---
title: Components
---

# Components

The **Components layer** defines the **reusable semantic UI contracts** of ttoss.

If tokens define the visual language of the system, components define the reusable UI meaning that applications compose into interfaces.

- **Tokens define the language.**
- **Components define reusable semantic UI contracts.**
- **Applications compose interfaces from both.**

## Model

The semantic model of ttoss is:

**Core Tokens → Semantic Tokens → Components → Patterns → Applications**

- **Core Tokens** define raw values
- **Semantic Tokens** define contextual usage
- **Components** define reusable semantic UI contracts
- **Patterns** compose components to solve user tasks
- **Applications** compose real product interfaces

This extends the token architecture already established in ttoss, where semantic tokens form the API consumed by components and patterns, while core tokens remain the source of truth for themes.

## What a component is

A **ttoss component** is a reusable semantic UI contract.

A component is **not**:

- a visual preset
- a styling recipe
- a framework wrapper
- a local implementation shortcut

A component exists to bind:

- semantic token usage
- interaction meaning
- accessibility semantics
- structural expectations
- stable behavioral states

into a reusable unit that product code can trust.

## Scope

This documentation explains how components are **defined, structured, and governed** in ttoss.

It covers:

- component principles
- the semantic contract
- the component model
- variants, anatomy, and state
- boundaries between components and patterns
- accessibility, responsiveness, and density guidance
- governance and the public component catalog

## Principle

The component layer exists to keep UI meaning **stable** while themes, products, and implementations evolve.

That means:

- components consume **semantic tokens only**
- component meaning does not depend on framework naming
- implementation may change without redefining the system
- the catalog documents only stable public contracts
