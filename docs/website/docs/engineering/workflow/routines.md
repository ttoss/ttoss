---
title: Routines
sidebar_position: 3
---

# Routines

A routine is a run that a schedule or an event starts, not a person. Each one runs like a tick: it starts fresh, reads the state from Flow, acts, writes the result back and stops, so a run that fails loses nothing and the next one picks up from the graph (GTF-U4). The runtime fires them, as a Claude Code routine or a cron or CI job that runs the agent headless, and the project lists them in its [`Routines`](parameters.md#routines) parameter.

## Standard routines

| Routine | Fired by | Runs | Model | Writes |
| --- | --- | --- | --- | --- |
| Tick | a schedule: hourly, in the project's working hours | `/flow <project id>` | the manager's | the [transitions](process.md#transitions) |
| Chase | a schedule: daily, at the start of the working day | `/flow <project id> --chase` | the check model | nothing in Flow: each person gets what waits on them |
| Audit | a schedule: weekly, at the end of the week | `/token-audit --routine` | the check model | an `incubated` task for each fix it proposes |

The tick is required, and it runs every stage an agent owns: it starts a child for each ready task, a check child for each check that came due and a review child for each change the `Review` parameter gives the loop, and it integrates and releases. The Chase and the Audit are recommended, and [`flow-setup`](https://github.com/ttoss/skills/blob/main/skills/flow-setup/SKILL.md) proposes all three.

- **Chase.** A wait on a person carries the date to chase on (GTF-N4), and an unattended run writes what needs a person into the graph instead of asking (GTF-U3), but the graph reaches nobody who does not read it. Every day, the Chase sends each person the waits on them past that date, the ones with no date that nobody touched for a week, and the decisions waiting on them. It sends an empty digest too, so a missing one means it did not run.
- **Audit.** Every run spends tokens. The Audit measures where, from the instruction files every session loads and the runs Flow records (GTF-S7), and files each fix it proposes as an `incubated` task for a person to promote (GTF-C1). It changes nothing itself.

## Rules of every routine

1. **Its procedure is on the default branch**: a skill the project pins, or a file in its repository. The runtime stores only the line that invokes it, so changing what a routine does is a change a person approves (GTF-A6). What fires it, its model and its connectors are the runtime's configuration, recorded in its row of the `Routines` parameter.
2. **It acts under the standing decision.** The decision names the parameters file and the `Routines` parameter names the routine, so a routine missing from it has no authority (GTF-U1, GTF-T1). It records its run with the decision as `authority` and its name as `agent` (GTF-S7), and knows its earlier runs only from those records (GTF-U4).
3. **It owns its stage and no other.** It moves a task only where the [Delivery Process](process.md#the-stages) makes it the owner; after a verdict, only the tick writes the task (GTF-S3).
4. **It never waits and never schedules.** What needs a person waits on them in the graph (GTF-U3), a check owed later is a wait on the task (GTF-S5), and the routine's trigger fires the next run.
5. **What fired it is data.** From an event it takes the id of what the event points at, and reads the rest from the source (GTF-A5).
6. **It is cheap.** It loads only the tools it calls, asks for the smallest page that answers, hands a wide read to a subagent that returns the conclusion, and runs on a mid-tier model unless it writes code or its verdict lets a change integrate.

## Project routines

A project adds a routine for a signal or an event only it has, in one of two shapes:

- **Intake** turns a signal from outside Flow, such as an error tracker's alert, a user's feedback or an alarm, into a task: stage 1 of the [Delivery Process](process.md#the-stages). It looks for the task that already covers the signal by the signal's URL (`list-tasks` with `ref_url`) before it writes one, and writes a new one with that URL as its `source` reference and its `dedupe_on`, so two runs on one signal leave one task. It investigates the signal with the instruction that owns its kind, and the task carries the investigation and the check its fix will leave (GTF-E8); a choice the fix needs waits on whoever decides (GTF-N6). It never fixes: the tick delegates the task like any other.
- **Reaction** makes a transition the tick would make anyway, sooner, when an event says it is due, such as a review requested by a label the project's CI adds on a green head. It takes the task with its run before it acts (GTF-S8), so the tick sees the transition in progress, and the tick stays its fallback: a lost event costs one tick.

A project routine is a file on the default branch that states:

- **Fired by**: the schedule with its time zone, or the event and where it comes from.
- **Model** and **connectors**.
- **Rules**: the project's instructions and the GTF rules it rests on.
- **Scope**: what it reads and what it may change.
- **Procedure**: its steps, ending in one line for each item it handled.
- **Never**: what it must not do.

`/flow-setup routine <name>` writes the file with you, adds its row to the `Routines` parameter and opens the change; once a person integrates it, `flow-setup` creates the routine in the runtime.
