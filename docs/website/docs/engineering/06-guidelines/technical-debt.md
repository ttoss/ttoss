---
title: Technical Debt Management
---

Technical debt is often viewed solely as a negative consequence of poor engineering. However, at **ttoss**, we view technical debt as a financial instrument: **leverage**. When used consciously, it allows us to ship faster and learn earlier. When accumulated unconsciously, it becomes **entropy** that grinds development to a halt.

This guideline outlines our strategy for managing technical debt, grounded in [The Governance of Technical Debt](/docs/ai/agentic-development-principles#the-governance-of-technical-debt).

## The Philosophy of Managed Debt

We accept technical debt when it buys us **speed of learning** or **market timing**, provided that the debt is:

1.  **Visible**: We know it exists.
2.  **Contained**: It doesn't infect the entire system.
3.  **Recoverable**: We have a plan to pay it down or discard it.

Unmanaged debt—sloppy code written without intent or boundaries—is not leverage; it is negligence.

## Systemic vs. Modular Debt

We distinguish between **Modular Debt** (acceptable) and **Systemic Debt** (unacceptable).

### Defining Systemic Technical Debt

**Systemic Technical Debt** is complexity that permeates the core data models, fundamental architecture, or shared business logic. It creates tight coupling between unrelated components, meaning a change in one area causes regressions in another. Unlike modular debt, systemic debt cannot be paid down incrementally; it often requires a full system rewrite.

### Avoiding Systemic Debt

To ensure debt remains modular and recoverable:

1.  **Protect the Core**: Never compromise the integrity of your core domain models or database schemas for the sake of a quick UI fix.
2.  **Strict Boundaries**: Enforce unidirectional data flow and strict architectural boundaries.
3.  **Debt at the Edges**: Push "messy" code to the edges of the system (UI components, specific API adapters, scripts). Keep the center (Business Logic) clean.

## Strategies for Managing Debt

To ensure technical debt remains a tool rather than a trap, we apply the following strategies:

### 1. Modularization and Componentization

**Aligns with:** [The Principle of Contractual Specialization](/docs/ai/agentic-development-principles#the-principle-of-contractual-specialization)

We structure our codebase into small, independent **packages**, **modules**, and **components**.

- **Why**: If a specific module is written quickly and becomes "messy," its boundaries prevent that mess from leaking into the rest of the system.
- **Strategy**: Prefer many small packages over large monoliths. If a package becomes unmaintainable, it should be cheap to rewrite or replace entirely because its surface area is small.

### 2. Automated Verification for Every Change

**Aligns with:** [The Principle of Intrinsic Verification](/docs/ai/agentic-development-principles#the-principle-of-intrinsic-verification)

We never trade speed for correctness. Even "quick and dirty" code must be verified.

- **Why**: Invisible debt is the most dangerous kind. If code is messy but tested, we can refactor it safely. If it is messy and untested, it is a landmine.
- **Strategy**:
  - Every Pull Request must include automated tests (Unit or E2E) covering the new functionality.
  - CI/CD pipelines must pass before merging.
  - "Hotfixes" must be accompanied by a regression test.

### 3. Isolation of Business Logic

**Aligns with:** [The Principle of Execution Isolation](/docs/ai/agentic-development-principles#the-principle-of-execution-isolation)

We protect our core domain logic from the volatility of external tools, frameworks, and UI libraries.

- **Why**: Frameworks change, and UI trends shift. Your core business rules should not break when you upgrade a library.
- **Strategy**: Use adapters, hooks, or service layers to decouple "what the app does" (Business Logic) from "how it does it" (Implementation Details).

### 4. Observability as Interest Payments

**Aligns with:** [The Corollary of Invisible Risk](/docs/ai/agentic-development-principles#the-corollary-of-invisible-risk)

If we choose to ship a sub-optimal solution to move fast, we must pay the "interest" in the form of higher observability.

- **Why**: We need to know immediately if our "hack" fails in production.
- **Strategy**: Add detailed logging, metrics, and alerts around debt-heavy areas. If you can't afford to monitor it, you can't afford to ship it.

### 5. Atomic State Decomposition

**Aligns with:** [The Principle of Atomic Debt Containment](/docs/ai/agentic-development-principles#the-principle-of-atomic-debt-containment)

Break complex workflows into discrete, atomic steps.

- **Why**: It allows us to isolate "messy" logic to a single step in a process.
- **Strategy**: Design workflows as state machines or pipelines where each step has clear inputs and outputs. This makes it easy to swap out a specific step's implementation without rewriting the whole flow.

## Agent Instruction Example: Code Review

When using an AI agent to review code, you can use the following instruction template to ensure technical debt is managed effectively (change as needed for your context):

```markdown
**Role**: Senior Technical Reviewer
**Objective**: Review the provided code changes to ensure that any introduced technical debt is visible, contained, and verified.

**Instructions**:

1.  **Critical Errors**: If you identify critical errors, provide a specific code suggestion to fix them.
2.  **Checklist Evaluation**:
    - For each item in the checklist below, determine if the condition is met.
    - If met, mark as `[x]`.
    - If NOT met, mark as `[ ]` and describe the missing part.
3.  **Output**:
    - Output the checklist with your evaluation.
    - If all items are `[x]`, add "LGTM".
    - Do not add unnecessary comments.

**Review Checklist**:

- [ ] **Verification**: The change includes automated tests covering new functionality and edge cases.
- [ ] **Containment**: The new logic is modular and does not leak implementation details into business logic.
- [ ] **Isolation**: If this is a "quick fix", it is isolated enough to be rewritten later without side effects.
- [ ] **Observability**: If the code is complex, there are sufficient logs/metrics to detect failure.
```
