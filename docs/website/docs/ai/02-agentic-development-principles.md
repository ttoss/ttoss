---
title: Agentic Development Principles
---

import TOCInline from '@theme/TOCInline';

:::caution Work in Progress
This document is under development. Principles will be refined and expanded as validated.
:::

This section defines principles for integrating AI agents into product development workflows, building on [The Principles of Product Development Flow](/docs/product/product-development/principles) and focusing on effective human-AI collaboration.

This document groups principles into categories that define the physics, economics, architecture, communication protocols, and governance structures required to maximize the value of AI agents as development partners.

Each principle includes failure scenarios illustrating common pitfalls when the principle is not followed. They may also include corollaries that further elaborate on specific aspects of the main principle.

_Agentic development means intentionally designing workflows, feedback loops, and decision boundaries to maximize the value of AI agents as development partners._

## Table of Contents

<TOCInline toc={toc} />

## The Physics of AI Integration

Define the immutable properties and technical constraints of the models we are working with. We cannot change these rules; we can only manage them.

### The Principle of Probabilistic AI Output

LLMs and most AI agents generate outputs based on probability distributions, not deterministic rules. This means identical prompts may yield different results, especially when randomness is enabled. Product teams must design workflows and guardrails that account for this inherent variability, ensuring reproducibility where needed and embracing diversity of output for creative tasks. This principle supports [B3: The Batch Size Feedback Principle](/docs/product/product-development/principles#b3-the-batch-size-feedback-principle-reducing-batch-sizes-accelerates-feedback) by highlighting the need for rapid feedback and validation cycles.

**Failure Scenario:** A team expects an AI agent to always produce the same code for a given prompt. When outputs vary, confusion and rework occur, undermining trust and slowing delivery.

#### The Corollary of Model Convergence

To mitigate the probabilistic nature of AI models, teams can submit the same prompt to multiple models. If responses converge, confidence increases; if they diverge, further review is warranted. This helps catch hallucinations that a single model might present convincingly.

#### The Corollary of Confidence-Qualified Output

By instructing AI agents to explicitly indicate when their confidence exceeds a high threshold (e.g., >80%), teams can reduce noise. Without this explicit qualification, developers might act on low-confidence suggestions, leading to avoidable errors.

#### The Corollary of Confident Hallucination

High confidence scores are internal probability assessments, not external verifications of truth. Therefore, high confidence should prioritize an output for review, but never bypass validation. Relying blindly on a "99% confident" score often leads to accepting non-existent APIs or logic flaws.

### The Principle of Finite Context Window

AI models operate within a fixed cognitive boundary where new information displaces old context. Because attention is zero-sum, every token introduced into the prompt competes for the model's processing capacity. Teams must manage context not just as a technical constraint, but as a scarce economic resource, ensuring that the information density within the window is optimized to support the current objective without dilution.

**Failure Scenario:** A developer provides detailed architectural guidelines at the start of a long refactoring session. By the end, the agent has "forgotten" these rules due to context overflow and generates code that violates the initial guidelines.

#### The Corollary of Context Scarcity

Context is a finite, perishable resource. Because adding low-value information displaces high-value information, every piece of context provided to an agent must justify its consumption of the window.

#### The Corollary of Concise, High-Signal Prompts

Treat each token in the model context as valuable. Remove fluff, greetings, and irrelevant context. Place critical instructions prominently to minimize wasted tokens and reduce the chance of context overflow.

### The Principle of Compounding Contextual Error

If an AI interaction does not resolve the problem quickly, the likelihood of successful resolution drops with each additional interaction, as accumulated context and unresolved errors compound. Fast, decisive resolution is critical to prevent error propagation and cognitive overload, aligning with [B3: The Batch Size Feedback Principle](/docs/product/product-development/principles#b3-the-batch-size-feedback-principle-reducing-batch-sizes-accelerates-feedback). This compounding effect is exacerbated by [The Principle of Finite Context Window](#the-principle-of-finite-context-window), as earlier correct context may be pushed out by recent erroneous attempts.

**Failure Scenario:** A developer repeatedly prompts an AI agent to fix a bug, but each iteration introduces new minor errors and increases context complexity. After several cycles, the original issue is buried under layers of confusion, making resolution harder and increasing rework.

## The Economics of Interaction

Define how to allocate scarce resources (human attention, tokens, latency) to maximize ROI.

### The Principle of Cognitive Bandwidth Conservation

Human attention is a finite resource, and every AI output demands a "cognitive tax" for evaluation. Because verifying AI suggestions requires mental effort, low-quality or excessive outputs can quickly drain developer energy and reduce overall velocity. Workflows must prioritize high-signal outputs to conserve human bandwidth for high-value decision making, supporting [E1: The Principle of Quantified Overall Economics](/docs/product/product-development/principles#e1-the-principle-of-quantified-overall-economics-select-actions-based-on-quantified-overall-economic-impact).

**Failure Scenario:** An AI tool generates verbose, slightly incorrect code for every keystroke. The developer spends more energy correcting the AI than writing code, resulting in net-negative productivity.

### The Principle of Prompt Economics

While AI agents allow for seemingly infinite retries, every prompt carries a marginal cost in latency, financial expense, and system load. Development workflows should optimize for high-value interactions rather than brute-force iteration, treating agent capacity as a metered utility. This supports [E16: The Principle of Marginal Economics](/docs/product/product-development/principles#e16-the-principle-of-marginal-economics-always-compare-marginal-cost-and-marginal-value).

**Failure Scenario:** A developer uses a "retry loop" strategy, blindly regenerating code dozens of times hoping for a correct result, incurring high API costs and wasting time that could have been spent on a single, well-crafted prompt.

#### The Corollary of Model Selection Strategy

Use the "lowest viable intelligence" for the task. Do not use a reasoning-heavy, expensive model (e.g., O1, Opus) for text formatting or simple distinct tasks. Match the model's cost and latency profile to the complexity of the prompt to optimize the marginal economics of the workflow.

## The Architecture of Flow

Define how to integrate AI into the development cycle to accelerate delivery and maintain flow.

### The Principle of Immediate AI Feedback Loop

Integrate AI tools directly into the coding environment to deliver instant suggestions and error checking, minimizing context switching and delays. This maximizes value-added time and aligns with [B3: The Batch Size Feedback Principle](/docs/product/product-development/principles#b3-the-batch-size-feedback-principle-reducing-batch-sizes-accelerates-feedback).

**Failure Scenario:** A team uses an AI code completion tool with a 5-second delay. Developers either wait (breaking flow) or ignore the tool, resulting in inconsistent adoption and wasted potential.

### The Principle of Small-Experiment Automation

Use AI agents to break down large tasks into small, verifiable experiments (e.g., auto-generated unit tests, code variations), reducing risk and enabling fast feedback. This applies [V7: The Principle of Small Experiments](/docs/product/product-development/principles#v7-the-principle-of-small-experiments-many-small-experiments-produce-less-variation-than-one-big-one).

**Failure Scenario:** An AI generates a massive, brittle test suite. Maintenance overhead grows, slowing development and negating the benefits of automation.

### The Principle of Compounding Context

AI workflows must be designed as interconnected layers where the output of one agent automatically persists into a shared memory layer to become the context for downstream agents. This ensures that intelligence accumulates over time rather than resetting after every task, reducing the transaction cost of information transfer and minimizing rework. This aligns with [E1: The Principle of Quantified Overall Economics](/docs/product/product-development/principles#e1-the-principle-of-quantified-overall-economics-select-actions-based-on-quantified-overall-economic-impact) by preserving value generated in earlier stages.

**Failure Scenario:** A team uses AI to architect a new feature and agrees on specific constraints. However, because this decision isn't stored in a shared memory layer, the AI agent responsible for writing the code is unaware of the constraints. It generates code that works but violates the architecture, forcing the human to manually refactor it.

#### The Corollary of Artifact Persistence

AI outputs should be persisted as durable artifacts (docs, code, tickets) rather than ephemeral chat logs. When we treat AI interactions as artifact generation steps, we build a compounding asset rather than losing value in transient chats.

#### The Corollary of Contextual Readiness

AI agents cannot leverage knowledge that exists solely in human minds or ephemeral channels. Organizations accumulate "contextual debt" when decisions, workflows, and logic are not documented. To maximize agentic return, teams must shift from oral culture to written culture, ensuring that the organization's knowledge base is structured and accessible enough to serve as the "ground truth" for agentic ingestion.

#### The Corollary of Tiered Memory Lifecycle

Context must be managed across distinct tiers based on persistence and utility: History (immutable source of truth), Memory (structured/indexed for retrieval), and Scratchpad (ephemeral reasoning workspace). Data should flow dynamically between these tiers—scratchpads are pruned after tasks, while high-value insights are promoted to persistent memory.

### The Principle of Orchestrated Agent Parallelism

Agent parallelism is most effective when the critical path is clearly defined and agents are orchestrated to work on independent, non-overlapping tasks. This maximizes throughput and minimizes bottlenecks, following [D10. The Main Effort Principle](/docs/product/product-development/principles#d10-the-main-effort-principle-designate-a-main-effort-and-subordinate-other-activities).

**Failure Scenario:** Agents are assigned tasks without regard to the critical path, resulting in duplicated effort, idle time, and delayed delivery.

#### The Corollary of Critical Path Conflict

Assigning multiple agents to work simultaneously on the same critical path increases the risk of conflict, redundant work, and integration errors. Effective orchestration requires that only one agent (or a tightly coordinated group) operates on the critical path at any time.

### The Principle of Universal Context Abstraction

Context sources are heterogeneous (databases, user uploads, API responses, tool outputs), but agents require a unified interface to reason effectively. By abstracting all context artifacts into a standardized, hierarchical namespace (similar to a file system), we decouple the reasoning logic from the storage mechanism. This enables agents to treat memory, tools, and human inputs uniformly, ensuring composability and reducing integration complexity.

**Failure Scenario**: A developer writes custom integration code for every new data source (SQL, vector DB, API). The agent struggles to correlate information across these silos, leading to "context rot" where valid information becomes inaccessible or stale due to fragmented architecture.

## The Protocol of Communication

Define the skills and methods required for the human operator to extract value from the machine.

### The Principle of Explicit Intent

Ambiguity is the primary source of failure in probabilistic systems. To ensure reliability, instructions must explicitly define not just the goal, but the constraints, scope, and structure of the desired output. By constraining the solution space through precise intent—defining exactly what is wanted and how it should be presented—we minimize the need for the model to guess, transforming open-ended generation into deterministic execution.

**Failure Scenario:** A developer asks "Improve this copy" without defining audience or length. The agent returns a generic rewrite that misses the desired tone and distribution channel, causing wasted review cycles.

#### The Corollary of Task Atomicity

Design prompts to express a single intent per interaction. Break complex workflows into explicit, chained steps (analyze → propose → implement → verify). Atomic prompts reduce compounding errors and simplify validation.

#### The Corollary of Instruction Polarity

Prefer positive, prescriptive instructions ("Do X") over negative constraints ("Don't do Y"). Positive instructions reduce misinterpretation by the model and lower verification costs for the reviewer.

#### The Corollary of Format Enforcement

Force strict output formats (JSON schema, markdown sections, tables) and include 1–3 few-shot examples when the structure matters. Examples and strict schemas make downstream automation and parsing deterministic and reduce rework caused by ambiguous structure.

#### The Corollary of Specification Hazard

In the principal-agent relationship with AI, the prompt functions as an incomplete contract. Because the agent's objective function is opaque ("black box"), any ambiguity in the prompt creates a "specification hazard"—the risk that the agent will fulfill the letter of the request while violating the unstated spirit or constraints. We mitigate this by treating prompts not as casual conversation, but as rigorous specifications that explicitly define boundaries to close the contract loopholes.

### The Principle of Theory of Mind in Human-AI Collaboration

Developers who actively practice perspective-taking—inferring the AI's capabilities, limitations, and processing patterns—achieve superior collaborative performance with AI agents. This social-cognitive skill is distinct from individual technical ability and must be deliberately developed through practice. Effective AI collaboration requires understanding what the AI "knows," anticipating its potential misunderstandings, and framing requests that align with how the AI processes information. This principle supports [FF8: The Fast-Learning Principle](/docs/product/product-development/principles#ff8-the-fast-learning-principle-use-fast-feedback-to-make-learning-faster-and-more-efficient) by accelerating the developer's ability to work synergistically with AI tools.

**Failure Scenario:** A skilled developer treats AI like a deterministic search engine, providing minimal context and expecting precise results. When the AI produces irrelevant outputs, the developer blames the tool rather than recognizing they failed to model the AI's need for disambiguation, leading to frustration and abandonment of the tool.

#### The Corollary of Collaborative Ability Distinction

Individual problem-solving ability and collaborative AI ability are separate competencies. Technical expertise alone does not guarantee effective AI-augmented productivity; developers must invest in developing AI collaboration as a distinct skill set.

#### The Corollary of Proficiency Through Frequency

AI collaboration is a tacit skill developed through repetition, not just theory. Teams must practice frequent, low-stakes interactions (micro-tasks) to calibrate their understanding of the model's behavior. High-frequency usage creates the feedback loops necessary to internalize the "Theory of Mind" required for high-stakes, complex orchestration.

### The Principle of Dynamic Adaptation

Effective AI collaboration requires real-time adjustment of communication strategies, context provision, and verification approaches based on ongoing interaction patterns—not reliance on static prompt templates. Moment-to-moment fluctuations in how developers frame problems and provide context directly influence AI response quality. Developers must develop adaptive, context-sensitive collaboration skills that respond dynamically to the specific problem and AI state, treating each interaction as a feedback loop. This principle operationalizes [B3: The Batch Size Feedback Principle](/docs/product/product-development/principles#b3-the-batch-size-feedback-principle-reducing-batch-sizes-accelerates-feedback) by emphasizing continuous micro-adjustments over rigid workflows.

**Failure Scenario:** A developer creates a library of "perfect prompts" and mechanically reuses them across contexts. When the prompts fail, they conclude the AI is unreliable rather than recognizing that effective collaboration requires adapting their communication to the specific task, accumulated context, and current interaction quality.

## The Governance of Agency

Define safety and authority boundaries to prevent catastrophic failures.

### The Principle of Delegated Agency Scaling

Autonomy is not a binary setting but a variable slider dependent on verification capability. We scale AI agency in proportion to our ability to automatically validate the output. Low-risk or easily verifiable tasks allow for high autonomy; high-risk or subjective tasks require restricted agency (consultant mode). You cannot delegate authority where you cannot automate accountability.

**Failure Scenario:** Delegating complex build optimization to AI leads to short-term gains but introduces critical errors, increasing rework and risk.

#### The Corollary of Automated Guardrail Prerequisite

Before granting full autonomy to AI agents for a task, ensure robust automated safety nets (CI/CD, test suites) are in place. Automation must be checked by automation to prevent catastrophic failures.

### The Principle of Human-in-the-Loop Veto

Every AI-generated output must pass final review by a domain expert who retains full accountability. AI accelerates delivery but introduces risk; human oversight ensures quality and prevents costly errors, supporting [E1: The Principle of Quantified Overall Economics](/docs/product/product-development/principles#e1-the-principle-of-quantified-overall-economics-select-actions-based-on-quantified-overall-economic-impact).

**Failure Scenario:** An AI-generated database query is deployed without review, causing performance issues and technical debt.

#### The Corollary of Contextual Provenance

Every interaction and context artifact must be logged as a verifiable transaction with lineage metadata (who created it, when, and from what source). Ideally, the system should allow for the reconstruction of the exact context state that led to a specific decision, ensuring accountability and easing debugging

### The Principle of Layered Autonomy

Establish tiered governance: Company sets strategic safety and cost policies, Team defines tactical goals and quality metrics, Developer retains autonomy over tool selection and workflows. This decentralizes optimization while maintaining compliance and security.

**Failure Scenario:** Mandating a single AI tool for all teams blocks specialized workflows, increasing risk and cycle time for critical tasks.

---

_These principles are evolving. For foundational reasoning, see [Product Development Principles](/docs/product/product-development/principles)._
