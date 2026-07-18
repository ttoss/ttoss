---
title: Deterministic Guardrails
sidebar_position: 8
---

Agentic execution must be bounded by deterministic systems. Permissions, protected environments, schemas, policy checks, type systems, lint rules, CI gates, and scoped edit surfaces are what keep probabilistic agents from turning local plausibility into systemic damage. Prompts cannot carry this burden.

The distinction that matters is structural versus behavioral constraint. A prompt instruction ("never touch the billing module") is behavioral: the agent will probably comply. A permission boundary is structural: the agent cannot do otherwise. Probabilistic compliance is acceptable for style; for anything with an asymmetric downside, the constraint must be enforced by a system that cannot be persuaded.

## What It Looks Like in Practice

Agents operate with the least access their task requires — scoped file surfaces, sandboxed execution, no production credentials by default. Rules that reviews would otherwise catch are encoded as lint rules, type constraints, and CI gates, so violations fail mechanically instead of depending on reviewer attention. Autonomy is graduated: low-risk exploratory work runs freely, while actions with irreversible consequences require deterministic checks or human approval to pass.

## Grounding Principles

This pillar operationalizes [The Principle of Structural Determinism](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-structural-determinism), [The Principle of Asymmetric Risk](/docs/ai/agentic-development-principles/governance-of-agency#the-principle-of-asymmetric-risk), and [The Corollary of Automated Guardrail Prerequisite](/docs/ai/agentic-development-principles/governance-of-agency#the-corollary-of-automated-guardrail-prerequisite).

## Failure Mode

The team trusts a strong model with broad repo and production access but lacks hard boundaries on what it may change or execute. A low-probability mistake becomes a high-cost incident because nothing structural existed to stop it.
