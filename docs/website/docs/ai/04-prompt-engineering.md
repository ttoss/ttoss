---
title: Prompt Engineering
---

# Prompt Engineering

## The Anti-Patterns (How to Fail)

> "Invert, always invert." — Carl Jacobi

Mastering the art of prompting often comes down to understanding exactly what makes a prompt fail. By learning how to write the _worst_ possible prompt, you can guarantee better results by doing the exact opposite.

This guide uses the mental model of **Inversion**: instead of asking "How do I write a great prompt?", we ask "How do I guarantee the model gives me garbage?"

Here is a systematic list of the most reliable ways to sabotage a prompt, grouped by the "Anti-Pattern" and the Design Pattern that solves it.

### The "Lazy Delegator" (Vagueness)

**The Mistake:** Be as vague as possible. Use broad verbs and ambiguous words like "cool", "better", or "nice".

**Why it fails**: The model lacks "grounding" (shared physical/social context). Without explicit definitions, it regresses to the mean, giving the most statistically likely (mediocre) answer.

**Anti-Prompt:** "Write something about marketing."

**Correction (Inversion):** Define constraints and criteria. "Write a LinkedIn post about B2B marketing trends in 2025. Success criteria: Focus on AI adoption, use a professional but provocative tone, and include 3 bullet points."

**Related Strategy:** [Explicit Intent Protocol](/docs/ai/agentic-design-patterns#explicit-intent-protocol) — Treat every prompt as a standalone packet containing all necessary definitions.

### The "Mind Reader" (Missing Context)

**The Mistake:** Assume the AI knows who you are, who the audience is, and what you know.

**Why it fails:** AI agents lack Theory of Mind. They cannot infer that a "summary" for a CEO is different from a "summary" for a Developer.

**Anti-Prompt:** "Explain how a car engine works."

**Correction (Inversion):** Prime the Persona and Audience. "Act as a senior mechanical engineer. Explain how a car engine works to a 5-year-old using analogies involving toys."

**Related Strategy:** [Theory of Mind Prompting](/docs/ai/agentic-design-patterns#theory-of-mind-prompting) — Explicitly define the persona (sender) and the audience (receiver) to adjust complexity.

### The "Chaos Agent" (Structure & Format)

**The Mistake:** Let the model choose the format. Provide zero examples (zero-shot).

**Why it fails:** You get whatever format is statistically most common in the training data (usually unstructured prose), making it impossible to parse the output programmatically.

**Anti-Prompt:** "Write a short story. Put it in a table or something if you want."

**Correction (Inversion):** Force the schema. "Write a story in exactly 3 sentences. Output the result strictly as a JSON object with keys title and story. Here is an example..."

**Related Strategy:** [Explicit Intent Protocol](/docs/ai/agentic-design-patterns#explicit-intent-protocol) — Enforce strict, machine-readable schemas (JSON/XML) to prevent entropy.

### The "Miscast Actor" (Role Mismatch)

**The Mistake:** Asking a creative "Architect" agent to do rote data entry, or asking a rigid "Executor" agent to plan a strategy.

**Why it fails:** Mismatch in ambiguity tolerance. The Executor crashes on vague instructions; the Architect hallucinates complexity ("boredom error") on simple tasks.

**Anti-Prompt:** To a rigid SQL-Executor Agent: "Look at the data and tell me what's interesting about our users."

**Correction (Inversion):** Route by Ambiguity Tolerance. To the Executor: "Run query SELECT \* FROM users WHERE active=true." To the Architect: "Analyze the user table schema and suggest 3 queries to measure retention."

**Related Strategy:** [Role-Based Routing](/docs/ai/agentic-design-patterns#role-based-routing) — Assign tasks based on the agent's functional role (Executor vs. Architect).

### The "Kitchen Sink" (Overloading)

**The Mistake:** Mix multiple distinct tasks (explain, code, translate) in a single massive block of text.

**Why it fails:** Confuses the attention mechanism ("Lost in the Middle" phenomenon). The model often skips instructions buried in the center.

**Anti-Prompt:** "Explain quantum physics, write a poem about cats, and give me 10 business ideas. Also, translate the explanation to Spanish."

**Correction (Inversion):** Decompose the Chain. Break the complex goal into atomic steps: "Explain quantum physics, "Translate that explanation."

**Related Strategy:** [Chain of Thought Decomposition](/docs/ai/agentic-design-patterns#chain-of-thought-decomposition).

### The "Visual Vibe Check" (The Aesthetic Trap)

**The Mistake:** Asking the model to "Check if this code is good" or relying on the visual cleanliness of the output (formatting, variable names) as a proxy for correctness.

**Why it fails:** This falls victim to the [Principle of Syntactic-Semantic Decoupling](/docs/ai/agentic-development-principles#the-principle-of-syntactic-semantic-decoupling). The model will optimize for "vibes"—producing code that looks professional, passes linters, and has great comments—while hiding deep logical flaws or security vulnerabilities that don't "look" wrong.

**Anti-Prompt:** "Review this code and tell me if it's clean." OR (implicitly) merging code just because it looks like the rest of the file.

**Correction (Inversion):** Demand Semantic Verification. Force the model to prove functionality, not just style. Ask it to generate a failing test case for the logic before generating the fix, or ask it to "Explain the edge cases where this logic fails."

**Related Strategy:** [The Semantic Validator](/docs/ai/agentic-design-patterns#the-semantic-validator) — Invert the workflow to verify logic via tests before verifying style via review.
