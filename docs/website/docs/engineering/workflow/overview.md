---
sidebar_position: 0
sidebar_label: Overview
title: Agentic Workflow
---

# Agentic Workflow

The agentic workflow is how a change at ttoss goes from a signal to an effect observed in production. Three ideas shape it: it is a state machine over a task graph, one engine runs it for every project while each project extends it, and it is built on [Get Things Flowing](https://flow.ttoss.dev/docs/method/principles) (GTF) and [Flow](https://flow.ttoss.dev).

## A State Machine

A task's state lives in Flow: its status, what holds it, and the changes it references. A tick reads that state, applies the transitions it calls for, writes the new state back, and stops. The next tick reads the state as it is now and does the same. Nothing passes from one tick to the next except the graph, so a tick that dies loses nothing, any agent can run the next one, and whatever schedules the ticks sets the pace. That schedule is the project's [routines](./routines.md): the tick, and beside it a run that chases the people the graph waits on and one that audits what the loop spends.

```mermaid
stateDiagram-v2
    state "Ready (active)" as Ready
    state "A choice for a person (waiting)" as Person
    state "At the gates (waiting)" as Gates
    state "Waiting for a release (blocked)" as Release
    state "Waiting for the check (calendar)" as Check
    state "Done (completed)" as Done
    [*] --> Ready: intake
    Ready --> Person: a choice nobody delegated
    Person --> Ready: answered
    Ready --> Gates: change proposed
    Gates --> Ready: red checks or findings
    Gates --> Release: integrated, release step pending
    Gates --> Check: integrated, released by its pipeline
    Release --> Check: release step done
    Check --> Done: effect observed
    Check --> Ready: effect not there
    Done --> [*]
```

The [Delivery Process](./process.md) defines every state, the seven stages that move a task between them with one owner each, and the [transitions](./process.md#transitions) a tick applies. The tick applies them in order every time it runs: it verifies what came due, runs the release steps, reviews and integrates the changes whose checks passed, and only then starts a child agent for each ready task, up to a cap.

## One Engine, Extended per Project

The engine is the same for every project: the states, the stages and their owners, the transitions and the rules of the Delivery Process. A project extends it at defined [extension points](./parameters.md#extension-points), its parameters: where work comes from, what a task must state before an agent starts it, which choices stay with a person, what runs before a change is proposed, who reviews it, when it may be integrated, how it is released, what proves it done, which deliveries are not pull requests, how its agents run and which routines fire them. An extension answers a question the engine asks and never changes the engine. A point left empty takes its default, so a project starts from the engine as it is and extends only where it differs, and a rule that turns out true of every project moves into the engine.

```mermaid
flowchart TB
    E["Delivery Process<br/>the engine"]
    A["Project A<br/>its parameters"] -->|extends| E
    B["Project B<br/>its parameters"] -->|extends| E
    S["ttoss skills<br/>agents that run the ticks"] -->|runs| E
```

## Built on GTF and Flow

GTF is the general method for working a task graph: who may change a commitment, what every change cites as its cause, how an agent run takes a task, what closes one. Flow holds the graph, records every agent run with what it cost, and refuses the few moves that contradict themselves. The workflow applies both to product development: its state is Flow's task state, and every rule cites GTF by its id instead of restating it. A rule true of any work belongs in GTF; one true of software delivery belongs here; how an agent carries it out belongs in the [ttoss skills](https://github.com/ttoss/skills); and what is true of a single product is that project's [parameters](./parameters.md). The skills carry the Delivery Process, the Project Parameters and the Routines verbatim, so a change to these pages reaches every agent with the next skills release.

## Why It Is Shaped This Way

The workflow rests on two sets of principles: the [Principles of Product Development Flow](/docs/product/product-development/principles) say why a rule pays, and the [Agentic Development Principles](/docs/ai/agentic-development-principles) say why agents need it.

| The workflow                                              | Why it pays                                                            | Why agents need it                                                     |
| --------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| One owner per transition, one worker per task             | [D9 Boundaries][]                                                      | [Distributed Unreliability][]                                          |
| The state lives in Flow                                   | [E5 Inactivity][], [W23 Visual WIP][]                                  | [Compounding Context][]                                                |
| Every change has a cause, under a standing decision       | [E13 First Decision Rule][], [FF13 Second Decision Rule][]             | [Compressed Delegation][], [Trust-Gated Orchestration][]               |
| A person decides what is reserved                         | [D2 Scale][]                                                           | [Asymmetric Risk][], [Contextual Authority][]                          |
| Done is the effect, observed where it matters             | [FF8 Fast-Learning][]                                                  | [Proxy Collapse][], [Detection Window][]                               |
| Loops have a limit                                        | [FF15 Relief Valve][], [W16 Escalation][]                              | [Compounding Contextual Error][], [Proxy Collapse][]                   |
| Finish before starting, with a cap on children            | [W1 WIP Constraints][], [F15 SJF Scheduling][]                         | [Cheap Generation, Expensive Commitment][], [Verification Asymmetry][] |
| A brief a child can check, one delivery per task          | [D8 Mission][], [B1 Batch Size Queueing][], [B3 Batch Size Feedback][] | [Executable Specification][], [Problem Decomposition][]                |
| Noticed work becomes a task, never a fix                  | [W20 Expansion Control][]                                              | [Admission Control][], [Traceable Edits][]                             |
| Gates on the change, and a reviewer that did not write it | [FF14 Locality of Feedback][]                                          | [Deterministic Verification][], [Verifier Sovereignty][]               |
| One engine, extended per project                          | [V9 Reuse][], [F22 Tailored Routing][]                                 | [Protocol Standardization][]                                           |
| An hourly tick inside a daily Chase and a weekly Audit    | [F5 Periodic Resynchronization][], [FF16 Multiple Control Loops][]     | [Invisible Risk][], [Prompt Economics][]                               |
| What fired a routine is data                              |                                                                        | [Instruction-Data Conflation][]                                        |

The gates are [deterministic guardrails](/docs/ai/agentic-engineering-foundations/deterministic-guardrails), and the run records keep the loop [observable](/docs/ai/agentic-engineering-foundations/observability).

[D9 Boundaries]: /docs/product/product-development/principles#d9-the-principle-of-boundaries-establish-clear-roles-and-boundaries
[Distributed Unreliability]: /docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-distributed-unreliability
[E5 Inactivity]: /docs/product/product-development/principles#e5-the-inactivity-principle-watch-the-work-product-not-the-worker
[W23 Visual WIP]: /docs/product/product-development/principles#w23-the-principle-of-visual-wip-make-wip-continuously-visible
[Compounding Context]: /docs/ai/agentic-development-principles/architecture-of-flow#the-principle-of-compounding-context
[E13 First Decision Rule]: /docs/product/product-development/principles#e13-the-first-decision-rule-principle-use-decision-rules-to-decentralize-economic-control
[FF13 Second Decision Rule]: /docs/product/product-development/principles#ff13-the-second-decision-rule-principle-control-the-economic-logic-behind-a-decision-not-the-entire-decision
[Compressed Delegation]: /docs/ai/agentic-development-principles/symbiosis-of-human-ai-agency#the-principle-of-compressed-delegation
[Trust-Gated Orchestration]: /docs/ai/agentic-development-principles/governance-of-agency#the-corollary-of-trust-gated-orchestration
[D2 Scale]: /docs/product/product-development/principles#d2-the-scale-principle-centralize-control-for-problems-that-are-infrequent-large-or-have-significant-economies-of-scale
[Asymmetric Risk]: /docs/ai/agentic-development-principles/governance-of-agency#the-principle-of-asymmetric-risk
[Contextual Authority]: /docs/ai/agentic-development-principles/governance-of-agency#the-principle-of-contextual-authority
[FF8 Fast-Learning]: /docs/product/product-development/principles#ff8-the-fast-learning-principle-use-fast-feedback-to-make-learning-faster-and-more-efficient
[Proxy Collapse]: /docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-proxy-collapse
[Detection Window]: /docs/ai/agentic-development-principles/economics-of-interaction#the-corollary-of-the-detection-window
[FF15 Relief Valve]: /docs/product/product-development/principles#ff15-the-relief-valve-principle-have-a-clear-predetermined-relief-valve
[W16 Escalation]: /docs/product/product-development/principles#w16-the-escalation-principle-create-a-preplanned-escalation-process-for-outliers
[Compounding Contextual Error]: /docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-compounding-contextual-error
[W1 WIP Constraints]: /docs/product/product-development/principles#w1-the-principle-of-wip-constraints-constrain-wip-to-control-cycle-time-and-flow
[F15 SJF Scheduling]: /docs/product/product-development/principles#f15-the-sjf-scheduling-principle-when-delay-costs-are-homogeneous-do-the-shortest-job-first
[Cheap Generation, Expensive Commitment]: /docs/ai/agentic-development-principles/economics-of-interaction#the-principle-of-cheap-generation-expensive-commitment
[Verification Asymmetry]: /docs/ai/agentic-development-principles/symbiosis-of-human-ai-agency#the-principle-of-verification-asymmetry
[D8 Mission]: /docs/product/product-development/principles#d8-the-principle-of-mission-specify-the-end-state-its-purpose-and-the-minimal-possible-constraints
[B1 Batch Size Queueing]: /docs/product/product-development/principles#b1-the-batch-size-queueing-principle-reducing-batch-size-reduces-cycle-time
[B3 Batch Size Feedback]: /docs/product/product-development/principles#b3-the-batch-size-feedback-principle-reducing-batch-sizes-accelerates-feedback
[Executable Specification]: /docs/ai/agentic-development-principles/foundations-of-hybrid-allocation#the-principle-of-executable-specification
[Problem Decomposition]: /docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-problem-decomposition
[W20 Expansion Control]: /docs/product/product-development/principles#w20-the-expansion-control-principle-prevent-uncontrolled-expansion-of-work
[Admission Control]: /docs/ai/agentic-development-principles/economics-of-interaction#the-corollary-of-admission-control
[Traceable Edits]: /docs/ai/agentic-development-principles/symbiosis-of-human-ai-agency#the-corollary-of-traceable-edits
[FF14 Locality of Feedback]: /docs/product/product-development/principles#ff14-the-locality-principle-of-feedback-whenever-possible-make-feedback-local
[Deterministic Verification]: /docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-deterministic-verification
[Verifier Sovereignty]: /docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-verifier-sovereignty
[V9 Reuse]: /docs/product/product-development/principles#v9-the-reuse-principle-reuse-reduces-variability
[F22 Tailored Routing]: /docs/product/product-development/principles#f22-the-principle-of-tailored-routing-select-and-tailor-the-sequence-of-subprocesses-to-the-task-at-hand
[Protocol Standardization]: /docs/ai/agentic-development-principles/protocol-of-communication#the-principle-of-protocol-standardization
[F5 Periodic Resynchronization]: /docs/product/product-development/principles#f5-the-principle-of-periodic-resynchronization-use-a-regular-cadence-to-limit-the-accumulation-of-variance
[FF16 Multiple Control Loops]: /docs/product/product-development/principles#ff16-the-principle-of-multiple-control-loops-embed-fast-control-loops-inside-slow-loops
[Invisible Risk]: /docs/ai/agentic-development-principles/governance-of-technical-debt#the-principle-of-invisible-risk
[Prompt Economics]: /docs/ai/agentic-development-principles/economics-of-interaction#the-principle-of-prompt-economics
[Instruction-Data Conflation]: /docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-instruction-data-conflation

## Adopting It

A repository adopts the workflow with the [`flow-setup`](https://github.com/ttoss/skills/blob/main/skills/flow-setup/SKILL.md) skill: it installs the skills, defines the [parameters](./parameters.md) with you from what the repository already says, proposes the Flow project and its standing decision, opens a pull request for your review and, once you integrate it, creates the project's [routines](./routines.md). The pull request carries `AGENTIC_WORKFLOW.md` at the repository's root, the page the project's people read: this workflow as the project runs it, with who acts at each stage, what fires each run, its routines and where each piece lives, rebuilt on every setup and audit. The [`flow`](https://github.com/ttoss/skills/blob/main/skills/flow/SKILL.md) skill runs the tick and the chase they fire, and [`token-audit`](https://github.com/ttoss/skills/blob/main/skills/token-audit/SKILL.md) the audit.
