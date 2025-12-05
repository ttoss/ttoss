---
title: Agentic Development Principles
---

import TOCInline from '@theme/TOCInline';

:::caution Work in Progress
This document is under development. Principles will be refined and expanded as validated.
:::

This section defines principles for integrating AI agents into product development workflows, building on [The Principles of Product Development Flow](/docs/product/product-development/principles) and focusing on effective human-AI collaboration.

_Agentic development means intentionally designing workflows, feedback loops, and decision boundaries to maximize the value of AI agents as development partners._

## Table of Contents

<TOCInline toc={toc} />

## Principles

### The Principle of Immediate AI Feedback Loop

Integrate AI tools directly into the coding environment to deliver instant suggestions and error checking, minimizing context switching and delays. This maximizes value-added time and aligns with [B3: The Batch Size Feedback Principle](https://ttoss.dev/docs/product/product-development/principles#b3-the-batch-size-feedback-principle-reducing-batch-sizes-accelerates-feedback).

**Failure Scenario:** A team uses an AI code completion tool with a 5-second delay. Developers either wait (breaking flow) or ignore the tool, resulting in inconsistent adoption and wasted potential.

### The Principle of Human-in-the-Loop Veto

Every AI-generated output must pass final review by a domain expert who retains full accountability. AI accelerates delivery but introduces risk; human oversight ensures quality and prevents costly errors, supporting [E1: The Principle of Quantified Overall Economics](https://ttoss.dev/docs/product/product-development/principles#e1-the-principle-of-quantified-overall-economics-select-actions-based-on-quantified-overall-economic-impact).

**Failure Scenario:** An AI-generated database query is deployed without review, causing performance issues and technical debt.

### The Principle of Small-Experiment Automation

Use AI agents to break down large tasks into small, verifiable experiments (e.g., auto-generated unit tests, code variations), reducing risk and enabling fast feedback. This applies [B2: The Principle of Small Experiments](https://ttoss.dev/docs/product/product-development/principles#b2-the-principle-of-small-experiments-small-experiments-reduce-variation-and-risk).

**Failure Scenario:** An AI generates a massive, brittle test suite. Maintenance overhead grows, slowing development and negating the benefits of automation.

### The Principle of Contextual Input Quality

Developers must provide high-quality context and select the agent/model with the best cost-benefit profile for each task. Effective prompt engineering and tool selection minimize waste and the Cost of Delay, echoing [E2: The Marginal Cost Principle](https://ttoss.dev/docs/product/product-development/principles#e2-the-marginal-cost-principle-consider-marginal-costs-in-every-decision).

**Failure Scenario:** Using a slow, expensive model for a trivial task with a vague prompt leads to wasted time and resources.

### The Principle of Continuous Agent Proficiency

Teams must practice frequent, low-stakes interactions with AI tools to build expertise in prompt engineering and tool selection. Skill development reduces long-term rework and accelerates learning, following [FF8: The Fast-Learning Principle](https://ttoss.dev/docs/product/product-development/principles#ff8-the-fast-learning-principle-use-fast-feedback-to-make-learning-faster-and-more-efficient).

**Failure Scenario:** Developers receive initial training but lack time for practice, resulting in slow learning and inefficient workflows.

### The Principle of Delegated Agency Scaling

Scale AI agent autonomy by task complexity: fully delegate repetitive, low-risk tasks; use AI as a consultant for complex or high-risk decisions. This balances velocity and risk, applying [Batch Size Risk](https://ttoss.dev/docs/product/product-development/principles#batch-size-risk).

**Failure Scenario:** Delegating complex build optimization to AI leads to short-term gains but introduces critical errors, increasing rework and risk.

### The Principle of Automated Guardrail Prerequisite

Before granting full autonomy to AI agents, ensure robust automated safety nets (e.g., CI/CD, test suites) are in place to continuously validate outputs. Automation must be checked by automation to prevent catastrophic failures, supporting [B4: The Automated Feedback Principle](https://ttoss.dev/docs/product/product-development/principles#b4-the-automated-feedback-principle-automate-feedback-to-reduce-cost-of-delay).

**Failure Scenario:** An AI refactors components with inadequate automated tests, introducing subtle bugs that escape detection until production.

### The Principle of Layered Autonomy

Establish tiered governance: Company sets strategic safety and cost policies, Team defines tactical goals and quality metrics, Developer retains autonomy over tool selection and workflows. This decentralizes optimization while maintaining compliance and security.

**Failure Scenario:** Mandating a single AI tool for all teams blocks specialized workflows, increasing risk and cycle time for critical tasks.

### The Principle of Compounding Contextual Error

If an AI interaction does not resolve the problem quickly, the likelihood of successful resolution drops with each additional interaction, as accumulated context and unresolved errors compound. Fast, decisive resolution is critical to prevent error propagation and cognitive overload, aligning with [B3: The Batch Size Feedback Principle](https://ttoss.dev/docs/product/product-development/principles#b3-the-batch-size-feedback-principle-reducing-batch-sizes-accelerates-feedback).

**Failure Scenario:** A developer repeatedly prompts an AI agent to fix a bug, but each iteration introduces new minor errors and increases context complexity. After several cycles, the original issue is buried under layers of confusion, making resolution harder and increasing rework.

### The Principle of Orchestrated Agent Parallelism

Agent parallelism is most effective when the critical path is clearly defined and agents are orchestrated to work on independent, non-overlapping tasks. This maximizes throughput and minimizes bottlenecks, following [B1: The Principle of Critical Path](https://ttoss.dev/docs/product/product-development/principles#b1-the-principle-of-critical-path-focus-on-the-critical-path-to-optimize-flow).

**Failure Scenario:** Agents are assigned tasks without regard to the critical path, resulting in duplicated effort, idle time, and delayed delivery.

---

### The Corollary of Critical Path Conflict

Assigning multiple agents to work simultaneously on the same critical path increases the risk of conflict, redundant work, and integration errors. Effective orchestration requires that only one agent (or a tightly coordinated group) operates on the critical path at any time.

**Failure Scenario:** Two agents independently refactor the same core module, leading to merge conflicts, inconsistent logic, and wasted effort.

---

_These principles are evolving. For foundational reasoning, see [Product Development Principles](/docs/product/product-development/principles)._
