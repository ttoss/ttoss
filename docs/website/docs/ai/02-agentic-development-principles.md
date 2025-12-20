---
title: Agentic Development Principles
---

import TOCInline from '@theme/TOCInline';

:::caution Work in Progress
This document is under development. Principles will be refined and expanded as validated.
:::

_Agentic development means intentionally designing workflows, feedback loops, and decision boundaries to maximize the value of AI agents as development partners._

This section defines principles for integrating AI agents into product development workflows, building on [The Principles of Product Development Flow](/docs/product/product-development/principles) and focusing on effective human-AI collaboration.

## What is a Principle?

A **Principle** is a fundamental truth or proposition that serves as the foundation for a chain of reasoning. It is not a "best practice" or a "suggestion." It is a description of the underlying physics and economics of Human-AI interaction.

Principles are immutable constraints. You cannot "break" them; you can only break yourself against them. Whether you acknowledge gravity or not, it will still pull you down. Similarly, whether you acknowledge [The Principle of Pattern Inertia](#the-principle-of-pattern-inertia) or not, your AI agents will still degrade your codebase if you feed them technical debt.

We define these principles to help us:

1. Predict where workflows will fail before they do.
2. Design systems that work with the grain of the technology, rather than against it.
3. Govern the delegation of autonomy based on structural realities rather than wishful thinking.

### Principles Structure

This document groups principles into categories that define the physics, economics, architecture, communication protocols, and governance structures required to maximize the value of AI agents.

Each principle includes:

- **The Principle**: The fundamental rule.
- **Failure Scenarios**: Common pitfalls illustrating what happens when the principle is ignored.
- **Corollaries**: Specific elaborations or sub-rules derived from the main principle.

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

### The Principle of Structural Determinism

Probabilistic systems can only be made deterministic through structural enforcement, not semantic persuasion. In traditional software engineering, the developer's primary role is to write deterministic logic that explicitly defines the system's behavior. In Applied AI, the model generates behavior probabilistically (see [The Principle of Probabilistic AI Output](#the-principle-of-probabilistic-ai-output)). Therefore, the developer's role shifts from writing the flow to architecting the boundaries—constructing rigid constraints (schemas, validators, type-checks) that force a non-deterministic model to collapse into a reliable, deterministic outcome.

**Failure Scenario:** A developer writes a prompt asking an agent to "extract the user's age and ensure it is a valid number between 18 and 100." When the model occasionally returns "eighteen" or "N/A," the developer adds more capital letters to the prompt ("MUST BE AN INTEGER"). The flakiness persists because the developer is attempting to solve a structural constraint problem with semantic persuasion.

#### The Corollary of Schema Supremacy

If a constraint can be defined mathematically or programmatically (e.g., Regex, JSON Schema, TypeScript interfaces), it must be removed from the prompt and enforced by the code. You do not ask the model to "be careful" with data types; you force it to fail if it creates the wrong one.

#### The Corollary of The Probabilistic Funnel

System design must act as a funnel where the "wide" creative potential of the LLM is progressively narrowed by hard constraints. The closer the data gets to a database or user interface, the stricter the non-AI constraints must become to filter out probabilistic noise.

_Read more about this principle in [From Scripter to Architect in the Age of AI](/blog/2025/12/17/from-scripter-to-architect)._

### The Principle of Finite Context Window

AI models operate within a fixed cognitive boundary where new information displaces old context. Because attention is zero-sum, every token introduced into the prompt competes for the model's processing capacity. Teams must manage context not just as a technical constraint, but as a scarce economic resource, ensuring that the information density within the window is optimized to support the current objective without dilution.

**Failure Scenario:** A developer provides detailed architectural guidelines at the start of a long refactoring session. By the end, the agent has "forgotten" these rules due to context overflow and generates code that violates the initial guidelines.

#### The Corollary of Context Scarcity

Context is a finite, perishable resource. Because adding low-value information displaces high-value information, every piece of context provided to an agent must justify its consumption of the window.

#### The Corollary of Concise, High-Signal Prompts

Treat each token in the model context as valuable. Remove fluff, greetings, and irrelevant context. Place critical instructions prominently to minimize wasted tokens and reduce the chance of context overflow.

#### The Corollary of Compounding Contextual Error

If an AI interaction does not resolve the problem quickly, the likelihood of successful resolution drops with each additional interaction, as accumulated context and unresolved errors compound. Fast, decisive resolution is critical to prevent error propagation and cognitive overload, aligning with [B3: The Batch Size Feedback Principle](/docs/product/product-development/principles#b3-the-batch-size-feedback-principle-reducing-batch-sizes-accelerates-feedback). This compounding effect is exacerbated by [The Principle of Finite Context Window](#the-principle-of-finite-context-window), as earlier correct context may be pushed out by recent erroneous attempts.

**Failure Scenario:** A developer repeatedly prompts an AI agent to fix a bug, but each iteration introduces new minor errors and increases context complexity. After several cycles, the original issue is buried under layers of confusion, making resolution harder and increasing rework.

### The Principle of Pattern Inertia

AI models function as statistical pattern matchers that prioritize local consistency with the provided context over global correctness. Just as an object in motion stays in motion, an AI agent interacting with a codebase will inherently perpetuate the existing momentum of that codebase. The probability of an agent generating "clean" code is inversely proportional to the volume of technical debt present in its context window.

**Failure Scenario:** A developer asks an AI to fix a bug in a legacy "God Class" file that contains 2,000 lines of nested logic. To maximize the statistical probability of the output "fitting in," the AI generates a fix that introduces a 15th nested conditional and uses inconsistent variable naming found elsewhere in the file, effectively hardening the technical debt.

#### The Corollary of Contextual Hygiene

Because AI amplifies existing patterns, the cleanliness of the input context (the code currently in the buffer) determines the quality of the output. Before asking an agent to extend a module, the operator must first ensure the immediate context represents the desired standard, or the agent will scale the dysfunction.

### The Principle of Distributed Unreliability

Any system composed of AI agents is inherently composed of unreliable components. Models hallucinate, timeout, crash, and produce inconsistent outputs. Unlike traditional distributed systems where failures are exceptional, in agentic systems, partial failure is the baseline expectation. This fundamental unreliability means that system design must treat every agent action as potentially failed until proven otherwise, and global state must be protected from corruption by incomplete or erroneous agent operations.

**Failure Scenario:** An orchestration layer retries a "Process Payment" task because the agent timed out. Because the action wasn't treated as inherently unreliable and isolated from global state, the first (timed-out) attempt actually succeeded in the background. The retry processes it again, charging the customer twice and corrupting the ledger.

#### The Corollary of Atomic State Isolation

To prevent total system corruption from partial failure, agent actions must be treated as atomic units that are isolated from the global state until confirmed. This ensures that a failed or retried action does not leave the system in an inconsistent "zombie" state.

## The Economics of Interaction

Every human-AI exchange costs something: attention, latency, tokens, or compute. Treat these as scarce resources and allocate them ruthlessly for maximum ROI. Waste them on low-value cycles and your whole workflow grinds to a halt.

### The Principle of Prompt Economics

While AI agents allow for seemingly infinite retries, every prompt carries a marginal cost in latency, financial expense, and system load. Development workflows should optimize for high-value interactions rather than brute-force iteration, treating agent capacity as a metered utility. This supports [E16: The Principle of Marginal Economics](/docs/product/product-development/principles#e16-the-principle-of-marginal-economics-always-compare-marginal-cost-and-marginal-value).

**Failure Scenario:** A developer uses a "retry loop" strategy, blindly regenerating code dozens of times hoping for a correct result, incurring high API costs and wasting time that could have been spent on a single, well-crafted prompt.

### The Principle of Allocative Efficiency

Compute resources must be allocated where they yield the highest marginal return per unit of cost and latency. It is economically inefficient to utilize high-intelligence, high-latency models for low-entropy tasks (formatting, classification). To maximize the economic throughput of the system, the "intelligence cost" of the model must match the "complexity value" of the task.

**Failure Scenario:** A system routes every user interaction—including simple "hello" messages—to a reasoning-heavy model (e.g., o1 or Opus). The system incurs massive latency and financial costs for interactions that required zero reasoning, depleting the budget for tasks that actually need high intelligence.

### The Principle of Zero-Cost Erosion

In manual development, the cognitive effort (friction) required to write complex, tangled code serves as a natural feedback signal that suggests refactoring is necessary. AI reduces the marginal cost of code generation to near-zero, effectively removing this pain signal. When the cost of "patching" (adding complexity) drops below the cost of "refactoring" (reducing complexity), the system inevitably trends toward entropy unless friction is artificially reintroduced via governance.

**Failure Scenario:** A developer needs to handle a new edge case. Manually, writing the necessary boilerplate would take 30 minutes, prompting them to refactor the architecture. With AI, generating a "good enough" patch takes 10 seconds. The developer applies the patch. Repeated 50 times, this leads to a system that is functional but unmaintainable, created without the developer ever feeling the "pain" of the debt they accrued.

## The Architecture of Flow

Define how to integrate AI into the development cycle to accelerate delivery and maintain flow.

### The Principle of Compounding Context

AI workflows must be designed as interconnected layers where the output of one agent automatically persists into a shared memory layer to become the context for downstream agents. This ensures that intelligence accumulates over time rather than resetting after every task, reducing the transaction cost of information transfer and minimizing rework. This aligns with [E1: The Principle of Quantified Overall Economics](/docs/product/product-development/principles#e1-the-principle-of-quantified-overall-economics-select-actions-based-on-quantified-overall-economic-impact) by preserving value generated in earlier stages.

**Failure Scenario:** A team uses AI to architect a new feature and agrees on specific constraints. However, because this decision isn't stored in a shared memory layer, the AI agent responsible for writing the code is unaware of the constraints. It generates code that works but violates the architecture, forcing the human to manually refactor it.

#### The Corollary of Artifact Persistence

AI outputs should be persisted as durable artifacts (docs, code, tickets) rather than ephemeral chat logs. When we treat AI interactions as artifact generation steps, we build a compounding asset rather than losing value in transient chats.

#### The Corollary of Contextual Readiness

AI agents cannot leverage knowledge that exists solely in human minds or ephemeral channels. Organizations accumulate "contextual debt" when decisions, workflows, and logic are not documented. To maximize agentic return, teams must shift from oral culture to written culture, ensuring that the organization's knowledge base is structured and accessible enough to serve as the "ground truth" for agentic ingestion.

#### The Corollary of Tiered Memory Lifecycle

Context must be managed across distinct tiers based on persistence and utility: History (immutable source of truth), Memory (structured/indexed for retrieval), and Scratchpad (ephemeral reasoning workspace). Data should flow dynamically between these tiers—scratchpads are pruned after tasks, while high-value insights are promoted to persistent memory.

### The Principle of Context Heterogeneity

Context sources are inherently heterogeneous—databases, user uploads, API responses, tool outputs, and human messages all represent information in fundamentally different formats and structures. This heterogeneity is not a design flaw to be fixed but a physical property of information systems. Because agents require unified interfaces to reason effectively, the friction between heterogeneous sources and uniform consumption is an immutable cost that must be managed through abstraction.

**Failure Scenario:** A developer writes custom integration code for every new data source (SQL, vector DB, API). The agent struggles to correlate information across these silos, leading to "context rot" where valid information becomes inaccessible or stale due to fragmented architecture.

#### The Corollary of Universal Abstraction

By abstracting all context artifacts into a standardized, hierarchical namespace (similar to a file system), we decouple the reasoning logic from the storage mechanism. This enables agents to treat memory, tools, and human inputs uniformly, ensuring composability and reducing integration complexity.

### The Principle of Syntactic-Semantic Decoupling

In traditional human coding, "messy" code (bad formatting, typos) often serves as a proxy for "broken" logic. With LLMs, syntactic correctness and semantic validity are statistically independent. An agent can produce code that is syntactically perfect—adhering to linters, using descriptive variable names, and following style guides—while being architecturally destructive or logically unsound. The visual quality of the code is no longer a reliable indicator of its "substance" (functional quality).

**Failure Scenario:** A senior engineer reviews a Pull Request generated by an agent. The code looks professional, passes the linter, and has excellent comments. Trusting the visual, the engineer merges it. They fail to notice that the agent implemented a clean-looking function that subtly bypasses a critical security check defined in a different layer of the application.

#### The Corollary of Agentic Single Responsibility

Just as in software engineering, AI agents maximize reliability when scoped to a single, atomic objective. Increasing the breadth of an agent's mandate exponentially increases the probability of "attention drift," where the model prioritizes one instruction at the expense of another. Complex workflows should be composed of chained, specialized agents—each with a distinct definition of done—rather than a single generalist entity attempting to juggle multiple distinct context streams. This minimizes [The Corollary of Compounding Contextual Error](#the-corollary-of-compounding-contextual-error).

**Failure Scenario:** A team creates a "Release Manager" agent instructed to "check git status, run tests, update version numbers, and write the changelog." The agent successfully writes the changelog but hallucinates test results because the test output context was pushed out of its active attention span by the verbose git logs.

#### The Corollary of Modular Composability

Agents should be designed as composable modules with strict input/output interfaces (schemas). This allows individual "cognitive modules" (e.g., a "SQL Query Writer") to be swapped, upgraded, or debugged independently without breaking the broader orchestration flow.

### The Principle of Tool Atomicity and Efficiency

AI agents extend beyond pure reasoning into action primarily through tools (function calls, APIs, retrieval systems, external executors). Tools represent the bridge between probabilistic generation and real-world effects, but poorly designed tools amplify unreliability, bloat context, encourage inefficient loops, and create new failure modes.

Without explicit governance of tools, agents devolve into unreliable "prompt chains" rather than robust systems.

**Failure Scenario:** An agent receives dozens of overlapping or verbose tools (e.g., separate "search_web", "search_news", "search_academic"). It wastes cycles debating which to use, returns excessively long results that overflow context, or hallucinates tool parameters — leading to repeated failures, high latency/cost, and eventual loss of trust.

#### The Corollary of Tool Minimalism

Fewer, more atomic tools outperform bloated toolsets. Aim for <10 high-utility tools per agent, each with clear, non-overlapping scope and minimal parameters. More tools increase decision overhead and error surface area exponentially.

#### The Corollary of Token-Efficient Tool Design

Tool outputs must be concise and structured (e.g., return summarized JSON, not raw HTML dumps). Verbose tool responses compete with critical context (violating [The Principle Finite Context Window](#the-principle-of-finite-context-window)) and encourage the agent to "wander."

#### The Corollary of Tool-as-Contract

Treat tool definitions as strict interfaces: precise schemas, idempotency where possible, and built-in validation. This shifts reliability from probabilistic prompt persuasion to structural enforcement (aligning with [The Principle of Structural Determinism](#the-principle-of-structural-determinism)).

#### The Corollary of Retrieval as First-Class Tool

For knowledge-heavy tasks, Retrieval-Augmented Generation (RAG) — dynamic, just-in-time retrieval — isn't optional; it's the primary mitigation for hallucinations and context scarcity. Static context loading fails at scale; agents must learn to retrieve relevant facts on-demand.

## The Protocol of Communication

This section defines how humans and AI agents should exchange information—through prompts, feedback, and constraints—to reduce ambiguity, control hallucinations, and keep work aligned with our product development principles.

### The Principle of Signal Entropy

In a probabilistic system, ambiguity is not neutral; it is noise. Unlike a human collaborator, an AI agent lacks "grounding"—the shared biological, social, and historical context that allows humans to infer meaning from incomplete data. Therefore, any information not explicitly transmitted in the signal (the prompt) is subject to entropy, degrading into randomness or hallucination. Effective protocol requires forcibly increasing the signal-to-noise ratio to overcome the physics of the channel.

**Failure Scenario:** A developer tells an agent to "refactor this function to be cleaner." Because "cleaner" is semantically ambiguous and the agent lacks the team's shared definition of "clean code," it removes essential error handling logic, treating it as "clutter."

#### The Corollary of Dynamic Adaptation

Effective AI collaboration requires real-time adjustment of communication strategies, context provision, and verification approaches based on ongoing interaction patterns—not reliance on static prompt templates. Moment-to-moment fluctuations in how developers frame problems and provide context directly influence AI response quality. Developers must develop adaptive, context-sensitive collaboration skills that respond dynamically to the specific problem and AI state, treating each interaction as a feedback loop. This corollary operationalizes [B3: The Batch Size Feedback Principle](/docs/product/product-development/principles#b3-the-batch-size-feedback-principle-reducing-batch-sizes-accelerates-feedback) by emphasizing continuous micro-adjustments over rigid workflows.

**Failure Scenario:** A developer creates a library of "perfect prompts" and mechanically reuses them across contexts. When the prompts fail, they conclude the AI is unreliable rather than recognizing that effective collaboration requires adapting their communication to the specific task, accumulated context, and current interaction quality.

## The Governance of Agency

Humans must explicitly define the scope, authority, escalation paths, and risk boundaries for every agent. No agent can safely or reliably determine its own limits. Without a clear, written constitution of delegation, agentic systems drift into misalignment, overreach, or collapse.

### The Principle of Delegated Agency Scaling

Autonomy is not a binary setting but a variable slider dependent on verification capability. We scale AI agency in proportion to our ability to automatically validate the output. Low-risk or easily verifiable tasks allow for high autonomy; high-risk or subjective tasks require restricted agency (consultant mode). You cannot delegate authority where you cannot automate accountability.

**Failure Scenario:** Delegating complex build optimization to AI leads to short-term gains but introduces critical errors, increasing rework and risk.

#### The Corollary of Automated Guardrail Prerequisite

Before granting full autonomy to AI agents for a task, ensure robust automated safety nets (CI/CD, test suites) are in place. Automation must be checked by automation to prevent catastrophic failures.

#### The Corollary of Trust-Gated Orchestration

The velocity and scale of agent orchestration are strictly limited by the "Trust Latency" of the human operator. If a human must verify every intermediate "real task" within a workflow, the system degrades from an autonomous fleet into a synchronous, manual approval queue. True orchestration is only possible when the cost of verification is significantly lower than the cost of execution. Therefore, trust—built on robust provenance and observability—is not a sentiment, but a functional requirement for scaling.

**Failure Scenario:** A manager deploys a team of five agents to optimize marketing campaigns but requires manual approval for every keyword selection and ad copy variant. The "orchestration" becomes a bottleneck where the manager spends more time reviewing low-stakes decisions than if they had done the work themselves, stalling the entire workflow.

### The Principle of Asymmetric Risk

The economics of automation are governed by convexity: the cost of verification is often linear (time spent reviewing), but the cost of failure can be non-linear (catastrophic data loss, security breaches). Agency must be capped not by the capability of the model, but by the bounds of the downside risk. When the "blast radius" of an error is infinite (e.g., production database access), autonomy must be zero, regardless of the model's intelligence.

**Failure Scenario:** An autonomous agent is given write access to the production environment to "fix a small bug." It hallucinates a command that drops a critical table. The $5 saved in developer time results in a \$500,000 outage.

### The Principle of Contextual Authority

An AI agent's effective capability is capped by the operator's ownership and mental model of the system. In systems where the operator possesses deep knowledge ("Ownership"), AI acts as an extension of will, amplifying intent. In systems where the operator lacks deep knowledge ("Contracting"), AI acts as a shield against complexity, hiding necessary implementation details. You cannot effectively delegate authority to an agent if you cannot predict the side effects of its output.

**Failure Scenario:** A contractor uses an AI agent to close a ticket in a legacy codebase they do not understand. The AI suggests a solution that works perfectly in isolation but relies on an internal API scheduled for deprecation. Because the operator lacks the Contextual Authority to know the API history, they accept the solution, solving the ticket today but creating a guaranteed failure for the next release.

## The Symbiosis of Human-AI Agency

AI scales volume and speed. Humans supply curation, contextual judgment, disruption and final "yes/no". The moment either side tries to do the other side’s job the whole system becomes slower, dumber and more expensive.

This group collects the principles that force clean, complementary division of labor so the hybrid becomes dramatically stronger than either human-alone or AI-alone.

### The Principle of Role Elevation in Human-AI Hybridization

AI agents excel at high-volume generation of commodity outputs and automatable tasks, while humans retain irreplaceable advantages in contextual judgment, curation, and directional decision-making. Effective agentic systems require deliberate elevation of human roles to these higher-order functions, treating AI as an amplifier that handles routine execution and allows humans to focus on refinement, integration, and novelty introduction.

**Failure Scenario:** Developers or teams resist reallocating responsibilities, insisting on retaining direct control over tasks that AI performs more efficiently (e.g., boilerplate generation or routine refactoring). This leads to diminished overall throughput, persistent bottlenecks in low-value work, and failure to capitalize on AI's scaling advantages, ultimately rendering the workflow less competitive as standards rise with widespread AI adoption.

#### The Corollary of Curation Premium

As AI drives the marginal cost of generation toward zero, the relative value of human curation—selecting, pruning, and rejecting suboptimal outputs—dramatically increases. Agentic workflows must explicitly design feedback loops that position humans as curators rather than primary generators, preserving cognitive bandwidth for high-signal interventions.

#### The Corollary of Collaborative Amplification

Human-AI interaction thrives in a "jam session" model: AI provides versatile, rapid ideation and execution across domains, while humans contribute specialized direction and structural integrity. Resistance to this interdependent dynamic stifles emergent creativity and multidisciplinary integration, limiting agentic systems to mechanical replication rather than amplified innovation.

### The Principle of Emergent Insight Constraint

AI systems, trained on historical data distributions, excel at interpolation and optimization within known bounds but are epistemically constrained from generating truly novel, discontinuous insights without human-mediated disruption. This principle enforces the immutable reality that machine intelligence is derivative, not originative—product development must hybridize AI's efficiency with human serendipity to avoid convergent stagnation.

**Failure Scenarios:** Homogenized Innovation Cycles: agents iteratively refine features within a narrow solution space, yielding incremental tweaks (e.g., UI polish) that masquerade as progress but fail to disrupt markets, as seen in AI-generated apps that echo incumbents without differentiation.

#### The Corollary of Catalyst Injection Protocol

Embed mandatory human "disruption gates" at iteration milestones (e.g., every 10 cycles), injecting contrarian prompts derived from user ethnography, cross-domain analogies, or failure autopsies to prime emergent reasoning.

### The Principle of Verification Asymmetry

The cost of generating AI output is orders of magnitude lower than the cost of verifying it. This asymmetry inverts traditional productivity assumptions—teams can generate unlimited artifacts but remain bottlenecked by human verification capacity. Because validation requires domain expertise, attention, and time that cannot be parallelized, the throughput of an agentic system is bounded not by generation speed but by verification bandwidth. This supports [E1: The Principle of Quantified Overall Economics](/docs/product/product-development/principles#e1-the-principle-of-quantified-overall-economics-select-actions-based-on-quantified-overall-economic-impact) by forcing teams to account for total cost-of-ownership.

**Failure Scenario:** A team deploys AI agents to generate 50 pull requests per day, believing they've 10x'd productivity. However, each PR requires 30 minutes of careful review to catch subtle semantic errors (per [The Principle of Syntactic-Semantic Decoupling](#the-principle-of-syntactic-semantic-decoupling)). The review queue grows exponentially, engineers spend 100% of their time reviewing AI output rather than building, and net velocity decreases.

#### The Corollary of Verification Investment

Every dollar saved on AI-assisted generation must be matched by investment in automated verification infrastructure (tests, linters, type systems, CI pipelines). The ROI of agentic workflows is determined not by generation capability but by verification scalability. Teams that invest only in generation create an illusion of productivity while accumulating review debt.

#### The Corollary of Review Debt

Unreviewed AI output accumulates as hidden liability—it looks like progress but carries unknown risk. Unlike technical debt (which is visible in code complexity), review debt is invisible until failure. A backlog of "AI-generated but not verified" artifacts represents not value, but deferred risk with compounding interest.

### The Principle of Cognitive Bandwidth Conservation

Human attention is a finite resource, and every AI output demands a "cognitive tax" for evaluation. Because verifying AI suggestions requires mental effort, low-quality or excessive outputs can quickly drain developer energy and reduce overall velocity. Workflows must prioritize high-signal outputs to conserve human bandwidth for high-value decision making, supporting [E1: The Principle of Quantified Overall Economics](/docs/product/product-development/principles#e1-the-principle-of-quantified-overall-economics-select-actions-based-on-quantified-overall-economic-impact).

**Failure Scenario:** An AI tool generates verbose, slightly incorrect code for every keystroke. The developer spends more energy correcting the AI than writing code, resulting in net-negative productivity.

---

_These principles are evolving. For implementation strategies, see [Agentic Design Patterns](/docs/ai/agentic-design-patterns). For foundational reasoning, see [Product Development Principles](/docs/product/product-development/principles)._
