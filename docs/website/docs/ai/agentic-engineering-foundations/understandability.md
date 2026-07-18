---
title: Understandability
sidebar_position: 4
---

The codebase must be understandable by both humans and agents. Clear module boundaries, explicit contracts, low coupling, consistent patterns, and low Mean Time to Understanding are no longer just maintainability concerns. They are preconditions for safe delegation. If the smallest correct context packet is still too large to fit in the model's working context, the agent will guess.

Understandability is measured at the boundary of a task: how much of the system must be loaded — into a human's head or a model's context window — before a change can be made safely? Systems with hidden side effects, implicit conventions, and long-range coupling force every task to carry the whole system as context. Systems with explicit contracts let a task carry only its own neighborhood.

## What It Looks Like in Practice

Module boundaries align with the boundaries of tasks that get delegated, so a task's context packet is small and self-contained. Contracts between modules are explicit in types and interfaces rather than enforced by convention. Patterns are consistent enough that one correct example teaches the agent the rest — because agents replicate whatever patterns dominate the code they read, good and bad alike.

## Grounding Principles

This pillar is grounded in [The Principle of Context Compressibility](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-context-compressibility), [The Principle of Mean Time to Understanding](/docs/ai/agentic-development-principles/symbiosis-of-human-ai-agency#the-principle-of-mean-time-to-understanding), and [The Principle of Pattern Inertia](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-pattern-inertia).

## Failure Mode

A team asks an agent to change a small behavior, but the meaning of that behavior is spread across hidden side effects, implicit conventions, and undocumented coupling. The diff compiles and still breaks production.
