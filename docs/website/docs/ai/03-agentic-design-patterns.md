---
title: Agentic Development Patterns
---

import TOCInline from '@theme/TOCInline';

While [Agentic Development Principles](/docs/ai/agentic-development-principles) define the immutable laws of physics and economics for AI integration, this page defines the Engineering Standards required to build within those laws.

These are not theoretical concepts; they are reusable design patterns. They provide specific solutions to the recurring problems of cost, latency, reliability, and risk that every agentic system encounters. Use these patterns to bridge the gap between abstract principles and production code.

## Table of Contents

<TOCInline toc={toc} />

## Communication Patterns

### Explicit Intent Protocol

**The Problem:** LLMs are probabilistic machines that "auto-complete" based on statistical likelihood, not shared understanding. When instructions are vague, the model "hallucinates" the missing context, introducing noise and error into the workflow.

**The Underlying Principle:** Derived from [The Principle of Signal Entropy](/docs/ai/agentic-development-principles#the-principle-of-signal-entropy).

**The Strategy:** Treat every prompt as a standalone communication packet that must contain all necessary context, constraints, and definitions. Do not rely on "implied" knowledge. Use structured formats (XML tags, JSON schemas) to force the model to parse intent rather than guess it.

**Failure Scenario:** A developer tells an agent to "refactor this code." Without explicit intent defining what "refactor" means (e.g., "optimize for readability," "reduce cyclomatic complexity," or "change variable names"), the agent aggressively shortens the code, removing critical error handling that it perceived as "clutter."

### Theory of Mind Prompting

**The Problem:** Agents lack "Theory of Mind"—the ability to model what the user knows or doesn't know. They often provide answers that are factually correct but contextually useless because they assume the wrong level of user expertise.

**The Underlying Principle:** Derived from [The Principle of Signal Entropy](/docs/ai/agentic-development-principles#the-principle-of-signal-entropy).

**The Strategy:** Explicitly prime the agent with a specific "Persona" and "Audience" definition. Instruct the agent to simulate the mental state of the recipient (e.g., "Explain this to a Junior React Developer" vs. "Explain this to the CTO"). This forces the model to adjust its complexity and tone to match the cognitive bandwidth of the user.

**Failure Scenario:** A senior engineer asks for a "high-level summary" of a bug. The agent, lacking Theory of Mind, dumps 400 lines of stack trace logs. The engineer's cognitive bandwidth is flooded with low-level data, obscuring the high-level root cause.

### Chain of Thought Decomposition

**The Problem:** LLMs have a "cognitive attention limit." When a single prompt contains multiple distinct requests (e.g., "Analyze this, then summarize it, then translate it, and format it as JSON"), the model often suffers from the "Lost in the Middle" phenomenon. It prioritizes the beginning and end of the prompt, ignoring instructions buried in the center, or it degrades in quality because it is trying to optimize for too many variables simultaneously.

**The Underlying Principle:** Derived from [The Principle of Signal Entropy](/docs/ai/agentic-development-principles#the-principle-of-signal-entropy).

**The Strategy:** Break complex workflows into a sequential chain of atomic prompts. Instead of a "One-Shot" attempt, force the model to generate an intermediate artifact (a plan, an outline, or a draft) before generating the final result. This allows the model to "reset" its attention span for each specific step.

- Step 1: Generate the logic/plan.
- Step 2: Execute based only on the output of Step 1.

**Failure Scenario:** A developer asks an agent to "Read this 50-page PDF, extract the financial risks, compare them to our internal policy, and write a memo in Spanish." The agent misses 3 critical risks because it was "distracted" by the translation requirement. Correct approach: (1) Extract risks. (2) Compare to policy. (3) Translate the final result.

### The Context Sanitizer

**The Problem:** Agents amplify the existing patterns in their context window. If a developer asks an agent to add a feature to a file containing "spaghetti code," the agent will mimic that messy style to ensure local consistency, effectively hardening the technical debt.

**The Underlying Principle:** Derived from [The Principle of Pattern Inertia](/docs/ai/agentic-development-principles#the-principle-of-pattern-inertia).

**The Strategy:** Before an agent is allowed to generate code for a legacy module, the context must be "sanitized." This can be achieved by:

- **Gold Standard Injection:** Explicitly injecting a "Reference Implementation" of clean code into the prompt to serve as a stronger style guide than the existing file.
- **Pre-Flight Refactor:** Using a separate, cheaper agent to strictly reformat or comment the target file before the main agent attempts the task.

**Failure Scenario:** A developer asks an agent to fix a bug in a 2000-line legacy controller. The agent notices that the file relies on global variables and lacks type safety. To "fit in," the agent's fix also uses a global variable. The code works, but the debt is compounded.

## Governance Patterns

### Human-in-the-Loop Veto

**The Problem:** AI agents can act with high confidence even when completely wrong. In high-stakes environments (production databases, public communications), a single error can have infinite downside cost.

**The Underlying Principle:** Derived from [The Principle of Asymmetric Risk](/docs/ai/agentic-development-principles#the-principle-of-asymmetric-risk).

**The Strategy:** Implement a mandatory "Veto State" for all actions with non-linear downside. The agent can propose an action and prepare the payload, but it cannot execute without a cryptographically signed signal (e.g., clicking a button) from a human. The system defaults to "Deny."

**Failure Scenario:** An autonomous "Customer Support Agent" is allowed to issue refunds without oversight. A user discovers a prompt injection exploit and tricks the agent into refunding \$50,000. The system optimized for speed but failed on risk control.

### Layered Autonomy

**The Problem:** Different tasks carry different risk profiles. Applying a "zero-trust" policy to everything slows down development (micromanagement), while applying "full autonomy" to everything creates unacceptable risk.

**The Underlying Principle:** Derived from [The Principle of Asymmetric Risk](/docs/ai/agentic-development-principles#the-principle-of-asymmetric-risk).

**The Strategy:** Assign "Clearance Levels" to agents similar to security clearances.

Level 1 (Consultant): Can only read data and suggest code. (High autonomy).

Level 2 (Intern): Can write to non-production environments with test verification.

Level 3 (Employee): Can deploy to production, but only for specific, whitelisted scopes (e.g., updating docs).

**Failure Scenario:** A "Documentation Agent" is given the same permission set as a "DevOps Agent." A prompt injection in the documentation pipeline allows an attacker to gain write access to the production deployment keys.

### The Complexity Brake

**The Problem:** AI makes adding complexity (patching) nearly free, while refactoring remains expensive (requires deep thought). This economic imbalance leads to "Zero-Cost Erosion," where systems degrade rapidly because "just one more if-statement" is always the path of least resistance.

**The Underlying Principle:** Derived from [The Principle of Zero-Cost Erosion](/docs/ai/agentic-development-principles#the-principle-of-zero-cost-erosion).

**The Strategy:** Re-introduce artificial friction for "lazy" coding. Configure CI/CD or Agent Orchestrators to calculate the Cyclomatic Complexity of the agent's output. If the agent's PR increases the complexity score of a function beyond a threshold (e.g., >10), the system automatically rejects the change or demands a "Refactor Plan" before acceptance.

**Failure Scenario:** An agent is tasked with handling a new edge case. It adds a 5th nested if/else block to a function because that was the easiest valid solution. The function becomes unreadable. A human would have felt the pain and refactored; the agent felt nothing.

### The Semantic Validator

**The Problem:** AI models excel at syntax (style, formatting) but struggle with semantics (logic, truth). They can generate code that looks "perfect" (correct indentation, professional comments) but contains subtle logical flaws or security vulnerabilities. The visual of the code deceives the human reviewer.

**The Underlying Principle:** Derived from [The Principle of Syntactic-Semantic Decoupling](/docs/ai/agentic-development-principles#the-principle-of-syntactic-semantic-decoupling).

**The Strategy:** Invert the verification workflow. Do not rely on visual code review ("Does this look right?"). Instead, enforce Test-Driven Generation:

1. The agent must generate a failing test case before writing the implementation.
2. The implementation is only shown to the human after it passes the test.
3. The human reviews the test for logic, not just the implementation for visual.

**Failure Scenario:** An agent generates a Regex for validating emails. It looks complex and professional. The developer merges it. In reality, the Regex allows catastrophic backtracking (ReDoS), crashing the production server when a malicious user sends a long string. A simple functional test would have caught this, but the visual masked it.

## Orchestration Patterns

### Role-Based Routing

**The Problem:** Not all failures are due to a lack of intelligence; many are due to a mismatch in ambiguity tolerance. Assigning a high-ambiguity task (e.g., "Analyze market trends") to an agent designed for rigid execution leads to crashes or hallucinated assumptions. Conversely, assigning a rote data-entry task to a creative "Reasoning Agent" often leads to "boredom errors," where the model over-complicates simple logic or tries to refactor data it was only meant to copy.

**The Underlying Principle:** Derived from The Principle of Allocative Efficiency and The Principle of Signal Entropy.

**The Strategy:** Classify your agents not just by the model they use, but by their Functional Role:

1. The Executor (Doer): Zero ambiguity tolerance. Follows strict Standard Operating Procedures (SOPs). Best for defined inputs/outputs (e.g., SQL queries, API calls).

2. The Collaborator (Clarifier): Moderate ambiguity tolerance. Has the explicit instruction and permission to ask questions back to the user if parameters are missing.

3. The Architect (Planner): High ambiguity tolerance. Breaks down abstract goals into concrete steps for Executors.

_Route tasks based on the level of definition required, not just the difficulty._

**Failure Scenario:** A user asks a "Database Agent" (Executor Role) to "Find the best users." Because "best" is subjective and undefined, the agent—lacking the "Architect" permission to define terms—hallucinates a metric (e.g., purely alphabetical order or random selection) and returns confident, meaningless data. The task required an "Architect" agent to first define "best" or a "Collaborator" to ask the user, "By 'best', do you mean highest revenue or most recent login?"

### Collaborative Ability Distinction

**The Problem:** Not all tasks have clear definitions. Assigning a high-ambiguity task (e.g., "Research market trends") to an agent designed for low-ambiguity execution (e.g., "Scrape this specific URL") leads to failure. The "Executor" agent will either crash because it lacks parameters or hallucinate a rigid path where none exists. Conversely, asking a creative "Architect" agent to perform rigid data entry leads to "boredom" errors (over-complicating simple tasks).

**The Underlying Principle:** Derived from The Principle of Allocative Efficiency and Signal Entropy.

1. The Strategy Classify agents not just by model intelligence, but by Functional Role:

2. The Executor: Follows strict SOPs. Zero ambiguity tolerance. Best for defined inputs/outputs.

3. The Collaborator: Can handle partial ambiguity and has permission to ask clarifying questions back to the user.

4. The Architect: Handles high ambiguity. Can breakdown abstract goals into concrete plans for Executors.

_Route the task based on the level of definition, not just difficulty._

**Failure Scenario:** A user asks a "SQL Database Agent" (Executor Role) to "Analyze the user retention trends." Because the agent expects a specific SQL query or strict table parameters, it attempts to guess the definition of "retention," writes a flawed query based on assumptions, and returns confident but misleading data. The task required an "Architect" to first define "retention" with the user.

### Idempotent Handoffs

**The Problem:** Agents fail, timeout, and hallucinate. If an orchestrator simply "retries" a failed task without safety checks, it may execute a side-effect (like a payment or database write) twice, corrupting the system state.

**The Underlying Principle:** Derived from [The Principle of Atomic State Isolation](/docs/ai/agentic-development-principles#the-principle-of-atomic-state-isolation).

**The Strategy:** Ensure every agent action is Idempotent—meaning it can be applied multiple times without changing the result beyond the initial application. Use unique interaction_ids for every request. If an agent receives a task with an ID it has already processed, it should return the cached result rather than executing the logic again.

**Failure Scenario:** An agent is tasked with "Add \$50 credit to User A." The agent adds the credit but the connection times out before it reports success. The orchestrator thinks it failed and retries the task. The agent adds another \$50. The ledger is now corrupt.
