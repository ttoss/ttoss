---
title: 'How to Stop AI From Ruining Your Architecture'
description: Practical steps to implement "The Complexity Brake" and prevent the rapid erosion of code quality in agentic workflows.
authors:
  - arantespp
tags:
  - ai
  - agentic-development
  - engineering
  - technical-debt
---

We are witnessing a new phenomenon in AI-assisted teams: **[The Principle of Zero-Cost Erosion](/docs/ai/agentic-development-principles#the-principle-of-zero-cost-erosion)**.
Because AI makes adding complexity (patching) nearly free, while refactoring remains expensive (requiring deep thought), teams are defaulting to infinite patching.

<!-- truncate -->

## The Old vs. New Reality

- **Pre-AI:** Cost(Patch) > Cost(Refactor) $\rightarrow$ **Trigger to Refactor.**
- **Post-AI:** Cost(Patch) $\approx$ 0 $\rightarrow$ **Never Refactor.**

This economic imbalance leads to "Zero-Cost Erosion," where systems degrade rapidly because "just one more if-statement" is always the path of least resistance.

## The Hidden Costs

Beyond the obvious technical debt, this erosion creates two invisible taxes on your team. First, there's the **Token Tax**: unrefactored, verbose code consumes more tokens in the context window, making every future interaction with that file more expensive (in API costs) and less intelligent (because the context window is filled with noise). Refactoring is an investment in _cheaper, smarter future agents_. Second, there's the **Reviewer's Asymmetry**: it takes longer to _review_ complex code than to _generate_ it with AI. Without a brake, your senior engineers (the reviewers) become the bottleneck, drowning in "LGTM" fatigue.

## The Consequences

If left unchecked, this leads to:

1.  **Hardened Technical Debt:** AI cements bad patterns by mimicking them.
2.  **Operational Risk:** Unrefactored code has higher entropy and failure rates.
3.  **Review Fatigue:** Humans cannot effectively review the high-volume, high-complexity output.

## The Solution: The Complexity Brake

We need to engineer a solution that forces refactoring. This is the practical application of **[The Principle of Artificial Friction](/docs/ai/agentic-development-principles#the-principle-of-artificial-friction)**: when technology removes natural friction, we must engineer artificial barriers to prevent collapse.

We call this specific implementation **[The Complexity Brake](/docs/ai/agentic-design-patterns#the-complexity-brake)**.

### How to Implement It

1.  **Quantify Complexity:** Integrate a linter (like SonarQube or ESLint complexity rules) into your CI pipeline.
2.  **Set Thresholds:** Define a maximum complexity score for functions (e.g., 10) and classes.
3.  **The Veto:** If an AI agent submits a PR that increases the complexity of a file beyond the threshold, the PR is **automatically rejected**.
4.  **The Refactor Mandate:** The agent receives the rejection with a specific instruction: _"Complexity too high. You must refactor the existing code to reduce complexity below X before adding the new feature."_

By automating the "No," we force the AI to maintain the hygiene of the codebase, ensuring that speed doesn't come at the cost of survival.

### Agentic Workflow: The 3-Step Protocol

To operationalize this with agents, we use a specific workflow that prioritizes hygiene over speed.

1.  **Test-First Mandate:** Before asking an agent to write any implementation code, you must first ask it (or a separate "QA Agent") to write the tests for the current code. This ensures we have a safety net for the upcoming changes.

2.  **The Artificial Friction Agent:** Before the implementation begins, a specialized "Friction Agent" evaluates the target file.
    - It calculates the current complexity score.
    - **If the threshold is reached:** It halts the feature work and triggers a "Refactor Mode." It proposes a refactor to simplify the existing code _without_ changing the tests (Green-Green Refactor).
    - **If the threshold is safe:** It allows the process to proceed.

3.  **The Implementer Agent:** Only after the Friction Agent clears the path (either by approving the current state or completing the refactor) does the "Implementer Agent" write the new feature code.

This sequence ensures that we never build new features on top of rotting foundations.
