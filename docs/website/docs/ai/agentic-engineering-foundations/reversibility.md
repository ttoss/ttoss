---
title: Reversibility
sidebar_position: 7
---

Every change an agent produces must be cheap to undo. Agents multiply the volume of change entering the system, and no verification loop catches everything, so the cost of being wrong is governed by the cost of recovery. A team that can revert any change in minutes can afford to delegate aggressively; a team whose changes are entangled, unflagged, or irreversible must inspect everything before it ships — which caps agentic throughput at human review speed.

Reversibility is what [Observability](/docs/ai/agentic-engineering-foundations/observability) is for: detection without recovery just produces well-documented incidents. Together they close the post-merge loop — observability tells you a change was wrong, reversibility makes being wrong survivable.

## What It Looks Like in Practice

Changes are small and atomic, so a revert removes one behavior instead of unraveling a week of entangled work. Risky behavior ships behind feature flags that can be turned off without a deploy. Database migrations are written with their rollback, and deployments have a tested path back to the previous version. Irreversible actions — data deletion, external API calls, published messages — are isolated behind explicit boundaries so everything around them stays reversible.

## Grounding Principles

This pillar operationalizes [The Principle of Asymmetric Risk](/docs/ai/agentic-development-principles/governance-of-agency#the-principle-of-asymmetric-risk), [The Principle of Cheap Generation, Expensive Commitment](/docs/ai/agentic-development-principles/economics-of-interaction#the-principle-of-cheap-generation-expensive-commitment), [The Principle of Atomic Debt Containment](/docs/ai/agentic-development-principles/governance-of-technical-debt#the-principle-of-atomic-debt-containment), and [The Corollary of Side-Effect Predictability Gates](/docs/ai/agentic-development-principles/governance-of-agency#the-corollary-of-side-effect-predictability-gates).

## Failure Mode

An agent-produced change passes tests and review, then misbehaves under real traffic three days later. By then, four other changes have been built on top of it, the migration it included cannot be rolled back, and there is no flag to disable the behavior. A five-minute mistake becomes a two-day incident — not because detection failed, but because recovery was never designed.
