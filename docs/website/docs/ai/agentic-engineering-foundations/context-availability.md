---
title: Context Availability
sidebar_position: 5
---

Agents can only use context that exists in accessible artifacts. Decisions trapped in meetings, Slack, memory, or tribal habit are unavailable to the model at the moment of execution. Engineering teams that want agentic leverage must externalize context into ADRs, examples, runbooks, design constraints, task definitions, and durable documentation.

Where [Understandability](/docs/ai/agentic-engineering-foundations/understandability) is about what the code itself communicates, Context Availability is about everything the code cannot: why decisions were made, which alternatives were rejected, what constraints are non-negotiable. A perfectly legible codebase still fails agentic delegation if its architectural intent lives only in the heads of senior engineers.

Availability is not a one-time act of writing things down. Per [The Principle of Context Decay](/docs/ai/agentic-development-principles/architecture-of-flow#the-principle-of-context-decay), artifacts drift from the system they describe, and an agent consumes stale context as confidently as fresh context — so an available-but-wrong artifact is worse than a missing one. Externalized context counts as available only while someone keeps it true.

## What It Looks Like in Practice

Every AI interaction is treated as an artifact-generation step: decisions made while steering an agent are written where the next agent will look, not left in the chat where they happened. Architectural decisions become ADRs at the moment they are made. Repository-level instruction files encode the conventions that reviews would otherwise repeat. When an agent violates a rule, the response is to make the rule consumable — not to re-explain it in the next prompt.

## Grounding Principles

This pillar is the organizational consequence of [The Principle of Compounding Context](/docs/ai/agentic-development-principles/architecture-of-flow#the-principle-of-compounding-context), [The Corollary of Artifact Persistence](/docs/ai/agentic-development-principles/architecture-of-flow#the-corollary-of-artifact-persistence), and [The Corollary of Contextual Readiness](/docs/ai/agentic-development-principles/architecture-of-flow#the-corollary-of-contextual-readiness), bounded by [The Principle of Context Decay](/docs/ai/agentic-development-principles/architecture-of-flow#the-principle-of-context-decay).

## Failure Mode

The architecture rules exist, but only in the mind of one senior engineer. Agents repeatedly violate them, not because they are weak, but because the rules were never made available in a form the system could consume.
