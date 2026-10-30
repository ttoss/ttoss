---
sidebar_position: 0
sidebar_label: Overview
title: Agentic Workflow
---

# Agentic Workflow

The agentic workflow is how a change at ttoss goes from a signal to an effect observed in production. Three ideas shape it: it is a state machine over a task graph, one engine runs it for every project while each project extends it, and it is built on [Get Things Flowing](https://flow.ttoss.dev/docs/method/principles) (GTF) and [Flow](https://flow.ttoss.dev).

## A State Machine

A task's state lives in Flow: its status, what holds it, and the changes it references. A tick reads that state, applies the transitions it calls for, writes the new state back, and stops. The next tick reads the state as it is now and does the same. Nothing passes from one tick to the next except the graph, so a tick that dies loses nothing, any agent can run the next one, and whatever schedules the ticks sets the pace. That schedule is the project's [routines](./routines.md): the tick, and beside it a run that chases the people the graph waits on and one that audits what the agents spend.

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

The engine is the same for every project: the states, the stages and their owners, the transitions and the rules of the Delivery Process. A project extends it at defined [extension points](./parameters.md#extension-points), its parameters. An extension answers a question the engine asks and never changes the engine. A point left empty takes its default, so a project starts from the engine as it is and extends only where it differs, and a rule that turns out true of every project moves into the engine.

```mermaid
flowchart TB
    E["Delivery Process<br/>the engine"]
    A["Project A<br/>its parameters"] -->|extends| E
    B["Project B<br/>its parameters"] -->|extends| E
    S["ttoss skills<br/>agents that run the ticks"] -->|runs| E
```

## Built on GTF and Flow

A rule true of any work belongs in GTF; one true of software delivery belongs here; how an agent carries it out belongs in the [ttoss skills](https://github.com/ttoss/skills); and what is true of a single product is that project's [parameters](./parameters.md). The skills read the Delivery Process, the Project Parameters and the Routines from this repository's default branch, so a change to these pages reaches every agent at its next run.

## What It Rests On

Every rule of the workflow applies a [product development](/docs/product/product-development/principles) or [agentic development](/docs/ai/agentic-development-principles/overview) principle. The pages the agents read cite one only where the reason changes what an agent decides; this table carries the rest, for whoever changes a rule.

| The workflow says                                                                        | Because                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The graph is the only memory; a tick that dies loses nothing                             | [Compounding Context](/docs/ai/agentic-development-principles/architecture-of-flow#the-principle-of-compounding-context), [Atomic State Isolation](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-atomic-state-isolation)                                                                                                                                                                         |
| One engine, extended at defined points                                                   | [Protocol Standardization](/docs/ai/agentic-development-principles/protocol-of-communication#the-principle-of-protocol-standardization)                                                                                                                                                                                                                                                                                               |
| A rule lives at the most general level where it holds                                    | [Curated Minimalism](/docs/ai/agentic-development-principles/architecture-of-flow#the-corollary-of-curated-minimalism)                                                                                                                                                                                                                                                                                                                |
| One owner per transition                                                                 | [D9](/docs/product/product-development/principles#d9-the-principle-of-boundaries-establish-clear-roles-and-boundaries)                                                                                                                                                                                                                                                                                                                |
| Rounds have a limit                                                                      | [Proxy Collapse](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-proxy-collapse), [Compounding Contextual Error](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-compounding-contextual-error)                                                                                                                                                                  |
| What ages fastest goes first, read from the stage                                        | [F17](/docs/product/product-development/principles#f17-the-wsjf-scheduling-principle-when-job-durations-and-delay-costs-are-not-homogeneous-use-wsjf), [E5](/docs/product/product-development/principles#e5-the-inactivity-principle-watch-the-work-product-not-the-worker)                                                                                                                                                           |
| Intake writes a task, never a fix                                                        | [Admission Control](/docs/ai/agentic-development-principles/economics-of-interaction#the-corollary-of-admission-control)                                                                                                                                                                                                                                                                                                              |
| A choice goes to a person only after a test                                              | [E10](/docs/product/product-development/principles#e10-the-first-perishability-principle-many-economic-choices-are-more-valuable-when-made-quickly), [E13](/docs/product/product-development/principles#e13-the-first-decision-rule-principle-use-decision-rules-to-decentralize-economic-control), [Silent Interpretation](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-principle-of-silent-interpretation) |
| A brief asking for several deliveries is split                                           | [Problem Decomposition](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-problem-decomposition), [B1](/docs/product/product-development/principles#b1-the-batch-size-queueing-principle-reducing-batch-size-reduces-cycle-time)                                                                                                                                                                     |
| The implementer records its assumptions at the handoff                                   | [Externalized Confusion](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-externalized-confusion), [Seam Memory Layer](/docs/ai/agentic-development-principles/architecture-of-flow#the-corollary-of-the-seam-memory-layer)                                                                                                                                                                         |
| The change goes up green, with its reversal path                                         | [Verification Latency](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-verification-latency), [Designed Reversal](/docs/ai/agentic-development-principles/economics-of-interaction#the-corollary-of-designed-reversal)                                                                                                                                                                             |
| The reviewer did not write the change and never fixes it                                 | [Verifier Sovereignty](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-verifier-sovereignty), [Boundary Justification](/docs/ai/agentic-development-principles/architecture-of-flow#the-corollary-of-boundary-justification)                                                                                                                                                                       |
| The agents integrate; a change to its own gates waits on a person                        | [Reversibility-Bounded Autonomy](/docs/ai/agentic-development-principles/governance-of-agency#the-corollary-of-reversibility-bounded-autonomy), [Verifier Sovereignty](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-verifier-sovereignty)                                                                                                                                                       |
| A task closes on an effect observed where it matters                                     | [Detection Window](/docs/ai/agentic-development-principles/economics-of-interaction#the-corollary-of-the-detection-window), [Intrinsic Verification](/docs/ai/agentic-development-principles/governance-of-technical-debt#the-corollary-of-intrinsic-verification), [FF3](/docs/product/product-development/principles#ff3-the-principle-of-leading-indicators-select-control-variables-that-predict-future-system-behavior)          |
| The code host enforces the merge rule; instructions change only through a person's merge | [Deterministic Enforcement Supremacy](/docs/ai/agentic-development-principles/foundations-of-hybrid-allocation#the-corollary-of-deterministic-enforcement-supremacy), [Control Stack](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-the-control-stack)                                                                                                                                           |
| Models by exact id                                                                       | [Pinned Substrate Migration](/docs/ai/agentic-development-principles/physics-of-ai-integration#the-corollary-of-pinned-substrate-migration)                                                                                                                                                                                                                                                                                           |
| Child runs are capped; a stale one is closed                                             | [W1](/docs/product/product-development/principles#w1-the-principle-of-wip-constraints-constrain-wip-to-control-cycle-time-and-flow), [F19](/docs/product/product-development/principles#f19-the-round-robin-principle-when-task-duration-is-unknown-share-time-among-tasks)                                                                                                                                                           |
| Routines run on nested cadences, on the cheapest model that does the work                | [F5](/docs/product/product-development/principles#f5-the-principle-of-periodic-resynchronization-use-a-regular-cadence-to-limit-the-accumulation-of-variance), [F14](/docs/product/product-development/principles#f14-the-harmonic-principle-make-nested-cadences-harmonic-multiples), [Allocative Efficiency](/docs/ai/agentic-development-principles/economics-of-interaction#the-principle-of-allocative-efficiency)               |
| The Chase tells people what the graph holds for them                                     | [Contextual Readiness](/docs/ai/agentic-development-principles/architecture-of-flow#the-corollary-of-contextual-readiness)                                                                                                                                                                                                                                                                                                            |
| The Audit measures what runs spend                                                       | [Prompt Economics](/docs/ai/agentic-development-principles/economics-of-interaction#the-principle-of-prompt-economics)                                                                                                                                                                                                                                                                                                                |

## Adopting It

A repository adopts the workflow with the [`flow-setup`](https://github.com/ttoss/skills/blob/main/skills/flow-setup/SKILL.md) skill: it installs the skills, defines the [parameters](./parameters.md) with you from what the repository already says, proposes the Flow project and its standing decision, opens a pull request for your review and, once you integrate it, creates the project's [routines](./routines.md). The [`flow`](https://github.com/ttoss/skills/blob/main/skills/flow/SKILL.md) skill runs the tick and the chase they fire, and [`token-audit`](https://github.com/ttoss/skills/blob/main/skills/token-audit/SKILL.md) the audit.
