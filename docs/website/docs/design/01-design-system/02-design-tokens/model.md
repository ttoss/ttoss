---
title: Token Model
---

# Token Model

The token model defines the **architectural contract** of the system.

It establishes where values live, where meaning lives, what components may consume, and how the system evolves without semantic drift.

This document defines **global invariants**.
Family docs define family-specific grammars and rules.

---

## Core Principle

Separate **value** from **meaning**.

- **Core tokens** define raw, themeable values
- **Semantic tokens** define stable design meaning
- **Components and patterns** consume semantic tokens only

> Semantic tokens are the public API of the system.

## Architecture

```text
core.{family}       → semantic.{family}   (foundation families: colors, font, spacing, sizing, radii, border, opacity, motion, z-index, elevation)
core.dataviz        → semantic.dataviz    (extension: analytical visualization)
semantic.*          → components
components          → patterns
patterns            → applications
```

> `core.{family}` is shorthand for the foundation families in `ThemeTokens.core`. There is no `foundation` key in the type contract — each family is a sibling at that level.

### Layer roles

- **Core** stores values only
- **Semantic** stores meaning only
- **Components** consume semantic tokens
- **Patterns** compose components without bypassing the token model
- **Applications** consume components, patterns, and — under strict rules — semantic tokens directly

### Application consumption of semantic tokens

Applications may consume semantic tokens directly only in these cases:

- **App-level layout composition** — page-level spacing, gutters, viewport sizing
- **Content composition** — text styles for app-owned content outside component boundaries
- **One-off surfaces** — unique screens or compositions that do not warrant a component
- **Platform integration** — when no semantic component exists for the integration point

Applications must **never**:

- consume core tokens directly
- create parallel semantic vocabulary (new tokens duplicating existing meaning)
- override component-level token contracts via direct semantic token consumption
- use semantic tokens as a shortcut to bypass existing components or patterns

> If an application repeatedly consumes the same semantic tokens in the same pattern, that pattern should become a component or a pattern — not remain as application-level token usage.

---

## Semantic Color Grammar — FSL Projection

The semantic color token grammar `{ux}.{role}.{dimension}.{state}` is a formal FSL Structural Language §17.1 projection that renames and subsets FSL dimensions. The mapping is normative:

