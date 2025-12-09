---
title: How to Prompt
---

# How to Prompt: The Anti-Prompt Guide

> "Invert, always invert." — Carl Jacobi

Mastering the art of prompting often comes down to understanding exactly what makes a prompt fail. By learning how to write the _worst_ possible prompt, you can guarantee better results by doing the exact opposite.

This guide uses the mental model of **Inversion**: instead of asking "How do I write a great prompt?", we ask "How do I guarantee the model gives me garbage?"

## The Anti-Patterns (How to Fail)

Here is a systematic list of the most reliable ways to sabotage a prompt, grouped by the "Anti-Pattern" and its correction.

### 1. The "Lazy Delegator" (Vagueness)

**The Mistake:** Be as vague as possible. Use broad verbs and ambiguous words like "cool", "better", or "nice".
**Why it fails:** The model has infinite degrees of freedom and will regress to the mean, giving you the most statistically likely (mediocre) answer.

**❌ Anti-Prompt:**

> "Write something about marketing."

**✅ Correction (Inversion):**

> "Write a LinkedIn post about B2B marketing trends in 2025, focusing on AI adoption. Use a professional but provocative tone."

Related principles: [The Principle of Explicit Intent](/docs/ai/agentic-development-principles#the-principle-of-explicit-intent) — define goal, audience, and success criteria.

### 2. The "Kitchen Sink" (Overloading)

**The Mistake:** Ask for everything at once. Mix multiple distinct tasks (explain, code, write a poem) in a single massive block of text.
**Why it fails:** It confuses the model's attention mechanism. Instructions buried in the middle often get ignored ("Lost in the Middle" phenomenon).

**❌ Anti-Prompt:**

> "Explain quantum physics, write a poem about cats, and give me 10 business ideas. Also, translate the explanation to Spanish."

**✅ Correction (Inversion):**

> **Chain your prompts.** Break the task into steps.
>
> 1. "First, explain quantum physics."
> 2. "Now, translate that explanation to Spanish."

Related principles: [The Corollary of Task Atomicity](/docs/ai/agentic-development-principles#the-corollary-of-task-atomicity) — keep a single intent per prompt and chain steps.

### 3. The "Mind Reader" (Missing Context)

**The Mistake:** Assume the AI knows who you are, who the audience is, and what the goal is. Never assign a role.
**Why it fails:** Without a persona, the model defaults to a generic, bland "helpful assistant". Without an audience, it guesses (often wrongly).

**❌ Anti-Prompt:**

> "Explain how a car engine works."

**✅ Correction (Inversion):**

> **Assign a role and audience.**
> "Act as a senior mechanical engineer. Explain how a car engine works to a 5-year-old using analogies involving toys."

Related principles: [The Principle of Explicit Intent](/docs/ai/agentic-development-principles#the-principle-of-explicit-intent) — declare role and audience so the agent's output matches expectations.

### 4. The "Don't Think of a Blue Elephant" (Negative Bias)

**The Mistake:** Rely only on negative constraints ("Don't do X", "Don't be Y").
**Why it fails:** Models are often bad at negatives and may focus on the very thing you told them to avoid.

**❌ Anti-Prompt:**

> "Don't be boring. Don't use long sentences. Don't use passive voice."

**✅ Correction (Inversion):**

> **State what you DO want.**
> "Write in a witty, conversational tone. Use short, punchy sentences. Use active voice."

Related principles: [The Corollary of Instruction Polarity](/docs/ai/agentic-development-principles#the-corollary-of-instruction-polarity) — prefer positive, prescriptive instructions over negative constraints.

### 5. The "Chaos Agent" (Structure & Format)

**The Mistake:** Let the model choose the format. Give contradictory instructions. Provide zero examples (zero-shot).
**Why it fails:** You get whatever format is statistically most common (usually paragraphs). Contradictions lead to confused output.

**❌ Anti-Prompt:**

> "Write a short story but make it extremely detailed. Put it in a table if you want."

**✅ Correction (Inversion):**

> **Force the format and use examples.**
> "Write a story in exactly 3 sentences. Output the result as a JSON object with keys 'title' and 'story'. Here is an example..."

Related principles: [The Corollary of Format Enforcement](/docs/ai/agentic-development-principles#the-corollary-of-format-enforcement) — require strict, machine-readable formats and include examples.

### 6. The "Chatty Cathy" (Fluff)

**The Mistake:** Treat the AI like a human colleague with small talk. Use weak phrases like "if you can" or "maybe".
**Why it fails:** It wastes tokens, dilutes the signal, and signals low commitment, leading the model to treat instructions as optional.

**❌ Anti-Prompt:**

> "Hi there! I was wondering if you could maybe help me write some code, if it's not too much trouble..."

**✅ Correction (Inversion):**

> **Be direct and authoritative.**
> "You are an expert Python developer. Write a script to..."

Related principles: [The Corollary of Concise, High-Signal Prompts](/docs/ai/agentic-development-principles#the-corollary-of-concise-high-signal-prompts) — keep prompts short, remove fluff, and place critical instructions prominently.

## The "Anti-Prompt" Checklist

Before sending a prompt, ask yourself: **"If I wanted the LLM to fail, would I do this?"**

| If you see this...                        | Do this instead...                                      |
| :---------------------------------------- | :------------------------------------------------------ |
| **Vague instructions** ("Make it better") | **Define success** ("Optimize for clarity and brevity") |
| **Wall of text**                          | **Break into steps** or chain prompts                   |
| **No persona**                            | **Assign a role** ("You are a Senior Editor")           |
| **"Don't do X"**                          | **"Do Y"** (Positive constraints)                       |
| **"If you can..."**                       | **"You MUST..."** (Absolute commands)                   |
| **No format specified**                   | **Force format** (JSON, Markdown table)                 |
| **No examples**                           | **Provide 2-3 examples** (Few-shot prompting)           |

By avoiding these failure modes, you automatically steer the model toward high-quality, reliable outputs.
