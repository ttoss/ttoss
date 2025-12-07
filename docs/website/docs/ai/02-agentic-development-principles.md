---
title: Agentic Development Principles
---

import TOCInline from '@theme/TOCInline';

:::caution Work in Progress
This document is under development. Principles will be refined and expanded as validated.
:::

This section defines principles for integrating AI agents into product development workflows, building on [The Principles of Product Development Flow](/docs/product/product-development/principles) and focusing on effective human-AI collaboration.

This document has two parts:

1. **Principles**: Foundational guidelines for designing AI-augmented development workflows. They're are irreducible truths derived from the nature of AI agents and software development.

2. **Corollaries**: Practical extensions of the principles that address specific scenarios and challenges encountered when applying them in real-world development contexts.

_Agentic development means intentionally designing workflows, feedback loops, and decision boundaries to maximize the value of AI agents as development partners._

## Table of Contents

<TOCInline toc={toc} />

## Principles

### The Principle of Probabilistic AI Output

LLMs and most AI agents generate outputs based on probability distributions, not deterministic rules. This means identical prompts may yield different results, especially when randomness is enabled. Product teams must design workflows and guardrails that account for this inherent variability, ensuring reproducibility where needed and embracing diversity of output for creative tasks. This principle supports [B3: The Batch Size Feedback Principle](/docs/product/product-development/principles#b3-the-batch-size-feedback-principle-reducing-batch-sizes-accelerates-feedback) by highlighting the need for rapid feedback and validation cycles.

**Failure Scenario:** A team expects an AI agent to always produce the same code for a given prompt. When outputs vary, confusion and rework occur, undermining trust and slowing delivery.

### The Principle of Confidence-Qualified AI Output

LLMs operate probabilistically and can be prompted to estimate the confidence of their predictions. By instructing AI agents to explicitly indicate when their confidence in an output exceeds a high threshold (e.g., >80%), teams can reduce noise and improve reliability in decision-making. This approach builds on [The Principle of Probabilistic AI Output](#the-principle-of-probabilistic-ai-output), enabling developers to prioritize high-confidence outputs and treat lower-confidence responses with appropriate caution, supporting more effective human-AI collaboration and risk management.

**Failure Scenario:** An AI agent provides recommendations without indicating confidence. Developers act on low-confidence suggestions, leading to errors and wasted effort.

### The Principle of Cognitive Bandwidth Conservation

Human attention is a finite resource, and every AI output demands a "cognitive tax" for evaluation. Because verifying AI suggestions requires mental effort, low-quality or excessive outputs can quickly drain developer energy and reduce overall velocity. Workflows must prioritize high-signal outputs to conserve human bandwidth for high-value decision making, supporting [E1: The Principle of Quantified Overall Economics](/docs/product/product-development/principles#e1-the-principle-of-quantified-overall-economics-select-actions-based-on-quantified-overall-economic-impact).

**Failure Scenario:** An AI tool generates verbose, slightly incorrect code for every keystroke. The developer spends more energy correcting the AI than writing code, resulting in net-negative productivity.

### The Principle of Immediate AI Feedback Loop

Integrate AI tools directly into the coding environment to deliver instant suggestions and error checking, minimizing context switching and delays. This maximizes value-added time and aligns with [B3: The Batch Size Feedback Principle](/docs/product/product-development/principles#b3-the-batch-size-feedback-principle-reducing-batch-sizes-accelerates-feedback).

**Failure Scenario:** A team uses an AI code completion tool with a 5-second delay. Developers either wait (breaking flow) or ignore the tool, resulting in inconsistent adoption and wasted potential.

### The Principle of Human-in-the-Loop Veto

Every AI-generated output must pass final review by a domain expert who retains full accountability. AI accelerates delivery but introduces risk; human oversight ensures quality and prevents costly errors, supporting [E1: The Principle of Quantified Overall Economics](/docs/product/product-development/principles#e1-the-principle-of-quantified-overall-economics-select-actions-based-on-quantified-overall-economic-impact).

**Failure Scenario:** An AI-generated database query is deployed without review, causing performance issues and technical debt.

### The Principle of Small-Experiment Automation

Use AI agents to break down large tasks into small, verifiable experiments (e.g., auto-generated unit tests, code variations), reducing risk and enabling fast feedback. This applies [V7: The Principle of Small Experiments](/docs/product/product-development/principles#v7-the-principle-of-small-experiments-many-small-experiments-produce-less-variation-than-one-big-one).

**Failure Scenario:** An AI generates a massive, brittle test suite. Maintenance overhead grows, slowing development and negating the benefits of automation.

### The Principle of Contextual Input Quality

Developers must provide high-quality context and select the agent/model with the best cost-benefit profile for each task. Effective prompt engineering and tool selection minimize waste and the Cost of Delay, echoing [E16: The Principle of Marginal Economics](/docs/product/product-development/principles#e16-the-principle-of-marginal-economics-always-compare-marginal-cost-and-marginal-value). This is particularly critical given [The Principle of Finite Context Window](#the-principle-of-finite-context-window), as irrelevant information consumes scarce memory resources.

**Failure Scenario:** Using a slow, expensive model for a trivial task with a vague prompt leads to wasted time and resources.

### The Principle of Continuous Agent Proficiency

Teams must practice frequent, low-stakes interactions with AI tools to build expertise in prompt engineering and tool selection. Skill development reduces long-term rework and accelerates learning, following [FF11: The Batch Size Principle of Feedback](/docs/product/product-development/principles#ff11-the-batch-size-principle-of-feedback-small-batches-yield-fast-feedback).

**Failure Scenario:** Developers receive initial training but lack time for practice, resulting in slow learning and inefficient workflows.

### The Principle of Delegated Agency Scaling

Scale AI agent autonomy by task complexity: fully delegate repetitive, low-risk tasks; use AI as a consultant for complex or high-risk decisions. This balances velocity and risk, applying [B4: The Batch Size Risk Principle](/docs/product/product-development/principles#b4-the-batch-size-risk-principle-reducing-batch-size-reduces-risk). High-risk tasks must always adhere to [The Principle of Human-in-the-Loop Veto](#the-principle-of-human-in-the-loop-veto).

**Failure Scenario:** Delegating complex build optimization to AI leads to short-term gains but introduces critical errors, increasing rework and risk.

### The Principle of Automated Guardrail Prerequisite

Before granting full autonomy to AI agents, ensure robust automated safety nets (e.g., CI/CD, test suites) are in place to continuously validate outputs. Automation must be checked by automation to prevent catastrophic failures, supporting [B4: The Batch Size Risk Principle](/docs/product/product-development/principles#b4-the-batch-size-risk-principle-reducing-batch-size-reduces-risk).

**Failure Scenario:** An AI refactors components with inadequate automated tests, introducing subtle bugs that escape detection until production.

### The Principle of Layered Autonomy

Establish tiered governance: Company sets strategic safety and cost policies, Team defines tactical goals and quality metrics, Developer retains autonomy over tool selection and workflows. This decentralizes optimization while maintaining compliance and security.

**Failure Scenario:** Mandating a single AI tool for all teams blocks specialized workflows, increasing risk and cycle time for critical tasks.

### The Principle of Compounding Contextual Error

If an AI interaction does not resolve the problem quickly, the likelihood of successful resolution drops with each additional interaction, as accumulated context and unresolved errors compound. Fast, decisive resolution is critical to prevent error propagation and cognitive overload, aligning with [B3: The Batch Size Feedback Principle](/docs/product/product-development/principles#b3-the-batch-size-feedback-principle-reducing-batch-sizes-accelerates-feedback). This compounding effect is exacerbated by [The Principle of Finite Context Window](#the-principle-of-finite-context-window), as earlier correct context may be pushed out by recent erroneous attempts.

**Failure Scenario:** A developer repeatedly prompts an AI agent to fix a bug, but each iteration introduces new minor errors and increases context complexity. After several cycles, the original issue is buried under layers of confusion, making resolution harder and increasing rework.

### The Principle of Finite Context Window

AI models have a fixed context window, limiting the amount of information they can process in a single interaction. As conversations lengthen or input sizes grow, earlier context is truncated, leading to a loss of critical instructions. Teams must manage context as a scarce resource, prioritizing relevant information and resetting sessions when necessary. This aligns with [E1: The Principle of Quantified Overall Economics](/docs/product/product-development/principles#e1-the-principle-of-quantified-overall-economics-select-actions-based-on-quantified-overall-economic-impact) by optimizing the resource usage of the model.

**Failure Scenario:** A developer provides detailed architectural guidelines at the start of a long refactoring session. By the end, the agent has "forgotten" these rules due to context overflow and generates code that violates the initial guidelines.

### The Principle of Context Scarcity

Context is a finite, perishable resource that must be allocated based on economic value. Because adding low-value information displaces high-value information (or increases costs/latency), every piece of context provided to an agent must justify its consumption of the window. This aligns with [E1: The Principle of Quantified Overall Economics](/docs/product/product-development/principles#e1-the-principle-of-quantified-overall-economics-select-actions-based-on-quantified-overall-economic-impact).

**Failure Scenario:** A developer pastes an entire 5000-line log file into the chat to debug a simple error, filling the context window and causing the agent to forget the project's coding standards.

### The Principle of Orchestrated Agent Parallelism

Agent parallelism is most effective when the critical path is clearly defined and agents are orchestrated to work on independent, non-overlapping tasks. This maximizes throughput and minimizes bottlenecks, following [D10. The Main Effort Principle](/docs/product/product-development/principles#d10-the-main-effort-principle-designate-a-main-effort-and-subordinate-other-activities).

**Failure Scenario:** Agents are assigned tasks without regard to the critical path, resulting in duplicated effort, idle time, and delayed delivery.

### The Principle of Prompt Economics

While AI agents allow for seemingly infinite retries, every prompt carries a marginal cost in latency, financial expense, and system load. Development workflows should optimize for high-value interactions rather than brute-force iteration, treating agent capacity as a metered utility. This supports [E16: The Principle of Marginal Economics](/docs/product/product-development/principles#e16-the-principle-of-marginal-economics-always-compare-marginal-cost-and-marginal-value).

**Failure Scenario:** A developer uses a "retry loop" strategy, blindly regenerating code dozens of times hoping for a correct result, incurring high API costs and wasting time that could have been spent on a single, well-crafted prompt.

### The Principle of Compounding Context

AI workflows must be designed as interconnected layers where the output of one agent automatically persists into a shared memory layer to become the context for downstream agents. This ensures that intelligence accumulates over time rather than resetting after every task, reducing the transaction cost of information transfer and minimizing rework. This aligns with [E1: The Principle of Quantified Overall Economics](/docs/product/product-development/principles#e1-the-principle-of-quantified-overall-economics-select-actions-based-on-quantified-overall-economic-impact) by preserving value generated in earlier stages.

**Failure Scenario:** A team uses AI to architect a new feature and agrees on specific constraints. However, because this decision isn't stored in a shared memory layer, the AI agent responsible for writing the code is unaware of the constraints. It generates code that works but violates the architecture, forcing the human to manually refactor it.

## Corollaries

### The Corollary of Artifact Persistence

AI outputs should be persisted as durable artifacts (docs, code, tickets) rather than ephemeral chat logs. When we treat AI interactions as transient, we lose value. When we treat them as artifact generation steps, we build a compounding asset. This corollary operationalizes [The Principle of Compounding Context](#the-principle-of-compounding-context) by ensuring the memory layer is populated with tangible records.

**Failure Scenario:** A developer has a long conversation with an AI to debug a complex issue. The AI explains the root cause and the fix. The developer applies the fix but closes the chat without saving the explanation. Six months later, the bug reappears, and the team has to rediscover the root cause from scratch because the "why" was lost in the ephemeral chat.

### The Corollary of Model Convergence

To mitigate the probabilistic nature of AI models, teams can submit the same prompt and context to multiple models and compare their outputs. If responses converge, confidence in the result increases; if they diverge, further review is warranted. This corollary operationalizes [The Principle of Probabilistic AI Output](#the-principle-of-probabilistic-ai-output) by leveraging model diversity to validate outputs and reduce the risk of relying on a single model's randomness.

**Failure Scenario:** A team only checks one model's answer and assumes correctness. If that model hallucinates, the error goes undetected. By contrast, if multiple models disagree, the team is alerted to investigate further.

### The Corollary of Confident Hallucination

High confidence scores are internal probability assessments, not external verifications of truth. An AI agent can be highly confident in a hallucinated fact or incorrect logic. Therefore, high confidence should prioritize an output for review, but never bypass validation or the [Human-in-the-Loop Veto](#the-principle-of-human-in-the-loop-veto).

**Failure Scenario:** A developer accepts a "99% confident" API reference from an agent without checking, only to find the method does not exist, causing a build failure.

### The Corollary of Critical Path Conflict

Assigning multiple agents to work simultaneously on the same critical path increases the risk of conflict, redundant work, and integration errors. Effective orchestration requires that only one agent (or a tightly coordinated group) operates on the critical path at any time.

**Failure Scenario:** Two agents independently refactor the same core module, leading to merge conflicts, inconsistent logic, and wasted effort.

### The Principle of Explicit Intent

Prompts must declare the goal, audience, role, and success criteria explicitly. A well-scoped instruction reduces ambiguity and preserves human cognitive bandwidth by removing guesswork. When possible, include the exact output format and a short definition of success (e.g., "3 bullets suitable for a 150-word LinkedIn post"). This principle complements [The Principle of Contextual Input Quality](#the-principle-of-contextual-input-quality) and [The Principle of Cognitive Bandwidth Conservation](#the-principle-of-cognitive-bandwidth-conservation).

**Failure Scenario:** A developer asks "Improve this copy" without defining audience or length. The agent returns a generic rewrite that misses the desired tone and distribution channel, causing wasted review cycles.

### The Principle of Task Atomicity

Design prompts to express a single intent per interaction. Break complex workflows into explicit, chained steps (analyze → propose → implement → verify). Atomic prompts reduce compounding context errors, simplify validation, and make human-in-the-loop review more effective. This principle operationalizes [The Principle of Small-Experiment Automation](#the-principle-of-small-experiment-automation) and mitigates [The Principle of Compounding Contextual Error](#the-principle-of-compounding-contextual-error).

**Failure Scenario:** A single prompt asks for analysis, a feature spec, tests, and code; the agent returns shallow artifacts across all parts and requires multiple corrective iterations.

### The Principle of Instruction Polarity

Prefer positive, prescriptive instructions over negative constraints. Saying what to do ("Use short, punchy sentences") is more reliable than saying what not to do ("Don't be boring"). Positive instructions reduce misinterpretation and lower verification cost for reviewers.

**Failure Scenario:** Prompts that list many "don'ts" are partially ignored or misapplied, producing outputs that still violate intended constraints and increasing review time.

### The Principle of Format Enforcement and Examples

Force strict output formats (JSON schema, markdown sections, tables) and include 1–3 few-shot examples when the structure matters. Examples and strict schemas make downstream automation and parsing deterministic and reduce rework caused by ambiguous structure. This supports [The Principle of Compounding Context](#the-principle-of-compounding-context) by producing machine-readable artifacts.

**Failure Scenario:** An agent returns a human-readable paragraph when the consumer expects a JSON object; engineers spend time parsing and normalizing outputs instead of shipping.

### The Principle of Concise, High-Signal Prompts

Treat each token in the model context as valuable. Remove fluff, greetings, and irrelevant context. Place critical instructions prominently (start or end of prompt) and repeat only when necessary. This minimizes wasted tokens, reduces chance of context overflow, and improves throughput per interaction, aligning with [The Principle of Finite Context Window](#the-principle-of-finite-context-window) and [The Principle of Cognitive Bandwidth Conservation](#the-principle-of-cognitive-bandwidth-conservation).

**Failure Scenario:** Long preambles and polite chatter push essential constraints out of the model's active window, producing outputs that ignore the project's rules.

---

_These principles are evolving. For foundational reasoning, see [Product Development Principles](/docs/product/product-development/principles)._
