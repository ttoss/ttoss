---
title: Routines
sidebar_position: 3
---

# Routines

A routine is a run that a schedule or an event starts, not a person. Each one runs like a tick: it starts fresh, reads the state from Flow, acts, writes the result back and stops, so a run that fails loses nothing and the next one picks up from the graph (GTF-U4). The runtime fires them, as a Claude Code routine or a cron or CI job that runs the agent headless, and the project lists them in its [`Routines`](parameters.md#routines) parameter.

## Standard routines

| Routine | Fired by | Runs | Model | Writes |
| --- | --- | --- | --- | --- |
| Tick | a schedule: hourly, in the project's working hours | `/flow <project id>` | its row's | the [transitions](process.md#transitions) |
| Chase | a schedule: daily, at the start of the working day | `/flow <project id> --chase` | the check model | nothing in Flow: one digest of what needs a person, each line naming who acts |
| Audit | a schedule: weekly, at the end of the week | `/token-audit --routine` | the check model | an `incubated` task for each fix it proposes |

The tick is required, and it runs every stage an agent owns: it starts a child for each ready task, a check child for each check that came due and a review child for each change the `Review` parameter gives an agent, and it integrates and releases. The Chase and the Audit are recommended, and [`flow-setup`](https://github.com/ttoss/skills/blob/main/skills/flow-setup/SKILL.md) proposes all three.

- **Chase.** A wait on a person carries the date to chase on (GTF-N4), and an unattended run writes what needs a person into the graph instead of asking (GTF-U3), but the graph reaches nobody who does not read it. Every day, the Chase sends one digest of what needs a person, in sections ordered by what ages fastest ([process](process.md#three-rules), rule 3), each line naming who acts:
  1. **Critical bugs**: open tasks tagged `bug` at `very_high` or `high`, and any `very_high` task, with what holds each. One held by a person, or by an agent's run past `Stale after` or out of the rounds the `Merge rule` allows, is a line of its own; the ones agents are working within those limits are one line that counts them.
  2. **Changes waiting to be integrated by a person**: ready changes whose checks and review passed, held only by what the `Merge rule` reserves to a person.
  3. **No owner**: a wait that names nobody, addressed to the project's admins. No other section reaches anyone for it, so it ages without limit, and naming who acts takes a minute: the highest cost of delay per minute of a person's time ([F17](/docs/product/product-development/principles#f17-the-wsjf-scheduling-principle-when-job-durations-and-delay-costs-are-not-homogeneous-use-wsjf)).
  4. **Overdue checks**: checks whose date came that no agent could run.
  5. **Old decisions**: `decision` tasks untouched for a week.
  6. **Stale sessions**: a person's run holding an open task past `Stale after`.
  7. **Overdue waits**: any other wait on a person past its date, or with no date and untouched for a week.

  A wait or a decision costs what the work it holds costs ([F17](/docs/product/product-development/principles#f17-the-wsjf-scheduling-principle-when-job-durations-and-delay-costs-are-not-homogeneous-use-wsjf)), so one that holds a critical bug or a waiting change appears there, as what holds it, and each task appears once, in the first section that takes it. Sections 4 to 7 are left with what holds later work; inside each, the one holding the most tasks comes first, then the oldest.

  The digest opens with a line per person: how many lines name them, and in which sections. Each section shows at most the lines the Chase's row in [`Routines`](parameters.md#routines) sets, five by default, and how many more; raise it when most digests cut a section for two weeks. An empty section is left out, except Critical bugs, which says there are none. A last line gives the flow's health: the changes integrated since the last Chase, the ready tasks, how many of them a stale session holds, and how many of the overdue waits name nobody. Each section is read by a query sorted so that what qualifies comes first, so the Chase stops at the first row that does not, never reading the whole graph.
- **Audit.** Every run spends tokens. The Audit measures where, from the instruction files every session loads and the runs Flow records (GTF-S7), and files each fix it proposes as an `incubated` task for a person to promote (GTF-C1). It changes nothing itself.

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
