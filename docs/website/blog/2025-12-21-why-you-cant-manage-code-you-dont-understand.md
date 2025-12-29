---
title: 'Why You Can''t "Manage" Code You Don''t Understand'
description: Addressing the "Developer as PM" question and the trade-off between scale and depth in the age of AI.
authors:
  - arantespp
tags:
  - ai
  - agentic-development
  - engineering-management
  - product-management
---

A common question in the age of AI is: _"If AI writes the code, do developers just become Product Managers?"_

The answer is **No**, and the reason lies in [The Principle of Contextual Authority](/docs/ai/agentic-development-principles#the-principle-of-contextual-authority).

<!-- truncate -->

Product Managers primarily own the _Problem Space_ (user needs, market fit, value). Engineers primarily own the _Solution Space_ (architecture, reliability, maintainability).

If a PM doesn't understand the market, they build the wrong product. If an Engineer doesn't understand the system, they build a _fragile_ product.

## The "How" Contains the Risk

When a developer delegates to AI without maintaining ownership, they are trying to outsource the Solution Space. The story becomes: "The AI handles the 'how', I just handle the 'what'." But the "how" contains the technical risk you can't outsource.

- The "how" determines if the database locks up under load.
- The "how" determines if the security model is valid.
- The "how" determines if the system can be extended next month.

If the engineering team delegates the "how" to AI without maintaining deep understanding, the codebase becomes a liability. Also, the team doesn't become PMs; they become custodians of technical debt they can't reason about.

## The Contractor Trap

When you delegate a task to an AI because you _don't understand the code_ (or don't want to deal with its complexity), you are acting as a **Contractor**. You are using the AI as a shield against complexity. The AI produces a "black box" patch that closes the immediate ticket, but you can't predict its impact on the rest of the system.

If you do this enough times, you lose your mental model of the software. You become a "Product Manager of Code"—someone who can describe _what_ they want, but can't reliably explain _why_ it works or _when_ it will fail.

And unlike a real Product Manager who relies on an engineering team to ensure structural integrity, you're relying on a model that (without strong feedback loops) is optimized for plausible output, not system guarantees.

## The Architect of Agency

The best strategy for scaling is not to become a manager of black boxes, but to become an **Architect of Agency**. You use AI to execute, but you rigorously audit the output against your mental model. You trade the low-leverage work of syntax generation for the high-leverage work of **System Verification**.

This requires [Ownership-Preserving Delegation](/docs/ai/agentic-design-patterns#ownership-preserving-delegation). Don't demand "trust me" output. Demand an audit trail: tests that pin behavior, clear invariants, notes about trade-offs, and a narrative diff you can reason about before you accept the change.

You don't lose ownership by delegating; you lose ownership by stopping to look.
