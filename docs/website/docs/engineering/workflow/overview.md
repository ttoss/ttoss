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

The [Delivery Process](./process.md) defines every state, the seven stages that move a task between them with one owner each, and the [transitions](./process.md#transitions) a tick applies, what ages fastest first.

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

GTF holds what is true of any work, this workflow what is true of software delivery, the [ttoss skills](https://github.com/ttoss/skills) how an agent carries it out, and a project's [parameters](./parameters.md) what is true of one product; [precedence](https://github.com/ttoss/skills/blob/main/skills/flow-setup/SKILL.md#precedence) says what wins when two disagree. The skills read these pages from this repository's default branch, so a change here reaches every agent at its next run. [Principles](./principles.md) maps every rule of the workflow to the product development and agentic development principles behind it.

## Adopting It

A repository adopts the workflow with the [`flow-setup`](https://github.com/ttoss/skills/blob/main/skills/flow-setup/SKILL.md) skill: it installs the skills, defines the [parameters](./parameters.md) with you from what the repository already says, proposes the Flow project and its standing decision, opens a pull request for your review and, once you integrate it, creates the project's [routines](./routines.md). The [`flow`](https://github.com/ttoss/skills/blob/main/skills/flow/SKILL.md) skill runs the tick and the chase they fire, and [`token-audit`](https://github.com/ttoss/skills/blob/main/skills/token-audit/SKILL.md) the audit.
