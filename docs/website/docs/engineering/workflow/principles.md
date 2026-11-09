---
title: Principles
sidebar_position: 1
---

# Principles

The agentic workflow rests on three pillars. [Get Things Flowing](https://flow.ttoss.dev/docs/method/principles) (GTF) says what holds for any work: the graph is the record, the person decides, review confirms reality. The [product development principles](/docs/product/product-development/principles) say what the work is worth and why flow beats utilization. The [agentic development principles](/docs/ai/agentic-development-principles/overview) say how AI agents behave: context resets, output is probabilistic, and a proxy optimized hard enough stops tracking the goal.

The workflow's own principles below combine the three, and they are the only place the workflow cites a pillar. Every rule of the [Delivery Process](./process.md), the [parameters](./parameters.md) and the [routines](./routines.md) rests on one of them, listed under it. A rule page cites a principle only where the reason changes what an agent decides. A rule no principle reaches is a candidate for removal, and so is a principle no rule rests on.

- [The graph is the state, and a tick is a function of it](#the-graph-is-the-state-and-a-tick-is-a-function-of-it)
- [One engine, extended for any project](#one-engine-extended-for-any-project)
- [The author never verifies its own work](#the-author-never-verifies-its-own-work)
- [Autonomy is bounded by reversibility](#autonomy-is-bounded-by-reversibility)
- [A rule holds where no agent can outvote it](#a-rule-holds-where-no-agent-can-outvote-it)
- [Cost of delay orders the work, read from a proxy nobody estimates](#cost-of-delay-orders-the-work-read-from-a-proxy-nobody-estimates)
- [The release queue holds new work upstream](#the-release-queue-holds-new-work-upstream)
- [A full queue is drained, never only held](#a-full-queue-is-drained-never-only-held)
- [A choice is answered by a rule where one exists, and by a person when the work needs it](#a-choice-is-answered-by-a-rule-where-one-exists-and-by-a-person-when-the-work-needs-it)
- [No wait is open-ended](#no-wait-is-open-ended)
- [A number is Flow's answer, never an agent's estimate](#a-number-is-flows-answer-never-an-agents-estimate)
- [Every run is paid for](#every-run-is-paid-for)

## The graph is the state, and a tick is a function of it

An agent's context ends with its run, so whatever a run does not write outside its conversation is lost ([Compounding Context](/docs/ai/agentic-development-principles/architecture-of-flow#the-principle-of-compounding-context)). The workflow therefore keeps nothing in a conversation: a task's status, what holds it, the changes it references and the choices a person answered all live in the [Flow](https://flow.ttoss.dev) graph ([P1](https://flow.ttoss.dev/docs/method/principles#p1-one-source-of-truth-outside-every-head)). A handoff persists what the next run needs in fields the handoff requires, never in a message it must infer ([Seam Memory Layer](/docs/ai/agentic-development-principles/architecture-of-flow#the-corollary-of-the-seam-memory-layer)). What integrating leaves is one of those fields, which the tick acts on without reading prose. An implementer's assumptions travel in the change the task references, where its reviewer reads them ([Externalized Confusion](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-externalized-confusion)).

That state is a machine's: each [transition](./process.md#transitions) is a condition read from the graph and an act with one owner, so a tick is a function from the graph to the graph ([P5](https://flow.ttoss.dev/docs/method/principles#p5-what-to-do-next-is-computed-not-remembered)). It reads, applies every transition that came due, writes and stops, and the next tick does the same from wherever the graph is. A run that dies loses nothing, and any agent on any model can run the next one ([Artifact Persistence](/docs/ai/agentic-development-principles/architecture-of-flow#the-corollary-of-artifact-persistence), [Atomic State Isolation](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-atomic-state-isolation)). A parameter points at the file that holds its rule for the same reason, and a signal enters once, by the URL it carries.

Correctness comes from the structure, not from an agent remembering to do the right thing ([Structural Determinism](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-structural-determinism)). Only a stage's owner moves a task in that stage, and after the verdict the tick is the only writer, because two writers act on a state the other already changed ([one owner per transition](./process.md#three-rules), [D9](/docs/product/product-development/principles/achieving-decentralized-control#d9-the-principle-of-boundaries-establish-clear-roles-and-boundaries)). A script computes and never writes, so every write stays with a run and the standing decision it acts under. When nothing schedules a tick, the next run that reads the graph writes what the tick would, since the transition is the graph's, not the scheduler's.

A signal from outside enters the same way, as a task the tick delegates like any other, never as a fix the signal starts on its own. Capturing is not committing ([P3](https://flow.ttoss.dev/docs/method/principles#p3-capturing-is-not-committing)), and what enters execution is the tick's decision ([Admission Control](/docs/ai/agentic-development-principles/economics-of-interaction#the-corollary-of-admission-control)). The pace belongs to whatever schedules the ticks, not to the agents, and what a run did not write did not happen.

Rules that rest on it:

- One owner per transition.
- With no tick, the next run that reads the graph writes what the tick would.
- A script never writes; every write stays with a run, under the standing decision.
- A parameter is a pointer to the file that holds it, never a copy.
- The implementer records its assumptions at the handoff.
- What integrating leaves is a field of the handoff, never prose the next run infers; a person who supplies it later writes the field, and the next tick applies it.
- Intake writes a task, never a fix, and looks for the task the signal's URL already names before it writes one.

## One engine, extended for any project

The states, stages, owners and transitions are the same for every project. A project extends them only at defined [extension points](./parameters.md#extension-points): an extension answers a question the engine asks and never changes the engine, and a point left empty takes its default. Shared handoffs keep the cost of a new project or a new agent flat instead of growing with every pair ([Protocol Standardization](/docs/ai/agentic-development-principles/protocol-of-communication#the-principle-of-protocol-standardization)).

A rule lives at the most general level where it holds: [Get Things Flowing](https://flow.ttoss.dev/docs/method/principles) for any work, this workflow for software delivery, the [ttoss skills](https://github.com/ttoss/skills) for how an agent carries it out, and the parameters for one product. A rule found true in every project moves up ([Curated Minimalism](/docs/ai/agentic-development-principles/architecture-of-flow#the-corollary-of-curated-minimalism)).

The model a parameter names is part of what the engine runs on, so it is pinned by exact id. An upgrade is a migration, never a swap an alias makes under a project without a change anyone made ([Pinned Substrate Migration](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-pinned-substrate-migration)). The process names acts, never tools, so it reads the same on any code host and for a delivery that is not code. A stage a project answers with none is skipped, not replaced. The parameters bind every session working in the repo, a person's included, because an engine two kinds of worker run differently is two engines.

So any project, delivering code or [anything else](./process.md#delivery-kinds), adopts the workflow by answering its parameters, and an improvement to the engine reaches every project at its next run.

Rules that rest on it:

- A project extends the engine only at its extension points, and never changes it.
- The process names acts, never tools.
- A stage answered with none is skipped.
- The parameters bind every session working in the repo, not only the agents'.
- Models by exact id.

## The author never verifies its own work

An agent that judges its own change optimizes the check instead of the goal ([Proxy Collapse](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-proxy-collapse)). The reviewer runs in a fresh context, did not write the change and never fixes it, which is the one isolation worth the continuity it costs ([Verifier Sovereignty](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-verifier-sovereignty), [Boundary Justification](/docs/ai/agentic-development-principles/architecture-of-flow#the-corollary-of-boundary-justification)). A change to the gates that judge it waits on a person.

A round back goes to a fresh child, never to the one whose change came back. Fix rounds have a limit, since each round on the same gates compounds the error of the last and takes the system out of the range where more effort helps ([Compounding Contextual Error](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-compounding-contextual-error), [V13](/docs/product/product-development/principles/exploiting-variability#v13-the-nonlinearity-principle-operate-in-the-linear-range-of-system-performance)). Findings only a person can act on (product intent, a change outside the repo, a credential the agents lack) go to that person with no round, because a round there only delays the answer it ends in ([E3](/docs/product/product-development/principles/economic-view#e3-the-principle-of-quantified-cost-of-delay-if-you-only-quantify-one-thing-quantify-the-cost-of-delay)).

A task closes only on its effect observed where it matters, never on green checks ([P6](https://flow.ttoss.dev/docs/method/principles#p6-the-record-is-an-estimate-review-confirms-reality), [Intrinsic Verification](/docs/ai/agentic-development-principles/governance-of-technical-debt#the-corollary-of-intrinsic-verification)). It closes as soon as the effect can be seen, because what a reversal must unwind grows with every hour between commitment and detection ([Detection Window](/docs/ai/agentic-development-principles/economics-of-interaction#the-corollary-of-the-detection-window)).

Rules that rest on it:

- Rounds have a limit, a round back goes to a fresh child, and findings only a person can act on go to them with no round.
- The reviewer did not write the change and never fixes it.
- The agents integrate; a change to its own gates waits on a person.
- A task closes on an effect observed where it matters.

## Autonomy is bounded by reversibility

Agents act alone where an act can be undone and its failure is seen in time; a person decides the rest ([P2](https://flow.ttoss.dev/docs/method/principles#p2-the-person-decides-the-agent-proposes), [Reversibility-Bounded Autonomy](/docs/ai/agentic-development-principles/governance-of-agency#the-corollary-of-reversibility-bounded-autonomy)). Both cut what a wrong act costs rather than how often one happens, the cheaper lever when output is probabilistic ([V12](/docs/product/product-development/principles/exploiting-variability#v12-the-principle-of-variability-consequence-reducing-consequences-is-usually-the-best-way-to-reduce-the-cost-of-variability)).

So a change carries its reversal path, designed in before it integrates, when buying it is cheapest ([Designed Reversal](/docs/ai/agentic-development-principles/economics-of-interaction#the-corollary-of-designed-reversal)). It goes up green, from automated loops that correct it before a person is asked ([Verification Latency](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-verification-latency)). One that proves harmful is reverted by that path before the fix is attempted, a cheap variability accepted to hold the expensive one ([V14](/docs/product/product-development/principles/exploiting-variability#v14-the-principle-of-variability-substitution-substitute-cheap-variability-for-expensive-variability), [F17](/docs/product/product-development/principles/controlling-flow-under-uncertainty#f17-the-wsjf-scheduling-principle-when-job-durations-and-delay-costs-are-not-homogeneous-use-wsjf)).

A standing decision delegates what agents may do, so the many small choices are made by rule instead of by queueing for a person, and every write made under it names it as its cause ([P4](https://flow.ttoss.dev/docs/method/principles#p4-every-change-to-a-commitment-carries-its-cause), [E13](/docs/product/product-development/principles/economic-view#e13-the-first-decision-rule-principle-use-decision-rules-to-decentralize-economic-control)). An answer a person gave more than once to the same kind of choice was meant as such a rule, so the Health proposes it as one, and the person's word stays the rule.

What is reserved to a person is what no later tick undoes or what only they can own, listed once in the [`Decisions` default](./parameters.md#the-decisions-default), and a delivery whose act reaches outside the product. A change closed without integrating goes back to a person, to implement again or to cancel, because closing it was somebody's decision the tick cannot read. A choice nobody delegated waits on who decides, written in the graph rather than guessed ([Silent Interpretation](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-silent-interpretation)), and only after the tests that show it is a choice at all, since a choice loses value while it waits ([E10](/docs/product/product-development/principles/economic-view#e10-the-first-perishability-principle-many-economic-choices-are-more-valuable-when-made-quickly)). Another agent's work is not an agent's to take: a run holding a task past its stale limit is left and reported, never reclaimed ([P7](https://flow.ttoss.dev/docs/method/principles#p7-report-dont-refuse-reconcile-explicitly)). Nor is a `blocks` edge an agent's to release: once its source's change integrated and the source waits for its release or check, the edge keeps gating and the target is reported, because building on work nobody validated makes reverting the source cost more, unless the standing decision delegates retracting it.

Rules that rest on it:

- A choice goes to a person only after a test.
- What the `Decisions` default reserves is a person's; so is a delivery that reaches outside the product.
- The change closed without integrating goes to a person: implement it again, or cancel it.
- A check that needs a target the project did not name waits on a person.
- The change goes up green, with its reversal path.
- An integration that proves harmful is reverted by that path before the fix.
- Another agent's run holding a task past `Stale after` is left to its owner.
- A task held only by `blocks` sources whose change integrated is reported, and the Chase lists it; retracting the edge is a person's unless the standing decision delegates it.
- The Health proposes a standing rule from an answer a person gave more than once.

## A rule holds where no agent can outvote it

An agent cannot tell an instruction from the data it reads: a comment on a change, a tool's output and a file in the repo all reach it on the channel its instructions do ([Instruction-Data Conflation](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-instruction-data-conflation)). A prompt is the shallowest control there is, outvoted by whatever is read after it ([Control Stack](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-the-control-stack)). So a rule that must hold against what an agent reads is enforced outside its context, by something that cannot read the diff ([Deterministic Enforcement Supremacy](/docs/ai/agentic-development-principles/foundations-of-hybrid-allocation#the-corollary-of-deterministic-enforcement-supremacy)).

The code host, not an instruction, enforces the merge rule, through required checks, branch protection and required reviews, which make it true for everyone. A verdict is a status on the commit it judged, from an identity allowed to give it, and the code host requires it, so a verdict read in a comment is not one. The agents' instructions change only through a merge a person approved, because the standing decision points at them.

The same ranking decides what an implementer may settle on its own: what is enforced by the system lasts over what a path's context says, over a procedure, over prose. Where enforcement has nothing to read, the gate fails closed. No verdict for the head, or a `Review` the parameters do not state, never reads as passed, because merging is the act no later tick undoes and a gate nobody can show passed has not passed ([Asymmetric Risk](/docs/ai/agentic-development-principles/governance-of-agency#the-principle-of-asymmetric-risk)).

Rules that rest on it:

- The code host enforces the merge rule; what judges or instructs the agents changes only through a person's merge.
- A verdict is a status on the commit it judged, from an identity allowed to give it, and the code host requires it.
- A gate fails closed: no verdict for the head, or a `Review` the parameters do not state, never reads as passed.
- The long-term test ranks durability: enforced, then context, then procedure, then prose.

## Cost of delay orders the work, read from a proxy nobody estimates

Work is ordered by what waiting costs, never by who asked first or by size ([F16](/docs/product/product-development/principles/controlling-flow-under-uncertainty#f16-the-hdcf-scheduling-principle-when-job-durations-are-homogeneous-do-the-high-cost-of-delay-job-first), [E5](/docs/product/product-development/principles/economic-view#e5-the-inactivity-principle-watch-the-work-product-not-the-worker)). Nobody quantifies that cost per task: an agent asked to would invent a number and then optimize it ([Silent Interpretation](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-silent-interpretation), [Proxy Collapse](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-proxy-collapse)). So the workflow reads it from a fixed proxy, the same for every project: the [stage](./process.md#three-rules) the work is in, and the two words a person may add.

The stages, in the order of what waiting costs:

1. A red default branch holds every change in its repo, so its repair frees the most ([P5](https://flow.ttoss.dev/docs/method/principles#p5-what-to-do-next-is-computed-not-remembered)).
2. Integrated work nobody has seen in effect lets a regression run, the one thing that can go wrong and is not undone by waiting ([P9](https://flow.ttoss.dev/docs/method/principles#p9-recovery-beats-zero), [P6](https://flow.ttoss.dev/docs/method/principles#p6-the-record-is-an-estimate-review-confirms-reality), [Detection Window](/docs/ai/agentic-development-principles/economics-of-interaction#the-corollary-of-the-detection-window)).
3. A wait that came due is the tick's to act on ([W20](/docs/product/product-development/principles/applying-wip-constraints#w20-the-expansion-control-principle-prevent-uncontrolled-expansion-of-work)).
4. What is open at its gates the agents drain on their own, and nothing ranks a conflict, a round and a review among themselves but Flow.
5. New work loses little by waiting a tick ([V16](/docs/product/product-development/principles/exploiting-variability#v16-the-principle-of-variability-displacement-move-variability-to-the-process-stage-where-its-cost-is-lowest)).

The two words: a `very_high` priority, which is their own assertion that waiting costs most, whatever the stage, and the `bug` tag, which at `high` says the defect is already in effect ([P2](https://flow.ttoss.dev/docs/method/principles#p2-the-person-decides-the-agent-proposes)). A priority holds through the `blocks` edge too: a task that holds a `very_high` is worked as one, by the priority Flow answers it inherits, since otherwise the work ranked first waits on what ranks last.

The proxy is the economics, coarsened: the order of the stages is their cost of delay ranked once for every project, which prevents the large mistakes without the per-task precision nobody has ([E1](/docs/product/product-development/principles/economic-view#e1-the-principle-of-quantified-overall-economics-select-actions-based-on-quantified-overall-economic-impact), [FF2](/docs/product/product-development/principles/using-fast-feedback#ff2-the-principle-of-efficient-control-control-parameters-that-are-both-influential-and-efficient)). Below the proxy, Flow's ranking, priority then leverage ([P5](https://flow.ttoss.dev/docs/method/principles#p5-what-to-do-next-is-computed-not-remembered)), orders the work inside a stage and never across them, since a priority holds only where the work is waiting ([F18](/docs/product/product-development/principles/controlling-flow-under-uncertainty#f18-the-local-priority-principle-priorities-are-inherently-local)).

A brief asking for several deliveries is split before it is started, because a large batch delays everything it carries ([B1](/docs/product/product-development/principles/reducing-batch-size#b1-the-batch-size-queueing-principle-reducing-batch-size-reduces-cycle-time)) and an agent delivers what it can hold whole ([Problem Decomposition](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-problem-decomposition)). The Chase lists what only a person can move in the same order, so a person reads first what their delay costs most.

The order needs a free slot to act on. A child may hold its slot for hours, so with every slot on new work the repair of a red default branch would wait for one to free. New work therefore never takes the last free slot while `Max runs` is two or more ([D15](/docs/product/product-development/principles/achieving-decentralized-control#d15-the-principle-of-tactical-reserves-decentralize-a-portion-of-reserves)). What ages faster takes it the moment it appears, ahead of the line without interrupting a run already underway, since a run stopped midway wastes what it did and head-of-the-line privilege already removes the wait ([F20](/docs/product/product-development/principles/controlling-flow-under-uncertainty#f20-the-preemption-principle-only-preempt-when-switching-costs-are-low)).

Rules that rest on it:

- What ages fastest goes first, read from the stage, a `very_high` priority and a `high` bug, asserted or inherited through `blocks`.
- A brief asking for several deliveries is split.
- New work never takes the last free slot; what ages faster takes it, without interrupting a run.
- The Chase lists what only a person can move in the order the tick works.

## The release queue holds new work upstream

Agents add work faster than people answer it, so the queues that cost most are the ones only a person can drain ([W21](/docs/product/product-development/principles/applying-wip-constraints#w21-the-principle-of-the-critical-queue-constrain-wip-in-the-section-of-the-system-where-the-queue-is-most-expensive), [FF24](/docs/product/product-development/principles/using-fast-feedback#ff24-the-attention-principle-time-counts-more-than-money)). There are two, on either side of the implementation: this one, and the [decision queue](#a-choice-is-answered-by-a-rule-where-one-exists-and-by-a-person-when-the-work-needs-it) below. Each is named and counted, because product development inventory shows nowhere unless something counts it ([Q1](/docs/product/product-development/principles/managing-queues#q1-the-principle-of-invisible-inventory-product-development-inventory-is-physically-and-financially-invisible)).

The release queue is everything between an implementation and its release to the customer in production: the changes waiting to be reviewed, integrated, validated or rid of their feature flag. It ends at the release, not at the review, because the value of the work and the feedback that tells whether it was right arrive only when the customer has it ([E3](/docs/product/product-development/principles/economic-view#e3-the-principle-of-quantified-cost-of-delay-if-you-only-quantify-one-thing-quantify-the-cost-of-delay), [B3](/docs/product/product-development/principles/reducing-batch-size#b3-the-batch-size-feedback-principle-reducing-batch-sizes-accelerates-feedback)). A change merged behind a flag carries the risk of an open one and none of its feedback, and the faster that feedback comes, the smaller the queue it lets us run ([FF7](/docs/product/product-development/principles/using-fast-feedback#ff7-the-queue-reduction-principle-of-feedback-fast-feedback-enables-smaller-queues)).

Reviewing and validating what agents built is where the queue grows with every implementation, so the tick constrains it ([W1](/docs/product/product-development/principles/applying-wip-constraints#w1-the-principle-of-wip-constraints-constrain-wip-to-control-cycle-time-and-flow)) by blocking new work once it is full ([W6](/docs/product/product-development/principles/applying-wip-constraints#w6-the-principle-of-demand-blocking-block-all-demand-when-wip-reaches-its-upper-limit)), holding that work upstream where waiting is cheap ([V16](/docs/product/product-development/principles/exploiting-variability#v16-the-principle-of-variability-displacement-move-variability-to-the-process-stage-where-its-cost-is-lowest)). A child ends at its handoff, so the run cap alone leaves the queue unbounded. The limit reads the queue's size, which reacts at once, never its utilization or cycle time, which react only once the work leaves ([Q13](/docs/product/product-development/principles/managing-queues#q13-the-first-queue-size-control-principle-dont-control-capacity-utilization-control-queue-size), [Q14](/docs/product/product-development/principles/managing-queues#q14-the-second-queue-size-control-principle-dont-control-cycle-time-control-queue-size)). The size is the wait, since a change waits about as long as the queue ahead of it takes to drain ([Q12](/docs/product/product-development/principles/managing-queues#q12-littles-formula-wait-time--queue-sizeprocessing-rate)), and a long queue makes no single item feel urgent ([FF21](/docs/product/product-development/principles/using-fast-feedback#ff21-the-hurry-up-and-wait-principle-large-queues-make-it-hard-to-create-urgency)).

Only new work waits: integrating, releases, checks, rounds and what a person marked urgent go on, so the queue keeps draining. The same limit sizes what the Chase asks of people, so the digest never asks more than the queue allows.

Rules that rest on it:

- The workflow names two queues only a person drains: the decision queue and the release queue.
- The release queue counts every change between its implementation and its release: open past draft, or integrated with its task waiting on a person.
- New work waits upstream once the release queue is full; decisions do not count, and only new work waits.
- The Chase lists what only a person can move in the release queue, as many as its limit.

## A full queue is drained, never only held

Holding new work upstream stops the release queue from growing; it does not make it shrink, and every way out of it is a person's act. A queue left at its limit stays there, since randomness does not correct a random queue ([Q15](/docs/product/product-development/principles/managing-queues#q15-the-diffusion-principle-over-time-queues-will-randomly-spin-seriously-out-of-control-and-will-remain-in-this-state-for-long-periods), [Q16](/docs/product/product-development/principles/managing-queues#q16-the-intervention-principle-we-cannot-rely-on-randomness-to-correct-a-random-queue)). While it is full, every item in it accrues delay at the rate the long queue imposes, so a change that was worth holding when the queue was short may no longer be ([W7](/docs/product/product-development/principles/applying-wip-constraints#w7-the-principle-of-wip-purging-when-wip-is-high-purge-low-value-projects)).

So the Health, counting the queue as the tick does, proposes what to drain. While the release queue is at its limit, it names the changes at the bottom of the tick's order, as many as bring it below its limit so new work can start again, each by URL in one `decision` waiting on the project's admins. Closing a change, cutting it down to what is worth shipping ([W8](/docs/product/product-development/principles/applying-wip-constraints#w8-the-principle-of-flexible-requirements-control-wip-by-shedding-requirements)) or returning its task to `incubated` is that person's, because closing work is a choice the tick cannot read ([P2](https://flow.ttoss.dev/docs/method/principles#p2-the-person-decides-the-agent-proposes)). The proposal weighs what is left to finish against what it returns, never what was already spent on it ([E17](/docs/product/product-development/principles/economic-view#e17-the-sunk-cost-principle-do-not-consider-money-already-spent)).

Averages hide the tail, so the Health also names the oldest item in each queue only a person drains, its age as the code host and Flow answer it, and who acts. An item that waited far longer than the rest is likely stuck on something nobody has seen, and naming it to whoever can move it is the escalation planned in advance ([W15](/docs/product/product-development/principles/applying-wip-constraints#w15-the-aging-principle-watch-the-outliers), [W16](/docs/product/product-development/principles/applying-wip-constraints#w16-the-escalation-principle-create-a-preplanned-escalation-process-for-outliers)). Age names an item for a person and never ranks the work, since only [cost of delay](#cost-of-delay-orders-the-work-read-from-a-proxy-nobody-estimates) orders it ([W16](/docs/product/product-development/principles/applying-wip-constraints#w16-the-escalation-principle-create-a-preplanned-escalation-process-for-outliers)).

Rules that rest on it:

- While the release queue is at its limit, the Health proposes the changes at the bottom of the tick's order, as many as bring it below its limit; closing them is a person's.
- A proposal to drain weighs what is left to finish, never what was spent.
- The Health names the oldest item in each queue only a person drains, with its age and who acts.
- Age names an item for a person; it never ranks the work.

## A choice is answered by a rule where one exists, and by a person when the work needs it

The decision queue is every open choice that holds work before it can start: a `decision` that `blocks` tasks, or a task waiting on a person for an answer its brief needs. Choices age, and many are worth more made quickly ([E10](/docs/product/product-development/principles/economic-view#e10-the-first-perishability-principle-many-economic-choices-are-more-valuable-when-made-quickly), [D1](/docs/product/product-development/principles/achieving-decentralized-control#d1-the-second-perishability-principle-decentralize-control-for-problems-and-opportunities-that-age-poorly)), so the workflow answers most of them without a person. Decision rules carry the economic logic of a choice to whoever meets it ([E13](/docs/product/product-development/principles/economic-view#e13-the-first-decision-rule-principle-use-decision-rules-to-decentralize-economic-control), [FF13](/docs/product/product-development/principles/using-fast-feedback#ff13-the-second-decision-rule-principle-control-the-economic-logic-behind-a-decision-not-the-entire-decision)), which is what the `Decisions` default's dominance and long-term tests and a project's standing decision are. What a rule cannot settle reaches a person, and so does what is infrequent, large or irreversible enough to be centralized, what the `Decisions` default reserves ([D2](/docs/product/product-development/principles/achieving-decentralized-control#d2-the-scale-principle-centralize-control-for-problems-that-are-infrequent-large-or-have-significant-economies-of-scale)).

A decision holds only the work it blocks, so it never counts against the release queue, and a thousand open choices never stop the work nobody has to choose about. Its best moment is when the work it frees could start ([E15](/docs/product/product-development/principles/economic-view#e15-the-principle-of-optimum-decision-timing-every-decision-has-its-optimum-economic-timing), [F26](/docs/product/product-development/principles/controlling-flow-under-uncertainty#f26-the-principle-of-late-binding-the-later-we-bind-demand-to-resources-the-smoother-the-flow)). While the release queue is over its limit the tick would not start that work anyway, so asking for the choice then spends attention the release queue needs ([FF24](/docs/product/product-development/principles/using-fast-feedback#ff24-the-attention-principle-time-counts-more-than-money)).

Most choices are never raised at all, because the implementer meets them mid-task and answers them there, and it can only answer them against an intent it was given. So a ready brief states its purpose, the end state the task serves and why, not only what to build and how it is checked ([D8](/docs/product/product-development/principles/achieving-decentralized-control#d8-the-principle-of-mission-specify-the-end-state-its-purpose-and-the-minimal-possible-constraints)). An acceptance alone is a proxy an agent satisfies literally. The purpose is the decision rule it carries into every choice the brief did not foresee, and without it the agent fills the gap with a guess that reads like an answer ([D17](/docs/product/product-development/principles/achieving-decentralized-control#d17-the-principle-of-decentralized-information-for-decentralized-decisions-disseminate-key-information-widely), [Silent Interpretation](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-silent-interpretation)).

Rules that rest on it:

- A choice waits on whoever decides: its task waiting on them, or a `decision` that `blocks` the tasks it holds.
- A ready brief states its purpose: the end state the task serves, so a choice met on the way is answered against it.
- What integrating leaves is the agent's to choose when the `Closing evidence` gives it the choice, and a wait on a person for it is read again once the parameter does.
- The Chase lists the decisions the team owes only while the release queue is within its limit, as many as that limit.

## No wait is open-ended

Work that is inside the system grows to fill whatever time it is given, so controlling what enters is not enough: every wait carries a date, and the date is the tick's to act on ([W20](/docs/product/product-development/principles/applying-wip-constraints#w20-the-expansion-control-principle-prevent-uncontrolled-expansion-of-work)).

A wait on a person carries the day to chase them ([GTF-N4](https://flow.ttoss.dev/docs/agents/protocol.md)), and Flow reports one written without it. A check's wait carries when the effect can be seen, written at the handoff; a reader that finds it not yet visible moves the date to when it will be, from something it can point to, never to a guess. A child's run is given a slice, `Stale after`, past which a tick that cannot read it takes it as gone and closes it, because a run's duration is unknown and may be unbounded ([F19](/docs/product/product-development/principles/controlling-flow-under-uncertainty#f19-the-round-robin-principle-when-task-duration-is-unknown-share-time-among-tasks)). The run records the same slice as its hold on its tasks, so no other run takes them sooner. A review request nobody picked up within the same slice falls to the `Review` fallback rather than holding the change. A child ends at its handoff and never waits on CI, so one still running past the slice has stopped.

What passes its date is closed, reported or handed on, never left as it is: a wait with no date is a queue nobody measures.

Rules that rest on it:

- A run past `Stale after` is closed, and its task is ready again.
- A review request lost past `Stale after` falls to the `Review` fallback.
- A check's wait carries when the effect can be seen, and moves only to a date someone can point to; the handoff's date moves with it, and a wait is never written with a date already past.
- A wait on a person carries the date to chase on; Flow reports one that does not.
- A run's hold on its tasks lasts its `Stale after`.

## A number is Flow's answer, never an agent's estimate

The graph reaches nobody who does not read it, so the routines carry it to people. The Chase tells each person what the graph holds for them, because knowledge that stays in the graph serves the agents and not the people it waits on ([Contextual Readiness](/docs/ai/agentic-development-principles/architecture-of-flow#the-corollary-of-contextual-readiness)).

What the Health reports is what the work product does, never what a worker does ([E5](/docs/product/product-development/principles/economic-view#e5-the-inactivity-principle-watch-the-work-product-not-the-worker)). It reports each state's arrivals, departures and age, the cumulative flow that shows a queue as it forms ([Q11](/docs/product/product-development/principles/managing-queues#q11-the-cumulative-flow-principle-use-cfds-to-monitor-queues)). It reports rework after the check and failure demand, the leading indicators of what the next weeks will cost ([FF3](/docs/product/product-development/principles/using-fast-feedback#ff3-the-principle-of-leading-indicators-select-control-variables-that-predict-future-system-behavior)). It reports what became of incubated work and the untriaged inbox and, from the Audit, spend on work that did not ship: the inventory that is invisible unless something counts it, and the expansion nothing else stops ([E1](/docs/product/product-development/principles/economic-view#e1-the-principle-of-quantified-overall-economics-select-actions-based-on-quantified-overall-economic-impact), [Q1](/docs/product/product-development/principles/managing-queues#q1-the-principle-of-invisible-inventory-product-development-inventory-is-physically-and-financially-invisible), [W20](/docs/product/product-development/principles/applying-wip-constraints#w20-the-expansion-control-principle-prevent-uncontrolled-expansion-of-work)). A state only a person's answer frees that grew two weeks running opens the report, because a queue left alone does not correct itself and more agents or tasks will not help ([Q16](/docs/product/product-development/principles/managing-queues#q16-the-intervention-principle-we-cannot-rely-on-randomness-to-correct-a-random-queue)).

Every number is written as Flow answers it, never a ratio, a goal or a threshold, because a number aimed at is a number reached while the work it stood for stops ([Proxy Collapse](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-proxy-collapse)). The arithmetic behind each is a script over Flow's answers, never an agent's: counting is a well-structured problem, and a sum an agent works out is a guess that reads like a fact ([Problem Structure Allocation](/docs/ai/agentic-development-principles/foundations-of-hybrid-allocation#the-principle-of-problem-structure-allocation), [Structural Determinism](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-structural-determinism)).

Rules that rest on it:

- The Chase tells people what the graph holds for them.
- The Health reports each state's arrivals, departures and age, as Flow answers them.
- The Health reports rework after the check, and failure demand.
- The Health reads incubated exits and the inbox; the Audit reads spend on work that did not ship.
- A person queue growing two weeks running opens the Health's report.
- Health numbers are written as Flow answers them: no ratio, no goal, no threshold.
- The routines' arithmetic is computed by scripts from Flow's answers, never by an agent.

## Every run is paid for

A run looks free to the agent that starts it and is not: every prompt costs money, latency and a share of what the people downstream will read ([Prompt Economics](/docs/ai/agentic-development-principles/economics-of-interaction#the-principle-of-prompt-economics)). So the Audit measures what runs spend, from the instruction files every session loads and the runs Flow records, and a routine is as cheap as its question allows.

It runs on the cheapest model that does the work, because intelligence spent on a low-entropy task is bought and wasted ([Allocative Efficiency](/docs/ai/agentic-development-principles/economics-of-interaction#the-principle-of-allocative-efficiency)). It loads only the tools it calls, and hands a wide read to a subagent that returns the conclusion. The children a tick runs at once are capped (`Max runs`), because each is paid for whether or not what is downstream can take its output.

The routines run on cadences, hourly, daily and weekly, because a regular rhythm turns unpredictable events into predictable ones ([F5](/docs/product/product-development/principles/controlling-flow-under-uncertainty#f5-the-principle-of-periodic-resynchronization-use-a-regular-cadence-to-limit-the-accumulation-of-variance)). The cadences nest as multiples of one another, so the week's Health and Audit read the days the Chase reported and the hours the tick ran ([F14](/docs/product/product-development/principles/controlling-flow-under-uncertainty#f14-the-harmonic-principle-make-nested-cadences-harmonic-multiples)).

Rules that rest on it:

- Routines run on nested cadences, on the cheapest model that does the work.
- Child runs are capped.
- A routine loads only the tools it calls, and hands a wide read to a subagent.
- The Audit measures what runs spend.
