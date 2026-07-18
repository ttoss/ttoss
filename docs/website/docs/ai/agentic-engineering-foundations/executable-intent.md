---
title: Executable Intent
sidebar_position: 2
---

Agentic teams need requirements that can be executed and verified, not just discussed. Features must be framed through acceptance criteria, constraints, invariants, examples, and explicit non-goals. If the intent is implicit, the agent will interpolate; if the task is ambiguous, the agent will choose a plausible interpretation and move forward anyway.

Intent is executable when a change can be judged correct or incorrect without asking the person who requested it. That judgment can come from an acceptance test, a type signature, a schema, an example of expected input and output, or a written invariant — the form matters less than the property: the specification resolves ambiguity before the agent encounters it, instead of after the diff arrives.

## What It Looks Like in Practice

Tasks handed to agents carry acceptance criteria and explicit non-goals ("do not change the public API"). Domain rules live in types and schemas rather than prose, so violating them fails compilation instead of review. Ambiguity is resolved by adding a constraint or an example to the task, not by re-prompting until the output looks right.

## Grounding Principles

This pillar is the practical engineering consequence of [The Principle of Executable Specification](/docs/ai/agentic-development-principles/foundations-of-hybrid-allocation#the-principle-of-executable-specification), [The Principle of Silent Interpretation](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-silent-interpretation), and [The Principle of Signal Entropy](/docs/ai/agentic-development-principles/protocol-of-communication#the-principle-of-signal-entropy).

## Failure Mode

Product asks for a "cleaner onboarding flow" and the engineer forwards that phrase directly to the agent. The output is polished but wrong because no one specified the states, constraints, success criteria, or what must not change.
