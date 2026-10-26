---
title: Delivery Process
sidebar_position: 1
---

# Delivery Process

How work in a software project goes from a signal to a closed task, once, for every project. It is a state machine: a task's state lives in Flow, and each tick reads it, applies the [transitions](#transitions) it calls for and writes the result, which the next tick reads. This is the engine; each project extends it with its answers to the [parameters](parameters.md), and a project with no answer gets the default. The process is [Get Things Flowing](https://flow.ttoss.dev/docs/agents/protocol.md) (GTF) applied to product development: the rule ids below are GTF's.

## Eight rules

1. **One owner per transition.** Only a stage's owner changes the task's state in that stage. Two owners drift apart silently, each acting on a state the other already changed.
2. **The state lives in Flow.** Every stage reads the task before it acts and writes it back before it ends, so a run that dies mid-stage is resumed from the graph (GTF-S4).
3. **Every change has a cause.** A run names the standing decision once, as its `authority`; its writes inherit it (GTF-A2, GTF-E4).
4. **A person decides what is reserved.** A choice the project reserves, or one nobody delegated, waits on a person (GTF-N6).
5. **One worker per task.** A run takes a task with its `works_on`; a task another run holds comes back `contended` (GTF-S8).
6. **Done is the effect, observed where it matters.** Integrated is not in effect (GTF-E8).
7. **Rounds have a limit.** Each reason a change goes back (red checks, findings) gets the automatic rounds the `Merge rule` allows; the next goes to a person.
8. **Finish before starting.** The work closest to done goes first: verify, then release, then the gates (reviews the agents run, fix rounds, conflicts), then new work. A priority a person set outranks the stage.

## Words

The process names acts, not tools, so it reads the same on any code host and for deliveries that are not code:

| Word | What it is | Examples |
| --- | --- | --- |
| change | what alters the product or its world | a pull request (the default), a merge request, a commit, a post, a CMS entry, a flag, a migration |
| gate | a check a change must pass | CI, an agent's review, a person's review, an approval, a store's review |
| integrate | the act that makes a change official | merge, publish, apply, execute |
| release | what puts an integrated change in effect | deploy, publish a package and bump its consumer, roll out |
| verify | observe the effect where it matters | a production query, a registry install, a device, a dataset |

## The stages

