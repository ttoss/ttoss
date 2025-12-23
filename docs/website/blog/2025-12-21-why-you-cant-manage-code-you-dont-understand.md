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

Product Managers own the _Problem Space_ (User needs, market fit, value). Engineers own the _Solution Space_ (Architecture, reliability, maintainability).

If a PM doesn't understand the market, they build the wrong product. If an Engineer doesn't understand the system, they build a _fragile_ product.

## The "How" Contains the Risk

When a developer delegates to AI without maintaining ownership, they are attempting to abdicate the Solution Space. They think, "The AI handles the 'how', I just handle the 'what'." But the "how" contains all the risk.

- The "how" determines if the database locks up under load.
- The "how" determines if the security model is valid.
- The "how" determines if the system can be extended next month.

If you delegate the "how" to an AI and don't verify it with deep understanding, you aren't becoming a PM; you are becoming a liability.

## The Contractor Trap

When you delegate a task to an AI because you _don't understand the code_ (or don't want to deal with its complexity), you are acting as a **Contractor**. You are using the AI as a shield against complexity. The AI produces a "black box" patch that solves the immediate ticket, but you have no idea how it impacts the rest of the system.

If you do this enough times, you lose your mental model of the software. You become a "Product Manager of Code"—someone who can describe _what_ they want, but has no idea _how_ it works. And unlike a real Product Manager who relies on an engineering team to ensure structural integrity, you are relying on a probabilistic model that prioritizes "looking right" over "being right."

## The Architect of Agency

The best strategy for scaling is not to become a manager of black boxes, but to become an **Architect of Agency**. You use AI to execute, but you rigorously audit the output against your mental model. You trade the low-leverage work of syntax generation for the high-leverage work of **System Verification**.

This requires [Ownership-Preserving Delegation](/docs/ai/agentic-design-patterns#ownership-preserving-delegation). You must demand that the AI teaches you what it did. You must review the artifacts—the docstrings, the reasoning chains, the narrative diffs—before you accept the code.

You don't lose ownership by delegating; you lose ownership by stopping to look.
