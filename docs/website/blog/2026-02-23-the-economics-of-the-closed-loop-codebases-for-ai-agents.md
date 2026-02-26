---
title: The Economics of Closed Loop Codebases for AI Agents
description: How closed-loop, test-driven codebases transform AI agent workflows by reducing the verification tax and aligning with Agentic Development Principles.
authors: arantespp
tags: [ai, engineering-management, agentic-development, testing]
---

In the rush to adopt AI coding tools, engineering teams are rediscovering a fundamental principle of Control Engineering, now codified as [The Principle of Automated Closed Loops](/docs/ai/agentic-development-principles#the-principle-of-automated-closed-loops): **Open-loop systems are unstable, and human feedback is the most expensive way to close the loop.**

The key insight is that **codebases need to be structured with tests and verification mechanisms** to provide the feedback signals that make those agent loops effective.

When we talk about "AI Agents," we are really talking about control systems. The Agent is the controller, your codebase is the plant, and the goal is a stable, functioning feature. But most current implementations—prompting ChatGPT, hitting copy-paste, and manually debugging—are economically broken. They rely on the most expensive resource you have (senior engineering attention) to do the job of a simple feedback sensor.

<!--truncate-->

## The Human as the Feedback Loop (The Bottleneck)

Most developers treat LLMs as open-loop systems. You write a prompt ("Make this button blue"), the LLM generates code, and the system assumes it's correct. But LLMs operate under [The Principle of Probabilistic AI Output](/docs/ai/agentic-development-principles#the-principle-of-probabilistic-ai-output)—they hallucinate APIs, forget imports, and make subtle logic errors. Without a feedback mechanism to catch these errors _before_ the human sees them, the system creates a costly verification bottleneck.

In this open-loop workflow, **you** act as the sensor. You read the code, run the app, spot the missing import, and tell the LLM to fix it. This is a **Human-in-the-Loop** system. From an engineering perspective, humans are ineffective feedback sensors. We have high latency, taking minutes to context-switch and verify code where a machine would take milliseconds ([The Corollary of Verification Latency](/docs/ai/agentic-development-principles#the-corollary-of-verification-latency)). Our feedback is often low-precision ("it feels laggy" vs. "expected 200 ms"), and most critically, we are very expensive. This inefficiency creates a "Verification Tax" that bankrupts the value of using AI in the first place.

### The Verification Tax

Every line of code written by an AI imposes a [Verification Tax](/docs/ai/agentic-development-principles#the-corollary-of-the-verification-tax) on the human developer. When you write code yourself, the creation cost is high because you have to think through the logic, but the verification cost is low since you inherently trust your own reasoning.

With AI coding, the equation flips. The generation cost is near zero because tokens are cheap, but the verification cost is massive. You have to reverse-engineer the AI's logic to fundamentally trust it. If an AI generates 1,000 lines of code in 10 seconds, but it takes you 2 hours to manually verify it works, you shifted the cost from **Creation** to **Verification**.

## The Closed Loop

The solution is to close the loop _before_ the human gets involved by replacing the expensive "Human Sensor" with a cheaper "Test Sensor." In a **Closed Loop Agentic Workflow**, the agent writes the code and also writes the tests to verify that code. The environment then runs those tests and feeds the results back to the agent. If a test fails, the precise error is sent back to the agent, which uses that feedback to correct its work. This cycle repeats until the tests pass.

Only _then_ does the human review the PR.

### Deterministic Verification

Not all "closed loops" are created equal. As codified in [The Corollary of Deterministic Verification](/docs/ai/agentic-development-principles#the-corollary-of-deterministic-verification), verification must be structurally enforced, not semantically requested.

**Instruction-driven verification** (weak closed loops) relies on prompts—you tell the agent to run tests and lint after changes, trusting it executed them. While valuable for reducing human verification work, this approach is structurally fragile under [The Principle of Distributed Unreliability](/docs/ai/agentic-development-principles#the-principle-of-distributed-unreliability). Agents can time out, crash, skip commands, or report execution that never occurred.

In ttoss, we make expected verification steps explicit in repo instructions (e.g., `pnpm run -w lint`, `pnpm run test`): https://github.com/ttoss/ttoss/blob/main/.github/instructions/general.instructions.md.

**CI-enforced verification** (strong closed loops) embeds tests and checks into infrastructure so they execute automatically on every change, producing an objective pass/fail signal. This converts "did tests run?" from a probabilistic agent responsibility into a well-structured, deterministic gate, aligning with [The Principle of Problem Structure Allocation](/docs/ai/agentic-development-principles#the-principle-of-problem-structure-allocation) and [The Principle of Structural Determinism](/docs/ai/agentic-development-principles#the-principle-of-structural-determinism).

In practice, this looks like GitHub Actions workflows that run on pull requests: https://github.com/ttoss/ttoss/tree/main/.github/workflows.

This approach delivers three key benefits: **Capital Efficiency** (compute is cheaper than salary—let an agent iterate on syntax errors for pennies rather than breaking a developer's expensive flow state), **Higher Signal** (when code reaches a human, it compiles and passes basic logic gates, shifting the review from "does this run?" to "is this the right architecture?"), and **Damping Oscillation** (machine feedback prevents the agent from "fixing" one bug by creating another because the test suite anchors the system state).

## A Practical Example

We apply these principles directly in the [ttoss project](https://github.com/ttoss/ttoss). The repository is structured as a monorepo with multiple independent packages, and many of the core application and library packages include their own focused test suites.

You can explore the structure here: [github.com/ttoss/ttoss/tree/main/packages](https://github.com/ttoss/ttoss/tree/main/packages).

This architecture is intentional. By isolating functionality into small packages and adding dedicated tests where they provide the most leverage, we create "closed loops" for our agents. When an agent works on a specific package (like `@ttoss/react-auth` or `@ttoss/forms`), it can run the tests for just that package in seconds. This provides the fast, precise feedback signal the agent needs to self-correct, without running the entire application or waiting for a human review.

When those same checks are also wired into CI, the loop becomes strong: the verification step is guaranteed to run, and the result is recorded independently of the agent.

## Conclusion

If you want autonomous agents, writing tests is no longer a "quality assurance" task—it is a "specification" task.

In the past, we wrote tests to catch regressions. In the future, we write tests to define the "Setpoint" for our AI controllers. The better your tests (sensors), the tighter the loop, and the more autonomy you can safely buy.
For a complementary view focused on verification costs and how to architect these feedback systems, see [From Reviewer to Architect: Escaping the AI Verification Trap](/blog/2025/12/18/from-reviewer-to-architect).

Stop being the feedback loop. Build one.