| # | Stage | Owner | Starts when | Writes to Flow before it ends | Parameter |
| --- | --- | --- | --- | --- | --- |
| 1 | Intake | whoever finds the signal: an intake [routine](routines.md#project-routines), a person, an agent mid-task | an alert, feedback, an idea, a finding | a task with its `source` and what was investigated, `active`, or `incubated` when found mid-task (GTF-C1); never a fix | `Intake` |
| 2 | Decide | a person | a choice the work needs, or a brief short of the `Ready brief` | the answer, on the task that waits on them (the move that frees it cites their words), or as the `outcome` of a `decision` that holds several tasks | `Decisions`, `Ready brief` |
| 3 | Implement | a child run, or a person | the task is ready, or a round sends it back | the change, proposed ready (not draft); an `implements` reference; in the body, what integrating leaves; in the change's description, the task's URL and the tasks it settles; the task `waiting` on the gates | `Before proposing`, `Child handoff` |
| 4 | Gates | automation, the reviewer `Review` names (a review child of the tick, a project routine or a person), the person the `Merge rule` reserves | the change is proposed | nothing on the task: verdicts stay on the change, and the tick writes after them | `Review`, `Merge rule` |
| 5 | Integrate | whoever the `Merge rule` lets integrate: the reviewer, the tick or a person | the gates pass | nothing on the task: the tick writes what integrating leaves | `Merge rule` |
| 6 | Release | the `Release procedure`: automation, a child run or a person | integration | a release step that is somebody's act is its own task that `blocks` the integrated task (GTF-N4); a pipeline every integration runs is a wait, not a task | `Release procedure` |
| 7 | Verify | the reader the `Closing evidence` names, else a check child of the tick | the check comes due | `completed` with what was observed, or `active` again with it (GTF-E8) | `Closing evidence` |

A stage a project, or a [delivery kind](#delivery-kinds), answers with "none" is skipped: with no review, the gates are the checks; with no release, integrated is in effect once its pipeline passes. A gate may also run after integrating, as in trunk-based work: its failure is the "pipeline red after integrating" transition below.

## Who writes the task

- An owner that writes to Flow writes its own stage's end: Intake, Implement, a release step run by a child, Verify.
- **After the verdict, the tick is the only writer of the task's status and wait** (GTF-S3). It writes every transition whose owner does not write to Flow, such as CI, the code host, or a person who merged or reviewed, and every one an owner left unwritten.
- A run that only contributed to a stage, such as a reviewer, leaves its verdict on the change and writes at most references for what it produced (GTF-S3).
- Every run is recorded before it works (GTF-S7): the tick takes a child's task with its own run before starting it, and the child records itself as its first act, with the tick's run as `parent`; a session nobody started records itself.
- With no tick, because nothing schedules one, the next run that reads the graph writes what the tick would.

## States

| Where the task is | Status | What holds it | Who acts next |
| --- | --- | --- | --- |
| Ready | `active` | nothing | the tick delegates it, or a person takes it |
| A choice for a person | `waiting`, or `active` behind a `decision` | an `external` wait `on` the person, or the decision's `blocks` edge | the person |
| At the gates | `waiting` | `external`: the gates the change waits on | the gates; the tick reads the verdict |
| A round back | `active` | nothing; the body carries the log or the findings | the tick delegates a fresh child |
| Reserved for a person | `waiting` | `external` `on` the person, naming what is ready for them | the person |
| Waiting for a release | `blocked` | the release task's `blocks` edge | the release's owner |
| Waiting for the check | `calendar` | `scheduled`: the check and its date | the check's reader |
| Done | `completed` | nothing | nobody |

## Transitions

The tick applies these on every tick, under the standing decision:

| When | The tick |
| --- | --- |
| The change's checks pass with no verdict for its head, and `Review` gives the review to an agent | starts a review child, which leaves its verdict on the change |
| The gates pass and the `Merge rule` lets the agents integrate | integrates the change |
| Checks red, or findings, within the round limit | moves the task to `active` with the log or the findings in the body, for a fresh child on the same change |
| The round limit reached (rounds are the task's fix runs; a red caused outside the change, such as a broken default branch or infrastructure, does not count) | moves the task to `waiting` on a person |
| A review request lost | applies the `Review` fallback |
| The change needs what the `Merge rule` reserves to a person | moves the task to `waiting` on that person, naming what is ready |
| The `Renewal` date has passed | applies the `Merge rule` as if it reserved every integration to a person: each change ready to integrate moves its task to `waiting` on the person `Renewal` names, naming the renewal, until a person integrates a change that moves the date |
| A conflict with the default branch | moves the task to `active` for a fresh child that resolves it |
| A step only a person can do before integrating (a migration, a manual check) | writes that step as a task, theirs, that `blocks` the task (GTF-N4) |
| The change closed without integrating | retracts its `implements` reference and moves the task to `waiting` on a person: implement it again, or cancel it |
| The change integrated, nothing written since | applies what the task's body says integrating leaves: closes it on immediate evidence, citing the change; or the release step; or the check's wait (GTF-E8). A task with several changes waits for the last one |
| The integration's pipeline red | moves the task to `active` with the log |
| The change's description names other tasks it settles | closes them on integration, citing the change, as far as the standing decision delegates tidying (GTF-S6) |
| A change in the project's repos names no task | applies the `Intake` answer: writes a task for it, or leaves it |
| A release step's task closes | moves each task it blocked to its check's wait, or closes it citing the release task, whose outcome is the evidence |
| A check comes due | starts a check child (unless the `Closing evidence` names another reader), which closes the task with what it observed or sends it back |
| A child's run failed or is gone with its task open | closes the run `failed`; the task is ready again |

A person reviewing a change has three outcomes: integrate it, ask for changes (the task goes back a round), or close it, which is the "closed without integrating" row.

## Delivery kinds

A pull request through the code host is the default kind. A project that also delivers in other ways (content, a CMS entry, a feature flag, manual infrastructure, a data fix) names each kind in `Delivery kinds`: its gates (a person's approval when the act reaches outside the product), who integrates it (executes it), and what proves it. Each kind runs the same stages; most just answer "none" to more of them.

An investigation delivers knowledge: its output is evidence or a proposal for a decision, and it closes with that evidence as its outcome.

## Prerequisites

- **The code host enforces the `Merge rule`.** Required checks, branch protection and required reviews make the rule true for everyone, not only for the agents. A change to the CI configuration needs a person's review there too (code owners or the host's equivalent), so no agent integrates a change to the checks that judge it on its own reading of the diff.
- **The runtime allows every act the standing decision delegates.** An act the runtime refuses, such as a merge or a release step its permission rules block, moves the task to `waiting` on a person, naming the refusal (GTF-U3).
- **Agent instructions change only through a merge a person approved**, so the standing decision can point at them (GTF-A6).
- **Something fires the runs.** Flow keeps the state but wakes nobody (GTF-S5): the project's [routines](routines.md) start each run fresh from the graph.
