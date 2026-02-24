---
title: The Economics of Closed Loop Agents
description: How closed-loop, test-driven AI agents transform human-in-the-loop coding workflows by reducing the verification tax and aligning with Agentic Development Principles.
authors: arantespp
tags: [ai, engineering-management, agentic-development, testing]
---

In the rush to adopt AI coding tools, engineering teams are rediscovering a fundamental principle of Control Engineering, now codified as [The Principle of Automated Closed Loops](/docs/ai/agentic-development-principles#the-principle-of-automated-closed-loops): **Open-loop systems are unstable, and human feedback is the most expensive way to close the loop.**

When we talk about "AI Agents," we are really talking about control systems. The Agent is the controller, your codebase is the plant, and the goal is a stable, functioning feature. But most current implementations—prompting ChatGPT, hitting copy-paste, and manually debugging—are economically broken. They rely on the most expensive resource you have (senior engineering attention) to do the job of a simple feedback sensor.

To build scalable AI workflows, we must move from Open Loops to Closed Loops, where tests provide the feedback signal and the machine pays the verification tax.

<!--truncate-->

## The Physics of Feedback Loops

In control engineering, any system that acts on an environment needs a way to know if its actions worked. An **Open Loop** system is like a toaster that heats for two minutes regardless of whether the bread is frozen or already burnt. The controller sends a command and assumes the output is correct because there is no sensor to measure the result.

A **Closed Loop** system, like a thermostat, measures the result to calculate the error between the desired and actual state. It acts, measures, and adjusts until the target is reached. This feedback mechanism is what makes the system stable and reliable.

### The Problem: AI is an Open-Loop Toaster

Most developers treat LLMs as open-loop systems. You write a prompt ("Make this button blue"), the LLM generates code, and... that's it.

The system assumes the code is correct. But LLMs operate under [The Principle of Probabilistic AI Output](/docs/ai/agentic-development-principles#the-principle-of-probabilistic-ai-output)—they hallucinate APIs, forget imports, and make subtle logic errors. Without a feedback mechanism to catch these errors _before_ the human sees them, the system creates a costly verification bottleneck.

## The Human as the Feedback Loop (The Bottleneck)

In this open-loop workflow, **you** act as the sensor. You read the code, run the app, spot the missing import, and tell the LLM to fix it. This is a **Human-in-the-Loop** system. From an engineering perspective, humans are ineffective feedback sensors. We have high latency, taking minutes to context-switch and verify code where a machine would take milliseconds ([The Corollary of Verification Latency](/docs/ai/agentic-development-principles#the-corollary-of-verification-latency)). Our feedback is often low-precision ("it feels laggy" vs. "expected 200 ms"), and most critically, we are very expensive. This inefficiency creates a "Verification Tax" that bankrupts the value of using AI in the first place.

### The Verification Tax

Every line of code written by an AI imposes a [Verification Tax](/docs/ai/agentic-development-principles#the-corollary-of-the-verification-tax) on the human developer. When you write code yourself, the creation cost is high because you have to think through the logic, but the verification cost is low since you inherently trust your own reasoning.

With AI coding, the equation flips. The generation cost is near zero because tokens are cheap, but the verification cost is massive. You have to reverse-engineer the AI's logic to fundamentally trust it. If an AI generates 1,000 lines of code in 10 seconds, but it takes you 2 hours to manually verify it works, you haven't saved time. You've just shifted the cost from **Creation** to **Verification**.

## The Closed Loop: Offloading Verification to the Machine

The solution is to close the loop _before_ the human gets involved by replacing the expensive "Human Sensor" with a cheaper "Test Sensor." In a **Closed Loop Agentic Workflow**, the agent writes the code and also writes the tests to verify that code. The environment then runs those tests and feeds the results back to the agent. If a test fails, the precise error is sent back to the agent, which uses that feedback to correct its work. This cycle repeats until the tests pass.

Only _then_ does the human review the PR.

### Why This Wins

1.  **Capital Efficiency:** Compute is cheaper than salary. It is better to let an agent iterate on a syntax error for pennies than to break a developer's expensive flow state.
2.  **Higher Signal:** When code finally reaches a human, it compiles and passes basic logic gates imposed by [The Principle of Structural Determinism](/docs/ai/agentic-development-principles#the-principle-of-structural-determinism), shifting the review from "does this run?" to "is this the right architecture?".
3.  **Damping Oscillation:** Machine feedback prevents oscillation. A closed-loop agent stops "fixing" one bug by creating another because the test suite anchors the system state.

## A Practical Example: The ttoss Monorepo

We apply these principles directly in the [ttoss project](https://github.com/ttoss/ttoss). The repository is structured as a monorepo with multiple independent packages, and many of the core application and library packages include their own focused test suites.

You can explore the structure here: [github.com/ttoss/ttoss/tree/main/packages](https://github.com/ttoss/ttoss/tree/main/packages).

This architecture is intentional. By isolating functionality into small packages and adding dedicated tests where they provide the most leverage, we create "closed loops" for our agents. When an agent works on a specific package (like `@ttoss/react-auth` or `@ttoss/forms`), it can run the tests for just that package in seconds. This provides the fast, precise feedback signal the agent needs to self-correct, without running the entire application or waiting for a human review.

## Conclusion: Tests are the Currency of Autonomy

If you want autonomous agents, writing tests is no longer a "quality assurance" task—it is a "specification" task.

In the past, we wrote tests to catch regressions. In the future, we write tests to define the "Setpoint" for our AI controllers. The better your tests (sensors), the tighter the loop, and the more autonomy you can safely buy.
For a complementary view focused on verification costs and how to architect these feedback systems, see [From Reviewer to Architect: Escaping the AI Verification Trap](/blog/2025/12/18/from-reviewer-to-architect).

Stop being the feedback loop. Build one.
