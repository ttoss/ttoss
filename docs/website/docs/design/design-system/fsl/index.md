---
title: Foundational Semantic Language
---

# Foundational Semantic Language (FSL)

> **FSL is the semantic foundation from which components, tokens, themes, and tooling are derived.**

UI systems become incoherent when meaning is defined locally — each component invents its own semantics, each token system invents its own vocabulary, and the gaps are filled by conventions that drift over time. FSL solves this by establishing a single source of semantic truth that all downstream systems derive from rather than define independently.

FSL is not styling, not a token tree, not a component API. It is the formal language of meaning that precedes all of those.

## Architecture

FSL is composed of two normative artifacts:

**[FSL Lexicon](./fsl-lexicon.md)** — the controlled vocabulary. Defines the canonical meaning of every core term across nine semantic dimensions: Entity Kind, Structural Role, Interaction Kind, Composition Role, Evaluation, Consequence, State, Layer Role, and Context Class.

**[FSL Structural Language](./fsl-structural-language.md)** — the grammar. Defines how lexicon terms combine into valid semantic expressions, what combinations are legal, how context may refine meaning, and how downstream projections must derive from the foundation.

## What derives from FSL

Every downstream semantic system is a **projection** of FSL — it derives from the foundation and must not define its own incompatible vocabulary. This page is the status ledger for the layers; the two normative artifacts above never carry implementation status.

- **Semantic Token Projection** ([Token Model](/docs/design/design-system/design-tokens/model) and family docs) — maps FSL to token families and addresses. **Implemented** by `@ttoss/fsl-theme`.
- **Component Semantics Projection** ([Component Model](/docs/design/design-system/components/component-model)) — maps FSL to the component model. **Implemented** by `@ttoss/fsl-ui`; the Component Model document names its source-of-truth files.
- **Resolution contract** ([FSL Structural Language §14](./fsl-structural-language.md)) — the obligation that every resolution function has a declared owner. **Satisfied (distributed)** — each function is owned by a shipped mechanism:

  | Function                 | Owner (shipped)                                                                        |
  | :----------------------- | :------------------------------------------------------------------------------------- |
  | Typed inputs / parse     | TypeScript vocabulary types (`ComponentMeta`, vocabulary tuples in `@ttoss/fsl-ui`)    |
  | Legality verdict         | `ENTITY_*` matrices + contract tests (build-time, `@ttoss/fsl-ui`)                     |
  | Normalization / defaults | Per-component documented defaults + `ENTITY_TOKEN_MAPPING`                             |
  | State resolution         | React Aria render props + `STATE_PRIORITY` cascade (runtime)                           |
  | Projection               | `resolveInteractiveStyle` (`@ttoss/fsl-ui`) + `toCssVars` (`@ttoss/fsl-theme`)         |
  | Explanation              | `CONTRACT.md` + `llms.txt` (AI-facing artifacts), derivable from the declared matrices |

## The guarantee

The same semantic expression, in the same context, always produces the same result — regardless of which projection consumes it. This is only possible because meaning is defined once at the foundation.
