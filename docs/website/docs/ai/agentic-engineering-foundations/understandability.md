---
title: Understandability
sidebar_position: 4
---

The codebase and the artifacts around it must be understandable by both humans and agents. Clear module boundaries, explicit contracts, low coupling, consistent patterns, and low Mean Time to Understanding are no longer just maintainability concerns. They are preconditions for safe delegation. If the smallest correct context packet is still too large to fit in the model's working context, the agent will guess.

Understandability is measured at the boundary of a task: how much of the system must be loaded — into a human's head or a model's context window — before a change can be made safely? Systems with hidden side effects, implicit conventions, and long-range coupling force every task to carry the whole system as context. Systems with explicit contracts let a task carry only its own neighborhood.

## Two Surfaces: Code and Artifacts

Code communicates what the system does. It cannot communicate why it does it that way, which alternatives were rejected, or which constraints are non-negotiable. Both surfaces have to be legible, because an agent can only use context that exists in a form it can read — decisions trapped in meetings, chat threads, or tribal habit are unavailable at the moment of execution. A perfectly factored codebase still fails agentic delegation if its architectural intent lives only in the heads of senior engineers.

The two surfaces fail differently and are repaired differently. Illegible code is fixed by refactoring; missing rationale is fixed by writing ADRs, examples, runbooks, and repository-level instruction files. A team can be strong at one and hopeless at the other, so each is worth measuring on its own even though both serve the same property.

Neither surface stays true without maintenance. Per [The Principle of Context Decay](/docs/ai/agentic-development-principles/architecture-of-flow#the-principle-of-context-decay), artifacts drift from the system they describe, and an agent consumes stale context as confidently as fresh context — so an available-but-wrong artifact is worse than a missing one. Externalized context counts only while someone keeps it true.

## What It Looks Like in Practice

Module boundaries align with the boundaries of tasks that get delegated, so a task's context packet is small and self-contained. Contracts between modules are explicit in types and interfaces rather than enforced by convention. Patterns are consistent enough that one correct example teaches the agent the rest — because agents replicate whatever patterns dominate the code they read, good and bad alike.

Alongside the code, every AI interaction is treated as an artifact-generation step: decisions made while steering an agent are written where the next agent will look, not left in the chat where they happened. Architectural decisions become ADRs at the moment they are made. Repository-level instruction files encode the conventions that reviews would otherwise repeat. When an agent violates a rule, the response is to make the rule consumable — not to re-explain it in the next prompt.

## Grounding Principles

This pillar is grounded in [The Principle of Context Compressibility](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-context-compressibility), [The Principle of Mean Time to Understanding](/docs/ai/agentic-development-principles/symbiosis-of-human-ai-agency#the-principle-of-mean-time-to-understanding), and [The Principle of Pattern Inertia](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-pattern-inertia) on the code surface, and in [The Principle of Compounding Context](/docs/ai/agentic-development-principles/architecture-of-flow#the-principle-of-compounding-context), [The Corollary of Artifact Persistence](/docs/ai/agentic-development-principles/architecture-of-flow#the-corollary-of-artifact-persistence), and [The Corollary of Contextual Readiness](/docs/ai/agentic-development-principles/architecture-of-flow#the-corollary-of-contextual-readiness) on the artifact surface — both bounded by [The Principle of Context Decay](/docs/ai/agentic-development-principles/architecture-of-flow#the-principle-of-context-decay).

## Failure Mode

A team asks an agent to change a small behavior. The meaning of that behavior is spread across hidden side effects and undocumented coupling, and the rule that would have made the change safe exists only in one senior engineer's head. The diff compiles, passes review, and breaks production — and the next agent, given the same task, repeats the mistake.
