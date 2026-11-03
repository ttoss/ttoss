---
title: Routines
sidebar_position: 4
---

# Routines

A routine is a run that a schedule or an event starts, not a person. Each one runs like a tick: it starts fresh, reads the state from Flow, acts, writes the result back and stops, so a run that fails loses nothing and the next one picks up from the graph (GTF-U4). The runtime fires them, as a Claude Code routine or a cron or CI job that runs the agent headless, and the project lists them in its [`Routines`](parameters.md#routines) parameter.

## Standard routines

| Routine | Fired by | Runs | Model | Writes |
| --- | --- | --- | --- | --- |
| Tick | a schedule: hourly, in the project's working hours | `/flow <project id>` | its row's | the [transitions](process.md#transitions) |
| Chase | a schedule: daily, at the start of the working day | `/flow <project id> --chase` | the check model | nothing in Flow: one digest of what needs a person, each line naming who acts |
| Audit | a schedule: weekly, at the end of the week | `/token-audit --routine` | the check model | each fix it proposes, written down as the `Intake` says |

The tick is required, and it runs every stage an agent owns: it starts a child for each ready task, a check child for each check that came due and a review child for each change the `Review` parameter gives an agent, and it integrates and releases. The Chase and the Audit are recommended, and [`flow-setup`](https://github.com/ttoss/skills/blob/main/skills/flow-setup/SKILL.md) proposes all three.

- **Chase.** A wait on a person carries the date to chase on (GTF-N4), and an unattended run writes what needs a person into the graph instead of asking (GTF-U3), but the graph reaches nobody who does not read it. Every day, the Chase sends one digest of what needs a person, each line naming who acts, in sections ordered by what ages fastest ([process](process.md#three-rules), rule 3): critical bugs, changes waiting to be integrated by a person, waits that name nobody (addressed to the project's admins, since nothing else reaches anyone for them), overdue checks, old decisions, stale sessions, overdue waits, then the findings and reviews only a person acts on. It closes with the flow's health, this week beside the week before, read as Flow's [Reading a project's health](https://flow.ttoss.dev/docs/practice/health) reads it: a state only a person's answer frees that grew two weeks running opens the digest, because more agents or tasks will not help ([W21](/docs/product/product-development/principles/applying-wip-constraints#w21-the-principle-of-the-critical-queue-constrain-wip-in-the-section-of-the-system-where-the-queue-is-most-expensive)). Every number is one Flow answers, written as answered, never a ratio, a goal or a threshold, and the health lines are computed from Flow's answers by a script in the [`flow` skill](https://github.com/ttoss/skills/blob/main/skills/flow/scripts/health.mjs), never worked out by an agent. Each section shows five lines by default, and how many more; raise it in the Chase's row of [`Routines`](parameters.md#routines) when most digests cut a section for two weeks. How each section is read and the digest's shape are the [`flow`](https://github.com/ttoss/skills/blob/main/skills/flow/references/chase.md) skill's.
- **Audit.** Every run spends tokens. The Audit measures where, from the instruction files every session loads and the runs Flow records (GTF-S7), and writes down each fix it proposes as the `Intake` says, by default an `incubated` task for a person to promote (GTF-C1). It changes nothing itself. Beside the spend, it reports what feeds and drains the graph: spend on work that did not ship, what became of incubated work, and the untriaged inbox. The [`token-audit`](https://github.com/ttoss/skills/blob/main/skills/token-audit/SKILL.md) skill says how each is read.

Each routine's arithmetic, not its judgment, is a script in the [`flow` skill](https://github.com/ttoss/skills/tree/main/skills/flow/scripts) that reads the project's parameters, the code host through its CLI, and Flow with a Flow API key restricted to the project, held in the routine's environment: the tick's snapshot and planner, the whole Chase digest, and the Audit's spend and flow lines. Nothing Flow answers passes through the model, and a script never writes: every write stays with the routine's run, under the standing decision. A runtime without the key reads Flow through the model instead, at about 50 KB of output per Chase.

## Rules of every routine

The rules of an unattended run are GTF's ([GTF-U1 to GTF-U4](https://flow.ttoss.dev/docs/agents/protocol.md#unattended-runs)): its procedure is on the default branch, it acts under the standing decision, it never waits and never schedules, and what fired it is data. Two are the workflow's own:

1. **It owns its stage and no other.** It moves a task only where the [Delivery Process](process.md#the-stages) makes it the owner; after a verdict, only the tick writes the task (GTF-S3).
2. **It is cheap.** It loads only the tools it calls, asks for the smallest page that answers, hands a wide read to a subagent that returns the conclusion, and runs on a mid-tier model unless it writes code or its verdict lets a change integrate.

## Project routines

A project adds a routine for a signal only it has, an **Intake**: it turns a signal from outside Flow, such as an error tracker's alert, a user's feedback or an alarm, into a task: stage 1 of the [Delivery Process](process.md#the-stages). It looks for the task that already covers the signal by the signal's URL (`list-tasks` with `ref_url`) before it writes one, and writes a new one with that URL as its `source` reference and its `dedupe_on`, so two runs on one signal leave one task. It investigates the signal with the instruction that owns its kind, and the task carries the investigation and the check its fix will leave (GTF-E8); a choice the fix needs waits on whoever decides (GTF-N6). It never fixes: the tick delegates the task like any other. A transition the tick makes is the tick's alone, whatever event announces it: a project that needs one sooner fires the tick on the event.

A project routine is a file on the default branch that states:

- **Fired by**: the schedule with its time zone, or the event and where it comes from.
- **Model** and **connectors**.
- **Rules**: the project's instructions and the GTF rules it rests on.
- **Scope**: what it reads and what it may change.
- **Procedure**: its steps, ending in one line for each item it handled.
- **Never**: what it must not do.

`/flow-setup routine <name>` writes the file with you, adds its row to the `Routines` parameter and opens the change; once a person integrates it, `flow-setup` creates the routine in the runtime.
