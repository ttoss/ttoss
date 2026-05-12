---
title: Validation and Build
sidebar_position: 6
---

# Validation and Build

Validation protects the semantic contract.

Build distributes that contract without changing its meaning.

This document defines:

- what must always be validated
- where validation rules live
- how validation severity works
- what build and output must guarantee

It does **not** define every rule for every token family.

Family-specific validations belong in each family documentation.
Pattern and application validations belong above the token layer.

## Source of truth

The token source is the only place where tokens are created, changed, deprecated, or removed.

Generated files are build artifacts.
They must not be edited manually.

## Scope

Validation exists at three levels:

### Global validation

Global validation protects the architecture of the system.

It enforces rules that must remain true across all token families.

### Family validation

Family validation protects the local contract of a token family.

Family docs are the normative source of these rules.

They may define only what is specific to that family, such as:

- grammar
- legal combinations
- required semantic pairings
- family invariants
- family-specific warnings
- family-specific output expectations

The central validation model does not redefine these rules.
It requires that they exist where needed and that they remain enforceable.

### Output validation

Output validation protects the generated contract.

It exists because a valid token source is not enough if build output breaks meaning.

Pattern and application concerns are outside the token validator.

## Global validation

### Structural validation

Structural validation protects the token graph.

It must guarantee:

- unique token names
- valid references
- resolvable references
- no circular references
- explicit deprecation metadata
- replacement metadata when applicable

If the token graph is invalid, validation must fail before build.

### Semantic contract validation

Semantic contract validation protects the architecture of the system.

It must guarantee:

- semantic tokens remain the public API
- core tokens remain value-only
- semantic tokens remain meaning-first
- UI does not consume core tokens directly
- semantic meaning does not change silently
- no parallel vocabulary is introduced
- naming expresses meaning, not appearance, component, mode, chart type, or library behavior
- meaning changes create new tokens and deprecate old ones

### Cross-family validation

Some guarantees depend on more than one family.

Use cross-family validation only when required by the contract, such as:

- readability and perceivability
- interactive ergonomics
- focus visibility across geometry and color
- mode correctness across semantic pairings
- preserving distinction between families whose meanings must not collapse into each other

Cross-family validation exists to protect composed guarantees.
It must not become a proxy for subjective design review.

## Build and output

Build must preserve the contract.

At minimum, build and output validation must guarantee:

- build runs only from validated source
- generated files are derived from source, not treated as source
- generated output does not invent new semantics
- generated output does not contain broken references
- semantic token names remain stable where they are the public API
- themes and modes preserve semantic meaning
- each supported mode remains valid after build
- capability-specific output preserves the same contract
- output remains consistent with governance and versioning rules

Build may transform syntax, format, and platform representation.
It must not change meaning.

## Severity

Validation uses three severities.

### Error

An `error` blocks merge.

Use `error` when the issue breaks:

- the token graph
- the semantic contract
- an explicit family invariant
- an explicit accessibility requirement
- build correctness
- output correctness

Errors protect guarantees.

### Warning

A `warning` does not block merge by default.

Use `warning` when the contract still holds but quality is weakened, such as:

- semantic drift risk
- reduced consistency
- weaker clarity
- fragile usability
- higher long-term maintenance cost

Warnings protect system quality without turning validation into a style police tool.

### Info

`info` is a non-blocking signal.

Use it for guidance only.

### Severity rule

- `error` must be objective and testable
- `warning` must not encode subjective preference
- `info` must not affect correctness

## Accessibility ownership

Tokens validate **pre-conditions**, not final accessibility compliance.

Accessible UI requires validation at three levels, each with distinct ownership:

| Level                       | Validates      | Examples                                                                                                                                                |
| :-------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Token layer**             | Pre-conditions | Contrast-safe palette pairs, minimum hit target sizes, reduced-motion token support, focus ring width ≥ 2px                                             |
| **Component/pattern layer** | Composition    | Focus appearance (area + contrast together), target size OR sufficient spacing, color-not-alone for meaning, border + color pairing for selected states |
| **Final output**            | Rendering      | Actual computed contrast ratios, actual focus ring visibility in context, actual target geometry on device                                              |

Token validation guarantees that the **building blocks** are accessible.
It does not guarantee that **composed UI** is accessible.

Components, patterns, and final output must validate their own accessibility obligations.

> Treating token-level accessibility as sufficient creates a false sense of compliance.
> Each layer owns its part of the contract.

## Semantic diff

Changes to the token system must be classifiable by their semantic impact.

The following rules define how to evaluate a token change objectively:

### Structural equivalence vs. resolved equivalence

- **Structural equivalence**: two tokens have the same shape and reference structure, but may resolve to different values. A structural change (e.g., remapping `action.primary.background.default` from `brand.500` to `brand.400`) is valid when meaning stays the same.
- **Resolved equivalence**: two tokens resolve to the same final value. Detecting this helps identify redundancy and potential parallel vocabulary.

### Change classification

| Change type                  | Meaning                                                                              | Version impact                                                |
| :--------------------------- | :----------------------------------------------------------------------------------- | :------------------------------------------------------------ |
| Mapping change, same meaning | Semantic token references a different core token, but the design intent is preserved | MINOR or PATCH                                                |
| Meaning change               | The semantic role, purpose, or contract of a token changes                           | Requires a **new token** + deprecation of the old one → MAJOR |
| New token                    | A new semantic concept that does not duplicate existing meaning                      | MINOR                                                         |
| Token removal                | A semantic token is removed from the public API                                      | MAJOR (must follow deprecation path)                          |

### Collision detection

A collision occurs when:

- two tokens in the same namespace resolve to the same final value **and** serve the same semantic role → one should be removed
- a new token introduces a name that expresses the same meaning as an existing token → parallel vocabulary violation

### Deprecation manifest

Every deprecation must include:

- the deprecated token name
- the replacement token (or explicit statement that no replacement exists)
- the version in which deprecation was introduced
- the target version for removal

> Semantic diff rules that require semantic judgment (e.g., "does this name express the same meaning?") require human review. Only structural and resolved equivalence checks are fully automatable.

## Change rules

Validation must support safe evolution over time.

At minimum:

- adding a core token is valid when a new raw value is needed
- adding a semantic token is valid only when existing semantics cannot express the need
- changing a semantic mapping is valid only when meaning stays the same
- changing meaning requires a new semantic token and deprecation of the old one
- removing a token requires explicit deprecation and a breaking-change path

## Merge rule

A token change is valid only when all of the following are true:

- structural validation passes
- semantic contract validation passes
- all applicable family errors pass
- required cross-family validation passes
- build succeeds
- output validation passes
- version impact is understood

Warnings must be visible and reviewable.
They do not block merge by default unless a stricter policy is adopted intentionally.

## Principle

Validate only what is necessary for the contract, objectively testable, and enforceable in CI.

Keep global validation focused on architecture.
Keep family validation focused on local contract.
Keep output validation focused on preserving meaning after build.

The system stays scalable when validation is explicit, bounded, enforceable, and aligned with the semantic contract.
