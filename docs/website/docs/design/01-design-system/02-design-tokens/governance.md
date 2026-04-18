---
title: Governance
sidebar_position: 5
---

# Governance

Design tokens are a public contract between design, themes, and components.

Governance protects three things:

- stable semantic names
- clear separation between core and semantic tokens
- safe evolution of the system over time

## Core rule

Components consume **semantic tokens only** for meaning-bearing families.

Infrastructure-only families (e.g., breakpoints) do not define a semantic layer — their tokens are consumed directly by layout systems and applications. See [Token Model — Invariant 7](./model.md) for the architectural rationale.

Core tokens of meaning-bearing families are foundation values for themes and token composition. They are not the public API for components.

## When to create a token

Create a token only when all of the following are true:

- the need cannot be expressed by an existing semantic token
- the need is reusable across multiple components or patterns
- the name fits the existing taxonomy

Prefer reuse before creation.

## What may change

### Add a core token

Add a core token when the system needs a new foundation value, such as a new color, size, radius, duration, or scale step.

Rules:

- core tokens define values, not intent
- adding a core token must not bypass the semantic layer
- new core tokens should extend the existing system, not create a parallel vocabulary

### Change a core token

A core value may change when a theme or foundation needs to evolve.

Rules:

- core value changes belong to theme or foundation evolution
- keep the token meaning the same
- evaluate impact on all semantic mappings and supported modes
- modes must remap semantic references, not mutate core values

### Add or change a semantic token

A semantic token may be added or remapped when the system needs a new stable design intention.

Rules:

- semantic tokens define intent, not raw value
- semantic names are part of the public API
- changing a semantic mapping is allowed
- changing a semantic token’s meaning is not allowed

If the intention changes, create a new token and deprecate the old one.

## Contract checks

Every token change must pass these checks:

- the name follows the system taxonomy
- semantic tokens reference valid tokens
- references are resolvable
- references are not circular
- components do not consume core tokens directly
- deprecated tokens provide a clear replacement when applicable

If a rule can be validated automatically, it should be validated automatically.

## Deprecation

Do not remove tokens without deprecation first.

When a token is no longer recommended:

1. mark it as deprecated in the token source
2. provide the replacement
3. allow time for migration
4. remove it in the next major version

Deprecation is the preferred path for contract changes.

## Versioning

Tokens follow semantic versioning.

- **PATCH**: documentation fixes, metadata fixes, or internal corrections that do not change the public token contract
- **MINOR**: backward-compatible additions, new tokens, new aliases, or deprecations
- **MAJOR**: removals, renames, meaning changes, or any other breaking contract change

## Review

Each proposal should answer:

- what problem exists
- why reuse is not enough
- what token is being added, changed, or deprecated
- what impact exists on themes and components

Design reviews semantic fit.
Engineering reviews implementation and validation.
Merge only when the contract remains coherent.

## Principle

Prefer a smaller vocabulary with stronger meaning.

A token system stays scalable by making reuse easy, naming stable, and change deliberate.