| Token grammar axis | FSL dimension   | Notes                                                                                                                                                                                      |
| :----------------- | :-------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ux`               | Entity Kind     | Projection-scoped subset: `action`, `input`, `navigation`, `feedback`, `content`. `guidance` and `discovery` are projection-stratum extensions with no FSL Entity Kind backing (§FSL 4.2). |
| `role`             | Evaluation      | Projection-scoped name for the FSL `Evaluation` dimension. Values are identical (`primary`, `secondary`, `accent`, `muted`, `positive`, `caution`, `negative`).                            |
| `dimension`        | Structural Role | Subset of FSL Structural Role values: `background`, `border`, `text`.                                                                                                                      |
| `state`            | State           | Values identical, no renaming.                                                                                                                                                             |

For the full Entity Kind → UX context mapping (covering all nine FSL Entity Kinds), see the [Colors family](/docs/design/design-system/design-tokens/colors#fsl-entity-kind-mapping).

---

## Invariants

These rules apply to all token families.

### 1. Core is value-only

Core tokens define raw values, scales, ramps, and other themeable primitives.

Core must not encode:

- UI intent
- component names
- modes
- implementation-specific meaning

### 2. Semantic is meaning-only

Semantic tokens define stable design intent.

Semantic tokens:

- reference core tokens only
- remain stable across themes and modes
- form the public API consumed by UI code

### 3. Core is never consumed directly by UI code

Core tokens exist for:

- theme definition
- token composition
- controlled system evolution

They are not the API for components or product UI.

> **Exception:** Infrastructure-only families (see invariant 7) export values directly without a semantic layer. Their tokens are consumed by layout systems and applications, not by the semantic mapping pipeline.

### 4. Meaning must remain stable

- Themes may change core values and semantic mappings.
- Modes do not change values. They remap semantic tokens to different core tokens within the same theme.
- If meaning changes, create a new semantic token and deprecate the old one.

### 5. Names must express meaning, not appearance

Semantic names describe intent, role, context, dimension, state, or analytical function.

Do not name semantics by:

- hue
- raw style
- component
- mode
- chart type
- library behavior

### 6. No parallel vocabulary

Do not introduce new tokens that duplicate existing meaning.

Prefer reuse before creation.

### 7. Families own their grammar, not their architecture

Each family may define its own semantic grammar.

Examples:

- colors may use `ux.role.dimension.state`
- typography may use `text.family.step`
- radii may use `radii.contract`
- dataviz may use analytical roles

This is valid.

What must remain constant is the architecture:

- core = value
- semantic = meaning
- semantic = public API

**Infrastructure-only families.** Some families do not express durable UI meaning and therefore do not define a semantic layer. They export values directly as adaptation infrastructure — for example, [breakpoints](./02-families/breakpoints.md) define viewport thresholds consumed by layout systems, not semantic intent consumed by components. This is architecturally valid when the family serves as operational infrastructure rather than design meaning.

### 8. RawValue exceptions are rare, intentional, and registered

Semantic tokens must reference core tokens. A `RawValue` is permitted only when a `TokenRef` is technically impossible (e.g., `clamp()` expressions mixing units from multiple token paths, or CSS units with no core token equivalent such as `ch`).

Approval criteria — a semantic `RawValue` must satisfy all three:

1. **Technical necessity**: the value cannot be expressed as a single `{token.path}` reference.
2. **Local justification**: a JSDoc comment on the token explains the necessity.
3. **Audit registration**: the token is listed in the inventory below.

**Approved RawValue inventory** (complete list as of this writing):

| Token path                                    | Reason                                                                                                                        |
| :-------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| `semantic.spacing.gutter.page`                | `clamp()` expression embedding multiple token refs — no single `TokenRef` can express responsive fluid gutters                |
| `semantic.spacing.gutter.section`             | same as above                                                                                                                 |
| `semantic.spacing.separation.interactive.min` | `clamp()` with mixed units (`px` + token ref) — minimum touch-target separation cannot be expressed as a pure token reference |
| `semantic.sizing.measure.reading`             | `ch` units — character-based measure has no core token equivalent                                                             |

Any new `RawValue` in the semantic layer requires an entry in this table before merging.

### 9. ThemeTokens plural keys are intentional

`ThemeTokens` uses `colors`, `radii`, and `breakpoints` (plural) alongside singular family names. These three are genuinely collection-typed families — each names a set of discrete, enumerable members rather than a unitary concept. The naming is an explicit convention, not an inconsistency. No migration to singular is planned.

### 10. Tokens define meaning, not implementation

Tokens do not define:

- component APIs
- layout composition
- chart types
- rendering logic
- application behavior

Those concerns belong to components, patterns, and implementation.

---

## Themes and Modes

Themes and modes preserve **semantic meaning**, but they do not vary in the same way.

### Themes

A theme may change:

- core values
- semantic mappings

A theme must not create a parallel semantic vocabulary for the same system intent.

### Modes

Modes are controlled variations of a theme, such as light and dark.

Core tokens are immutable across modes. Modes operate at the **semantic mapping layer**:

- core token values do not change
- semantic token names do not change
- semantic token references may point to different core tokens

> If a semantic contract fails in a mode, remap the semantic reference to a different core token — do not mutate the core value or rename the semantic token.

## Foundation and Extension

The system has a global foundation and a controlled extension model.

### Foundation

The foundation contains the general UI token families of the system, expressed as `core.{family} → semantic.{family}` pairs. There is no physical `foundation` key in `ThemeTokens` — `core.foundation` is conceptual shorthand for the full set of non-extension families.

### Extension

A new domain may extend the model when the foundation does not already solve the problem.

Example:

```text
core.dataviz → semantic.dataviz
```

An extension is valid only when all of the following are true:

1. the problem is not already solved by the foundation
2. the concept is stable and reusable
3. it can be expressed without component or implementation coupling
4. it does not duplicate existing meaning

If the need is local, solve it at the pattern or application layer instead.

## References and Composition

Semantic tokens typically reference core tokens.

This is what keeps names stable while allowing themes and modes to evolve.

Some families may also use composite tokens where the value is naturally applied as a bundle, such as typography styles or shadow recipes.

This is valid as long as the contract remains intact:

- core composites remain value-only
- semantic composites remain meaning-first
- UI code still consumes semantic tokens only

## Notation

`core.*` and `semantic.*` describe **architectural layers**, not required naming prefixes.

- semantic tokens are exposed directly as the public API
- core tokens may be namespaced or structured to prevent misuse
- storage and build organization may vary

> The architecture is fixed.
> The exact source notation is an implementation choice.

## Enforcement

The model must be enforceable.

Validation and build must preserve at least these guarantees:

- unique token names
- valid and resolvable references
- no circular references
- semantic tokens remain the public API
- core tokens are not consumed directly by UI code
- no parallel vocabularies are introduced
- semantic meaning does not change silently
- generated outputs preserve the contract

Family-specific validation may add stricter rules where needed.

## Change Rules

Changes must preserve the model.

- **Add core token** when a new raw value is needed
- **Add semantic token** only when existing semantics cannot express the need
- **Change semantic mapping** only if meaning stays the same
- **Change semantic meaning** by creating a new token and deprecating the old one
- **Remove token** only through explicit deprecation and versioned breaking change

---

## Summary

The system stays scalable by protecting a small set of truths:

- core stores values
- semantic stores meaning
- semantic tokens are the public API for meaning-bearing families
- components and patterns consume semantic tokens only (infrastructure-only families are consumed directly)
- themes may change core values; modes remap semantic references within a theme
- families may differ in grammar; infrastructure-only families may skip the semantic layer entirely
- extensions are controlled
- validation and build preserve the contract

This is what makes the token system themeable, governable, and safe to evolve.
