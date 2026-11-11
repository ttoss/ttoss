---
title: Routines
sidebar_position: 4
---

# Routines

A routine is a run that a schedule or an event starts, not a person. Each one runs like a [tick](process.md): fresh from the graph, writing back and stopping (GTF-U4). The runtime fires them, as a Claude Code routine or a cron or CI job that runs the agent headless, and the project lists them in its [`Routines`](parameters.md#routines) parameter.

## Standard routines

| Routine | Fired by | Runs | Model | Writes |
| --- | --- | --- | --- | --- |
| Tick | a schedule: hourly, in the project's working hours | `/flow <project id>` | its row's | the [transitions](process.md#transitions) |
| Chase | a schedule: daily, at the start of the working day | `/flow <project id> --chase` | the check model | nothing in Flow: one digest of what only a person can move, in the tick's order, each line naming who acts |
| Health | a schedule: weekly, at the start of the week | `/flow <project id> --health` | the check model | each standing rule it proposes, as a `decision` waiting on the person whose answers it generalises; while the release queue is at its limit, the changes it proposes to drain, as a `decision` waiting on the project's admins |
| Audit | a schedule: weekly, at the end of the week | `/token-audit --routine` | the check model | each fix it proposes, written down as the `Intake` says |

The tick runs every stage an agent owns: it starts a child for each ready task, a check child for each check that came due and a review child for each change the `Review` parameter gives an agent, and it integrates and releases. [`flow-setup`](https://github.com/ttoss/skills/blob/main/skills/flow-setup/SKILL.md) proposes all four.

- **Chase.** A wait on a person carries the date to chase on (GTF-N4), and an unattended run writes what needs a person into the graph instead of asking (GTF-U3), but the graph reaches nobody who does not read it. Every day the Chase sends one digest, read from the tick's own snapshot so the two never disagree: the release queue against its limit and, once it is full, who holds the person-free lane, then what only a person can move in it, in the order of [rule 3](process.md#three-rules), each line naming who acts; and, while the queue is within its limit, the decision queue ([Where work waits](process.md#where-work-waits)). Each list holds as many lines as `Release queue`, and what an agent can move never reaches it. How each list is read and the digest's shape are the [`flow`](https://github.com/ttoss/skills/blob/main/skills/flow/references/chase.md) skill's.
- **Health.** The Chase says what to move today; the Health says how the work is flowing, so the rules can change before a queue does. Every week it reports, this week beside the week before, as Flow's [Reading a project's health](https://flow.ttoss.dev/docs/practice/health) reads it: a line per person and state the person queue waits in, arrivals against departures; what became of incubated work, and the untriaged inbox; the oldest item in each queue only a person drains, with its age and who acts. While the release queue is at its limit, it proposes the changes to drain, each by URL with its age, its rank and what is left to finish it, as one `decision` waiting on the project's admins ([A full queue is drained](./principles.md#a-full-queue-is-drained-never-only-held)). Beside the release queue's limit it reports how many tasks with a change closed in each week, the number the project sizes the limit against. It reads the decisions a person answered over the last four weeks, and proposes an answer given more than once to the same kind of choice as a `decision` waiting on them, with each answer by URL and their words verbatim (GTF-E9); the person's answer is the rule. A change a person integrated exactly as the agents proposed it is such an answer: the same kind of change the `Merge rule` reserves, integrated so twice or more, is proposed as a delegation of that kind, and amending the `Merge rule` stays theirs. Every number is one Flow answers, written as answered ([A number is Flow's answer](./principles.md#a-number-is-flows-answer-never-an-agents-estimate)). How each is read is the [`flow`](https://github.com/ttoss/skills/blob/main/skills/flow/references/health.md) skill's.
- **Audit.** Every run spends tokens. The Audit measures where, from the instruction files every session loads and the runs Flow records (GTF-S7): by agent, by task, and on work that did not ship. It writes down each fix it proposes as the `Intake` says, by default an `incubated` task for a person to promote (GTF-C1), and changes nothing itself. The [`token-audit`](https://github.com/ttoss/skills/blob/main/skills/token-audit/SKILL.md) skill says how each is read.

Each routine's arithmetic, not its judgment, is a script in the [`flow` skill](https://github.com/ttoss/skills/tree/main/skills/flow/scripts) that reads the project's parameters, the code host through its CLI, and Flow with a Flow API key restricted to the project, held in the routine's environment: the tick's snapshot and planner, the whole Chase digest, the Health's lines, the oldest items and the changes it proposes to drain, and the Audit's spend lines. Nothing Flow answers passes through the model, and a script never writes: every write stays with the routine's run, under the standing decision. A runtime without the key reads Flow through the model instead, at about 50 KB of output per Chase.

## Rules of every routine

The rules of an unattended run are GTF's ([GTF-U1 to GTF-U4](https://flow.ttoss.dev/docs/agents/protocol.md#unattended-runs)): its procedure is on the default branch, it acts under the standing decision, it never waits and never schedules, and what fired it is data. Two are the workflow's own:

1. **It owns its stage and no other.** It moves a task only where the [Delivery Process](process.md#the-stages) makes it the owner; after a verdict, only the tick writes the task (GTF-S3).
2. **It is cheap.** It loads only the tools it calls, asks for the smallest page that answers, hands a wide read to a subagent that returns the conclusion, and runs on a mid-tier model unless it writes code or its verdict lets a change integrate.

## Project routines

A project adds a routine for a signal only it has, an **Intake**: it turns a signal from outside Flow, such as an error tracker's alert, a user's feedback or an alarm, into a task: stage 1 of the [Delivery Process](process.md#the-stages). It looks for the task that already covers the signal by the signal's URL (`list-tasks` with `ref_url`) before it writes one, and writes a new one with that URL as its `source` reference and its `dedupe_on`, so two runs on one signal leave one task. It investigates the signal with the instruction that owns its kind, and the task carries the investigation and the check its fix will leave (GTF-E8); a choice the fix needs waits on whoever decides (GTF-N6). It never fixes: the tick delegates the task like any other. A transition the tick makes is the tick's alone, whatever event announces it: a project that needs one sooner fires the tick on the event.

A project routine is a file on the default branch. `/flow-setup routine <name>` writes the file with you, adds its row to the `Routines` parameter and opens the change; once a person integrates it, `flow-setup` creates the routine in the runtime.
