---
title: Governance
---

# Governance

A design token system is a shared contract between design and engineering. To keep it healthy, changes must be deliberate. This page outlines how to add, modify or retire tokens.

## When to create a token

Create a new token when:

- A new brand value emerges (e.g. a new brand colour, scale step, radius).
- A new design intention appears that cannot be expressed by existing semantic tokens (e.g. a new feedback type like `critical`).
- You need a consistent solution across multiple components.

Before adding a token:

- **Search existing names.** Many needs are already covered. Reuse rather than reinvent.
- **Align on vocabulary.** If a new context, role or dimension is needed, discuss it with the design system team to avoid divergence from the taxonomy.

## How to propose a token

1. Open a pull request against the design system repository.
2. In the description, explain:
   - The problem to solve.
   - Why existing tokens are insufficient.
   - The proposed name, family and value or alias.
   - Impact on current themes and components.
3. Tag reviewers from both design and engineering.

Changes to core tokens should be versioned and may require a major release. Breaking changes include renaming or deleting tokens, or altering their meaning.

## Modifying existing tokens

- **Core tokens:** changing a core value affects all semantics referencing it. Ensure that the new value meets accessibility and branding requirements for all themes. Communicate widely and plan for potential regressions.
- **Semantic tokens:** you may remap a semantic token to a different core value when adjusting a theme (e.g. dark mode). Do not change the semantic name’s meaning—if the intention changes, create a new token and deprecate the old one.

## Deprecation and removal

When a token is no longer needed:

1. Deprecate it by marking it as such in code comments and documentation. Provide a recommended replacement.
2. Announce the deprecation to consumers and allow a migration period (e.g. one release cycle).
3. Remove the token in a major version bump.

Avoid hard deletions without deprecation. Breaking changes should be rare and well communicated.

## Versioning

Tokens follow semantic versioning. A patch release may add tokens or fix documentation; a minor release may add new families or contexts; a major release may introduce breaking changes. Document all changes in a changelog so that consumers can upgrade with confidence.

## Review process

The design system team manages governance. For each proposal:

- Designers evaluate naming, semantics and visual appropriateness.
- Engineers assess technical integration, performance and accessibility.
- Product stakeholders ensure alignment with brand guidelines.

Consensus must be reached before merging. This process keeps the token system cohesive and prevents fragmentation.
