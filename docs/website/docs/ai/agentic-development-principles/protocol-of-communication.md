---
title: Protocol of Communication
sidebar_position: 6
---

## The Protocol of Communication

This section defines how humans and AI agents should exchange information—through prompts, feedback, and constraints—to reduce ambiguity, control hallucinations, and keep work aligned with our product development principles.

### The Principle of Signal Entropy

In a probabilistic system, ambiguity is noise. Unlike a human collaborator, an AI agent lacks "grounding"—the shared biological, social, and historical context that allows humans to infer meaning from incomplete data. Therefore, any information not explicitly transmitted in the signal (the prompt) is subject to entropy, degrading into randomness or hallucination. Effective protocol requires forcibly increasing the signal-to-noise ratio to overcome the physics of the channel. Reducing entropy requires [The Principle of Structural Determinism](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-structural-determinism).

**Failure Scenario:** A developer tells an agent to "refactor this function to be cleaner." Because "cleaner" is semantically ambiguous and the agent lacks the team's shared definition of "clean code," it removes essential error handling logic, treating it as "clutter."

### The Principle of Protocol Standardization

In agentic systems, every handoff (human→agent, agent→agent, agent→tool) is an interface. Interface variance creates translation work, and translation work compounds as the number of participants grows. The scalability of an agentic workflow is therefore bounded by the degree to which its handoffs share a small set of standardized, machine-checkable protocols (schemas) for message envelopes, intents, and context payloads—a system with N participants and unstandardized interfaces pays a translation cost that grows with every pair, not with every participant.

This is the communication-layer analogue of [The Principle of Structural Determinism](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-structural-determinism): do not rely on "good phrasing" to enforce correctness—encode the contract. It also directly mitigates [The Principle of Signal Entropy](/docs/ai/agentic-development-principles/protocol-of-communication#the-principle-of-signal-entropy) and aligns with [The Corollary of Tool-as-Contract](/docs/ai/agentic-development-principles/architecture-of-flow#the-corollary-of-tool-as-contract), [The Corollary of Modular Composability](/docs/ai/agentic-development-principles/governance-of-technical-debt#the-corollary-of-modular-composability), and [The Principle of Context Heterogeneity](/docs/ai/agentic-development-principles/architecture-of-flow#the-principle-of-context-heterogeneity).

**Failure Scenario:** Two AI agents designed to collaborate on a multi-step workflow use different message formats and intent definitions. Without a shared protocol, they misinterpret each other's outputs, leading to failed tasks and increased human intervention to mediate communication.

#### The Corollary of Canonical Message Envelopes

Define a minimal message envelope that all agents must emit and accept (e.g., intent, inputs, constraints, outputs, next move, and provenance). This reduces per-handoff negotiation cost and makes validation possible without "reading the agent's mind."

#### The Corollary of Protocol Versioning

Protocols drift. Version schemas explicitly and treat breaking changes as migrations; silent format drift reintroduces the same translation cost and failure modes that standardization was meant to remove.
