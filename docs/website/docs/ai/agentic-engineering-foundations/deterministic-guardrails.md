---
title: Deterministic Guardrails
sidebar_position: 7
---

Agentic execution must be bounded by systems that cannot be persuaded. Permissions, protected environments, scoped edit surfaces, sandboxed execution, and approval gates on irreversible actions are what keep probabilistic agents from turning local plausibility into systemic damage. Prompts cannot carry this burden.

The distinction that matters is structural versus behavioral constraint. A prompt instruction ("never touch the billing module") is behavioral: the agent will probably comply. A permission boundary is structural: the agent cannot do otherwise. Probabilistic compliance is acceptable for style; for anything with an asymmetric downside, the constraint must be enforced by a system that cannot be talked out of it.

## Scope: Authority, Not Correctness

This pillar governs what an agent is allowed to reach, not whether its output is right. Mechanical correctness checks belong to the pillars that own them — types and schemas to [Executable Intent](/docs/ai/agentic-engineering-foundations/executable-intent), lint rules and CI gates to [Testability](/docs/ai/agentic-engineering-foundations/testability) — and they all answer the same question: is this change valid? Guardrails answer a different one: how much can this change break, and who authorized that reach? A team can have exemplary CI and still hand every agent production credentials.

## What It Looks Like in Practice

Agents operate with the least access their task requires — scoped file surfaces, sandboxed execution, no production credentials by default. Autonomy is graduated: low-risk exploratory work runs freely, while actions whose consequences cannot be undone require a deterministic check or a human approval to proceed. The blast radius of a task is decided before the task starts, not discovered afterward in an incident review.

## Grounding Principles

This pillar operationalizes [The Principle of Structural Determinism](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-structural-determinism), [The Principle of Asymmetric Risk](/docs/ai/agentic-development-principles/governance-of-agency#the-principle-of-asymmetric-risk), and [The Corollary of Automated Guardrail Prerequisite](/docs/ai/agentic-development-principles/governance-of-agency#the-corollary-of-automated-guardrail-prerequisite).

## Failure Mode

The team trusts a strong model with broad repository and production access but sets no hard boundary on what it may change or execute. Every correctness gate passes: the agent does exactly what it was asked, in a place it should never have been able to reach. A low-probability mistake becomes a high-cost incident because nothing structural existed to stop it.
