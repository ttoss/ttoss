---
description: How to add, change or withdraw an Agentic Development Principle
applyTo: '**/docs/website/docs/ai/agentic-development-principles/**'
---

# Agentic Development Principles Instructions

The chapters in `docs/website/docs/ai/agentic-development-principles/` hold principles and corollaries; design patterns live in `docs/website/docs/ai/agentic-design-patterns.md`. The section "Principles, Corollaries, and Design Patterns" of the chapters' `overview.md` defines the three layers and their litmus tests: read it before writing. The chapters build on `docs/website/docs/product/product-development/principles.md`.

Before adding or changing an entry:

- **It is about agents.** A truth that holds without AI is a product development principle: cite it (e.g. E16) and state only what agents change.
- **It is new.** Search every chapter first: a second statement of an existing truth is a merge, not an entry.
- **It names no mechanism.** "Use RAG", "ask several models" or "put the pattern in the prompt" is at best a design pattern.
- **A corollary sits under the principle it follows from.** The principles graph (`docs/website/plugins/principles-graph`) draws each corollary's parent from the principle heading above it.
- **Format:** `### The Principle of <Name>` or `#### The Corollary of <Name>`, a **Failure Scenario** in which agents are misused in development, and inline links, since the graph reads no others.
- **Withdrawing or renaming an entry removes its anchor**, and the site builds with `onBrokenAnchors: 'throw'`: update every link to it in `docs/` and `blog/`, and add a dated note to a blog post whose argument rested on it.
