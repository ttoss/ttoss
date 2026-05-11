---
title: Economics of Interaction
sidebar_position: 3
---

## The Economics of Interaction

Every human-AI exchange costs something: attention, latency, tokens, or compute. Treat these as scarce resources and allocate them ruthlessly for maximum ROI. Waste them on low-value cycles and your whole workflow grinds to a halt.

### The Principle of Prompt Economics

While AI agents allow for seemingly infinite retries, every prompt carries a marginal cost in latency, financial expense, and system load. Development workflows should optimize for high-value interactions rather than brute-force iteration, treating agent capacity as a metered utility. This supports [E16: The Principle of Marginal Economics](/docs/product/product-development/principles#e16-the-principle-of-marginal-economics-always-compare-marginal-cost-and-marginal-value). It is a direct response to [The Principle of Finite Context Window](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-finite-context-window) and [The Principle of Cognitive Bandwidth Conservation](/docs/ai/agentic-development-principles/symbiosis-of-human-ai-agency#the-principle-of-cognitive-bandwidth-conservation).

**Failure Scenario:** A developer uses a "retry loop" strategy, blindly regenerating code dozens of times hoping for a correct result, incurring high API costs and wasting time that could have been spent on a single, well-crafted prompt.

### The Principle of Allocative Efficiency

Compute resources must be allocated where they yield the highest marginal return per unit of cost and latency. It is economically inefficient to utilize high-intelligence, high-latency models for low-entropy tasks (formatting, classification). To maximize the economic throughput of the system, the "intelligence cost" of the model must match the "complexity value" of the task.

This is the economic counterpart of [The Principle of Problem Structure Allocation](/docs/ai/agentic-development-principles/foundations-of-hybrid-allocation#the-principle-of-problem-structure-allocation): as a task becomes more well-structured and repeatable, the economically optimal solution shifts toward cheaper, more deterministic execution.

**Failure Scenario:** A system routes every user interaction—including simple "hello" messages—to a reasoning-heavy model (e.g., o1 or Opus). The system incurs massive latency and financial costs for interactions that required zero reasoning, depleting the budget for tasks that actually need high intelligence.

#### The Corollary of Model Specialization

General-purpose models pay a "generalization tax" in latency, cost, and output variance because they carry capability you are not using for a narrow task. For critical, high-volume, repeatable tasks (e.g., query formulation, entity extraction, classification), specialized models (or constrained decoding + fine-tuning) often provide more infrastructure-grade economics than a single large general model.

This corollary is strongest when the task is well-structured and stable over time (see [The Principle of Problem Structure Allocation](/docs/ai/agentic-development-principles/foundations-of-hybrid-allocation#the-principle-of-problem-structure-allocation)) and when the marginal savings exceed the ongoing maintenance cost (see [E16: The Principle of Marginal Economics](/docs/product/product-development/principles#e16-the-principle-of-marginal-economics-always-compare-marginal-cost-and-marginal-value)).

**Failure Scenario:** A product relies on a single massive general-purpose LLM for a high-throughput, time-sensitive task (e.g., real-time query rewriting). Latency and compute cost become a system bottleneck. The team misses a simpler routing strategy (smaller model + deterministic constraints) that would have met the quality bar at lower marginal cost.

#### The Corollary of the Generalization Tax

Every unit of model capacity that does not contribute to the task is a recurring tax on latency and cost. Specialization reduces the tax, but it introduces its own fixed costs (data, evaluation, deployment, drift monitoring) that must be justified economically.

_Read more about this principle in [NEMO-4-PAYPAL: Leveraging NVIDIA's Nemo Framework for empowering PayPal's Commerce Agent](https://arxiv.org/abs/2512.21578)._

### The Principle of Zero-Cost Erosion

In manual development, the cognitive effort (friction) required to write complex, tangled code serves as a natural feedback signal that suggests refactoring is necessary. AI reduces the marginal cost of code generation to near-zero, effectively removing this pain signal. When the cost of "patching" (adding complexity) drops below the cost of "refactoring" (reducing complexity), the system inevitably trends toward entropy unless friction is artificially reintroduced via governance. This erosion is amplified by [The Principle of Pattern Inertia](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-pattern-inertia).

**Failure Scenario:** A developer needs to handle a new edge case. Manually, writing the necessary boilerplate would take 30 minutes, prompting them to refactor the architecture. With AI, generating a "good enough" patch takes 10 seconds. The developer applies the patch. Repeated 50 times, this leads to a system that is functional but unmaintainable, created without the developer ever feeling the "pain" of the debt they accrued.

### The Principle of Cheap Generation, Expensive Commitment

AI collapses the marginal cost of producing candidate code, drafts, and partial implementations to near zero. But the cost of commitment—validation, integration, review, ownership, and long-term maintenance inside a real system—remains strictly human-bound and expensive. This asymmetry is new: before AI, generation cost and commitment cost were roughly proportional, creating a natural governor on how much work entered the system. With AI, that governor is removed. Organizations can now start far more work than they can responsibly finish, because the visible cost (generation) no longer signals the invisible cost (commitment). Therefore, the cheaper generation becomes, the stronger governance must be around what is allowed to enter execution. This principle extends [The Principle of Zero-Cost Erosion](/docs/ai/agentic-development-principles/economics-of-interaction#the-principle-of-zero-cost-erosion) from code quality to workflow economics, and interacts with [Q3: The Principle of Queueing Capacity Utilization](/docs/product/product-development/principles#q3-the-principle-of-queueing-capacity-utilization-capacity-utilization-increases-queues-exponentially) by increasing hidden WIP.

**Failure Scenario:** A CTO assigns a developer to a sensitive billing migration. During the sprint, the commercial team asks for three "quick" customer-facing adjustments. Because AI can generate each change in minutes, the developer accepts all three. The generation was cheap, but now the developer carries four open contexts requiring validation, testing, and integration. The billing migration—the highest-value task—slips, accumulates errors from fragmented attention, and loses coherence. The organization confused fast initiation with fast completion.

#### The Corollary of Cognitive Re-entry Cost

AI does not reduce the cost of resuming interrupted knowledge work. Every context switch destroys the developer's active mental model—the accumulated understanding of constraints, partial decisions, and risks required to guide and verify AI output correctly. The dominant cost of an interruption is not the time spent on the interrupting task; it is the non-linear cost of reconstructing the mental state for the original task. Because AI increases the frequency of "cheap" interruptions (via [The Principle of Cheap Generation, Expensive Commitment](/docs/ai/agentic-development-principles/economics-of-interaction#the-principle-of-cheap-generation-expensive-commitment)), it amplifies the total re-entry tax the developer pays across a workday.

**Failure Scenario:** A developer deep in a complex state machine refactor uses AI to handle a "quick" unrelated bug fix from another team. The fix takes 5 minutes. Returning to the state machine takes 40 minutes of re-reading code and reconstructing the reasoning chain. The net cost of the interruption was 45 minutes for a 5-minute task—a 9:1 ratio invisible to management.

#### The Corollary of Priority Contention

When multiple authorities can independently inject work into the same execution channel, the system stops optimizing for completion and starts optimizing for interruption response. AI worsens this because it makes every request _look_ cheap to start, lowering the social barrier for injection. The result is that more tasks begin, fewer tasks finish cleanly, and effective priority is determined by recency and social pressure rather than system economics. This directly increases hidden WIP, destabilizing throughput as predicted by [Q3: The Principle of Queueing Capacity Utilization](/docs/product/product-development/principles#q3-the-principle-of-queueing-capacity-utilization-capacity-utilization-increases-queues-exponentially).

**Failure Scenario:** The CTO sets a backend migration as the sprint goal. Sales, support, and product each inject one "small" request during the week. Each looks trivial in isolation. By Friday, the developer has five open branches, three pending reviews, and the migration is 40% complete instead of 90%—not because the developer was slow, but because the system allowed four uncoordinated priority signals to fragment execution.

#### The Corollary of Admission Control

The question is not "Can AI generate this quickly?" but "Should this enter execution now?" Every candidate task must justify not just its own value, but the commitment cost it imposes on the system: validation effort, context-switch tax on the current priority, review queue load, and maintenance tail. Without explicit admission control, cheap generation floods the execution channel with work that individually looks free but collectively bankrupts the team's capacity to finish anything well.
